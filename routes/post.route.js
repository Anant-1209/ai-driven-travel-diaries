import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { create, deletepost, getposts, updatepost } from '../controllers/post.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPostSchema, updatePostSchema } from '../validations/post.validation.js';

const router = express.Router();

router.post('/create', verifyToken, validate(createPostSchema), create)
router.get('/getposts', getposts)
router.delete('/deletepost/:postId/:userId', verifyToken, deletepost)
router.put('/updatepost/:postId/:userId', verifyToken, validate(updatePostSchema), updatepost)


export default router;