import { z } from 'zod';
import { objectId } from './trip.validation.js';
import { PARTNER_TYPES } from '../models/partner.model.js';

const placeSlug = z.string().regex(/^[a-z0-9-]{1,100}$/, 'Invalid destination');
const phone = z.union([z.literal(''), z.string().regex(/^\+?[0-9 -]{10,20}$/, 'Enter a valid phone number with country code')]);
const image = z.union([
  z.literal(''),
  z.string().regex(/^(\/uploads\/[A-Za-z0-9._-]+|https:\/\/[^\s"'<>]+)$/, 'Image must be an upload or an https URL'),
]);

const partnerFields = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  type: z.enum(PARTNER_TYPES),
  placeSlugs: z.array(placeSlug).max(20),
  description: z.string().trim().max(1000),
  priceRange: z.string().trim().max(60),
  phone,
  whatsapp: phone,
  image,
  verified: z.boolean(),
  active: z.boolean(),
});

export const createPartnerSchema = z.object({
  body: partnerFields
    .partial()
    .required({ name: true, type: true, placeSlugs: true })
    .refine((p) => p.phone || p.whatsapp, 'Add a phone or WhatsApp number'),
});

export const updatePartnerSchema = z.object({
  params: z.object({ id: objectId }),
  body: partnerFields.partial(),
});

export const listPartnersSchema = z.object({ query: z.object({ place: placeSlug }) });

export const partnerIdSchema = z.object({ params: z.object({ id: objectId }) });

export const contactPartnerSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ channel: z.enum(['whatsapp', 'call']) }),
});
