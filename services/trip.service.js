import crypto from 'crypto';
import Trip from '../models/trip.model.js';
import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';
import { escapeRegex } from '../utils/sanitize.js';
import { checkToxicityService } from './ai.service.js';

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
  const view = { ...trip, owner: trip.userId, userId: ownerId, isOwner };
  if (!isOwner) {
    // Travel dates reveal when someone is away from home; keep them and the checklist private.
    delete view.startDate;
    delete view.checklist;
  }
  return view;
};

export const updateTripService = async (tripId, user, changes) => {
  const trip = await getOwnedTrip(tripId, user);
  for (const key of ['title', 'isPublic', 'startDate', 'checklist']) {
    if (changes[key] !== undefined) trip[key] = changes[key];
  }
  await trip.save();
  return trip;
};

export const submitFeedbackService = async (tripId, user, feedback) => {
  const trip = await Trip.findById(tripId);
  if (!trip || String(trip.userId) !== user.id) throw errorHandler(404, 'Trip not found');
  if (feedback.tip && (await checkToxicityService(feedback.tip)) === 'TOXIC') {
    throw errorHandler(400, 'Your tip was flagged as inappropriate. Please rephrase it.');
  }
  trip.status = 'completed';
  trip.feedback = { ...feedback, submittedAt: new Date() };
  await trip.save();
  return trip;
};

const median = (sorted) => {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

export const getPlaceInsightsService = async (placeSlug) => {
  const trips = await Trip.find({ placeSlug, status: 'completed', 'feedback.rating': { $exists: true } })
    .sort({ 'feedback.submittedAt': -1 })
    .limit(200)
    .populate('userId', 'username')
    .lean();
  if (trips.length === 0) return { count: 0 };

  const ratings = trips.map((t) => t.feedback.rating);
  const spends = trips
    .map((t) => t.feedback.dailySpendINR)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const transport = trips.map((t) => t.feedback.transportEasy).filter((v) => typeof v === 'boolean');

  return {
    count: trips.length,
    avgRating: Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10,
    medianDailySpendINR: spends.length ? median(spends) : null,
    transportEasyPercent: transport.length
      ? Math.round((100 * transport.filter(Boolean).length) / transport.length)
      : null,
    // Stats include everyone, but named tips only come from trips their owners made public.
    tips: trips
      .filter((t) => t.isPublic && t.feedback.tip && t.userId)
      .slice(0, 5)
      .map((t) => ({
        tip: t.feedback.tip,
        rating: t.feedback.rating,
        budget: t.budget,
        username: t.userId.username,
        date: t.feedback.submittedAt,
      })),
  };
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
