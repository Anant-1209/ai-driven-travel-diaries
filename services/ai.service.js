import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import NodeCache from 'node-cache';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import { escapeRegex, plainTextToHtml } from '../utils/sanitize.js';

// Cache responses for 1 hour to prevent redundant AI calls
const aiCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// ===== IN-FLIGHT REQUEST COALESCING (Prevents Thundering Herd / Rate Limit Spikes) =====
const inFlightRequests = new Map();

const coalesce = async (key, taskFn) => {
  if (inFlightRequests.has(key)) {
    return await inFlightRequests.get(key);
  }
  const promise = (async () => {
    try {
      return await taskFn();
    } finally {
      inFlightRequests.delete(key);
    }
  })();
  inFlightRequests.set(key, promise);
  return await promise;
};

// ===== DIGNIFIED LANGUAGE SANITIZER (Zero Tolerance for Hurtful/Socio-Economic Labels) =====
const DIGNIFIED_REPLACEMENTS = [
  { regex: /\b(middle[- ]?class families)\b/gi, replace: 'families' },
  { regex: /\b(middle[- ]?class family)\b/gi, replace: 'family' },
  { regex: /\b(middle[- ]?class travelers?)\b/gi, replace: 'smart travelers' },
  { regex: /\b(middle[- ]?class)\b/gi, replace: 'smart & value-conscious' },
  { regex: /\bpoverty\b/gi, replace: 'budget constraints' },
  { regex: /\bpoor families\b/gi, replace: 'budget-conscious families' },
  { regex: /\bpoor travelers?\b/gi, replace: 'budget travelers' },
  { regex: /\bpoor\b/gi, replace: 'budget' },
];

export const sanitizeDignifiedLanguage = (val) => {
  if (typeof val === 'string') {
    let s = val;
    for (const { regex, replace } of DIGNIFIED_REPLACEMENTS) {
      s = s.replace(regex, replace);
    }
    return s;
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeDignifiedLanguage);
  }
  if (val !== null && typeof val === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      const cleanKey = k === 'middleClassRecommendation' ? 'smartTravelerAdvice' : k;
      res[cleanKey] = sanitizeDignifiedLanguage(v);
    }
    return res;
  }
  return val;
};

// ===== PROVIDER CONFIG & CIRCUIT BREAKER STATE =====
const GEMINI_MODELS = ['gemini-2.5-flash'];
const GROQ_MODELS = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];
const XAI_MODEL = 'grok-4.20-reasoning';

let geminiCircuitTrippedUntil = 0;
let groqCircuitTrippedUntil = 0;

// ===== HELPER: CLEAN & PARSE JSON =====
const cleanAndParseJson = (raw) => {
  if (!raw) return null;
  let str = raw.trim();
  if (str.startsWith('```json')) {
    str = str.replace(/^```json/i, '').replace(/```$/, '').trim();
  } else if (str.startsWith('```')) {
    str = str.replace(/^```/, '').replace(/```$/, '').trim();
  }
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    str = str.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Failed to parse AI JSON:', e.message, 'Raw was:', str.slice(0, 100));
    return null;
  }
};

// ===== GEMINI PROVIDER (Circuit Breaker Protected) =====
const generateWithGemini = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) return null;
  // If circuit breaker is open (e.g. recent 429 quota limit), skip with 0 latency
  if (Date.now() < geminiCircuitTrippedUntil) {
    return null;
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  for (const model of GEMINI_MODELS) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({ model, contents: prompt }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini timeout')), 8000)),
      ]);
      if (response && response.text) return response.text;
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('quota') ||
        msg.includes('rate')
      ) {
        geminiCircuitTrippedUntil = Date.now() + 60000; // Trip circuit for 60 seconds
        console.warn(`[Circuit Breaker] Gemini rate limit tripped (${msg.slice(0, 60)}). Routing traffic to Groq for 60s.`);
        return null;
      }
      console.warn(`Gemini ${model} failed:`, msg);
    }
  }
  return null;
};

