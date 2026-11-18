import { z } from 'zod';

const waypointSchema = z.object({
  name: z.string().min(1, 'Waypoint name is required'),
  lat: z.number(),
  lng: z.number(),
  day: z.number().optional().default(1),
  description: z.string().optional().default(''),
  distanceKm: z.number().optional().default(0),
  transport: z.string().optional().default('Road'),
});

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    category: z.string().optional(),
    region: z.string().optional(),
    state: z.string().optional(),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
    videoUrl: z.string().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
    bestSeason: z.string().optional(),
    nearestHubs: z
      .object({
        airport: z.string().optional(),
        railway: z.string().optional(),
        highway: z.string().optional(),
      })
      .optional(),
    budgetINR: z
      .object({
        backpacker: z.number().optional(),
        moderate: z.number().optional(),
        luxury: z.number().optional(),
      })
      .optional(),
    permits: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    waypoints: z.array(waypointSchema).optional(),
  }),
});

export const updatePostSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').optional(),
    content: z.string().min(1, 'Content is required').optional(),
    category: z.string().optional(),
    region: z.string().optional(),
    state: z.string().optional(),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
    videoUrl: z.string().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
    bestSeason: z.string().optional(),
    nearestHubs: z
      .object({
        airport: z.string().optional(),
        railway: z.string().optional(),
        highway: z.string().optional(),
      })
      .optional(),
    budgetINR: z
      .object({
        backpacker: z.number().optional(),
        moderate: z.number().optional(),
        luxury: z.number().optional(),
      })
      .optional(),
    permits: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    waypoints: z.array(waypointSchema).optional(),
  }),
});
