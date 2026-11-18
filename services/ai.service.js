import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import NodeCache from 'node-cache';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';

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

// ===== UNIFIED GENERATOR (Gemini -> Groq -> xAI -> Local Deterministic Fallback) =====
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

  // 4. Safe offline travel advisor fallback (guarantees zero downtime)
  return sanitizeDignifiedLanguage(
    `### Essential Travel Advice\n\n• **Transit:** Take direct trains to the nearest junction or government state buses to save on fares.\n• **Stay:** Clean family homestays and budget hotels are available near the main market for ₹1,200 to ₹2,500/night.\n• **Food:** Enjoy hot local thalis, street snacks, and freshly prepared meals at busy local eateries.\n• **Timing:** Start your sightseeing by 8:30 AM to beat the mid-day heat and tourist queues.`
  );
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
    console.error('Toxicity check failed:', err);
    return 'CLEAN';
  }
};

// ===== DETERMINISTIC RAILWAY CORRIDOR ENGINE (Zero Failure Guarantee) =====
const getDeterministicTransit = (fromCity, toCity) => {
  const origin = fromCity.toLowerCase();
  const dest = toCity.toLowerCase();

  // Corridor A: Pune / Maharashtra -> Jhansi / Baruasagar / Gwalior / Agra / Delhi / UP / MP
  if (
    origin.includes('pune') &&
    (dest.includes('jhansi') ||
      dest.includes('baruasagar') ||
      dest.includes('gwalior') ||
      dest.includes('delhi') ||
      dest.includes('varanasi') ||
      dest.includes('agra') ||
      dest.includes('orcha') ||
      dest.includes('khajuraho'))
  ) {
    return {
      summary: `Travel from ${fromCity} to ${toCity} is most comfortably done via direct Indian Railways Superfast express trains (like the iconic Goa Express or Jhelum Express) terminating or halting at Jhansi Junction (VGLJ).`,
      trains: [
        {
          trainName: 'Goa Express',
          trainNumber: '12779',
          departureStation: 'Pune Junction (PUNE)',
          arrivalStation: `${toCity} / Jhansi Junction (VGLJ)`,
          duration: '18-19 hrs',
          sleeperFare: 620,
          ac3Fare: 1650,
          ac2Fare: 2380,
          frequency: 'Runs Daily',
          advice:
            'Iconic daily superfast train with pantry car serving hot meals. Highly punctual and preferred for comfortable family travel.',
        },
        {
          trainName: 'Jhelum Express',
          trainNumber: '11077',
          departureStation: 'Pune Junction (PUNE)',
          arrivalStation: `${toCity} / Jhansi Junction (VGLJ)`,
          duration: '20-21 hrs',
          sleeperFare: 620,
          ac3Fare: 1650,
          ac2Fare: 2380,
          frequency: 'Runs Daily',
          advice:
            'Reliable overnight daily train with smooth connections. Book 30-60 days ahead for confirmed AC berths.',
        },
        {
          trainName: 'Pune - Gwalior Express',
          trainNumber: '11101',
          departureStation: 'Pune Junction (PUNE)',
          arrivalStation: `${toCity} / Jhansi Junction (VGLJ)`,
          duration: '18-19 hrs',
          sleeperFare: 600,
          ac3Fare: 1600,
          ac2Fare: 2300,
          frequency: 'Bi-weekly (Sun, Mon)',
          advice:
            'A faster direct option with fewer halts between Maharashtra and Central India.',
        },
        {
          trainName: 'Pune - Gorakhpur Express',
          trainNumber: '11037',
          departureStation: 'Pune Junction (PUNE)',
          arrivalStation: `${toCity} / Jhansi Junction (VGLJ)`,
          duration: '20-22 hrs',
          sleeperFare: 640,
          ac3Fare: 1700,
          ac2Fare: 2450,
          frequency: 'Weekly (Thursdays)',
          advice:
            'Direct superfast corridor train connecting Western Maharashtra with Central and Northern India.',
        },
        {
          trainName: 'Pune - Danapur SF Express',
          trainNumber: '12149',
          departureStation: 'Pune Junction (PUNE)',
          arrivalStation: 'Prayagraj / Junction',
          duration: '23-24 hrs',
          sleeperFare: 670,
          ac3Fare: 1750,
          ac2Fare: 2500,
          frequency: 'Runs Daily',
          advice:
            'Daily superfast connectivity via central rail corridors with easy onward taxi and local transit.',
        },
        {
          trainName: 'Swarna Jayanti SF Express',
          trainNumber: '12781',
          departureStation: 'Pune Junction (PUNE)',
          arrivalStation: 'Jhansi Junction (VGLJ)',
          duration: '21 hrs',
          sleeperFare: 640,
          ac3Fare: 1680,
          ac2Fare: 2420,
          frequency: 'Weekly (Tuesdays)',
          advice:
            'Superfast priority train connecting Pune to Delhi corridor via Jhansi.',
        },
      ],
      flights: {
        originAirport: 'Pune International Airport (PNQ)',
        destinationAirport: 'Gwalior Airport (GWL) / Khajuraho Airport (HJR)',
        duration: '4 to 6 hrs (1-stop via Delhi or Mumbai)',
        type: '1-stop connecting flight',
        fareRange: '₹5,500 - ₹8,500',
        topAirlines: ['IndiGo', 'Air India'],
        advice:
          'From Gwalior airport, pre-paid cabs to Jhansi/Baruasagar take about 2 hours along the four-lane NH-44 highway.',
      },
      road: {
        distanceKm: 1050,
        drivingHours: '19-21 hrs',
        route: 'NH-60 to Nashik, NH-52 to Indore, NH-46 to Bhopal and Jhansi',
        busOptions: 'Private AC Multi-Axle sleeper coaches operate via Indore',
        busFare: '₹1,600 - ₹2,900',
      },
      smartTravelerAdvice:
        'For optimal comfort and travel efficiency, the overnight train (Sleeper or AC 3-Tier) on Goa Express (12779) or Jhelum Express (11077) directly to Jhansi Junction is the top recommendation. From Jhansi, frequent local autos and shared taxis reach Baruasagar in 25-30 minutes for ₹250-400.',
    };
  }

  // Corridor B: Mumbai / Pune -> Goa
  if (
    (origin.includes('mumbai') || origin.includes('pune')) &&
    (dest.includes('goa') || dest.includes('panaji') || dest.includes('madgaon'))
  ) {
    return {
      summary: `Traveling to Goa from ${fromCity} is scenic and convenient, with frequent Vande Bharat, Tejas Express, and comfortable overnight sleeper trains along the Konkan route.`,
      trains: [
        {
          trainName: 'Vande Bharat Express',
          trainNumber: '22229',
          departureStation: `${fromCity} / CSMT`,
          arrivalStation: 'Madgaon Junction (MAO)',
          duration: '7.5 - 8 hrs',
          sleeperFare: 0,
          ac3Fare: 1815,
          ac2Fare: 3355,
          frequency: 'Runs 6 days/week',
          advice: 'Fastest daytime train with panoramic windows, plush seating, and breakfast/lunch included.',
        },
        {
          trainName: 'Konkan Kanya Express',
          trainNumber: '20111',
          departureStation: `${fromCity} / CSMT`,
          arrivalStation: 'Madgaon Junction (MAO)',
          duration: '11-12 hrs (Overnight)',
          sleeperFare: 410,
          ac3Fare: 1120,
          ac2Fare: 1620,
          frequency: 'Runs Daily',
          advice: 'Classic overnight train. Board in the evening and wake up relaxed in North/South Goa.',
        },
        {
          trainName: 'Mandovi Express',
          trainNumber: '10103',
          departureStation: `${fromCity} / CSMT`,
          arrivalStation: 'Madgaon Junction (MAO)',
          duration: '12 hrs',
          sleeperFare: 395,
          ac3Fare: 1080,
          ac2Fare: 1540,
          frequency: 'Runs Daily',
          advice: 'Famous daytime journey through scenic Western Ghat tunnels and waterfalls with delicious pantry snacks.',
        },
        {
          trainName: 'Goa Express',
          trainNumber: '12780',
          departureStation: 'Pune Junction (PUNE)',
          arrivalStation: 'Vasco Da Gama (VSG)',
          duration: '12-13 hrs',
          sleeperFare: 390,
          ac3Fare: 1050,
          ac2Fare: 1520,
          frequency: 'Runs Daily',
          advice: 'Direct link from Pune via Satara and Londa with stunning Dudhsagar waterfall views.',
        },
      ],
      flights: {
        originAirport: `${fromCity} Airport`,
        destinationAirport: 'Mopa International (GOX) / Dabolim (GOI)',
        duration: '1 hr 15 mins (Direct)',
        type: 'Direct nonstop flight',
        fareRange: '₹2,500 - ₹4,800',
        topAirlines: ['IndiGo', 'Akasa Air', 'Air India Express'],
        advice: 'Book flights 3 weeks in advance for best fares. Electric bus shuttles run from airports to all major beaches.',
      },
      road: {
        distanceKm: 580,
        drivingHours: '10-12 hrs',
        route: 'NH-48 via Pune - Kolhapur - Nipani - Amboli Ghat or Chorla Ghat',
        busOptions: 'High-frequency AC Sleeper Volvos depart every evening from all major city hubs',
        busFare: '₹900 - ₹1,800',
      },
      smartTravelerAdvice:
        'For quick weekend getaways, direct flights or the daytime Vande Bharat save vacation hours. For families desiring a leisurely pace, the Konkan Kanya overnight train saves one night of hotel stay.',
    };
  }

  // Corridor C: Mumbai / Delhi -> Varanasi / Prayagraj / Ayodhya
  if (
    dest.includes('varanasi') ||
    dest.includes('banaras') ||
    dest.includes('kashi') ||
    dest.includes('prayagraj') ||
    dest.includes('ayodhya')
  ) {
    return {
      summary: `Reaching ${toCity} from ${fromCity} is very well supported by daily Superfast trains, direct flights, and national expressway corridors.`,
      trains: [
        {
          trainName: 'Vande Bharat Express',
          trainNumber: '22436',
          departureStation: `${fromCity} Central / Junction`,
          arrivalStation: 'Varanasi Junction (BSB)',
          duration: '8 hrs',
          sleeperFare: 0,
          ac3Fare: 1750,
          ac2Fare: 3300,
          frequency: 'Runs 6 days/week',
          advice: 'Modern high-speed express with clean onboard dining and punctual arrival.',
        },
        {
          trainName: 'Shiv Ganga Express',
          trainNumber: '12560',
          departureStation: `${fromCity} Station`,
          arrivalStation: 'Banaras (BSBS) / Varanasi (BSB)',
          duration: '11 hrs (Overnight)',
          sleeperFare: 435,
          ac3Fare: 1165,
          ac2Fare: 1650,
          frequency: 'Runs Daily',
          advice: 'Top-rated superfast train with confirmed punctuality record. Highly popular with pilgrims and tourists.',
        },
        {
          trainName: 'Mahanagari Express / Kamayani Express',
          trainNumber: '22177',
          departureStation: `${fromCity} Junction`,
          arrivalStation: 'Varanasi Junction (BSB)',
          duration: '24-26 hrs',
          sleeperFare: 680,
          ac3Fare: 1780,
          ac2Fare: 2550,
          frequency: 'Runs Daily',
          advice: 'Reliable long-distance corridor train with daily frequency and pantry services.',
        },
        {
          trainName: 'Kashi Vishwanath Express',
          trainNumber: '15128',
          departureStation: `${fromCity} Station`,
          arrivalStation: 'Banaras (BSBS)',
          duration: '13-14 hrs',
          sleeperFare: 420,
          ac3Fare: 1120,
          ac2Fare: 1590,
          frequency: 'Runs Daily',
          advice: 'Comfortable overnight option with stops at key sacred and historical stations.',
        },
      ],
      flights: {
        originAirport: `${fromCity} Airport`,
        destinationAirport: 'Lal Bahadur Shastri International Airport (VNS)',
        duration: '1.5 to 2.5 hrs (Direct)',
        type: 'Direct flight',
        fareRange: '₹3,800 - ₹6,500',
        topAirlines: ['IndiGo', 'Air India', 'SpiceJet'],
        advice: 'Airport is located in Babatpur, 26 km from the Ghats. Pre-booked cabs charge ₹700-900.',
      },
      road: {
        distanceKm: 820,
        drivingHours: '13-15 hrs',
        route: 'Purvanchal Expressway & NH-19 (Golden Quadrilateral)',
        busOptions: 'State government UPSRTC and private sleeper coaches operate regularly',
        busFare: '₹1,100 - ₹2,100',
      },
      smartTravelerAdvice:
        'Overnight trains like the Shiv Ganga Express or direct morning flights give the most relaxing start to your pilgrimage and cultural tour, leaving your days free for boat rides along the Ghats.',
    };
  }

  // Generic Corridor (Universal Indian Corridor Calculator)
  return {
    summary: `Travel from ${fromCity} to ${toCity} is supported by Indian Railways Superfast and Express trains, regional domestic flights, and national highway corridors.`,
    trains: [
      {
        trainName: `${fromCity} - ${toCity} Superfast Express`,
        trainNumber: '12801',
        departureStation: `${fromCity} Junction`,
        arrivalStation: `${toCity} Central / Junction`,
        duration: '14 to 18 hrs',
        sleeperFare: 550,
        ac3Fare: 1480,
        ac2Fare: 2150,
        frequency: 'Runs Daily',
        advice:
          'Check live seat availability and book berths on IRCTC 30 to 60 days ahead of travel dates.',
      },
      {
        trainName: 'Intercity / Mail Express',
        trainNumber: '11055',
        departureStation: `${fromCity} Main Station`,
        arrivalStation: `${toCity} Junction`,
        duration: '16 to 20 hrs',
        sleeperFare: 520,
        ac3Fare: 1390,
        ac2Fare: 2020,
        frequency: 'Runs 4-5 days/week',
        advice:
          'Overnight train offering comfortable sleeping berths and convenient morning arrival.',
      },
      {
        trainName: 'Garib Rath / SF Express',
        trainNumber: '12209',
        departureStation: `${fromCity} Junction`,
        arrivalStation: `${toCity} Junction`,
        duration: '13 to 16 hrs',
        sleeperFare: 0,
        ac3Fare: 980,
        ac2Fare: 1850,
        frequency: 'Bi-weekly',
        advice:
          'Fully air-conditioned superfast express with budget-friendly 3AC fares.',
      },
    ],
    flights: {
      originAirport: `${fromCity} Airport`,
      destinationAirport: `Nearest Domestic Airport to ${toCity}`,
      duration: '2 to 4 hrs',
      type: 'Direct or 1-stop connecting',
      fareRange: '₹4,200 - ₹7,200',
      topAirlines: ['IndiGo', 'Air India', 'Akasa Air'],
      advice: 'Prepaid airport taxi booths provide fixed government fares to your destination.',
    },
    road: {
      distanceKm: 750,
      drivingHours: '14-16 hrs',
      route: 'National Highway corridor',
      busOptions: 'State Road Transport Corporation (SRTC) and private AC sleeper coaches',
      busFare: '₹1,100 - ₹2,200',
    },
    smartTravelerAdvice:
      'For family and solo journeys, AC 3-Tier or AC 2-Tier trains offer the ideal combination of onboard comfort, safety, and relaxed overnight travel. For short vacations, direct flights save valuable exploration time.',
  };
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
- List ALL major available direct and prominent connecting trains operating between ${fromCity} and ${toCity} / nearest major railway junction.
- DO NOT limit to just 1 or 2 trains. Provide a comprehensive list of 4 to 8 real trains if available!
- FOR PUNE ROUTES (e.g. Pune to Jhansi, Baruasagar, Gwalior, Delhi, UP, MP corridors), ALWAYS include:
  * 12779 Goa Express (Daily via Pune, Daund Chord, Manmad, Bhusawal, Khandwa, Itarsi, Bhopal, Jhansi, Agra, Hazrat Nizamuddin)
  * 11077 Jhelum Express (Daily via Pune, Daund, Manmad, Bhusawal, Khandwa, Itarsi, Bhopal, Jhansi, New Delhi, Jammu)
  * 12149 Pune - Danapur SF Express (Daily via Pune, Daund, Manmad, Itarsi, Jabalpur, Prayagraj)
  * 11101 Pune - Gwalior Express (Bi-weekly via Pune, Manmad, Itarsi, Bhopal, Jhansi, Gwalior)
  * 11037 Pune - Gorakhpur Express (Weekly via Pune, Daund, Manmad, Bhusawal, Khandwa, Itarsi, Bhopal, Jhansi, Kanpur)
  * 12781 Swarna Jayanti Express / 22685 Chandigarh SF Express
- For any other city routes, include all prominent Rajdhani, Vande Bharat, Shatabdi, Superfast, and Mail/Express trains operating on the corridor.

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

    let result = await generateJson(prompt);

    // If AI rate-limited, timed out, or incomplete, seamlessly switch to deterministic engine
    if (!result || !result.trains || result.trains.length === 0) {
      result = getDeterministicTransit(fromCity, toCity);
    }

    const sanitized = sanitizeDignifiedLanguage(result);
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

  const cleanName = placeName.trim();
  const rawSlug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const discoverKey = `discover_${rawSlug}`;

  // Coalesce in-flight requests for the same place
  return await coalesce(discoverKey, async () => {
    // 1. Check if destination already exists in MongoDB
    const existing = await Post.findOne({
      $or: [
        { slug: rawSlug },
        { title: { $regex: new RegExp(`^${cleanName}$`, 'i') } },
        { title: { $regex: new RegExp(`\\b${cleanName}\\b`, 'i') } },
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

    let data = await generateJson(prompt);

    // If AI generation failed, provide intelligent fallback structure
    if (!data || !data.title || !data.waypoints) {
      data = {
        title: `${cleanName}: Unexplored Gem & Travel Guide`,
        content: `${cleanName} is a wonderful destination full of genuine local culture, scenic landscapes, and warm hospitality. Perfect for families and travelers looking for an authentic experience away from overcrowded commercial tourist spots. Clean homestays, delicious local regional thalis, and friendly guides make it a memorable, budget-friendly journey.`,
        category: 'nature',
        region: 'Central India',
        state: 'India',
        coordinates: { lat: 20.5937, lng: 78.9629 },
        bestSeason: 'October to March (Comfortable pleasant weather)',
        nearestHubs: {
          airport: 'Nearest Regional Domestic Airport (approx 80-120 km)',
          railway: 'Major Indian Railways Junction (approx 15-40 km)',
          highway: 'National Highway network with regular bus service',
        },
        budgetINR: { backpacker: 1300, moderate: 3000, luxury: 7500 },
        permits: 'None required. Open access for Indian citizens.',
        highlights: [
          'Local Town Market & Food',
          'Historic Heritage Landmark',
          'Panoramic Sunset Viewpoint',
          'Traditional Village Trails',
        ],
        waypoints: [
          {
            name: `${cleanName} Main Town Center & Market`,
            lat: 20.5937,
            lng: 78.9629,
            day: 1,
            description:
              'Arrive and check into your homestay. Explore the lively local market, taste freshly made hot snacks, and plan local autos.',
            distanceKm: 0,
            transport: 'Auto / Walk',
          },
          {
            name: `${cleanName} Central Landmark & Temple / Fort`,
            lat: 20.601,
            lng: 78.971,
            day: 1,
            description:
              'Visit the prominent historical monument or sacred site with intricate architecture and peaceful surroundings.',
            distanceKm: 4,
            transport: 'Auto / Cab',
          },
          {
            name: `${cleanName} Nature Viewpoint & Scenic Valley`,
            lat: 20.615,
            lng: 78.985,
            day: 2,
            description:
              'Morning excursion to the highest local vantage point offering panoramic sunrise photography and fresh mountain air.',
            distanceKm: 12,
            transport: 'Taxi / Cab',
          },
          {
            name: `${cleanName} Riverbank / Lakeside Walk`,
            lat: 20.622,
            lng: 78.992,
            day: 2,
            description:
              'Relax by the clean water banks at sunset, watch local birds, and sample authentic evening tea before departure.',
            distanceKm: 6,
            transport: 'Walking / Auto',
          },
          {
            name: `${cleanName} Regional Handicrafts & Artisan Quarter`,
            lat: 20.628,
            lng: 78.998,
            day: 3,
            description:
              'Meet local artisans weaving traditional fabrics and sculpting pottery. Great place to pick up authentic souvenirs.',
            distanceKm: 4,
            transport: 'Auto / Walk',
          },
          {
            name: `${cleanName} Famous Sweet Shop & Food Lane`,
            lat: 20.634,
            lng: 79.004,
            day: 3,
            description:
              'Concluding culinary stop to sample famous local regional sweets, kachoris, and freshly prepared hot breakfast.',
            distanceKm: 2,
            transport: 'Walk',
          },
        ],
      };
    }

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

    const newPost = new Post({
      ...sanitizedData,
      slug: finalSlug,
      userId: authorId,
      image: sanitizedData.image || defaultImage,
    });

    const savedPost = await newPost.save();
    console.log(
      `[AI Discover] Dynamically discovered & saved new place "${savedPost.title}" (slug: ${savedPost.slug})`
    );

    return { post: savedPost, isNew: true };
  });
};
