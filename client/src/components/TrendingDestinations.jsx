import { Link } from 'react-router-dom';

const DESTINATION_HIGHLIGHTS = [
  {
    title: 'Rann of Kutch',
    subtitle: 'The Great White Desert',
    image: 'https://images.unsplash.com/photo-1616036740257-9449ea1f6605?auto=format&fit=crop&q=80&w=800',
    category: 'adventure',
    slug: 'great-white-desert-rann-of-kutch',
    size: 'large',
  },
  {
    title: 'Varanasi',
    subtitle: 'Spiritual Heart of India',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=80&w=800',
    category: 'spiritual',
    slug: 'varanasi-spiritual-heart-india',
    size: 'medium',
  },
  {
    title: 'Leh-Ladakh',
    subtitle: 'Land of High Passes',
    image: 'https://images.unsplash.com/photo-1545063009-8472506e768e?auto=format&fit=crop&q=80&w=800',
    category: 'adventure',
    slug: 'leh-ladakh-journey-to-high-passes',
    size: 'medium',
  },
  {
    title: 'Munnar',
    subtitle: 'Misty Tea Gardens',
    image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&q=80&w=800',
    category: 'nature',
    slug: 'misty-tea-gardens-of-munnar',
    size: 'small',
  },
  {
    title: 'Jaipur',
    subtitle: 'The Pink City',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80&w=800',
    category: 'adventure',
    slug: 'exploring-pink-city-jaipur',
    size: 'small',
  },
  {
    title: 'Goa',
    subtitle: 'Sun, Sand & Spice',
    image: 'https://images.unsplash.com/photo-1512341689857-198e7e2f3ca8?auto=format&fit=crop&q=80&w=800',
    category: 'nature',
    slug: 'sunny-days-sandy-beaches-goa',
    size: 'small',
  },
];

export default function TrendingDestinations() {
  return (
    <section className='py-16 bg-slate-100 dark:bg-slate-900/50'>
      <div className='max-w-7xl mx-auto px-4'>
        {/* Section Header */}
        <div className='flex items-center justify-between mb-10'>
          <div>
            <p className='text-xs font-semibold tracking-[0.2em] uppercase text-teal-600 dark:text-teal-400 mb-2'>
              Where to go next
            </p>
            <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight'>
              Trending Destinations
            </h2>
          </div>
          <Link
            to='/projects'
            className='hidden sm:block text-xs font-semibold tracking-widest uppercase text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors border-b-2 border-transparent hover:border-teal-600 pb-1'
          >
            View All
          </Link>
        </div>

        {/* Bento Grid Layout */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px] sm:auto-rows-[220px]'>
          {DESTINATION_HIGHLIGHTS.map((dest, idx) => {
            const rowSpan = dest.size === 'large' ? 'sm:row-span-2' : '';
            const colSpan = dest.size === 'large' ? 'sm:col-span-1' : '';

            return (
              <Link
                key={idx}
                to={`/post/${dest.slug}`}
                className={`destination-card ${rowSpan} ${colSpan} cursor-pointer`}
              >
                <img
                  src={dest.image}
                  alt={dest.title}
                  loading='lazy'
                  className='w-full h-full object-cover'
                />
                <div className='overlay'></div>
                <div className='card-content'>
                  <span className={`badge badge-${dest.category} mb-2`}>
                    {dest.category}
                  </span>
                  <h3 className='text-xl sm:text-2xl font-bold leading-tight'>{dest.title}</h3>
                  <p className='text-sm text-white/80 mt-1'>{dest.subtitle}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