// ===== GROQ PROVIDER (Circuit Breaker Protected Fallback) =====
const generateWithGroq = async (prompt) => {
  if (!process.env.GROQ_API_KEY) return null;
  // If Groq circuit breaker is open, skip with 0 latency
  if (Date.now() < groqCircuitTrippedUntil) {
    return null;
  }
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  for (const model of GROQ_MODELS) {
    try {
      const completion = await Promise.race([
        groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model,
          temperature: 0.7,
          max_tokens: 2048,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Groq timeout')), 8000)),
      ]);
      const content = completion.choices[0]?.message?.content;
      if (content) return content;
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('rate_limit') || msg.includes('quota')) {
        groqCircuitTrippedUntil = Date.now() + 60000; // Trip circuit for 60 seconds
        console.warn(`[Circuit Breaker] Groq rate limit tripped (${msg.slice(0, 60)}). Routing to xAI/local fallback for 60s.`);
        return null;
      }
      console.warn(`Groq model ${model} failed:`, msg);
    }
  }
  return null;
};

// ===== XAI PROVIDER (Tertiary Fallback) =====
const generateWithXAI = async (prompt) => {
  if (!process.env.XAI_API_KEY) return null;
  try {
    const xai = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });
    const completion = await xai.chat.completions.create({
      model: XAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
    });
    return completion.choices[0]?.message?.content || null;
  } catch (err) {
    console.warn('xAI request failed:', err.message);
    return null;
  }
};

// ===== UNIFIED GENERATOR (Gemini -> Groq -> xAI) =====
export const AI_UNAVAILABLE_MESSAGE = 'Our AI assistant is busy right now. Please try again in a minute.';

const generate = async (prompt) => {
  // 1. Try Gemini (Primary)
  try {
    const geminiResult = await generateWithGemini(prompt);
    if (geminiResult) return sanitizeDignifiedLanguage(geminiResult);
  } catch (e) {
    console.error('Gemini Provider Error:', e.message);
  }

  // 2. Try Groq (Secondary)
  try {
    const groqResult = await generateWithGroq(prompt);
    if (groqResult) return sanitizeDignifiedLanguage(groqResult);
  } catch (e) {
    console.error('Groq Provider Error:', e.message);
  }

  // 3. Fallback to xAI (Tertiary)
  try {
    const xaiResult = await generateWithXAI(prompt);
    if (xaiResult) return sanitizeDignifiedLanguage(xaiResult);
  } catch (e) {
    console.error('xAI Provider Error:', e.message);
  }

  throw errorHandler(503, AI_UNAVAILABLE_MESSAGE);
};

// ===== STRUCTURED JSON GENERATOR =====
export const generateJson = async (prompt) => {
  // 1. Try Gemini
  try {
    const text = await generateWithGemini(
      `${prompt}\n\nIMPORTANT: Return ONLY valid raw JSON with NO markdown formatting.`
    );
    if (text) {
      const parsed = cleanAndParseJson(text);
      if (parsed) return sanitizeDignifiedLanguage(parsed);
    }
  } catch (e) {
    console.warn('Gemini JSON parse failed, trying Groq...');
  }

  // 2. Try Groq
  try {
    const text = await generateWithGroq(
      `${prompt}\n\nIMPORTANT: Return ONLY valid raw JSON with NO markdown formatting.`
    );
    if (text) {
      const parsed = cleanAndParseJson(text);
      if (parsed) return sanitizeDignifiedLanguage(parsed);
    }
  } catch (e) {
    console.warn('Groq JSON parse failed...');
  }

  return null;
};

// ===== SERVICES =====
export const generateItineraryService = async (destination, days, budget) => {
  const prompt = `Create a realistic, easy-to-follow travel itinerary for ${destination} for ${days} days with a ${budget} budget. 
  
  AUDIENCE & TONE:
  - Write in simple, clear, conversational English for travelers and families looking for a relaxing, well-paced vacation.
  - DO NOT use words like "middle class", "middle-class", or socio-economic labels. Treat all travelers with warmth and respect.
  - Avoid overly complex words or rush schedules. Give enough time to rest, enjoy scenic spots, and eat local meals.
  - Provide realistic costs in Indian Rupees (₹) for hotels/homestays, trains/buses/cabs, and meals.
  
  FORMAT IN BEAUTIFUL MARKDOWN:
  - ### Day X: [Catchy Theme]
  - Morning, Afternoon, Evening breakdown
  - 🚗 Easiest travel method (auto, shared cab, train, walking)
  - 🍽️ Local food spots (clean, welcoming restaurants or famous street stalls)
  - 💰 End summary: Realistic budget breakdown table in INR (Stay, Food, Local Travel, Tickets, Total)`;

  const res = await generate(prompt);
  return sanitizeDignifiedLanguage(res);
};

