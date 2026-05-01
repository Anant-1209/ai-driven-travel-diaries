import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import { getIo, notifyUser } from '../socket/socketHandler.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user.id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      conversationId: conversation._id,
    });

    if (newMessage) {
      conversation.lastMessage = {
        text,
        senderId,
      };
    }

    await Promise.all([conversation.save(), newMessage.save()]);

    // Real-time: Send message to receiver via Socket
    notifyUser(receiverId, 'newMessage', newMessage);
    
    // Notification: Alert receiver
    notifyUser(receiverId, 'notification', { 
      message: `New message from ${req.user.username || 'User'}`, 
      type: 'MESSAGE' 
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user.id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    });

    if (!conversation) return res.status(200).json([]);

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({
        participants: { $in: [userId] }
    }).populate('participants', 'username profilePicture').sort({ updatedAt: -1 });

    // Filter out the current user from the participants list for easier frontend use
    // If it's a self-chat, we keep one participant (themselves)
    const filteredConversations = conversations.map(conv => {
        const otherParticipants = conv.participants.filter(p => p._id.toString() !== userId);
        conv.participants = otherParticipants.length > 0 ? otherParticipants : conv.participants;
        return conv;
    });

    res.status(200).json(filteredConversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
