import { Button, Select, TextInput, Spinner } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { HiSparkles, HiSearch, HiLocationMarker, HiArrowRight } from 'react-icons/hi';

export default function Search() {
  const [sidebarData, setSidebarData] = useState({
    searchTerm: '',
    sort: 'desc',
    category: '',
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Dynamic AI Place Discovery State
  const [discovering, setDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState(null);
  const [customDiscoverPlace, setCustomDiscoverPlace] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    const sortFromUrl = urlParams.get('sort');
    const categoryFromUrl = urlParams.get('category');
    if (searchTermFromUrl || sortFromUrl || categoryFromUrl) {
      setSidebarData({
        ...sidebarData,
        searchTerm: searchTermFromUrl || '',
        sort: sortFromUrl || 'desc',
        category: categoryFromUrl || '',
      });
    }

    const fetchPosts = async () => {
      setLoading(true);
      const searchQuery = urlParams.toString();
      const res = await fetch(`/api/post/getposts?${searchQuery}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
        setLoading(false);
        if (data.posts.length === 9) {
          setShowMore(true);
        } else {
          setShowMore(false);
        }
      }
    };
    fetchPosts();
  }, [location.search]);

  const handleChange = (e) => {
    if (e.target.id === 'searchTerm') {
      setSidebarData({ ...sidebarData, searchTerm: e.target.value });
    }
    if (e.target.id === 'sort') {
      const order = e.target.value || 'desc';
      setSidebarData({ ...sidebarData, sort: order });
    }
    if (e.target.id === 'category') {
      const category = e.target.value || '';
      setSidebarData({ ...sidebarData, category });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('searchTerm', sidebarData.searchTerm);
    urlParams.set('sort', sidebarData.sort);
    urlParams.set('category', sidebarData.category);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  const handleShowMore = async () => {
    const numberOfPosts = posts.length;
    const startIndex = numberOfPosts;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('startIndex', startIndex);
    const searchQuery = urlParams.toString();
    const res = await fetch(`/api/post/getposts?${searchQuery}`);
    if (!res.ok) {
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setPosts([...posts, ...data.posts]);
      if (data.posts.length === 9) {
        setShowMore(true);
      } else {
        setShowMore(false);
      }
    }
  };

  // Dynamic AI Discovery Handler: Discovers ANY place on Earth and builds its guide
  const handleDiscoverPlace = async (targetPlace) => {
    const placeToFind = (targetPlace || sidebarData.searchTerm || '').trim();
    if (!placeToFind) return;

    try {
      setDiscovering(true);
      setDiscoveryError(null);
      const res = await fetch('/api/ai/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeName: placeToFind }),
      });
      const data = await res.json();
      if (res.ok && data.post?.slug) {
        navigate(`/post/${data.post.slug}`);
      } else if (res.status === 401) {
        setDiscoveryError('Please sign in to discover and add a new place.');
      } else {
        setDiscoveryError(data.message || 'Could not discover this place. Please try another name.');
      }
    } catch (err) {
      setDiscoveryError('Network error while discovering destination. Please try again.');
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <div className='flex flex-col md:flex-row min-h-screen'>
      {/* Sidebar Filters */}
      <div className='p-6 border-b md:border-r md:w-80 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40'>
        <form className='flex flex-col gap-6' onSubmit={handleSubmit}>
          <div className='flex flex-col gap-2'>
            <label className='text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
              Search Destination:
            </label>
            <TextInput
              placeholder='e.g. Varanasi, Jhansi, Goa...'
              id='searchTerm'
              type='text'
              value={sidebarData.searchTerm}
              onChange={handleChange}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
              Sort By:
            </label>
            <Select onChange={handleChange} value={sidebarData.sort} id='sort'>
              <option value='desc'>Latest Updates</option>
              <option value='asc'>Oldest</option>
            </Select>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
              Travel Category:
            </label>
            <Select
              onChange={handleChange}
              value={sidebarData.category}
              id='category'
            >
              <option value=''>All Categories</option>
              <option value='adventure'>Adventure</option>
              <option value='nature'>Nature & Hills</option>
              <option value='heritage'>Heritage & Forts</option>
              <option value='culture'>Culture & Spiritual</option>
              <option value='uncategorized'>Uncategorized</option>
            </Select>
          </div>

          <Button type='submit' gradientDuoTone='purpleToPink'>
            Apply Filters
          </Button>
        </form>

        {/* Feature: AI Offbeat Place Explorer in Sidebar */}
        <div className='mt-8 pt-6 border-t border-slate-200 dark:border-slate-800'>
          <div className='flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider mb-2'>
            <HiSparkles className='w-4 h-4' /> AI Destination Explorer
          </div>
          <p className='text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed'>
            Want to visit a hidden village, waterfall, or offbeat place not yet in the community list?
          </p>
          <div className='flex flex-col gap-2'>
            <TextInput
              placeholder='e.g. Pachmarhi, Spiti, Ziro...'
              value={customDiscoverPlace}
              onChange={(e) => setCustomDiscoverPlace(e.target.value)}
              sizing='sm'
            />
            <Button
              size='xs'
              gradientDuoTone='tealToLime'
              disabled={discovering || !customDiscoverPlace.trim()}
              onClick={() => handleDiscoverPlace(customDiscoverPlace)}
            >
              {discovering ? <><Spinner size='xs' className='mr-1.5' /> Exploring...</> : '✨ Discover with AI'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Results Container */}
      <div className='flex-1 p-6 sm:p-8'>
        <div className='flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 mb-6'>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white'>
            Destinations & Travel Diaries:
          </h1>
          {sidebarData.searchTerm && (
            <span className='px-3 py-1 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-semibold text-xs rounded-full'>
              Searching for: "{sidebarData.searchTerm}"
            </span>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className='flex justify-center items-center py-20'>
            <Spinner size='xl' />
          </div>
        )}

        {/* AI Generating Animation Card when discovering a new place */}
        {discovering && (
          <div className='p-8 my-6 bg-gradient-to-r from-teal-800 to-emerald-800 text-white rounded-3xl shadow-xl text-center animate-pulse'>
            <HiSparkles className='w-10 h-10 mx-auto mb-3 text-teal-200 animate-spin' />
            <h3 className='text-xl sm:text-2xl font-black'>
              AI Travel Explorer is Generating Your Guide...
            </h3>
            <p className='text-sm text-teal-100 mt-2 max-w-xl mx-auto'>
              Calculating real GPS coordinates, plotting day-by-day checkpoints, direct trains & flights, and honest, transparent budget rates. Taking you there in a few seconds!
            </p>
          </div>
        )}

        {/* No Posts Found -> Prompt AI Discovery Card (Solving User Point 2) */}
        {!loading && posts.length === 0 && !discovering && (
          <div className='p-6 sm:p-10 my-6 bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-2 border-dashed border-teal-300 dark:border-teal-800 rounded-3xl text-center shadow-lg'>
            <div className='w-16 h-16 bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-300 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow'>
              ✨
            </div>

            <h3 className='text-xl sm:text-2xl font-black text-slate-900 dark:text-white'>
              {sidebarData.searchTerm
                ? `No community diary for "${sidebarData.searchTerm}" yet`
                : 'No destinations found'}
            </h3>

            <p className='text-slate-600 dark:text-slate-300 text-sm mt-2 max-w-xl mx-auto leading-relaxed'>
              India and the world have thousands of beautiful hidden places. If a place isn't in our database yet, our AI Travel Engine can locate it right now, calculate exact roads, direct trains & flights, and generate a complete interactive trip guide!
            </p>

            {sidebarData.searchTerm && (
              <div className='mt-6'>
                <button
                  onClick={() => handleDiscoverPlace(sidebarData.searchTerm)}
                  disabled={discovering}
                  className='inline-flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-xl hover:scale-105 transition-all'
                >
                  <HiSparkles className='w-5 h-5' />
                  <span>Generate Live Guide for "{sidebarData.searchTerm}"</span>
                  <HiArrowRight className='w-4 h-4' />
                </button>
              </div>
            )}

            {discoveryError && (
              <p className='text-rose-500 text-xs font-semibold mt-4'>
                {discoveryError}
              </p>
            )}
          </div>
        )}

        {/* Results Grid */}
        {!loading && posts && posts.length > 0 && (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}

        {/* Show More Button */}
        {showMore && (
          <div className='text-center mt-8'>
            <button
              onClick={handleShowMore}
              className='px-6 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-teal-600 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 transition-colors shadow-sm'
            >
              Load More Destinations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}