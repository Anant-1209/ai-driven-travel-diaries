import express from 'express';
import {
  deleteUser,
  getUser,
  getUsers,
  getMe,
  setUserRole,
  signout,
  test,
  updateUser,
  savePost,
  getSavedPosts,
} from '../controllers/user.controller.js';
import { verifyToken, verifyAdmin } from '../utils/verifyUser.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateUserSchema, setRoleSchema } from '../validations/user.validation.js';

const router = express.Router();

router.get('/test', test);
router.get('/me', verifyToken, getMe);
router.put('/update/:userId', verifyToken, validate(updateUserSchema), updateUser);
router.put('/:userId/role', verifyToken, verifyAdmin, validate(setRoleSchema), setUserRole);
router.delete('/delete/:userId', verifyToken, deleteUser);
router.post('/signout', signout);
router.get('/getusers', verifyToken, getUsers);
router.post('/savePost/:postId', verifyToken, savePost);
router.get('/getSavedPosts/:userId', verifyToken, getSavedPosts);
router.get('/:userId', getUser);

export default router;
