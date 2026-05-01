import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { sendMessage, getMessages, getConversations } from '../controllers/message.controller.js';

const router = express.Router();

router.post('/send/:id', verifyToken, sendMessage);
router.get('/conversations', verifyToken, getConversations);
router.get('/:id', verifyToken, getMessages);

export default router;
