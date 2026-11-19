import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { initSocket } from './socket/socketHandler.js';
import { logger } from './utils/logger.js';

const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'FIREBASE_PROJECT_ID'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length) {
  logger.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
  })
  .then(() => logger.info('MongoDB is connected successfully'))
  .catch((err) => logger.error(`MongoDB connection error: ${err.message}`));

const app = createApp();
const server = http.createServer(app);
initSocket(server);

server.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
});

// State is unknown after an uncaught exception; exit and let the process manager restart.
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack}`);
  process.exit(1);
});

