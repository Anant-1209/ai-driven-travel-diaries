import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');
const shareId = z.string().regex(/^[A-Za-z0-9_-]{6,20}$/, 'Invalid trip link');

export const createTripSchema = z.object({
  body: z.object({
    title: z.string().trim().max(120).optional(),
    destination: z.string().trim().min(1, 'Destination is required').max(100),
    days: z.coerce.number().int().min(1).max(14),
    budget: z.enum(['Budget', 'Moderate', 'Luxury']),
    itinerary: z.string().min(1, 'Itinerary is required').max(30000),
  }),
});

export const updateTripSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    title: z.string().trim().min(1).max(120).optional(),
    isPublic: z.boolean().optional(),
    startDate: z.union([z.iso.date(), z.null()]).optional(),
    checklist: z
      .array(
        z.object({
          _id: objectId.optional(),
          text: z.string().trim().min(1).max(120),
          done: z.boolean(),
        })
      )
      .max(30, 'Up to 30 checklist items')
      .optional(),
  }),
});

export const feedbackSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    transportEasy: z.boolean().optional(),
    dailySpendINR: z.number().int().min(0).max(200000).optional(),
    tip: z.string().trim().max(280).optional(),
  }),
});

export const insightsSchema = z.object({
  query: z.object({ place: z.string().regex(/^[a-z0-9-]{1,100}$/, 'Invalid destination') }),
});

export const tripIdSchema = z.object({ params: z.object({ id: objectId }) });

export const shareIdSchema = z.object({ params: z.object({ shareId }) });
