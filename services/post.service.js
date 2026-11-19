import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';
import { escapeRegex, asString } from '../utils/sanitize.js';
import NodeCache from 'node-cache';

const postCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

export const createPostService = async (postData, userId) => {
  const slug = postData.title
    .split(' ')
    .join('-')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9-]/g, '');
  const newPost = new Post({ ...postData, slug, userId });
  const savedPost = await newPost.save();
  postCache.flushAll(); // Clear cache on new post
  return savedPost;
};

export const getPostsService = async (query) => {
  const startIndex = parseInt(query.startIndex) || 0;
  const limit = Math.min(parseInt(query.limit) || 9, 50);
  const sortDirection = query.order === 'asc' ? 1 : -1;
  const userId = asString(query.userId);
  const category = asString(query.category);
  const region = asString(query.region);
  const slug = asString(query.slug);
  const postId = asString(query.postId);
  const searchTerm = asString(query.searchTerm)?.trim().slice(0, 100);
  const searchPattern = searchTerm && escapeRegex(searchTerm);
  const searchWords = searchTerm
    ? searchTerm.split(' ').filter((w) => w.length > 1).map(escapeRegex)
    : [];

  const posts = await Post.find({
    ...(userId && { userId }),
    ...(category && { category }),
    ...(region && { region }),
    ...(slug && { slug }),
    ...(postId && { _id: postId }),
    ...(searchPattern && {
      $or: [
        { title: { $regex: searchPattern, $options: 'i' } },
        { content: { $regex: searchPattern, $options: 'i' } },
        { slug: { $regex: searchPattern, $options: 'i' } },
        { state: { $regex: searchPattern, $options: 'i' } },
        { category: { $regex: searchPattern, $options: 'i' } },
        { highlights: { $elemMatch: { $regex: searchPattern, $options: 'i' } } },
        ...searchWords.flatMap(word => [
          { title: { $regex: word, $options: 'i' } },
          { content: { $regex: word, $options: 'i' } },
          { slug: { $regex: word, $options: 'i' } },
          { state: { $regex: word, $options: 'i' } },
        ]),
      ],
    }),
  })
    .sort({ updatedAt: sortDirection })
    .skip(startIndex)
    .limit(limit);

  const totalPosts = await Post.countDocuments();
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const lastMonthPosts = await Post.countDocuments({ createdAt: { $gte: oneMonthAgo } });

  return { posts, totalPosts, lastMonthPosts };
};

export const deletePostService = async (postId) => {
  await Post.findByIdAndDelete(postId);
  postCache.flushAll(); // Clear cache
  return 'The post has been deleted';
};

const UPDATABLE_FIELDS = ['title', 'content', 'category', 'image', 'images', 'videoUrl', 'region', 'state', 'bestSeason', 'permits', 'highlights'];

export const updatePostService = async (postId, updateData) => {
  const changes = Object.fromEntries(
    UPDATABLE_FIELDS.filter((field) => updateData[field] !== undefined).map((field) => [field, updateData[field]])
  );
  const updatedPost = await Post.findByIdAndUpdate(postId, { $set: changes }, { new: true });
  if (!updatedPost) throw errorHandler(404, 'Post not found');
  postCache.flushAll(); // Clear cache
  return updatedPost;
};
