import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';

export const updateUserService = async (userId, updateData) => {
  if (updateData.password) {
    updateData.password = bcryptjs.hashSync(updateData.password, 10);
  }
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        username: updateData.username,
        email: updateData.email,
        profilePicture: updateData.profilePicture,
        password: updateData.password,
      },
    },
    { new: true }
  );
  const { password, ...rest } = updatedUser._doc;
  return rest;
};

export const deleteUserService = async (userId) => {
  await User.findByIdAndDelete(userId);
  return 'User has been deleted';
};

export const getUsersService = async (query) => {
  const startIndex = parseInt(query.startIndex) || 0;
  const limit = parseInt(query.limit) || 9;
  const sortDirection = query.sort === 'asc' ? 1 : -1;

  const users = await User.find()
    .sort({ createdAt: sortDirection })
    .skip(startIndex)
    .limit(limit);

  const usersWithoutPassword = users.map((user) => {
    const { password, ...rest } = user._doc;
    return rest;
  });

  const totalUsers = await User.countDocuments();
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const lastMonthUsers = await User.countDocuments({ createdAt: { $gte: oneMonthAgo } });

  return { users: usersWithoutPassword, totalUsers, lastMonthUsers };
};

export const getUserService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw errorHandler(404, 'User not found');
  const { password, ...rest } = user._doc;
  return rest;
};

export const savePostService = async (userId, postId) => {
  const user = await User.findById(userId);
  if (!user) throw errorHandler(404, 'User not found');
  
  const isSaved = user.savedPosts.includes(postId);
  if (isSaved) {
    user.savedPosts = user.savedPosts.filter((id) => id.toString() !== postId);
  } else {
    user.savedPosts.push(postId);
  }
  
  await user.save();
  return { message: isSaved ? 'Post unsaved' : 'Post saved', savedPosts: user.savedPosts };
};

export const getSavedPostsService = async (userId) => {
  const user = await User.findById(userId).populate('savedPosts');
  if (!user) throw errorHandler(404, 'User not found');
  return user.savedPosts;
};
