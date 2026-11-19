import express from 'express';
import { verifyToken, verifyAdmin } from '../utils/verifyUser.js';
import { validate } from '../middlewares/validate.middleware.js';
import { contactLimiter } from '../middlewares/rateLimiter.js';
import { asyncHandler as handle } from '../utils/asyncHandler.js';
import {
  listPartnersService,
  listAllPartnersService,
  createPartnerService,
  updatePartnerService,
  deletePartnerService,
  recordContactService,
} from '../services/partner.service.js';
import {
  createPartnerSchema,
  updatePartnerSchema,
  listPartnersSchema,
  partnerIdSchema,
  contactPartnerSchema,
} from '../validations/partner.validation.js';

const router = express.Router();

router.get(
  '/',
  validate(listPartnersSchema),
  handle(async (req, res) => res.json(await listPartnersService(req.query.place)))
);

router.post(
  '/:id/contact',
  contactLimiter,
  validate(contactPartnerSchema),
  handle(async (req, res) => {
    await recordContactService(req.params.id, req.body.channel);
    res.json({ success: true });
  })
);

router.get('/admin', verifyToken, verifyAdmin, handle(async (req, res) => res.json(await listAllPartnersService())));

router.post(
  '/',
  verifyToken,
  verifyAdmin,
  validate(createPartnerSchema),
  handle(async (req, res) => res.status(201).json(await createPartnerService(req.body)))
);

router.put(
  '/:id',
  verifyToken,
  verifyAdmin,
  validate(updatePartnerSchema),
  handle(async (req, res) => res.json(await updatePartnerService(req.params.id, req.body)))
);

router.delete(
  '/:id',
  verifyToken,
  verifyAdmin,
  validate(partnerIdSchema),
  handle(async (req, res) => {
    await deletePartnerService(req.params.id);
    res.json({ success: true });
  })
);

export default router;