export const summarizeBlogService = async (content) => {
  const prompt = `Provide a simple, clear 3-sentence summary (TL;DR) for the following travel diary in plain, friendly English that any traveler can easily understand:\n\n${content}`;
  const res = await generate(prompt);
  return sanitizeDignifiedLanguage(res);
};

export const generateTagsService = async (content) => {
  const prompt = `Read the following travel blog post and return exactly 3 relevant category tags (e.g., Adventure, Budget, Luxury, City, Nature, Beach). Output the tags as a comma-separated list, nothing else. No extra text.\n\n${content}`;
  const text = await generate(prompt);
  return text.split(',').map((tag) => tag.trim());
};

export const chatAssistantService = async (message) => {
  const prompt = `You are 'WanderBot', a friendly and helpful travel assistant for Travel Diaries. 
  Answer the traveler's question in simple, clear, everyday English. Focus on practical advice for travelers and families (honest ₹ costs, clean places to stay, direct train/bus routes, local food to try). Never use socio-economic labels or terms like "middle class". Keep your response under 150 words.\n\nUser Question: ${message}`;
  const res = await generate(prompt);
  return sanitizeDignifiedLanguage(res);
};

export const checkToxicityService = async (text) => {
  try {
    const prompt = `Analyze the following text for toxicity, hate speech, harassment, or extreme profanity. 
    Respond with exactly one word: 'TOXIC' if the content is inappropriate, or 'CLEAN' if it is acceptable for a family-friendly travel blog. 
    Text: "${text}"`;
    const reply = await generate(prompt);
    return reply.trim().toUpperCase().includes('TOXIC') ? 'TOXIC' : 'CLEAN';
  } catch (err) {
    console.warn(`Toxicity check skipped: ${err.message}`);
    return 'CLEAN';
  }
};

// ===== SERVICE: ROUTE & TRANSIT GUIDANCE FROM ORIGIN TO DESTINATION =====
export const getTransitGuideService = async ({ origin, destination, destinationState = 'India' }) => {
  const fromCity = (origin || 'Pune').trim();
  const toCity = (destination || 'Destination').trim();
  const cacheKey = `transit_v3_${fromCity.toLowerCase()}_${toCity.toLowerCase()}`;

  // 1. Fast Cache Lookup (0ms latency for repeated queries)
  const cached = aiCache.get(cacheKey);
  if (cached) return cached;

  // 2. Coalesce in-flight requests (Thundering Herd Protection under Live Traffic)
  return await coalesce(cacheKey, async () => {
    // Double check cache in case a parallel request just populated it
    const doubleCheck = aiCache.get(cacheKey);
    if (doubleCheck) return doubleCheck;

    const prompt = `You are an expert Indian Railways authority and journey planning specialist.
Provide realistic, comprehensive travel transit options from "${fromCity}" to "${toCity}" (${destinationState}) for travelers and families.

IMPORTANT SENSITIVITY RULE:
- NEVER use terms like "middle class", "middle-class", "low income", or socio-economic labels. Treat all travelers with utmost respect and dignity. Refer to them as "travelers", "families", "couples", or "explorers".

CRITICAL TRAIN COVERAGE REQUIREMENT:
- List the major direct and prominent connecting trains operating between ${fromCity} and ${toCity} / nearest major railway junction.
- Only include trains you are confident actually run on this route. If unsure, return fewer trains rather than guessing.
- Include prominent Rajdhani, Vande Bharat, Shatabdi, Superfast, and Mail/Express trains operating on the corridor.

Return ONLY a valid JSON object matching this schema:
{
  "summary": "2-sentence practical advice on the easiest, most comfortable way to travel from ${fromCity} to ${toCity}.",
  "trains": [
    {
      "trainName": "Full train name",
      "trainNumber": "5-digit train number",
      "departureStation": "${fromCity} Station (with code)",
      "arrivalStation": "Destination station (with code)",
      "duration": "e.g. 18-20 hrs",
      "sleeperFare": 620,
      "ac3Fare": 1650,
      "ac2Fare": 2380,
      "frequency": "Daily / Days of week",
      "advice": "Clear practical tip on bookings, pantry car, or connectivity"
    }
  ],
  "flights": {
    "originAirport": "${fromCity} Airport",
    "destinationAirport": "Nearest Airport",
    "duration": "e.g. 2 hrs direct / 5 hrs 1-stop",
    "type": "Direct or 1-stop via hub",
    "fareRange": "e.g. ₹4,000 - ₹6,500",
    "topAirlines": ["IndiGo", "Air India", "Akasa Air"],
    "advice": "Practical flight tip"
  },
  "road": {
    "distanceKm": 850,
    "drivingHours": "e.g. 16 hrs",
    "route": "Main National Highway names",
    "busOptions": "State transport or private AC sleeper buses",
    "busFare": "e.g. ₹1,200 - ₹2,200"
  },
  "smartTravelerAdvice": "Helpful recommendation on balancing travel time, budget, and comfort for families, solo travelers, and groups."
}`;

    const result = await generateJson(prompt);
    if (!result?.summary || !Array.isArray(result.trains)) {
      throw errorHandler(503, AI_UNAVAILABLE_MESSAGE);
    }

    const sanitized = sanitizeDignifiedLanguage(result);
    sanitized.aiGenerated = true;
    // Backward compatibility alias
    sanitized.middleClassRecommendation = sanitized.smartTravelerAdvice;

    aiCache.set(cacheKey, sanitized);
    return sanitized;
  });
};

