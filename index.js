import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import postRoutes from './routes/post.route.js';
import commentRoutes from './routes/comment.route.js';
import aiRoutes from './routes/ai.route.js';
import messageRoutes from './routes/message.route.js';
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

mongoose
  .connect(mongoURI)
  .then(async () => {
    logger.info('MongoDb is connected');
    // --- FORCE SEED LOGIC (SUREFIRE FIX) ---
    try {
      const Post = (await import('./models/post.model.js')).default;
      const User = (await import('./models/user.model.js')).default;
      
      const realUser = await User.findOne({});
      if (!realUser) {
        logger.warn('⚠️ No users found in DB. Messaging might not work until you sign up.');
      }

      logger.info('🚀 FORCE SEEDING: Wiping database and injecting 24 destinations...');
      const { posts } = await import('./scratch/seed_data_list.js'); 
      
      const updatedPosts = posts.map(p => ({
        ...p,
        userId: realUser ? realUser._id : p.userId // Use real user if found
      }));

      await Post.deleteMany({});
      await Post.insertMany(updatedPosts);
      logger.info('✨ SUCCESS: 24 destinations are now 100% in your database.');
    } catch (seedErr) {
      logger.error('Auto-seed failed:', seedErr.message);
    }
  })
  .catch((err) => {
    logger.error(`MongoDb connection error: ${err}`);
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
