import * as dotenv from 'dotenv';
import { createClient } from "../src/utils/supabase/client";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Load environment variables
dotenv.config();

async function testJollofRice() {
  try {
    console.log("Testing Jollof Rice query with RAG system...");
    
    // Initialize embeddings and model
    const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "text-embedding-004",
      apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY!,
    });

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      maxOutputTokens: 2048,
      temperature: 0.7,
      apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY!,
    });
    
    // Test query about jollof rice
    const testQuery = "I want to make jollof rice";
    console.log(`Test query: "${testQuery}"`);
    
    // Generate embedding
    const queryEmbedding = await embeddings.embedQuery(testQuery);
    console.log("Generated embedding successfully");
    
    // Search for relevant documents
    const supabase = createClient();
    const { data: relevantDocs, error } = await supabase.rpc(
      'match_documents' as any,
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 8
      }
    );
    
    if (error) {
      console.error("Vector search error:", error);
      return;
    }
    
    console.log(`Found ${Array.isArray(relevantDocs) ? relevantDocs.length : 0} relevant documents`);
    
    // Extract context from relevant documents
    const context = Array.isArray(relevantDocs) ? relevantDocs.map((doc: any) => doc.content).join('\n\n') : '';
    
    // Create system prompt with context
    const systemPrompt = `You are a helpful AI assistant for FeedMe, an e-commerce website that sells food products and bundles in Nigeria.

Use the following context to answer questions accurately. Only provide information that is supported by the context:

${context}

IMPORTANT: If the user asks about products, bundles, or any specific information, only provide details that are confirmed in the context above. If you don't have enough information, say so rather than making things up.

For cooking questions (like jollof rice), you can:
1. Recommend products from the context that would be suitable
2. Suggest bundles that contain the needed ingredients
3. Provide general cooking tips based on the products available
4. Always ground your recommendations in the actual products/bundles from the context

Always be helpful, accurate, and honest about what you know. If someone asks about making a dish, suggest the specific products you have available rather than generic recipes.`;

    // Generate AI response using RAG
    const response = await model.invoke([
      ["system", systemPrompt],
      ["user", testQuery]
    ]);

    console.log("\n=== AI Response ===");
    console.log(response.content);
    
    console.log("\n✅ Jollof rice query test completed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testJollofRice();


