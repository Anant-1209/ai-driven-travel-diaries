import Trip from '../models/trip.model.js';
import Story from '../models/story.model.js';

const BADGES = [
  { id: 'planner', name: 'Trip Planner', description: 'Saved your first trip', earned: (s) => s.tripsPlanned >= 1 },
  { id: 'explorer', name: 'Explorer', description: 'Completed trips to 3 different places', earned: (s) => s.placesVisited.length >= 3 },
  { id: 'storyteller', name: 'Storyteller', description: 'Shared your first story', earned: (s) => s.storiesShared >= 1 },
  { id: 'helper', name: 'Helpful Traveler', description: 'Left a tip for other travelers', earned: (s) => s.tipsShared >= 1 },
  { id: 'favourite', name: 'Community Favourite', description: 'Got 10 likes on your stories', earned: (s) => s.likesReceived >= 10 },
];

export const getPassportService = async (userId) => {
  const [trips, stories] = await Promise.all([
    Trip.find({ userId }).select('destination status feedback').lean(),
    Story.find({ userId }).select('likesCount').lean(),
  ]);
  const completed = trips.filter((trip) => trip.status === 'completed');
  const places = new Map(completed.map((trip) => [trip.destination.trim().toLowerCase(), trip.destination.trim()]));

  const stats = {
    tripsPlanned: trips.length,
    tripsCompleted: completed.length,
    placesVisited: [...places.values()],
    storiesShared: stories.length,
    likesReceived: stories.reduce((sum, story) => sum + story.likesCount, 0),
    tipsShared: completed.filter((trip) => trip.feedback?.tip).length,
  };

  return {
    ...stats,
    badges: BADGES.map(({ earned, ...badge }) => ({ ...badge, earned: earned(stats) })),
  };
};
