import { Button } from 'flowbite-react';

export default function CallToAction() {
  return (
    <div className='flex flex-col sm:flex-row p-10 glass border border-teal-500/20 justify-center items-center rounded-3xl text-center sm:text-left gap-10 shadow-2xl relative overflow-hidden group'>
      {/* Decorative Blob */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
      
      <div className="flex-1 flex flex-col justify-center">
        <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white leading-tight'>
          Plan Your Dream <br />
          <span className="text-gradient">Indian Odyssey</span>
        </h2>
        <p className='text-slate-600 dark:text-slate-300 text-lg my-6 font-light leading-relaxed'>
          Unlock AI-powered itineraries, hidden gems, and real stories from explorers across the subcontinent.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button gradientDuoTone='tealToLime' className='rounded-full hover:scale-105 transition-transform'>
            <a href="/ai-planner" className='px-6'>
              ✨ Get Free AI Plan
            </a>
          </Button>
          <Button outline gradientDuoTone='purpleToBlue' className='rounded-full hover:scale-105 transition-transform'>
            <a href="/search" className='px-6'>
              Browse Destinations
            </a>
          </Button>
        </div>
      </div>
      <div className="flex-1 w-full max-w-md">
        <img 
          src="https://images.unsplash.com/photo-1524492707947-5538561db412?auto=format&fit=crop&q=80&w=1200" 
          alt="Indian Architecture" 
          className='rounded-2xl shadow-2xl transform hover:rotate-2 transition-transform duration-500' 
        />
      </div>
    </div>
  );
}
