import Comment from '../models/comment.model.js';
import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';
import { getIo, notifyUser } from '../socket/socketHandler.js';
import { checkToxicityService } from './ai.service.js';

export const createCommentService = async (commentData) => {
  // Phase 7: AI Toxicity Check
  const toxicity = await checkToxicityService(commentData.content);
  if (toxicity === 'TOXIC') {
    throw errorHandler(400, 'Your comment was flagged as inappropriate and could not be posted.');
  }

  const newComment = new Comment({
    content: commentData.content,
    postId: commentData.postId,
    userId: commentData.userId,
  });
  await newComment.save();
  console.log(`[DEBUG] Comment saved to DB: ${newComment._id} for Post: ${commentData.postId}`);
  
  // Real-time: Emit to all users looking at this post
  try {
    const io = getIo();
    if (io) {
        io.to(commentData.postId).emit('newComment', newComment);
    }
    const post = await Post.findById(commentData.postId);
    if (post) {
      // Professional Notification: Using the actual username
      const senderName = req.user.username || 'A traveler';
      notifyUser(post.userId, 'notification', { 
        message: `${senderName} just commented on your travel story! ✍️`, 
        postId: post._id,
        postSlug: post.slug 
      });
    }
  } catch (err) {
    console.error('Socket emit error', err);
  }
  
  return newComment;
};

export const getPostCommentsService = async (postId) => {
  return await Comment.find({ postId }).sort({ createdAt: -1 });
};

export const likeCommentService = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw errorHandler(404, 'Comment not found');
  
  const userIndex = comment.likes.indexOf(userId);
  if (userIndex === -1) {
    comment.numberOfLikes += 1;
    comment.likes.push(userId);
  } else {
    comment.numberOfLikes -= 1;
    comment.likes.splice(userIndex, 1);
  }
  await comment.save();

  // Real-time: Emit to post room
  try {
    getIo().to(comment.postId).emit('commentLiked', { commentId, likes: comment.likes, numberOfLikes: comment.numberOfLikes });
  } catch(err) {
    console.log(err);
  }
  return comment;
};

export const editCommentService = async (commentId, content) => {
  return await Comment.findByIdAndUpdate(
    commentId,
    { content },
    { new: true }
  );
};

export const deleteCommentService = async (commentId) => {
  await Comment.findByIdAndDelete(commentId);
  return 'Comment has been deleted';
};

export const getCommentsService = async (query) => {
  const startIndex = parseInt(query.startIndex) || 0;
  const limit = parseInt(query.limit) || 9;
  const sortDirection = query.sort === 'desc' ? -1 : 1;
  const comments = await Comment.find()
    .sort({ createdAt: sortDirection })
    .skip(startIndex)
    .limit(limit);
  const totalComments = await Comment.countDocuments();
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const lastMonthComments = await Comment.countDocuments({ createdAt: { $gte: oneMonthAgo } });
  
  return { comments, totalComments, lastMonthComments };
};
