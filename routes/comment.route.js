import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import {
  createComment,
  deleteComment,
  editComment,
  getPostComments,
  getcomments,
  likeComment,
} from '../controllers/comment.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCommentSchema, editCommentSchema } from '../validations/comment.validation.js';

const router = express.Router();

router.post('/create', verifyToken, validate(createCommentSchema), createComment);
router.get('/getPostComments/:postId', getPostComments);
router.put('/likeComment/:commentId', verifyToken, likeComment);
router.put('/editComment/:commentId', verifyToken, validate(editCommentSchema), editComment);
router.delete('/deleteComment/:commentId', verifyToken, deleteComment);
router.get('/getcomments', verifyToken, getcomments);

export default router;
