import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://f1-fantasy-ai.vercel.app", // Replace with your site URL
    "X-Title": "F1 Fantasy AI", // Replace with your app name
  },
  defaultQuery: {
    // Use the google/gemini-pro-1.5 model for all OpenAI API calls
    model: "google/gemini-pro-1.5",
  },
}); 