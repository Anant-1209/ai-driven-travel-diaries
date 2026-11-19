import crypto from 'crypto';
import Trip from '../models/trip.model.js';
import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';
import { escapeRegex } from '../utils/sanitize.js';

const newShareId = () => crypto.randomBytes(6).toString('base64url');

// Links a trip to an existing destination guide so travelers' data can show on that page.
const findPlaceSlug = async (destination) => {
  const slug = destination.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const post = await Post.findOne({
    $or: [{ slug }, { title: { $regex: `^${escapeRegex(destination.trim())}\\b`, $options: 'i' } }],
  })
    .select('slug')
    .lean();
  return post?.slug ?? null;
};

const getOwnedTrip = async (tripId, user) => {
  const trip = await Trip.findById(tripId);
  if (!trip) throw errorHandler(404, 'Trip not found');
  if (String(trip.userId) !== user.id && !user.isAdmin) {
    throw errorHandler(403, 'You can only change your own trips');
  }
  return trip;
};

export const createTripService = async (userId, data) =>
  Trip.create({
    userId,
    shareId: newShareId(),
    title: data.title?.trim() || `${data.days} days in ${data.destination.trim()}`,
    destination: data.destination.trim(),
    days: data.days,
    budget: data.budget,
    itinerary: data.itinerary,
    placeSlug: await findPlaceSlug(data.destination),
  });

export const getMyTripsService = (userId) =>
  Trip.find({ userId }).sort({ updatedAt: -1 }).select('-itinerary').lean();

export const getSharedTripService = async (shareId, viewer) => {
  const trip = await Trip.findOne({ shareId }).populate('userId', 'username profilePicture').lean();
  const ownerId = trip?.userId?._id ? String(trip.userId._id) : null;
  const isOwner = Boolean(viewer && ownerId === viewer.id);
  if (!trip || (!trip.isPublic && !isOwner)) throw errorHandler(404, 'Trip not found');
  return { ...trip, owner: trip.userId, userId: ownerId, isOwner };
};

export const updateTripService = async (tripId, user, changes) => {
  const trip = await getOwnedTrip(tripId, user);
  for (const key of ['title', 'isPublic']) {
    if (changes[key] !== undefined) trip[key] = changes[key];
  }
  await trip.save();
  return trip;
};

export const deleteTripService = async (tripId, user) => {
  const trip = await getOwnedTrip(tripId, user);
  await trip.deleteOne();
};

export const copyTripService = async (shareId, userId) => {
  const source = await Trip.findOne({ shareId, isPublic: true });
  if (!source) throw errorHandler(404, 'Trip not found');
  const copy = await Trip.create({
    userId,
    shareId: newShareId(),
    title: `${source.title} (my copy)`.slice(0, 120),
    destination: source.destination,
    days: source.days,
    budget: source.budget,
    itinerary: source.itinerary,
    placeSlug: source.placeSlug,
    copiedFrom: source.shareId,
  });
  await Trip.updateOne({ _id: source._id }, { $inc: { copies: 1 } });
  return copy;
};
