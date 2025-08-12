import { addToCart } from "@/lib/actions/cart.actions";
import { getProduct } from "@/lib/actions/product.actions";
import { ProductInterface } from "@/utils/productsiinterface";
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const primaryModel = "gemini-2.5-pro";
const fallbackModel = "gemini-1.5-flash";

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error?.error?.code === 503) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(
          `Retry ${i + 1}/${maxRetries} after ${delay}ms due to 503 error`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

async function placeOrder(product: ProductInterface) {
  // Assuming addToCart expects productId, quantity, and possibly other fields
  const response = await addToCart(product.id, 1, null, null, null);
  if (response.success) {
    return {
      id: product.id,
      message: `Order for ${product.name} placed successfully!`,
    };
  } else {
    return {
      id: "",
      message: "unable to place order",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { history } = await req.json();

    if (!history || history.length === 0) {
      return NextResponse.json(
        { error: "History is required" },
        { status: 400 }
      );
    }

    const lastUserMessage = history[history.length - 1].content;

    const products = await getProduct();
    console.log("Fetched products count:", products.length);

    const productList = products
      .map((p: ProductInterface) =>
        `
- ${p.name} (Price: ${p.price !== null ? `₦${p.price}` : `₦${p.list_price} (list price)`}, Stock: ${p.stock_status || "Unknown"}, Category: ${(p.category_ids || []).join(", ") || "None"})
      `.trim()
      )
      .join("\n");

    const systemInstruction = `
You are a friendly e-commerce AI assistant specializing in grocery and West African cuisine. Engage in natural conversation, detect intents like product recommendations or orders.
- For recommendations: Suggest 5-6 relevant products with name, price (use price if available, else list_price), and why they match (e.g., for fruit, soups). Highlight stock_status. Only use available products.
- For orders: If user confirms buying (e.g., "Buy Olomi Mango"), respond with [ORDER: product_name] using exact product name.
- If price is null, use list_price. If stock_status is null or not "in_stock", suggest alternatives.
- Keep responses concise, engaging, and ask clarifying questions (e.g., budget, dish type).
- Use Nigerian Naira (₦).
Available products:
${productList}
`;

    const contents = history
      .slice(0, -1)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));
    contents.push({
      role: "user",
      parts: [{ text: lastUserMessage }],
    });

    let response;
    try {
      console.log("Attempting with primary model:", primaryModel);
      response = await withRetry(async () => {
        return await ai.models.generateContent({
          model: primaryModel,
          contents,
          config: {
            systemInstruction,
            safetySettings: [
              {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
              },
            ],
          },
        });
      });
    } catch (error: any) {
      if (error?.error?.code === 429) {
        console.warn(
          `Quota limit reached for ${primaryModel}. Falling back to ${fallbackModel}.`
        );
        response = await withRetry(async () => {
          return await ai.models.generateContent({
            model: fallbackModel,
            contents,
            config: {
              systemInstruction,
              safetySettings: [
                {
                  category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                  threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
              ],
            },
          });
        });
      } else {
        throw error;
      }
    }

    // Handle response
    let responseText: string;
    try {
      responseText = (await response.text) || "";
    } catch (e) {
      console.error("Error extracting response text:", e);
      responseText = "";
    }

    // Parse for orders
    const orderMatch = responseText.match(/\[ORDER: (.*?)\]/);
    if (orderMatch) {
      const productName = orderMatch[1];
      // Find the product by name
      const product = products.find(
        (p: ProductInterface) =>
          p.name.toLowerCase() === productName.toLowerCase()
      );
      if (!product) {
        responseText = `Product "${productName}" not found. Please check the product name or try another item.\nAvailable products:\n${productList}`;
      } else {
        const orderResult = await placeOrder(product);
        responseText =
          responseText.replace(orderMatch[0], "") + `\n${orderResult.message}`;
      }
    }

    console.log("Response text:", responseText);
    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("GenAI API error:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Failed to generate response", details: error.message },
      { status: 500 }
    );
  }
}
