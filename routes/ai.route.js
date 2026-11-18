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

const router = express.Router();

// Apply AI rate-limiter to protect free-tier APIs from abuse
router.use(aiLimiter);

router.post('/plan', planItinerary);
router.post('/summarize', summarizePost);
router.post('/tags', verifyToken, autoTagPost);
router.post('/chat', chatWithAssistant);
router.post('/transit', getTransitGuide);
router.post('/discover', discoverPlace);

export default router;
