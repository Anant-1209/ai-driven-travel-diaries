import { z } from 'zod';

const text = (max, label) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be at most ${max} characters`);

export const planSchema = z.object({
  body: z.object({
    destination: text(100, 'Destination'),
    days: z.coerce.number().int().min(1, 'Days must be at least 1').max(14, 'Days must be at most 14'),
    budget: z.enum(['Budget', 'Moderate', 'Luxury']),
  }),
});

export const chatSchema = z.object({
  body: z.object({ message: text(1000, 'Message') }),
});

export const contentSchema = z.object({
  body: z.object({ content: text(20000, 'Content') }),
});

export const transitSchema = z.object({
  body: z.object({
    origin: z.string().trim().max(80).optional(),
    destination: text(150, 'Destination'),
    destinationState: z.string().trim().max(80).optional(),
  }),
});

export const discoverSchema = z.object({
  body: z.object({
    placeName: z.string().trim().min(2, 'Place name is too short').max(80, 'Place name is too long'),
  }),
});
