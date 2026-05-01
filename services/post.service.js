import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';
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
  // Create a unique cache key based on the query string
  const cacheKey = JSON.stringify(query);
  if (postCache.has(cacheKey)) {
    return postCache.get(cacheKey);
  }

  const startIndex = parseInt(query.startIndex) || 0;
  const limit = parseInt(query.limit) || 9;
  const sortDirection = query.order === 'asc' ? 1 : -1;
  const posts = await Post.find({
    ...(query.userId && { userId: query.userId }),
    ...(query.category && { category: query.category }),
    ...(query.slug && { slug: query.slug }),
    ...(query.postId && { _id: query.postId }),
    ...(query.searchTerm && {
      $or: [
        { title: { $regex: query.searchTerm, $options: 'i' } },
        { content: { $regex: query.searchTerm, $options: 'i' } },
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

  const result = { posts, totalPosts, lastMonthPosts };
  postCache.set(cacheKey, result);
  return result;
};

export const deletePostService = async (postId) => {
  await Post.findByIdAndDelete(postId);
  postCache.flushAll(); // Clear cache
  return 'The post has been deleted';
};

export const updatePostService = async (postId, updateData) => {
  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    {
      $set: {
        title: updateData.title,
        content: updateData.content,
        category: updateData.category,
        image: updateData.image,
      },
    },
    { new: true }
  );
  postCache.flushAll(); // Clear cache
  return updatedPost;
};
