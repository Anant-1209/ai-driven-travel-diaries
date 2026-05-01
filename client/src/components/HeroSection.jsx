import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineSearch } from 'react-icons/ai';

export default function HeroSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?searchTerm=${searchTerm}`);
    }
  };

  return (
    <section className='hero-overlay relative h-[85vh] min-h-[600px] flex items-center justify-center'>
      {/* Background Image */}
      <img
        src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=2000'
        alt='Mountain landscape'
        className='absolute inset-0 w-full h-full object-cover'
      />

      {/* Content */}
      <div className='relative z-10 text-center text-white px-4 max-w-4xl mx-auto'>
        <p className='text-sm sm:text-base tracking-[0.3em] uppercase font-medium mb-4 opacity-90 animate-fade-in-up'>
          Discover · Explore · Experience
        </p>
        <h1 className='text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-6 animate-fade-in-up animation-delay-200'>
          Explore India,
          <br />
          <span className='text-gradient'>One Diary at a Time</span>
        </h1>
        <p className='text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light animate-fade-in-up animation-delay-400'>
          AI-powered itineraries, curated destinations, and real stories from explorers across the subcontinent.
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className='animate-fade-in-up animation-delay-600 flex items-center max-w-xl mx-auto bg-white/95 dark:bg-slate-800/95 rounded-full overflow-hidden shadow-2xl'
        >
          <input
            type='text'
            placeholder='Search destinations, stories, itineraries...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='flex-1 px-6 py-4 text-slate-800 dark:text-white bg-transparent border-none outline-none text-base placeholder:text-slate-400'
          />
          <button
            type='submit'
            className='px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white transition-colors'
          >
            <AiOutlineSearch className='h-5 w-5' />
          </button>
        </form>

        {/* Quick Tags */}
        <div className='flex flex-wrap justify-center gap-3 mt-6 animate-fade-in-up animation-delay-600'>
          {['Adventure', 'Nature', 'Spiritual', 'Historical'].map((tag) => (
            <button
              key={tag}
              onClick={() => navigate(`/search?category=${tag.toLowerCase()}`)}
              className='px-4 py-1.5 text-xs uppercase tracking-wider font-semibold text-white/90 border border-white/40 rounded-full hover:bg-white/20 transition-all'
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
