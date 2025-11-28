import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const PRODUCT_MENU_LIMIT = 5;

type CartItem = { product_id: string; name: string; qty: number; price: number };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Method Not Allowed", { status: 405 });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (data.object !== "whatsapp_business_account")
    return NextResponse.json({ ok: true });

  for (const entry of data.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const message = value.messages?.[0];
      if (!message) continue;

      const phone = message.from; // E.164 without plus
      const text =
        message.type === "text"
          ? message.text?.body?.trim()
          : message.type === "interactive"
          ? message.interactive?.button_reply?.id ?? ""
          : "";

      // Load/create session
      let { data: session, error } = await supabase
        .from("whatsapp_sessions")
        .select("*")
        .eq("phone_number", phone)
        .single();
      if (error && (error as any).code === "PGRST116") session = undefined;
      if (!session) {
        const { data: created } = await supabase
          .from("whatsapp_sessions")
          .insert([{ phone_number: phone, cart_items: [], stage: "menu" }])
          .select("*")
          .single();
        session = created;
      }
      if (!session) continue;

      const lowerText = (text ?? "").toLowerCase();

      if (/^(menu|order|start|hi|hello|hey)/.test(lowerText)) {
        const { data: products } = await supabase
          .from("products")
          .select("id, name, price")
          .eq("is_published", true)
          .order("num_sales", { ascending: false })
          .limit(PRODUCT_MENU_LIMIT);
        if (!products || products.length === 0) {
          await sendWhatsAppText(phone, "Our menu is temporarily unavailable. Please try again later.");
        } else {
          const menu = products
            .map((p: { name: string; price: number }, idx: number) => `${idx + 1}. ${p.name} (₦${p.price})`)
            .join("\n");
          await sendWhatsAppText(
            phone,
            `Welcome to FeedMe!\n\nHere's our menu:\n${menu}\n\nReply with the product and quantity (e.g. 'Burger x2') to add to your cart.\nSend 'done' to check out.`
          );
        }
        await supabase.from("whatsapp_sessions").update({ stage: "menu" }).eq("id", session.id);
      } else if (/done|checkout/.test(lowerText)) {
        if (!session.name) {
          await sendWhatsAppText(phone, "What's your name for the order?");
          await supabase.from("whatsapp_sessions").update({ stage: "awaiting_name" }).eq("id", session.id);
        } else if (!session.address) {
          await sendWhatsAppText(phone, "Please provide your delivery address.");
          await supabase.from("whatsapp_sessions").update({ stage: "awaiting_address" }).eq("id", session.id);
        } else {
          const cart: CartItem[] = session.cart_items ?? [];
          if (!cart.length) {
            await sendWhatsAppText(phone, "Your cart is empty. Reply with items to add.");
          } else {
            const total_amount = cart.reduce((n, it) => n + (it.price || 0) * (it.qty || 1), 0);
            const { data: order, error: orderError } = await supabase
              .from("orders")
              .insert({
                shipping_address: { name: session.name, phone, address: session.address },
                total_amount,
                status: "order confirmed",
                user_id: null,
                payment_method: "whatsapp",
                created_at: new Date().toISOString(),
              })
              .select("id")
              .single();
            if (!orderError && order?.id) {
              for (const it of cart) {
                await supabase.from("order_items").insert({
                  order_id: order.id,
                  product_id: it.product_id,
                  price: it.price,
                  quantity: it.qty,
                });
              }
              await sendWhatsAppText(phone, `Thank you ${session.name}! 🎉\nYour order is confirmed. Our team will contact you soon.`);
              await supabase
                .from("whatsapp_sessions")
                .update({ cart_items: [], stage: "menu", name: null, address: null })
                .eq("id", session.id);
            } else {
              await sendWhatsAppText(phone, "Sorry, there was a problem placing your order. Please reply again to try.");
            }
          }
        }
      } else if (session.stage === "awaiting_name") {
        await supabase.from("whatsapp_sessions").update({ name: text, stage: "awaiting_address" }).eq("id", session.id);
        await sendWhatsAppText(phone, "Thanks! Please provide your delivery address.");
      } else if (session.stage === "awaiting_address") {
        await supabase.from("whatsapp_sessions").update({ address: text, stage: "checkout" }).eq("id", session.id);
        await sendWhatsAppText(phone, `Got it!\nSend 'done' again to confirm your order, or add more items.`);
      } else if (/^(\w+)(\s|x|X)(\d+)/.test(text)) {
        const match = text.match(/^(.*?)\s*[xX ]\s*(\d+)/);
        if (match) {
          const prodQuery = match[1].trim();
          const qty = parseInt(match[2], 10);
          const { data: p } = await supabase
            .from("products")
            .select("id, name, price")
            .eq("is_published", true)
            .ilike("name", `%${prodQuery}%`)
            .limit(1)
            .single();
          if (p) {
            let cart: CartItem[] = session.cart_items ?? [];
            const idx = cart.findIndex((it: CartItem) => it.product_id === p.id);
            if (idx !== -1) {
              cart[idx].qty = qty;
            } else {
              cart.push({ product_id: p.id, name: p.name, qty, price: p.price });
            }
            await supabase.from("whatsapp_sessions").update({ cart_items: cart }).eq("id", session.id);
            await sendWhatsAppText(phone, `${p.name} x${qty} added to cart!\nSend more items, or type 'done' to check out.`);
          } else {
            await sendWhatsAppText(phone, `Sorry, we couldn't find "${prodQuery}" in our menu.`);
          }
        } else {
          await sendWhatsAppText(phone, `Please use format 'Product x2' (e.g. 'Burger x2').`);
        }
      } else {
        await sendWhatsAppText(
          phone,
          `Welcome to FeedMe!\nReply 'menu' to see our menu.\nTo order, reply with product name and quantity (e.g. 'Burger x2').\nType 'done' to check out.`
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}

async function sendWhatsAppText(to: string, message: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { preview_url: false, body: message },
    }),
  });
}
