import express from 'express';
import { verifyToken, optionalUser } from '../utils/verifyUser.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createTrip,
  getMyTrips,
  getSharedTrip,
  updateTrip,
  deleteTrip,
  copyTrip,
} from '../controllers/trip.controller.js';
import {
  createTripSchema,
  updateTripSchema,
  tripIdSchema,
  shareIdSchema,
} from '../validations/trip.validation.js';

const router = express.Router();

router.post('/', verifyToken, validate(createTripSchema), createTrip);
router.get('/mine', verifyToken, getMyTrips);
router.get('/s/:shareId', validate(shareIdSchema), optionalUser, getSharedTrip);
router.post('/s/:shareId/copy', validate(shareIdSchema), verifyToken, copyTrip);
router.patch('/:id', verifyToken, validate(updateTripSchema), updateTrip);
router.delete('/:id', verifyToken, validate(tripIdSchema), deleteTrip);

export default router;
