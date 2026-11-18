import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import { posts } from '../scratch/seed_data_list.js';
import { logger } from './logger.js';

dotenv.config();

const mongoURI = process.env.MONGO_URI;

export const seedDatabase = async ({ force = false } = {}) => {
  if (!mongoURI) {
    logger.error('MONGO_URI is missing in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    logger.info('Connected to MongoDB for seeding');

    const existingCount = await Post.countDocuments();
    if (existingCount > 0 && !force) {
      logger.info(`Database already contains ${existingCount} posts. Skipping seed (use --force to overwrite).`);
      await mongoose.disconnect();
      return;
    }

    if (force) {
      logger.warn('Force flag detected: clearing existing posts...');
      await Post.deleteMany({});
    }

    const realUser = await User.findOne({});
    const authorId = realUser ? realUser._id.toString() : '65f123456789012345678901';

    const formattedPosts = posts.map((p) => ({
      ...p,
      userId: authorId,
    }));

    await Post.insertMany(formattedPosts);
    logger.info(`Successfully seeded ${formattedPosts.length} destinations into database.`);

    await mongoose.disconnect();
    logger.info('Database connection closed.');
  } catch (error) {
    logger.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

// If run directly from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  const isForce = process.argv.includes('--force');
  seedDatabase({ force: isForce });
}
