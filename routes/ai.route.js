import express from 'express';
import {
  planItinerary,
  summarizePost,
  autoTagPost,
  chatWithAssistant,
} from '../controllers/ai.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/plan', planItinerary);
router.post('/summarize', summarizePost);
router.post('/tags', verifyToken, autoTagPost);
router.post('/chat', chatWithAssistant);

export default router;
