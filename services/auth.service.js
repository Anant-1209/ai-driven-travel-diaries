import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js';

export const signupService = async (userData) => {
  const { username, email, password } = userData;
  const hashedPassword = bcryptjs.hashSync(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  await newUser.save();
  return newUser;
};

export const signinService = async (credentials) => {
  const { email, password } = credentials;
  const validUser = await User.findOne({ email });
  if (!validUser) throw errorHandler(404, 'User not found');
  
  const validPassword = bcryptjs.compareSync(password, validUser.password);
  if (!validPassword) throw errorHandler(400, 'Invalid password');
  
  const token = jwt.sign(
    { id: validUser._id, isAdmin: validUser.isAdmin },
    process.env.JWT_SECRET
  );
  const { password: pass, ...rest } = validUser._doc;
  return { token, user: rest };
};

export const googleAuthService = async (googleData) => {
  const { email, name, googlePhotoUrl } = googleData;
  let user = await User.findOne({ email });
  if (!user) {
    const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
    user = new User({
      username: name.toLowerCase().split(' ').join('') + Math.random().toString(9).slice(-4),
      email,
      password: hashedPassword,
      profilePicture: googlePhotoUrl,
    });
    await user.save();
  }
  
  const token = jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET
  );
  const { password, ...rest } = user._doc;
  return { token, user: rest };
};
