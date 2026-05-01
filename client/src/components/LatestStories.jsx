import { useRef } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

export default function LatestStories({ posts }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!posts || posts.length === 0) return null;

  return (
    <section className='py-16 max-w-7xl mx-auto px-4'>
      {/* Section Header */}
      <div className='flex items-center justify-between mb-8'>
        <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight'>
          Latest Stories
        </h2>
        <div className='flex items-center gap-3'>
          <Link
            to='/search'
            className='hidden sm:block text-xs font-semibold tracking-widest uppercase text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors border-b-2 border-transparent hover:border-teal-600 pb-1'
          >
            View All
          </Link>
          <button onClick={() => scroll('left')} className='scroll-arrow' aria-label='Scroll left'>
            <HiChevronLeft />
          </button>
          <button onClick={() => scroll('right')} className='scroll-arrow' aria-label='Scroll right'>
            <HiChevronRight />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div ref={scrollRef} className='scroll-container'>
        {posts.map((post) => {
          const wordCount = post.content ? post.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
          const readTime = Math.max(1, Math.ceil(wordCount / 200));
          const formattedDate = moment(post.createdAt || post.updatedAt).format('MMM D, YYYY').toUpperCase();

          return (
            <div key={post._id} className='scroll-card w-[280px] sm:w-[300px] group'>
              <Link to={`/post/${post.slug}`} className='block overflow-hidden rounded-lg'>
                <img
                  src={post.image}
                  alt={post.title}
                  loading='lazy'
                  className='w-full h-[200px] object-cover transition-transform duration-500 group-hover:scale-105'
                />
              </Link>
              <div className='mt-3'>
                <div className='flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wider mb-2'>
                  <span>{formattedDate}</span>
                  <span>{readTime} MIN READ</span>
                </div>
                <Link to={`/post/${post.slug}`}>
                  <h3 className='text-base font-bold text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors'>
                    {post.title}
                  </h3>
                </Link>
                <Link
                  to={`/post/${post.slug}`}
                  className='inline-flex items-center mt-3 px-4 py-1.5 text-[11px] font-semibold tracking-wider uppercase border-2 border-slate-800 dark:border-slate-300 text-slate-800 dark:text-slate-300 rounded-full hover:bg-slate-800 hover:text-white dark:hover:bg-slate-300 dark:hover:text-slate-900 transition-all'
                >
                  Read Story
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile View All */}
      <div className='sm:hidden text-center mt-6'>
        <Link
          to='/search'
          className='text-xs font-semibold tracking-widest uppercase text-teal-600 hover:underline'
        >
          View All Stories →
        </Link>
      </div>
    </section>
  );
}
