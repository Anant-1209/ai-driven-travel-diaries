import { z } from 'zod';
import { objectId } from './trip.validation.js';

const placeSlug = z.string().regex(/^[a-z0-9-]{1,100}$/, 'Invalid destination');
// Only files uploaded through our own /api/upload endpoint are accepted.
const uploadedFile = z.string().regex(/^\/uploads\/[A-Za-z0-9._-]+$/, 'Media must be uploaded first');

export const listStoriesSchema = z.object({
  query: z.object({
    place: placeSlug.optional(),
    featured: z.enum(['true', 'false']).optional(),
    before: z.iso.datetime().optional(),
    limit: z.coerce.number().int().min(1).max(30).optional(),
  }),
});

export const createStorySchema = z.object({
  body: z.object({
    caption: z.string().trim().min(1, 'Please write a caption').max(1000),
    placeSlug: placeSlug.optional(),
    media: z.array(uploadedFile).min(1, 'Add at least one photo or video').max(5, 'Up to 5 photos or videos'),
  }),
});

export const storyIdSchema = z.object({ params: z.object({ id: objectId }) });

export const featureStorySchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ featured: z.boolean() }),
});
