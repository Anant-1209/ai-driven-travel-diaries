import { Spinner } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function DashPassport() {
  const [passport, setPassport] = useState(null);

  useEffect(() => {
    fetch('/api/user/me/passport')
      .then((res) => (res.ok ? res.json() : null))
      .then(setPassport)
      .catch(() => {});
  }, []);

  if (!passport) {
    return (
      <div className='flex-1 flex justify-center p-10'>
        <Spinner size='xl' />
      </div>
    );
  }

  const stats = [
    { label: 'Trips planned', value: passport.tripsPlanned },
    { label: 'Trips completed', value: passport.tripsCompleted },
    { label: 'Places visited', value: passport.placesVisited.length },
    { label: 'Stories shared', value: passport.storiesShared },
    { label: 'Likes received', value: passport.likesReceived },
    { label: 'Tips shared', value: passport.tipsShared },
  ];

  return (
    <div className='flex-1 p-4 max-w-5xl mx-auto w-full'>
      <h2 className='text-2xl font-bold'>Travel Passport</h2>
      <p className='text-sm text-slate-500 mb-6'>Your journeys and how you&apos;ve helped other travelers.</p>

      <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
        {stats.map((stat) => (
          <div key={stat.label} className='p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center'>
            <p className='text-3xl font-extrabold text-teal-700 dark:text-teal-300'>{stat.value}</p>
            <p className='text-xs text-slate-500 mt-1'>{stat.label}</p>
          </div>
        ))}
      </div>

      {passport.placesVisited.length > 0 && (
        <div className='mt-8'>
          <h3 className='font-bold mb-2'>Places you&apos;ve been</h3>
          <div className='flex flex-wrap gap-2'>
            {passport.placesVisited.map((place) => (
              <span key={place} className='px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-sm'>
                📍 {place}
              </span>
            ))}
          </div>
        </div>
      )}

      <h3 className='font-bold mt-8 mb-3'>Badges</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
        {passport.badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-4 rounded-2xl border ${
              badge.earned
                ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30'
                : 'border-slate-200 dark:border-slate-700 opacity-60'
            }`}
          >
            <p className='font-semibold'>
              {badge.earned ? '🏅' : '🔒'} {badge.name}
            </p>
            <p className='text-xs text-slate-500 mt-1'>{badge.description}</p>
          </div>
        ))}
      </div>

      <div className='mt-8 flex flex-wrap gap-4 text-sm font-semibold'>
        <Link to='/ai-planner' className='text-teal-600 hover:underline'>
          Plan a trip →
        </Link>
        <Link to='/community' className='text-teal-600 hover:underline'>
          Share a story →
        </Link>
      </div>
    </div>
  );
}
