import { Button, TextInput, Select, Spinner, Alert } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { whatsappUrl } from '../utils/share';

const PENDING_PLAN_KEY = 'pendingPlan';

export default function AIPlanner() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ destination: '', days: '3', budget: 'Moderate' });
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Restore a plan the user generated before signing in to save it.
  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_PLAN_KEY);
    if (!pending) return;
    sessionStorage.removeItem(PENDING_PLAN_KEY);
    try {
      const plan = JSON.parse(pending);
      setFormData(plan.formData);
      setItinerary(plan.itinerary);
    } catch {
      // ignore a corrupted saved plan
    }
  }, []);

  const handleSave = async () => {
    if (!currentUser) {
      sessionStorage.setItem(PENDING_PLAN_KEY, JSON.stringify({ formData, itinerary }));
      navigate('/sign-in?redirect=/ai-planner');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, itinerary }),
      });
      const data = await res.json();
      if (res.ok) navigate(`/trip/${data.shareId}`);
      else setError(data.message || 'Could not save this trip.');
    } catch {
      setError('Could not save this trip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const shareText = itinerary
    ? `My ${formData.days}-day trip plan for ${formData.destination} ✈️\n\n${itinerary.slice(0, 700)}…\n\nPlan your own trip free: ${window.location.origin}/ai-planner`
    : '';

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
      <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        <TextInput
          type='text'
          maxLength={100}
          placeholder='Where do you want to go? (e.g., Tokyo, Japan)'
          required
          value={formData.destination}
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
          <div className='flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700'>
            <Button gradientDuoTone='tealToLime' onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : currentUser ? 'Save trip' : 'Sign in to save this trip'}
            </Button>
            <a
              href={whatsappUrl(shareText)}
              target='_blank'
              rel='noopener noreferrer'
              className='px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold'
            >
              Share on WhatsApp
            </a>
          </div>
          <p className='mt-3 text-xs text-slate-500'>
            Save the trip to get a shareable link, a checklist and a printable PDF.
          </p>
        </div>
      )}
    </div>
  );
}
