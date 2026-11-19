import express from 'express';
import { verifyToken, verifyAdmin, optionalUser } from '../utils/verifyUser.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  listStoriesService,
  createStoryService,
  toggleLikeService,
  featureStoryService,
  deleteStoryService,
} from '../services/story.service.js';
import {
  listStoriesSchema,
  createStorySchema,
  storyIdSchema,
  featureStorySchema,
} from '../validations/story.validation.js';
import { asyncHandler as handle } from '../utils/asyncHandler.js';

const router = express.Router();

router.get(
  '/',
  validate(listStoriesSchema),
  optionalUser,
  handle(async (req, res) => res.json(await listStoriesService(req.query, req.user)))
);

router.post(
  '/',
  verifyToken,
  validate(createStorySchema),
  handle(async (req, res) => res.status(201).json(await createStoryService(req.user, req.body)))
);

router.put(
  '/:id/like',
  verifyToken,
  validate(storyIdSchema),
  handle(async (req, res) => res.json(await toggleLikeService(req.params.id, req.user.id)))
);

router.put(
  '/:id/feature',
  verifyToken,
  verifyAdmin,
  validate(featureStorySchema),
  handle(async (req, res) => res.json(await featureStoryService(req.params.id, req.body.featured)))
);

router.delete(
  '/:id',
  verifyToken,
  validate(storyIdSchema),
  handle(async (req, res) => {
    await deleteStoryService(req.params.id, req.user);
    res.json({ success: true });
  })
);

export default router;
