import { Link } from 'react-router-dom';
import { HiGlobeAlt, HiSparkles, HiUserGroup, HiPencilAlt } from 'react-icons/hi';

export default function About() {
  const values = [
    {
      icon: HiGlobeAlt,
      title: 'Explore Fearlessly',
      description: 'From hidden villages to bustling cities — every destination has a story waiting to be told.',
    },
    {
      icon: HiSparkles,
      title: 'AI-Powered Planning',
      description: 'Use our free AI Trip Planner to create personalized itineraries tailored to your budget and style.',
    },
    {
      icon: HiUserGroup,
      title: 'Community First',
      description: 'Join thousands of travelers sharing tips, stories, and real experiences from around India.',
    },
    {
      icon: HiPencilAlt,
      title: 'Real Stories',
      description: 'No sponsored fluff — just authentic travel guides, budget tips, and destination deep-dives.',
    },
  ];

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='relative h-[50vh] min-h-[400px] flex items-center justify-center hero-overlay'>
        <img
          src='https://images.unsplash.com/photo-1488646472380-4511f43fae60?auto=format&fit=crop&q=80&w=2000'
          alt='Traveler on mountain'
          className='absolute inset-0 w-full h-full object-cover'
        />
        <div className='relative z-10 text-center text-white px-4'>
          <p className='text-xs font-semibold tracking-[0.3em] uppercase mb-3 text-teal-300'>
            Our Story
          </p>
          <h1 className='text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4'>
            About Travel Diaries
          </h1>
          <p className='text-lg text-white/80 max-w-xl mx-auto font-light'>
            Inspiring explorers to discover the beauty of India — one diary at a time.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className='max-w-4xl mx-auto px-4 py-16'>
        <div className='flex flex-col md:flex-row items-center gap-10'>
          <div className='w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-teal-600 flex items-center justify-center text-white text-5xl font-bold shrink-0 shadow-xl rotate-3'>
            🗺️
          </div>
          <div>
            <p className='text-xs font-semibold tracking-[0.2em] uppercase text-teal-600 dark:text-teal-400 mb-2'>
              Our Mission
            </p>
            <h2 className='text-3xl font-extrabold text-slate-800 dark:text-white mb-4'>
              Redefining Travel Planning
            </h2>
            <div className='space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed'>
              <p>
                Travel Diaries is a premier public platform dedicated to democratizing travel intelligence. 
                We believe that every journey should be accessible, well-planned, and deeply personal. 
                By combining authentic human experiences with cutting-edge AI technology, we provide 
                a comprehensive resource for modern explorers.
              </p>
              <p>
                Our platform serves as a bridge between curiosity and discovery. Whether you are navigating 
                the high passes of the Himalayas or looking for the quietest sunrise in Kanyakumari, 
                our curated guides and intelligent planning tools are designed to empower your wanderlust.
              </p>
              <p>
                We focus on transparency and depth. Here, you'll find data-driven itineraries, 
                sustainable travel practices, and a community-driven ecosystem where explorers 
                from around the globe share insights to make travel better for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className='bg-slate-100 dark:bg-slate-900/50 py-16 px-4'>
        <div className='max-w-5xl mx-auto'>
          <div className='text-center mb-12'>
            <p className='text-xs font-semibold tracking-[0.2em] uppercase text-teal-600 dark:text-teal-400 mb-2'>
              What We Stand For
            </p>
            <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white'>
              Why Travel Diaries?
            </h2>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
            {values.map((item) => (
              <div
                key={item.title}
                className='p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300'
              >
                <div className='w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center mb-4'>
                  <item.icon className='h-6 w-6 text-teal-600 dark:text-teal-400' />
                </div>
                <h3 className='text-lg font-bold text-slate-800 dark:text-white mb-2'>{item.title}</h3>
                <p className='text-sm text-slate-500 dark:text-slate-400 leading-relaxed'>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collaboration Section */}
      <section className='bg-slate-100 dark:bg-slate-900/50 py-16 px-4'>
        <div className='max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10'>
          <div className='flex-1'>
            <p className='text-xs font-semibold tracking-[0.2em] uppercase text-teal-600 dark:text-teal-400 mb-2'>
              Work With Us
            </p>
            <h2 className='text-3xl font-extrabold text-slate-800 dark:text-white mb-4'>
              Collaborations & Contributions
            </h2>
            <p className='text-slate-600 dark:text-slate-300 leading-relaxed mb-6'>
              Travel Diaries is an open ecosystem. We collaborate with tourism boards, travel influencers, 
              eco-conscious hospitality groups, and local guides to bring the most accurate and 
              inspiring content to our readers. 
            </p>
            <p className='text-slate-600 dark:text-slate-300 leading-relaxed'>
              Are you a storyteller, a photographer, or a travel tech enthusiast? We are always 
              looking for fresh perspectives. Join our network of contributors and help us 
              map the world more intelligently.
            </p>
          </div>
          <div className='w-full md:w-auto flex flex-col gap-4'>
            <div className='p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700'>
              <p className='text-xs font-bold text-teal-600 mb-1 uppercase'>For Tourism Boards</p>
              <p className='text-sm text-slate-500'>Promote your destination with data-driven AI guides.</p>
            </div>
            <div className='p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700'>
              <p className='text-xs font-bold text-teal-600 mb-1 uppercase'>For Creators</p>
              <p className='text-sm text-slate-500'>Share your stories with a global audience of explorers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section className='py-20 px-4 text-center'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-3xl font-extrabold text-slate-800 dark:text-white mb-6'>
            The World is Waiting
          </h2>
          <p className='text-lg text-slate-500 dark:text-slate-400 font-light mb-10 max-w-xl mx-auto'>
            Whether you're looking for your next solo adventure or want to contribute to our growing knowledge base, 
            the Travel Diaries community is here to support your journey.
          </p>
          <div className='flex flex-wrap justify-center gap-4'>
            <Link
              to='/search'
              className='px-10 py-4 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 hover:shadow-xl transition-all tracking-wide'
            >
              Start Exploring
            </Link>
            <Link
              to='/ai-planner'
              className='px-10 py-4 border-2 border-slate-800 dark:border-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-full hover:bg-slate-800 hover:text-white dark:hover:bg-slate-200 dark:hover:text-slate-900 transition-all tracking-wide'
            >
              ✨ Try AI Planner
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
