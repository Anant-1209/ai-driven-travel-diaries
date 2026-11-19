import { Helmet } from 'react-helmet-async';
import TravelerStories from '../components/TravelerStories';

export default function Community() {
  return (
    <main className='min-h-screen py-8'>
      <Helmet>
        <title>Traveler Stories | Travel Diaries</title>
      </Helmet>
      <div className='max-w-5xl mx-auto px-3'>
        <h1 className='text-3xl sm:text-4xl font-extrabold'>Traveler Stories</h1>
        <p className='mt-2 text-slate-600 dark:text-slate-300'>
          Real photos and videos from people who just went there. Share yours to help the next traveler plan better.
        </p>
      </div>
      <TravelerStories />
    </main>
  );
}
