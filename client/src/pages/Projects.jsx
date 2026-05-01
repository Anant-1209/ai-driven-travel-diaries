import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { Spinner } from 'flowbite-react';

const CATEGORIES = [
  { key: '', label: 'All Destinations' },
  { key: 'adventure', label: 'Adventure' },
  { key: 'nature', label: 'Nature' },
  { key: 'historical', label: 'Historical' },
  { key: 'spiritual', label: 'Spiritual' },
];

const HERO_DESTINATIONS = [
  {
    name: 'North India',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=600',
    description: 'Majestic mountains, sacred rivers, and vibrant culture',
  },
  {
    name: 'South India',
    image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&q=80&w=600',
    description: 'Lush tea gardens, ancient temples, and tropical beaches',
  },
  {
    name: 'West India',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80&w=600',
    description: 'Royal palaces, golden deserts, and coastal paradise',
  },
  {
    name: 'East India',
    image: 'https://images.unsplash.com/photo-1616843413587-9e3a37f7bbd8?auto=format&fit=crop&q=80&w=600',
    description: 'Hill stations, tea estates, and colonial heritage',
  },
];

export default function Destinations() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const url = activeCategory
        ? `/api/post/getPosts?category=${activeCategory}&limit=12`
        : '/api/post/getPosts?limit=12';
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts);
      setLoading(false);
    };
    fetchPosts();
  }, [activeCategory]);

  const handleCategoryChange = (cat) => {
    if (cat) {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='bg-slate-900 py-16 px-4'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-12'>
            <p className='text-xs font-semibold tracking-[0.3em] uppercase text-teal-400 mb-3'>
              Explore India
            </p>
            <h1 className='text-4xl sm:text-5xl font-extrabold text-white mb-4'>
              Destinations
            </h1>
            <p className='text-lg text-slate-400 max-w-2xl mx-auto font-light'>
              From the snow-capped Himalayas to the tropical beaches of Goa, discover the incredible diversity of India.
            </p>
          </div>

          {/* Region Cards */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            {HERO_DESTINATIONS.map((region) => (
              <div key={region.name} className='destination-card h-[200px] sm:h-[240px] cursor-pointer group'>
                <img
                  src={region.image}
                  alt={region.name}
                  className='w-full h-full object-cover'
                />
                <div className='overlay'></div>
                <div className='card-content'>
                  <h3 className='text-lg sm:text-xl font-bold text-white'>{region.name}</h3>
                  <p className='text-xs text-white/70 mt-1 hidden sm:block'>{region.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Tabs + Posts */}
      <section className='max-w-7xl mx-auto px-4 py-12'>
        {/* Category Tabs */}
        <div className='flex flex-wrap gap-2 mb-10 border-b border-slate-200 dark:border-slate-800 pb-4'>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                activeCategory === cat.key
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className='flex justify-center py-20'>
            <Spinner size='xl' />
          </div>
        ) : posts.length === 0 ? (
          <div className='text-center py-20'>
            <p className='text-xl text-slate-500'>No destinations found in this category.</p>
            <button
              onClick={() => handleCategoryChange('')}
              className='mt-4 text-teal-600 hover:underline font-medium'
            >
              View all destinations
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
            {posts.map((post) => (
              <div key={post._id} className='flex justify-center'>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className='bg-slate-100 dark:bg-slate-900/50 py-16 px-4'>
        <div className='max-w-2xl mx-auto text-center'>
          <h2 className='text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mb-4'>
            Can't decide where to go?
          </h2>
          <p className='text-slate-500 dark:text-slate-400 mb-6'>
            Let our AI plan the perfect itinerary based on your preferences, budget, and travel style.
          </p>
          <Link
            to='/ai-planner'
            className='inline-block px-8 py-3 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 hover:shadow-lg transition-all text-sm tracking-wide'
          >
            ✨ Try AI Planner — Free
          </Link>
        </div>
      </section>
    </div>
  );
}
