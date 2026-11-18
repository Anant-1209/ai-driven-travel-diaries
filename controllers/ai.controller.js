import { errorHandler } from '../utils/error.js';
import {
  generateItineraryService,
  summarizeBlogService,
  generateTagsService,
  chatAssistantService,
  getTransitGuideService,
  discoverPlaceService,
} from '../services/ai.service.js';

export const planItinerary = async (req, res, next) => {
  try {
    const { destination, days, budget } = req.body;
    if (!destination || !days || !budget) {
      return next(errorHandler(400, 'Destination, days, and budget are required'));
    }
    const itinerary = await generateItineraryService(destination, days, budget);
    res.status(200).json({ itinerary });
  } catch (error) {
    next(error);
  }
};

export const summarizePost = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return next(errorHandler(400, 'Content is required'));
    
    const summary = await summarizeBlogService(content);
    res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
};

export const autoTagPost = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return next(errorHandler(400, 'Content is required'));
    
    const tags = await generateTagsService(content);
    res.status(200).json({ tags });
  } catch (error) {
    next(error);
  }
};

export const chatWithAssistant = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return next(errorHandler(400, 'Message is required'));
    
    const reply = await chatAssistantService(message);
    res.status(200).json({ reply });
  } catch (error) {
    next(error);
  }
};

export const getTransitGuide = async (req, res, next) => {
  try {
    const { origin, destination, destinationState } = req.body;
    if (!destination) return next(errorHandler(400, 'Destination is required'));
    
    const transit = await getTransitGuideService({ origin, destination, destinationState });
    res.status(200).json({ success: true, transit });
  } catch (error) {
    next(error);
  }
};

export const discoverPlace = async (req, res, next) => {
  try {
    const { placeName } = req.body;
    if (!placeName) return next(errorHandler(400, 'placeName is required'));
    
    const result = await discoverPlaceService({ placeName });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
