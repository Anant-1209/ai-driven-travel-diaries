import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import postRoutes from './routes/post.route.js';
import commentRoutes from './routes/comment.route.js';
import aiRoutes from './routes/ai.route.js';
import messageRoutes from './routes/message.route.js';
import uploadRoutes from './routes/upload.route.js';
import cookieParser from 'cookie-parser';
import path from 'path'; 
import helmet from 'helmet';
import morgan from 'morgan';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { globalErrorMiddleware } from './middlewares/error.middleware.js';
import { logger } from './utils/logger.js';
import { initSocket } from './socket/socketHandler.js';
import http from 'http';

dotenv.config(); // Load environment variables from .env file

const jwtSecret = process.env.JWT_SECRET;
const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 3000;

// Debugging statements to check if environment variables are loaded
console.log('MONGO_URI:', mongoURI); // This should log your MongoDB URI
console.log('PORT:', port); // This should log 3000 or the specified port in .env file

// Configure robust connection options for MongoDB Atlas Free Tier (M0) resilience
const mongooseOptions = {
  maxPoolSize: 10, // Prevent Atlas M0 500-connection exhaustion
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000, // Fast timeout on network stalls
  socketTimeoutMS: 45000,
  family: 4, // IPv4 to avoid DNS delays
};

mongoose
  .connect(mongoURI, mongooseOptions)
  .then(async () => {
    logger.info('MongoDB is connected successfully');
    try {
      const Post = (await import('./models/post.model.js')).default;
      const User = (await import('./models/user.model.js')).default;
      
      const postCount = await Post.countDocuments();
      if (postCount === 0) {
        logger.info('Database empty on first startup: auto-populating initial destinations...');
        const realUser = await User.findOne({});
        const { posts } = await import('./scratch/seed_data_list.js');
        const initialPosts = posts.map(p => ({
          ...p,
          userId: realUser ? realUser._id : p.userId
        }));
        await Post.insertMany(initialPosts);
        logger.info(`✨ Initialized database with ${initialPosts.length} destinations.`);
      } else {
        logger.info(`Database ready with ${postCount} existing destinations.`);
      }
    } catch (seedErr) {
      logger.error('Startup check failed:', seedErr.message);
    }
  })
  .catch((err) => {
    logger.error(`MongoDB connection error: ${err}`);
  });

const __dirname = path.resolve();
const app = express();
const server = http.createServer(app);
initSocket(server);

app.set('trust proxy', 1);

// --- HARDENING MIDDLEWARES ---
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
})); // Sets security HTTP headers
app.use(morgan('dev')); // HTTP request logger
app.use('/api/', apiLimiter); // Apply rate limiting to all API routes

app.use(express.json());
app.use(cookieParser());

// --- AUTH SECURITY FIX (CORS) ---
import cors from 'cors';
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true, // Allow cookies to be sent
}));

server.listen(port, () => {
  logger.info(`Server is running on port ${port}!`);
});

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Serve self-hosted user and destination media
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend files from the build directory
app.get("/", (req, res) => {
  app.use(express.static(path.resolve(__dirname, "client", "dist")));
  res.sendFile(path.resolve(__dirname, "client", "dist", "index.html"));
});

app.use(express.static(path.join(__dirname, '/client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Use global error middleware instead of inline
app.use(globalErrorMiddleware);

// Process-level crash prevention under live traffic
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep server alive, never let an async rejection take down production
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception thrown:', err.message, err.stack);
  // Log critical error without crashing instantly if recoverable
});

