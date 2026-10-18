import { GoogleGenAI } from "@google/genai";

let client = null;

const getClient = () => {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
};

export const askGemini = async (prompt, { json = false } = {}) => {
  const response = await getClient().models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: prompt,
    config: json ? { responseMimeType: "application/json" } : undefined,
  });
  return response.text;
};