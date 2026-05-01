import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(7, 'Username must be at least 7 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers')
      .refine((s) => !s.includes(' '), 'Username cannot contain spaces')
      .refine((s) => s === s.toLowerCase(), 'Username must be lowercase'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const signinSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});
