import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(25, 'Username must be at most 25 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .refine((s) => !s.includes(' '), 'Username cannot contain spaces')
      .refine((s) => s === s.toLowerCase(), 'Username must be lowercase'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(5, 'Password must be at least 5 characters'),
  }),
});

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google credential is required'),
  }),
});

export const signinSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});
