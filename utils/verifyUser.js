import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { errorHandler } from './error.js';

const loadUser = async (token) => {
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
  const user = await User.findById(payload.id).select('isAdmin username').lean();
  return user ? { id: String(user._id), isAdmin: Boolean(user.isAdmin), username: user.username } : null;
};

// Admin status is read from the database so promotions and removals apply immediately.
export const verifyToken = async (req, res, next) => {
  try {
    const user = await loadUser(req.cookies.access_token);
    if (!user) return next(errorHandler(401, 'Unauthorized'));
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalUser = async (req, res, next) => {
  try {
    req.user = await loadUser(req.cookies.access_token);
    next();
  } catch (err) {
    next(err);
  }
};

export const verifyAdmin = (req, res, next) =>
  req.user?.isAdmin ? next() : next(errorHandler(403, 'Admin access required'));
