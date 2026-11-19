import { Spinner } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { daysUntil } from './TripTools';

const tripStatus = (trip) => {
  if (trip.status === 'completed') return '✓ Completed';
  if (!trip.startDate) return 'No travel date yet';
  const days = daysUntil(trip.startDate);
  if (days > 0) return `In ${days} ${days === 1 ? 'day' : 'days'}`;
  if (days >= -trip.days) return 'Happening now';
  return 'Back home? Share how it went';
};

export default function DashTrips() {
  const [trips, setTrips] = useState(null);

  useEffect(() => {
    fetch('/api/trip/mine')
      .then((res) => (res.ok ? res.json() : []))
      .then(setTrips)
      .catch(() => setTrips([]));
  }, []);

  if (!trips) {
    return (
      <div className='flex-1 flex justify-center p-10'>
        <Spinner size='xl' />
      </div>
    );
  }

  return (
    <div className='flex-1 p-4 max-w-5xl mx-auto w-full'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-2xl font-bold'>My Trips</h2>
        <Link to='/ai-planner' className='text-sm font-semibold text-teal-600 hover:underline'>
          + Plan a new trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className='text-center p-10 rounded-2xl bg-slate-50 dark:bg-slate-800'>
          <p className='text-slate-600 dark:text-slate-300'>You haven&apos;t saved any trips yet.</p>
          <Link to='/ai-planner' className='inline-block mt-3 text-teal-600 font-semibold hover:underline'>
            Plan your first trip with AI →
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {trips.map((trip) => (
            <Link
              key={trip._id}
              to={`/trip/${trip.shareId}`}
              className='block p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-teal-500 transition'
            >
              <div className='flex items-start justify-between gap-2'>
                <h3 className='font-bold text-lg'>{trip.title}</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    trip.isPublic ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {trip.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
              <p className='text-sm text-slate-500 mt-1'>
                {trip.destination} · {trip.days} days · {trip.budget}
              </p>
              <p className='text-sm font-semibold text-teal-700 dark:text-teal-300 mt-2'>{tripStatus(trip)}</p>
              <p className='text-xs text-slate-400 mt-3'>
                Updated {new Date(trip.updatedAt).toLocaleDateString()}
                {trip.copies > 0 && ` · copied ${trip.copies}×`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