// ===== SERVICE: DYNAMIC PLACE DISCOVERY & AUTO-GENERATION FOR ANY LOCATION =====
export const discoverPlaceService = async ({ placeName }) => {
  if (!placeName || placeName.trim().length < 2) {
    throw errorHandler(400, 'A valid destination or place name is required');
  }

  const cleanName = placeName.trim().slice(0, 80);
  const namePattern = escapeRegex(cleanName);
  const rawSlug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!rawSlug) {
    throw errorHandler(400, 'A valid destination or place name is required');
  }

  const discoverKey = `discover_${rawSlug}`;

  // Coalesce in-flight requests for the same place
  return await coalesce(discoverKey, async () => {
    // 1. Check if destination already exists in MongoDB
    const existing = await Post.findOne({
      $or: [
        { slug: rawSlug },
        { title: { $regex: new RegExp(`^${namePattern}$`, 'i') } },
        { title: { $regex: new RegExp(`\\b${namePattern}\\b`, 'i') } },
      ],
    });

    if (existing) {
      return { post: existing, isNew: false };
    }

    // 2. Discover & Generate on-the-fly using AI
    const prompt = `You are a trusted travel guide specialist. A traveler is planning to visit "${cleanName}".
Generate a complete, genuine, realistic travel guide and route itinerary for "${cleanName}".
Write all content in simple, clear, conversational English suitable for travelers, families, and couples.
DO NOT use terms like "middle class", "middle-class", or socio-economic labels. Treat all travelers with respect.
Provide real geographic coordinates, honest Indian Rupee (₹) daily budget rates, and 6 to 8 sequential checkpoints & must-visit places with realistic distances and travel modes.

Return ONLY a valid JSON object matching this schema:
{
  "title": "${cleanName}: [Catchy 3-5 word subtitle]",
  "content": "A detailed 3-paragraph friendly introduction explaining what makes ${cleanName} special, atmosphere, key attractions, best foods to try, and practical tips for regular families.",
  "category": "nature" | "heritage" | "adventure" | "culture",
  "region": "North India" | "South India" | "West India" | "East India" | "Central India" | "International",
  "state": "Name of State / Province or Country",
  "coordinates": { "lat": 20.5937, "lng": 78.9629 },
  "bestSeason": "e.g. October to March",
  "nearestHubs": {
    "airport": "Airport name and distance in km",
    "railway": "Railway Station and connectivity",
    "highway": "Major National Highway"
  },
  "budgetINR": {
    "backpacker": 1200,
    "moderate": 2800,
    "luxury": 7000
  },
  "permits": "Permit regulations or 'None required.'",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4", "Highlight 5", "Highlight 6"],
  "waypoints": [
    {
      "name": "Stop 1 Name (Town Center & Arrival)",
      "lat": 20.59,
      "lng": 78.96,
      "day": 1,
      "description": "Clear practical description in simple English with timing advice.",
      "distanceKm": 0,
      "transport": "Auto / Cab / Walk"
    },
    {
      "name": "Stop 2 Name (Historic Fort / Major Landmark)",
      "lat": 20.60,
      "lng": 78.97,
      "day": 1,
      "description": "Clear practical description.",
      "distanceKm": 5,
      "transport": "Auto / Cab"
    },
    {
      "name": "Stop 3 Name (Ancient Temple / Spiritual Site)",
      "lat": 20.61,
      "lng": 78.98,
      "day": 1,
      "description": "Clear practical description.",
      "distanceKm": 8,
      "transport": "Auto / Cab"
    },
    {
      "name": "Stop 4 Name (Scenic Sunset Viewpoint)",
      "lat": 20.62,
      "lng": 78.99,
      "day": 1,
      "description": "Clear practical description.",
      "distanceKm": 4,
      "transport": "Walk / Cab"
    },
    {
      "name": "Stop 5 Name (Lakeside / Nature Walk / Waterfall)",
      "lat": 20.63,
      "lng": 79.00,
      "day": 2,
      "description": "Clear practical description.",
      "distanceKm": 12,
      "transport": "Cab / Taxi"
    },
    {
      "name": "Stop 6 Name (Traditional Local Market & Food Street)",
      "lat": 20.64,
      "lng": 79.01,
      "day": 2,
      "description": "Clear practical description.",
      "distanceKm": 3,
      "transport": "Auto / Walk"
    }
  ]
}`;

    const data = await generateJson(prompt);

    const isCoord = (lat, lng) =>
      Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    const waypoints = Array.isArray(data?.waypoints)
      ? data.waypoints.filter((wp) => wp && typeof wp.name === 'string' && isCoord(wp.lat, wp.lng))
      : [];
    if (
      !data?.title ||
      !data.content ||
      !isCoord(data.coordinates?.lat, data.coordinates?.lng) ||
      waypoints.length === 0
    ) {
      throw errorHandler(503, "We couldn't build a reliable guide for this place right now. Please try again shortly.");
    }
    data.waypoints = waypoints;

    const sanitizedData = sanitizeDignifiedLanguage(data);

    // Find author (admin user)
    const adminUser = (await User.findOne({ isAdmin: true })) || (await User.findOne({}));
    const authorId = adminUser ? adminUser._id.toString() : '6afdd9e52ab1d87bd552e38b';

    // Ensure unique slug
    let finalSlug = rawSlug;
    const slugExists = await Post.findOne({ slug: finalSlug });
    if (slugExists) {
      finalSlug = `${rawSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Representative default cover image
    const defaultImage =
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200';

    // Only copy known fields: AI output is untrusted and must not set ids, owners, media or raw HTML.
    const newPost = new Post({
      title: String(sanitizedData.title).slice(0, 150),
      content: plainTextToHtml(sanitizedData.content || ''),
      category: sanitizedData.category,
      region: sanitizedData.region,
      state: sanitizedData.state,
      coordinates: sanitizedData.coordinates,
      bestSeason: sanitizedData.bestSeason,
      nearestHubs: sanitizedData.nearestHubs,
      budgetINR: sanitizedData.budgetINR,
      permits: sanitizedData.permits,
      highlights: sanitizedData.highlights,
      waypoints: sanitizedData.waypoints,
      source: 'ai',
      slug: finalSlug,
      userId: authorId,
      image: defaultImage,
    });

    const savedPost = await newPost.save();
    console.log(
      `[AI Discover] Dynamically discovered & saved new place "${savedPost.title}" (slug: ${savedPost.slug})`
    );

    return { post: savedPost, isNew: true };
  });
};
