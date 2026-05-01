import { useState } from 'react';
import { HiMail, HiCheckCircle } from 'react-icons/hi';

export default function NewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      // For now, just show success. In production, connect to a mailing list API.
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 5000);
      setEmail('');
    }
  };

  return (
    <section className='newsletter-bg py-20 px-4'>
      <div className='max-w-3xl mx-auto text-center relative z-10'>
        <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-600/20 mb-6'>
          <HiMail className='h-8 w-8 text-teal-400' />
        </div>

        <h2 className='text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight'>
          Subscribe to Travel Diaries
        </h2>
        <p className='text-lg text-slate-400 mb-8 font-light max-w-xl mx-auto'>
          Get the latest travel stories, curated itineraries, and destination guides delivered to your inbox. No spam, just wanderlust.
        </p>

        {subscribed ? (
          <div className='flex items-center justify-center gap-3 text-teal-400 text-lg font-medium animate-fade-in-up'>
            <HiCheckCircle className='h-6 w-6' />
            <span>You're subscribed! Welcome aboard ✈️</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className='flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto'>
            <input
              type='email'
              placeholder='Enter your email address'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='flex-1 w-full sm:w-auto px-6 py-4 rounded-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base'
            />
            <button
              type='submit'
              className='w-full sm:w-auto px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-full transition-all hover:shadow-lg hover:shadow-teal-600/25 tracking-wide text-sm uppercase'
            >
              Subscribe
            </button>
          </form>
        )}

        <p className='text-xs text-slate-600 mt-6'>
          By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
