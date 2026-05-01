import { errorHandler } from '../utils/error.js';
import Comment from '../models/comment.model.js';
import {
  createCommentService,
  getPostCommentsService,
  likeCommentService,
  editCommentService,
  deleteCommentService,
  getCommentsService
} from '../services/comment.service.js';

export const createComment = async (req, res, next) => {
  try {
    if (req.body.userId !== req.user.id) {
      return next(errorHandler(403, 'You are not allowed to create this comment'));
    }
    const newComment = await createCommentService(req.body);
    res.status(200).json(newComment);
  } catch (error) {
    next(error);
  }
};

export const getPostComments = async (req, res, next) => {
  try {
    const comments = await getPostCommentsService(req.params.postId);
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

export const likeComment = async (req, res, next) => {
  try {
    const comment = await likeCommentService(req.params.commentId, req.user.id);
    res.status(200).json(comment);
  } catch (error) {
    next(error);
  }
};

export const editComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return next(errorHandler(404, 'Comment not found'));
    
    if (comment.userId !== req.user.id && !req.user.isAdmin) {
      return next(errorHandler(403, 'You are not allowed to edit this comment'));
    }

    const editedComment = await editCommentService(req.params.commentId, req.body.content);
    res.status(200).json(editedComment);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return next(errorHandler(404, 'Comment not found'));
    
    if (comment.userId !== req.user.id && !req.user.isAdmin) {
      return next(errorHandler(403, 'You are not allowed to delete this comment'));
    }
    const message = await deleteCommentService(req.params.commentId);
    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};

export const getcomments = async (req, res, next) => {
  if (!req.user.isAdmin) return next(errorHandler(403, 'You are not allowed to get all comments'));
  try {
    const data = await getCommentsService(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
