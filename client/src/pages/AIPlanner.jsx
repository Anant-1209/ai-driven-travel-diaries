import { Button, TextInput, Select, Spinner, Alert } from 'flowbite-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

export default function AIPlanner() {
  const { currentUser } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({ destination: '', days: '3', budget: 'Moderate' });
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setItinerary(data.itinerary);
      } else {
        const errorMsg = data.message?.error?.message || data.message || 'Something went wrong.';
        if (errorMsg.includes('high demand')) {
          setError('The AI is a bit busy right now! 🤖 Please wait 10 seconds and try again.');
        } else {
          setError(errorMsg);
        }
      }
    } catch (error) {
      setError('Could not connect to the AI service.');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-3 max-w-4xl mx-auto min-h-screen'>
      <h1 className='text-center text-4xl my-7 font-semibold text-teal-600'>✨ AI Travel Planner</h1>
      {currentUser ? (
        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
          <TextInput
            type='text'
            placeholder='Where do you want to go? (e.g., Tokyo, Japan)'
            required
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          />
          <div className='flex gap-4'>
            <Select
              required
              onChange={(e) => setFormData({ ...formData, days: e.target.value })}
              value={formData.days}
            >
              {[1, 2, 3, 4, 5, 7, 10, 14].map((d) => (
                <option key={d} value={d}>{d} Days</option>
              ))}
            </Select>
            <Select
              required
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              value={formData.budget}
            >
              <option value='Budget'>Backpacker / Budget</option>
              <option value='Moderate'>Moderate</option>
              <option value='Luxury'>Luxury</option>
            </Select>
          </div>
          <Button type='submit' gradientDuoTone='purpleToPink' disabled={loading}>
            {loading ? <Spinner /> : 'Generate My Itinerary'}
          </Button>
        </form>
      ) : (
        <div className='text-center py-10 bg-slate-100 dark:bg-slate-800 rounded-xl p-8'>
          <p className='text-xl text-slate-600 dark:text-slate-400 mb-6'>
            Unlock the power of AI to plan your perfect trip. 
            Please sign in to access the AI Travel Planner.
          </p>
          <Button gradientDuoTone='tealToLime' size='xl' outline className='mx-auto rounded-full'>
            <Link to='/sign-in'>Sign In to Continue</Link>
          </Button>
        </div>
      )}

      {error && (
        <Alert color='failure' className='mt-5'>
          {error}
        </Alert>
      )}

      {itinerary && (
        <div className='mt-8 p-6 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-md'>
          <div className='prose dark:prose-invert max-w-none'>
            <ReactMarkdown>{itinerary}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
