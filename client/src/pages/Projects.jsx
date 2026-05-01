import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { Spinner, TextInput } from 'flowbite-react';
import { AiOutlineSearch } from 'react-icons/ai';

const CATEGORIES = [
  { key: '', label: 'All Types' },
  { key: 'adventure', label: 'Adventure' },
  { key: 'nature', label: 'Nature' },
  { key: 'historical', label: 'Historical' },
  { key: 'spiritual', label: 'Spiritual' },
];

const HERO_DESTINATIONS = [
  {
    name: 'North India',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=800',
    description: 'Majestic Himalayas & Sacred Valleys',
  },
  {
    name: 'South India',
    image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&q=80&w=800',
    description: 'Lush Backwaters & Tropical Paradise',
  },
  {
    name: 'West India',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80&w=800',
    description: 'Royal Deserts & Coastal Beaches',
  },
  {
    name: 'East India',
    image: 'https://images.unsplash.com/photo-1616843413587-9e3a37f7bbd8?auto=format&fit=crop&q=80&w=800',
    description: 'Cloudy Hills & Cultural Heritage',
  },
];

export default function Destinations() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const searchTermFromUrl = searchParams.get('searchTerm') || '';
  const activeRegion = searchParams.get('region') || '';
  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const urlParams = new URLSearchParams();
      if (activeCategory) urlParams.set('category', activeCategory);
      if (activeRegion) urlParams.set('region', activeRegion);
      if (searchTermFromUrl) urlParams.set('searchTerm', searchTermFromUrl);
      urlParams.set('limit', '12');
      urlParams.set('t', Date.now()); // Cache buster

      const apiUrl = `/api/post/getPosts?${urlParams.toString()}`;
      console.log(`[DEBUG] Fetching from URL: ${apiUrl}`);

      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        console.log('[DEBUG] Received Data:', data);
        setPosts(data.posts || []);
      } catch (err) {
        console.error('[DEBUG] Fetch Error:', err);
      }
      setLoading(false);
    };
    fetchPosts();
  }, [activeCategory, activeRegion, searchTermFromUrl]); 

  const handleCategoryChange = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat) newParams.set('category', cat);
    else newParams.delete('category');
    setSearchParams(newParams);
  };

  const handleRegionClick = (region) => {
    const newParams = new URLSearchParams(); // Start fresh for region navigation
    newParams.set('region', region);
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = e.target.search.value;
    const newParams = new URLSearchParams(searchParams);
    if (term) newParams.set('searchTerm', term);
    else newParams.delete('searchTerm');
    setSearchParams(newParams);
  };

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='bg-slate-950 py-20 px-4 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")] opacity-10'></div>
        <div className='max-w-7xl mx-auto relative z-10'>
          <div className='text-center mb-16'>
            <p className='text-xs font-semibold tracking-[0.4em] uppercase text-teal-400 mb-4'>
              The Grand Tour of India
            </p>
            <h1 className='text-5xl sm:text-6xl font-black text-white mb-6'>
              Find Your <span className='text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400'>Adventure</span>
            </h1>
            
            {/* Main Search Bar */}
            <form onSubmit={handleSearchSubmit} className='max-w-xl mx-auto relative group'>
              <TextInput
                type='text'
                name='search'
                placeholder='Search cities, regions or landmarks...'
                className='w-full'
                defaultValue={searchTermFromUrl}
                icon={AiOutlineSearch}
              />
              <button className='absolute right-2 top-1/2 -translate-y-1/2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-1.5 rounded-lg text-sm font-bold transition-all'>
                Search
              </button>
            </form>
          </div>

          {/* Region Cards */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
            {HERO_DESTINATIONS.map((region) => (
              <div 
                key={region.name} 
                onClick={() => handleRegionClick(region.name)}
                className={`group relative h-[280px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/20 ${activeRegion === region.name ? 'ring-4 ring-teal-500' : ''}`}
              >
                <img
                  src={region.image}
                  alt={region.name}
                  className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent'></div>
                <div className='absolute bottom-6 left-6'>
                  <h3 className='text-2xl font-black text-white mb-1'>{region.name}</h3>
                  <p className='text-xs text-teal-400 font-medium tracking-wide uppercase'>{region.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Tabs + Posts */}
      <section className='max-w-7xl mx-auto px-4 py-16'>
        {/* Category Tabs */}
        <div className='flex items-center justify-between flex-wrap gap-4 mb-12 border-b border-slate-200 dark:border-slate-800 pb-6'>
          <div className='flex flex-wrap gap-2'>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`px-6 py-2.5 text-xs font-bold tracking-widest uppercase rounded-full transition-all duration-300 ${
                  activeCategory === cat.key
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {activeRegion && (
            <button 
              onClick={() => setSearchParams({})}
              className='text-xs font-bold text-red-500 hover:underline uppercase tracking-widest'
            >
              Clear Filters ✕
            </button>
          )}
        </div>

        {/* Results Info */}
        {(searchTermFromUrl || activeCategory) && !loading && (
          <p className='text-sm text-slate-500 mb-8 italic'>
            Showing results for: <span className='text-teal-600 font-bold'>"{searchTermFromUrl || activeCategory}"</span>
          </p>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className='flex flex-col items-center justify-center py-32'>
            <Spinner size='xl' />
            <p className='mt-4 text-slate-500 font-medium animate-pulse'>Gathering stories...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className='text-center py-32 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800'>
            <div className='text-5xl mb-6'>🏜️</div>
            <p className='text-2xl font-bold text-slate-800 dark:text-white mb-2'>No destinations found</p>
            <p className='text-slate-500 max-w-md mx-auto'>We haven't shared stories from this area yet. Why not be the first to write one?</p>
            <Link
              to='/create-post'
              className='mt-8 inline-block px-8 py-3 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 transition-all'
            >
              Share a Story
            </Link>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10'>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* Modern Newsletter / CTA */}
      <section className='bg-teal-600 py-20 px-4'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-3xl sm:text-4xl font-black text-white mb-6 italic'>
            "The world is a book, and those who do not travel read only one page."
          </h2>
          <p className='text-teal-100 text-lg mb-10 font-medium'>
            Join 50,000+ explorers and get the best Indian travel stories in your inbox.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <input 
              type='email' 
              placeholder='your@email.com'
              className='px-8 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-teal-100/50 focus:outline-none focus:ring-2 focus:ring-white w-full sm:w-80'
            />
            <button className='px-10 py-4 bg-white text-teal-600 font-bold rounded-full hover:bg-teal-50 transition-all shadow-xl'>
              Subscribe Free
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
