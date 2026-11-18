import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import { logger } from './logger.js';

dotenv.config();

const identifier = process.argv[2];

if (!identifier) {
  console.log('Usage: npm run make-admin <email-or-username>');
  process.exit(1);
}

const promoteUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { username: identifier.toLowerCase() };

    const user = await User.findOne(query);
    if (!user) {
      console.error(`User "${identifier}" not found in MongoDB.`);
      await mongoose.disconnect();
      process.exit(1);
    }

    user.isAdmin = true;
    await user.save();
    console.log(`✨ Successfully promoted ${user.username} (${user.email}) to Admin!`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

promoteUser();
