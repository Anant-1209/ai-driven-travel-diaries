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
  }),
});

export const tripIdSchema = z.object({ params: z.object({ id: objectId }) });

export const shareIdSchema = z.object({ params: z.object({ shareId }) });
