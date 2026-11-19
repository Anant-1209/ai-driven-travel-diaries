import express from 'express';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import postRoutes from './routes/post.route.js';
import commentRoutes from './routes/comment.route.js';
import aiRoutes from './routes/ai.route.js';
import messageRoutes from './routes/message.route.js';
import uploadRoutes from './routes/upload.route.js';
import tripRoutes from './routes/trip.route.js';
import storyRoutes from './routes/story.route.js';
import partnerRoutes from './routes/partner.route.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { globalErrorMiddleware } from './middlewares/error.middleware.js';
import { errorHandler } from './utils/error.js';
import { getAllowedOrigins } from './utils/origins.js';
import { socialPreview } from './utils/socialMeta.js';

export const createApp = () => {
  const app = express();
  const rootDir = path.resolve();
  const clientDist = path.join(rootDir, 'client', 'dist');

  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' } }));
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }
  app.use(cors({ origin: getAllowedOrigins(), credentials: true }));
  app.use('/api/', apiLimiter);
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/user', userRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/post', postRoutes);
  app.use('/api/comment', commentRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/message', messageRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/trip', tripRoutes);
  app.use('/api/story', storyRoutes);
  app.use('/api/partner', partnerRoutes);
  app.use('/api', (req, res, next) => next(errorHandler(404, 'API route not found')));

  app.use('/uploads', express.static(path.join(rootDir, 'uploads')));
  app.get(['/trip/:shareId', '/post/:slug'], socialPreview(path.join(clientDist, 'index.html')));
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  app.use(globalErrorMiddleware);
  return app;
};
