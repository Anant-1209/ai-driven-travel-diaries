import express from 'express';
import {
  planItinerary,
  summarizePost,
  autoTagPost,
  chatWithAssistant,
  getTransitGuide,
  discoverPlace,
} from '../controllers/ai.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { aiLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  planSchema,
  chatSchema,
  contentSchema,
  transitSchema,
  discoverSchema,
} from '../validations/ai.validation.js';

const router = express.Router();

// Apply AI rate-limiter to protect free-tier APIs from abuse
router.use(aiLimiter);

router.post('/plan', validate(planSchema), planItinerary);
router.post('/summarize', validate(contentSchema), summarizePost);
router.post('/tags', verifyToken, validate(contentSchema), autoTagPost);
router.post('/chat', validate(chatSchema), chatWithAssistant);
router.post('/transit', validate(transitSchema), getTransitGuide);
router.post('/discover', verifyToken, validate(discoverSchema), discoverPlace);

export default router;
