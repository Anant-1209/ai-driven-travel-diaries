import rateLimit from 'express-rate-limit';

// General API rate limiter for regular browsing (generous for active exploration)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // Up to 600 requests per 15 minutes per IP for smooth browsing
  message: {
    success: false,
    message: 'Too many requests from this IP. Please take a quick breath and try again shortly.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dedicated AI rate limiter to protect Free-Tier Gemini & Groq limits from abuse
export const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 40, // Up to 40 AI operations per 5 minutes per IP
  message: {
    success: false,
    message: 'AI assistant is currently busy serving travelers. Please wait a moment before asking again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Resilient rate limiter for Authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Up to 30 sign-in/up attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

