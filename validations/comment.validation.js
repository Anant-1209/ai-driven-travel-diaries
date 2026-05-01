import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(200, 'Comment is too long'),
    postId: z.string().min(1, 'Post ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
});

export const editCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(200, 'Comment is too long'),
  }),
});
