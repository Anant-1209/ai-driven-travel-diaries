import express from 'express';
import {
  deleteUser,
  getUser,
  getUsers,
  signout,
  test,
  updateUser,
  savePost,
  getSavedPosts,
} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateUserSchema } from '../validations/user.validation.js';

const router = express.Router();

router.get('/test', test);
router.put('/update/:userId', verifyToken, validate(updateUserSchema), updateUser);
router.delete('/delete/:userId', verifyToken, deleteUser);
router.post('/signout', signout);
router.get('/getusers', verifyToken, getUsers);
router.post('/savePost/:postId', verifyToken, savePost);
router.get('/getSavedPosts/:userId', verifyToken, getSavedPosts);
router.get('/:userId', getUser);

export default router;
