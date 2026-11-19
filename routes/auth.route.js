import express from 'express';
import { google, signin, signup } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { signupSchema, signinSchema, googleAuthSchema } from '../validations/auth.validation.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/signin', authLimiter, validate(signinSchema), signin);
router.post('/google', authLimiter, validate(googleAuthSchema), google);

export default router;