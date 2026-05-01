import { z } from 'zod';

export const updateUserSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(7, 'Username must be at least 7 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers')
      .refine((s) => !s.includes(' '), 'Username cannot contain spaces')
      .refine((s) => s === s.toLowerCase(), 'Username must be lowercase')
      .optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    profilePicture: z.string().url('Invalid URL').optional(),
  }),
});
