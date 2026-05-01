import { errorHandler } from '../utils/error.js';
import { createPostService, getPostsService, deletePostService, updatePostService } from '../services/post.service.js';

export const create = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(403, 'You are not allowed to create a post'));
  }
  try {
    const savedPost = await createPostService(req.body, req.user.id);
    res.status(201).json(savedPost);
  } catch (error) {
    next(error);
  }
};

export const getposts = async (req, res, next) => {
  try {
    const data = await getPostsService(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const deletepost = async (req, res, next) => {
  if (!req.user.isAdmin || req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'You are not allowed to delete this post'));
  }
  try {
    const message = await deletePostService(req.params.postId);
    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};

export const updatepost = async (req, res, next) => {
  if (!req.user.isAdmin || req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'You are not allowed to update this post'));
  }
  try {
    const updatedPost = await updatePostService(req.params.postId, req.body);
    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};
