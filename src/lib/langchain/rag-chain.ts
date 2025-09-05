import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SupabaseVectorStore } from "./supabase-vector-store";
import { embeddings } from "./embeddings";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Initialize the vector store
const vectorStore = new SupabaseVectorStore(embeddings);

// Initialize Gemini
const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-1.5-flash",
  maxOutputTokens: 2048,
  temperature: 0.7,
});

// Create the RAG chain
const template = `You are a helpful AI assistant for FeedMe, an e-commerce website that sells food products and bundles.

Use the following context to answer the user's question. If you don't know the answer, just say that you don't know, don't try to make up an answer.

Context:
{context}

User Question: {question}

Conversation History:
{history}

Instructions:
1. Be helpful, friendly, and knowledgeable about food products
2. If the user wants to order or add items to cart, use the format [ORDER: item_name] or [ADD_TO_CART: item_name]
3. Provide relevant suggestions and follow-up questions
4. Keep responses concise but informative
5. If suggesting products, mention prices and key features

Response:`;

const prompt = PromptTemplate.fromTemplate(template);

export const ragChain = RunnableSequence.from([
  {
    context: async (input: { question: string; history: any[] }) => {
      const docs = await vectorStore.similaritySearch(input.question, 6);
      return docs.map(doc => doc.pageContent).join("\n\n");
    },
    question: (input: { question: string; history: any[] }) => input.question,
    history: (input: { question: string; history: any[] }) => 
      input.history.map(msg => `${msg.role}: ${msg.content}`).join("\n")
  },
  prompt,
  model,
  new StringOutputParser(),
]);

// Export the vector store for direct access if needed
export { vectorStore };


