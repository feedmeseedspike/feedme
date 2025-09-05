import * as dotenv from 'dotenv';
import { createClient } from "../src/utils/supabase/client";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Load environment variables
dotenv.config();

async function testRAG() {
  try {
    console.log("Testing RAG system...");
    
    // Initialize embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "text-embedding-004",
      apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY!,
    });
    
    // Test query
    const testQuery = "rice tomatoes onions peppers spices ingredients";
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
        match_threshold: 0.3, // Much lower threshold to find more matches
        match_count: 10
      }
    );
    
    if (error) {
      console.error("Vector search error:", error);
      return;
    }
    
    console.log(`Found ${Array.isArray(relevantDocs) ? relevantDocs.length : 0} relevant documents:`);
    
    if (Array.isArray(relevantDocs)) {
      relevantDocs.forEach((doc: any, index: number) => {
        console.log(`\n--- Document ${index + 1} ---`);
        console.log(`Content: ${doc.content.substring(0, 200)}...`);
        console.log(`Similarity: ${doc.similarity}`);
        console.log(`Metadata: ${JSON.stringify(doc.metadata, null, 2)}`);
      });
    }
    
    console.log("\n✅ RAG system is working correctly!");
    
  } catch (error) {
    console.error("❌ RAG test failed:", error);
  }
}

// Run the test
testRAG();
