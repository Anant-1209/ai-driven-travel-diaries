import { updateUserService, deleteUserService, getUsersService, getUserService, savePostService, getSavedPostsService } from '../services/user.service.js';

export const test = (req, res) => {
  res.json({ message: 'API is working!' });
};

export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'You are not allowed to update this user'));
  }
  try {
    const updatedUser = await updateUserService(req.params.userId, req.body);
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  if (!req.user.isAdmin && req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'You are not allowed to delete this user'));
  }
  try {
    const message = await deleteUserService(req.params.userId);
    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};

export const signout = (req, res, next) => {
  try {
    res.clearCookie('access_token').status(200).json('User has been signed out');
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(403, 'You are not allowed to see all users'));
  }
  try {
    const data = await getUsersService(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await getUserService(req.params.userId);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const savePost = async (req, res, next) => {
  try {
    const result = await savePostService(req.user.id, req.params.postId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getSavedPosts = async (req, res, next) => {
  try {
    const posts = await getSavedPostsService(req.user.id);
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};
