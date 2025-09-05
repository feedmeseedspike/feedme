import * as dotenv from 'dotenv';
import { createClient } from "../src/utils/supabase/client";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Load environment variables
dotenv.config();

async function testComprehensiveKnowledge() {
  try {
    console.log("Testing Comprehensive Business Knowledge with RAG system...");
    
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
    
    // Test multiple types of queries
    const testQueries = [
      "I want to make jollof rice",
      "What bundles do you have for cooking?",
      "Tell me about your return policy",
      "What delivery options do you offer?",
      "Are there any bulk purchase offers?"
    ];
    
    for (const testQuery of testQueries) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`TESTING: "${testQuery}"`);
      console.log(`${'='.repeat(60)}`);
      
      // Generate embedding
      const queryEmbedding = await embeddings.embedQuery(testQuery);
      
      // Search for relevant documents
      const supabase = createClient();
      const { data: relevantDocs, error } = await supabase.rpc(
        'match_documents' as any,
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.3,
          match_count: 10
        }
      );
      
      if (error) {
        console.error("Vector search error:", error);
        continue;
      }
      
      console.log(`Found ${Array.isArray(relevantDocs) ? relevantDocs.length : 0} relevant documents`);
      
      // Show document types found
      if (Array.isArray(relevantDocs)) {
        const docTypes = relevantDocs.map((doc: any) => doc.metadata?.type || 'unknown');
        const uniqueTypes = [...new Set(docTypes)];
        console.log(`Document types: ${uniqueTypes.join(', ')}`);
      }
      
      // Extract context from relevant documents
      const context = Array.isArray(relevantDocs) ? relevantDocs.map((doc: any) => doc.content).join('\n\n') : '';
      
      // Create system prompt with context
      const systemPrompt = `You are a comprehensive AI assistant for FeedMe, an e-commerce website that sells food products and bundles in Nigeria.

Use the following context to answer questions accurately. Only provide information that is supported by the context:

${context}

IMPORTANT: If the user asks about products, bundles, or any specific information, only provide details that are confirmed in the context above. If you don't have enough information, say so rather than making things up.

You are knowledgeable about ALL aspects of FeedMe's business:

**Products & Bundles:**
- Recommend specific products with prices and descriptions
- Suggest relevant bundles for cooking needs
- Explain product benefits and uses

**Offers & Deals:**
- Inform about active Plug & Share offers
- Explain bulk purchase opportunities
- Highlight cost savings

**Customer Support:**
- Provide return policy information
- Share contact details for support
- Answer FAQs about policies

**Delivery & Logistics:**
- Explain delivery options and locations
- Provide delivery pricing information
- Share delivery timeframes

**Cooking & Recipes:**
- Suggest products for specific dishes
- Recommend ingredient combinations
- Provide cooking tips based on available products

For any question, always:
1. Ground your response in the actual products/bundles/offers from the context
2. Provide specific prices and details when available
3. Suggest relevant bundles or offers that could help
4. Include customer support information when relevant
5. Be helpful, accurate, and honest about what you know

If someone asks about making a dish, suggest the specific products you have available, relevant bundles, and any applicable offers.`;

      // Generate AI response using RAG
      const response = await model.invoke([
        ["system", systemPrompt],
        ["user", testQuery]
      ]);

      console.log(`\nAI Response:`);
      console.log(response.content);
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log("✅ Comprehensive business knowledge test completed!");
    console.log(`${'='.repeat(60)}`);
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testComprehensiveKnowledge();


