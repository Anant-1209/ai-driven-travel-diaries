import { z } from 'zod';

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    category: z.string().optional(),
    image: z.string().url('Invalid image URL').optional(),
  }),
});

export const updatePostSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').optional(),
    content: z.string().min(1, 'Content is required').optional(),
    category: z.string().optional(),
    image: z.string().url('Invalid image URL').optional(),
  }),
});
