import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const startTestApp = async () => {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret',
    FIREBASE_PROJECT_ID: 'travel-diaries-test',
    CLIENT_URL: 'http://localhost:5173',
  });
  for (const key of ['GEMINI_API_KEY', 'GROQ_API_KEY', 'XAI_API_KEY']) delete process.env[key];

  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongo.getUri());
  const { createApp } = await import('../app.js');
  const { default: User } = await import('../models/user.model.js');

  let counter = 0;
  const createUser = (overrides = {}) => {
    counter += 1;
    return User.create({
      username: `traveler${counter}${Date.now() % 100000}`,
      email: `traveler${counter}-${Date.now()}@example.com`,
      password: 'hashed',
      ...overrides,
    });
  };

  const cookieFor = (user) =>
    `access_token=${jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET)}`;

  const stop = async () => {
    await mongoose.disconnect();
    await mongo.stop();
  };

  return { app: createApp(), createUser, cookieFor, stop };
};
