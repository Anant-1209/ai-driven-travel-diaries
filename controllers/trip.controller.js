import {
  createTripService,
  getMyTripsService,
  getSharedTripService,
  updateTripService,
  deleteTripService,
  copyTripService,
} from '../services/trip.service.js';

const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (error) {
    next(error);
  }
};

export const createTrip = handle(async (req, res) => {
  res.status(201).json(await createTripService(req.user.id, req.body));
});

export const getMyTrips = handle(async (req, res) => {
  res.status(200).json(await getMyTripsService(req.user.id));
});

export const getSharedTrip = handle(async (req, res) => {
  res.status(200).json(await getSharedTripService(req.params.shareId, req.user));
});

export const updateTrip = handle(async (req, res) => {
  res.status(200).json(await updateTripService(req.params.id, req.user, req.body));
});

export const deleteTrip = handle(async (req, res) => {
  await deleteTripService(req.params.id, req.user);
  res.status(200).json({ success: true });
});

export const copyTrip = handle(async (req, res) => {
  res.status(201).json(await copyTripService(req.params.shareId, req.user.id));
});
