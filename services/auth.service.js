import crypto from 'crypto';
import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { errorHandler } from '../utils/error.js';

export const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const signToken = (user) =>
  jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_TTL_SECONDS,
  });

// Verifying ID tokens only needs the project ID, no service account.
const firebaseAuth = () => {
  if (!getApps().length) {
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  }
  return getAuth();
};

export const signupService = async (userData) => {
  const { username, email, password } = userData;

  // Check for duplicate email
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw errorHandler(400, 'An account with this email address already exists. Please sign in.');
  }

  // Check for duplicate username
  const existingUsername = await User.findOne({ username: username.toLowerCase() });
  if (existingUsername) {
    throw errorHandler(400, 'This username is already taken. Please choose another username.');
  }

  const hashedPassword = bcryptjs.hashSync(password, 10);
  const newUser = new User({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password: hashedPassword,
  });
  await newUser.save();
  return newUser;
};

export const signinService = async (credentials) => {
  const { email, password } = credentials;
  const validUser = await User.findOne({ email: email.toLowerCase() });
  const validPassword = validUser && bcryptjs.compareSync(password, validUser.password);
  if (!validPassword) throw errorHandler(401, 'Invalid email or password');

  const token = signToken(validUser);
  const { password: pass, ...rest } = validUser._doc;
  return { token, user: rest };
};

export const googleAuthService = async ({ idToken }) => {
  let decoded;
  try {
    decoded = await firebaseAuth().verifyIdToken(idToken);
  } catch {
    throw errorHandler(401, 'Google sign-in could not be verified. Please try again.');
  }
  if (!decoded.email || !decoded.email_verified) {
    throw errorHandler(401, 'Your Google account email is not verified.');
  }

  const email = decoded.email.toLowerCase();
  let user = await User.findOne({ email });
  if (!user) {
    const baseName = (decoded.name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '') || 'traveler';
    user = new User({
      username: `${baseName.slice(0, 20)}${crypto.randomInt(1000, 10000)}`,
      email,
      password: bcryptjs.hashSync(crypto.randomBytes(32).toString('hex'), 10),
      ...(decoded.picture && { profilePicture: decoded.picture }),
    });
    await user.save();
  }

  const token = signToken(user);
  const { password, ...rest } = user._doc;
  return { token, user: rest };
};
