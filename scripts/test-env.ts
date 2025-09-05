import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log("Environment variables test:");
console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY ? "✅ Set" : "❌ Not set");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✅ Set" : "❌ Not set");
console.log("NODE_ENV:", process.env.NODE_ENV);


