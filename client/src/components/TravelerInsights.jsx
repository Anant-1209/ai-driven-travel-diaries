import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const formatINR = (value) => `₹${value.toLocaleString('en-IN')}`;

export default function TravelerInsights({ placeSlug, placeName }) {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    fetch(`/api/trip/insights?place=${encodeURIComponent(placeSlug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setInsights)
      .catch(() => {});
  }, [placeSlug]);

  if (!insights) return null;

  if (insights.count === 0) {
    return (
      <section className='max-w-5xl mx-auto w-full px-3 my-8'>
        <div className='p-5 rounded-2xl border border-dashed border-teal-400'>
          <p className='font-semibold'>No traveler reports for {placeName} yet.</p>
          <p className='text-sm text-slate-500 mt-1'>
            Plan your trip here and answer 3 quick questions when you&apos;re back. Your answers help the next traveler.
          </p>
          <Link to='/ai-planner' className='inline-block mt-2 text-sm font-semibold text-teal-600 hover:underline'>
            Plan a trip →
          </Link>
        </div>
      </section>
    );
  }

  const tiles = [
    { label: 'Average rating', value: `★ ${insights.avgRating}/5` },
    {
      label: 'Typical spend per person per day',
      value: insights.medianDailySpendINR !== null ? formatINR(insights.medianDailySpendINR) : '—',
    },
    {
      label: 'Found getting around easy',
      value: insights.transportEasyPercent !== null ? `${insights.transportEasyPercent}%` : '—',
    },
  ];

  return (
    <section className='max-w-5xl mx-auto w-full px-3 my-10'>
      <p className='text-xs uppercase tracking-widest text-teal-600 font-semibold'>From real trips</p>
      <h2 className='text-2xl font-bold'>What travelers report about {placeName}</h2>
      <p className='text-sm text-slate-500 mb-4'>
        Based on {insights.count} completed {insights.count === 1 ? 'trip' : 'trips'} planned on Travel Diaries.
      </p>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {tiles.map((tile) => (
          <div key={tile.label} className='p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center'>
            <p className='text-2xl font-extrabold text-teal-700 dark:text-teal-300'>{tile.value}</p>
            <p className='text-xs text-slate-500 mt-1'>{tile.label}</p>
          </div>
        ))}
      </div>
      {insights.tips.length > 0 && (
        <ul className='mt-6 space-y-3'>
          {insights.tips.map((tip, index) => (
            <li key={index} className='p-4 rounded-2xl border border-slate-200 dark:border-slate-700'>
              <p className='text-sm'>&ldquo;{tip.tip}&rdquo;</p>
              <p className='text-xs text-slate-500 mt-1'>
                @{tip.username} · {tip.budget} trip · {new Date(tip.date).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
