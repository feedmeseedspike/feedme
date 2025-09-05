import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Ensure GOOGLE_API_KEY is set for embeddings
if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

export const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "text-embedding-004",
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY!,
});


