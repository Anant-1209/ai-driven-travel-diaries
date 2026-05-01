import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import LatestStories from '../components/LatestStories';
import TrendingDestinations from '../components/TrendingDestinations';
import NewsletterSubscribe from '../components/NewsletterSubscribe';
import PostCard from '../components/PostCard';

export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const res = await fetch('/api/post/getPosts?limit=12');
      const data = await res.json();
      setPosts(data.posts);
    };
    fetchPosts();
  }, []);

  // Split posts for different sections
  const latestPosts = posts.slice(0, 8);
  const editorPicks = posts.slice(0, 6);

  return (
    <div>
      {/* SECTION 1: Hero Banner */}
      <HeroSection />

      {/* SECTION 2: Latest Stories — Horizontal Scroll */}
      <LatestStories posts={latestPosts} />

      {/* SECTION 3: Trending Destinations — Bento Grid */}
      <TrendingDestinations />

      {/* SECTION 4: AI Trip Planner CTA */}
      <section className='py-16 max-w-7xl mx-auto px-4'>
        <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 p-8 sm:p-12'>
          {/* Decorative circles */}
          <div className='absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10'></div>
          <div className='absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5'></div>

          <div className='relative z-10 flex flex-col sm:flex-row items-center gap-8'>
            <div className='flex-1'>
              <p className='text-xs font-semibold tracking-[0.2em] uppercase text-teal-200 mb-2'>
                Powered by AI
              </p>
              <h2 className='text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight'>
                Plan Your Dream Trip
                <br />in Seconds ✨
              </h2>
              <p className='text-lg text-white/80 font-light mb-6 max-w-md'>
                Tell us where you want to go, and our AI will create a personalized day-by-day itinerary with local tips and hidden gems.
              </p>
              <div className='flex flex-wrap gap-3'>
                <Link
                  to='/ai-planner'
                  className='px-8 py-3 bg-white text-teal-700 font-bold rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm tracking-wide'
                >
                  Try AI Planner — Free
                </Link>
                <Link
                  to='/search'
                  className='px-8 py-3 border-2 border-white/50 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300 text-sm tracking-wide'
                >
                  Browse Stories
                </Link>
              </div>
            </div>
            <div className='flex-shrink-0 hidden md:block'>
              <div className='w-48 h-48 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-7xl'>
                🗺️
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Editor's Picks — Card Grid */}
      <section className='py-16 max-w-7xl mx-auto px-4'>
        <div className='flex items-center justify-between mb-10'>
          <div>
            <p className='text-xs font-semibold tracking-[0.2em] uppercase text-teal-600 dark:text-teal-400 mb-2'>
              Handpicked for you
            </p>
            <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight'>
              Editor's Picks
            </h2>
          </div>
          <Link
            to='/search'
            className='hidden sm:block text-xs font-semibold tracking-widest uppercase text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors border-b-2 border-transparent hover:border-teal-600 pb-1'
          >
            View All
          </Link>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
          {editorPicks.map((post) => (
            <div key={post._id} className='flex justify-center'>
              <PostCard post={post} />
            </div>
          ))}
        </div>

        <div className='sm:hidden text-center mt-8'>
          <Link
            to='/search'
            className='text-sm font-semibold text-teal-600 hover:underline tracking-wide'
          >
            View All Stories →
          </Link>
        </div>
      </section>

      {/* SECTION 6: Newsletter Subscribe */}
      <NewsletterSubscribe />
    </div>
  );
}
