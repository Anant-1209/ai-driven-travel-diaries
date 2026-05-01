import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { errorHandler } from '../utils/error.js';

// ===== PROVIDER CONFIG =====
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const XAI_MODEL = 'grok-4.20-reasoning'; // User specified model

// ===== GEMINI PROVIDER =====
const generateWithGemini = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) return null;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt });
      return response.text;
    } catch (err) {
      console.warn(`Gemini ${model} failed, trying next...`);
    }
  }
  return null;
};

// ===== xAI PROVIDER (Grok) =====
const generateWithXAI = async (prompt) => {
  if (!process.env.XAI_API_KEY) return null;
  try {
    const openai = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });
    const completion = await openai.chat.completions.create({
      model: XAI_MODEL,
      messages: [{ role: "user", content: prompt }],
    });
    return completion.choices[0]?.message?.content || null;
  } catch (err) {
    console.warn('xAI failed:', err.message?.substring(0, 100));
    return null;
  }
};

// ===== GROQ PROVIDER (FREE FALLBACK) =====
const generateWithGroq = async (prompt) => {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
      temperature: 0.7,
      max_tokens: 2048,
    });
    return completion.choices[0]?.message?.content || null;
  } catch (err) {
    console.warn('Groq failed:', err.message?.substring(0, 100));
    return null;
  }
};

// ===== UNIFIED GENERATOR (tries Gemini -> xAI -> Groq) =====
const generate = async (prompt) => {
  // 1. Try Gemini
  const geminiResult = await generateWithGemini(prompt);
  if (geminiResult) return geminiResult;

  // 2. Try xAI (Grok)
  const xaiResult = await generateWithXAI(prompt);
  if (xaiResult) return xaiResult;

  // 3. Fallback to Groq
  const groqResult = await generateWithGroq(prompt);
  if (groqResult) return groqResult;

  throw errorHandler(503, 'AI service is temporarily unavailable. Please try again in a minute.');
};

// ===== SERVICES =====
export const generateItineraryService = async (destination, days, budget) => {
  const prompt = `Create a detailed travel itinerary for ${destination} for ${days} days with a ${budget} budget. 
  
  IMPORTANT: Return the response in BEAUTIFUL MARKDOWN FORMAT.
  Use:
  - ### Day X: [Theme] for daily headers
  - **Bold** for emphasis on place names or prices
  - Bullet points for activities
  - A summary table or list for estimated costs at the end
  - High-quality, professional travel advice and local food recommendations.
  
  Make it look like a professional travel guide.`;
  
  return await generate(prompt);
};

export const summarizeBlogService = async (content) => {
  const prompt = `Provide a concise, exciting 3-sentence summary (TL;DR) for the following travel blog post:\n\n${content}`;
  return generate(prompt);
};

export const generateTagsService = async (content) => {
  const prompt = `Read the following travel blog post and return exactly 3 relevant category tags (e.g., Adventure, Budget, Luxury, City, Nature, Beach). Output the tags as a comma-separated list, nothing else. No extra text.\n\n${content}`;
  const text = await generate(prompt);
  return text.split(',').map(tag => tag.trim());
};

export const chatAssistantService = async (message) => {
  const prompt = `You are a helpful and enthusiastic travel assistant named 'WanderBot' for the Travel Diaries platform. Respond concisely and politely to the following user query. Keep your response under 150 words.\n\nUser: ${message}`;
  return generate(prompt);
};

export const checkToxicityService = async (text) => {
  try {
    const prompt = `Analyze the following text for toxicity, hate speech, harassment, or extreme profanity. 
    Respond with exactly one word: 'TOXIC' if the content is inappropriate, or 'CLEAN' if it is acceptable for a family-friendly travel blog. 
    Text: "${text}"`;
    const reply = await generate(prompt);
    return reply.trim().toUpperCase().includes('TOXIC') ? 'TOXIC' : 'CLEAN';
  } catch (err) {
    console.error('Toxicity check failed:', err);
    return 'CLEAN'; // Fallback to avoid blocking comments if AI is down
  }
};
