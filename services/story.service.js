import path from 'path';
import Story from '../models/story.model.js';
import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';
import { checkToxicityService } from './ai.service.js';

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];
const AUTHOR_FIELDS = 'username profilePicture';

const toView = ({ likes = [], ...story }, viewerId) => ({
  ...story,
  likedByMe: Boolean(viewerId && likes.some((id) => String(id) === viewerId)),
});

export const listStoriesService = async ({ place, featured, before, limit = 12 }, viewer) => {
  const filter = {};
  if (place) filter.placeSlug = place;
  if (featured === 'true') filter.featured = true;
  if (before) filter.createdAt = { $lt: new Date(before) };
  const stories = await Story.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .populate('userId', AUTHOR_FIELDS)
    .lean();
  return stories.filter((story) => story.userId).map((story) => toView(story, viewer?.id));
};

export const createStoryService = async (user, { caption, media, placeSlug }) => {
  if (placeSlug && !(await Post.exists({ slug: placeSlug }))) {
    throw errorHandler(400, 'Unknown destination');
  }
  if ((await checkToxicityService(caption)) === 'TOXIC') {
    throw errorHandler(400, 'Your story was flagged as inappropriate and could not be posted.');
  }
  const story = await Story.create({
    userId: user.id,
    placeSlug: placeSlug || null,
    caption,
    media: media.map((url) => ({
      url,
      type: VIDEO_EXTENSIONS.includes(path.extname(url).toLowerCase()) ? 'video' : 'image',
    })),
  });
  await story.populate('userId', AUTHOR_FIELDS);
  return toView(story.toObject(), user.id);
};

export const toggleLikeService = async (storyId, userId) => {
  const liked = await Story.findOneAndUpdate(
    { _id: storyId, likes: { $ne: userId } },
    { $push: { likes: userId }, $inc: { likesCount: 1 } },
    { new: true }
  );
  if (liked) return { likesCount: liked.likesCount, likedByMe: true };

  const unliked = await Story.findOneAndUpdate(
    { _id: storyId, likes: userId },
    { $pull: { likes: userId }, $inc: { likesCount: -1 } },
    { new: true }
  );
  if (!unliked) throw errorHandler(404, 'Story not found');
  return { likesCount: unliked.likesCount, likedByMe: false };
};

export const featureStoryService = async (storyId, featured) => {
  const story = await Story.findByIdAndUpdate(storyId, { $set: { featured } }, { new: true });
  if (!story) throw errorHandler(404, 'Story not found');
  return { featured: story.featured };
};

export const deleteStoryService = async (storyId, user) => {
  const story = await Story.findById(storyId);
  if (!story) throw errorHandler(404, 'Story not found');
  if (String(story.userId) !== user.id && !user.isAdmin) {
    throw errorHandler(403, 'You can only delete your own stories');
  }
  await story.deleteOne();
};
