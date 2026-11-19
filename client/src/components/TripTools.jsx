import { Button, Textarea, TextInput } from 'flowbite-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export const daysUntil = (dateString) => {
  const [year, month, day] = dateString.slice(0, 10).split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((start - today) / 86400000);
};

export function TripCountdown({ trip, onUpdate }) {
  const days = trip.startDate ? daysUntil(trip.startDate) : null;
  let message = 'Add your travel date to get a countdown.';
  if (days !== null) {
    if (days > 1) message = `${days} days to go ✈️`;
    else if (days === 1) message = 'Tomorrow! Final check of your list below.';
    else if (days === 0) message = 'Today. Have a great trip!';
    else if (days >= -trip.days) message = 'Trip in progress. Enjoy!';
    else message = 'Trip done. How did it go?';
  }

  return (
    <div className='mt-5 flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900'>
      <span className='font-bold text-amber-900 dark:text-amber-200'>{message}</span>
      <label className='print:hidden ml-auto flex items-center gap-2 text-sm'>
        Travel date
        <input
          type='date'
          value={trip.startDate ? trip.startDate.slice(0, 10) : ''}
          onChange={(e) => onUpdate({ startDate: e.target.value || null })}
          className='rounded-lg border-slate-300 dark:bg-slate-800 dark:border-slate-600 text-sm'
        />
      </label>
    </div>
  );
}

export function TripChecklist({ trip, onUpdate }) {
  const [newItem, setNewItem] = useState('');
  const items = trip.checklist || [];
  const doneCount = items.filter((item) => item.done).length;

  const save = (checklist) =>
    onUpdate({ checklist: checklist.map(({ _id, text, done }) => ({ ...(_id && { _id }), text, done })) });

  const addItem = (e) => {
    e.preventDefault();
    const text = newItem.trim();
    if (!text) return;
    save([...items, { text, done: false }]);
    setNewItem('');
  };

  return (
    <section className='mt-6 p-5 rounded-2xl border border-slate-200 dark:border-slate-700'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-bold'>Packing &amp; prep checklist</h2>
        <span className='text-sm text-slate-500'>
          {doneCount}/{items.length} done
        </span>
      </div>
      <div className='h-2 mt-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden'>
        <div
          className='h-full bg-teal-500 transition-all'
          style={{ width: `${items.length ? (100 * doneCount) / items.length : 0}%` }}
        />
      </div>
      <ul className='mt-4 space-y-2'>
        {items.map((item, index) => (
          <li key={item._id || `${item.text}-${index}`} className='flex items-center gap-3'>
            <input
              type='checkbox'
              checked={item.done}
              onChange={() => save(items.map((it, i) => (i === index ? { ...it, done: !it.done } : it)))}
              className='rounded text-teal-600'
            />
            <span className={item.done ? 'line-through text-slate-400' : ''}>{item.text}</span>
            <button
              type='button'
              aria-label='Remove item'
              onClick={() => save(items.filter((_, i) => i !== index))}
              className='print:hidden ml-auto text-slate-400 hover:text-red-500'
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {items.length < 30 && (
        <form onSubmit={addItem} className='print:hidden mt-4 flex gap-2'>
          <TextInput
            className='flex-1'
            sizing='sm'
            maxLength={120}
            placeholder='Add an item, e.g. warm jacket for Gulmarg'
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <Button type='submit' size='sm' color='light'>
            Add
          </Button>
        </form>
      )}
    </section>
  );
}

export function TripFeedback({ trip, onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [transportEasy, setTransportEasy] = useState(null);
  const [spend, setSpend] = useState('');
  const [tip, setTip] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  if (trip.status === 'completed' && trip.feedback?.rating) {
    return (
      <div className='print:hidden mt-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900'>
        <p className='font-semibold'>Thanks for sharing how it went! You rated it {trip.feedback.rating}/5.</p>
        {trip.placeSlug && (
          <p className='text-sm mt-1'>
            Your answers now help travelers on the{' '}
            <Link to={`/post/${trip.placeSlug}`} className='text-teal-600 hover:underline'>
              {trip.destination} page
            </Link>
            .
          </p>
        )}
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    const body = { rating };
    if (transportEasy !== null) body.transportEasy = transportEasy;
    if (spend !== '') body.dailySpendINR = Math.round(Number(spend));
    if (tip.trim()) body.tip = tip.trim();
    try {
      setSending(true);
      setError(null);
      const res = await fetch(`/api/trip/${trip._id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not save your answers.');
      onSubmitted({ status: data.status, feedback: data.feedback });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const choice = (active) =>
    `px-3 py-1.5 rounded-lg border text-sm ${active ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-300 dark:border-slate-600'}`;

  return (
    <section className='print:hidden mt-6 p-5 rounded-2xl bg-teal-50 dark:bg-slate-800 border border-teal-200 dark:border-slate-700'>
      {!open ? (
        <div className='flex flex-wrap items-center gap-3'>
          <p className='font-semibold'>Back from {trip.destination}? Help the next traveler in 10 seconds.</p>
          <Button size='sm' gradientDuoTone='tealToLime' onClick={() => setOpen(true)} className='ml-auto'>
            Answer 3 quick questions
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className='flex flex-col gap-4'>
          <div>
            <p className='text-sm font-semibold mb-2'>How was the trip overall?</p>
            <div className='flex gap-1'>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type='button'
                  aria-label={`${value} stars`}
                  onClick={() => setRating(value)}
                  className={`text-2xl ${value <= rating ? 'text-amber-400' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className='text-sm font-semibold mb-2'>Was getting around easy (cabs, buses, roads)?</p>
            <div className='flex gap-2'>
              <button type='button' className={choice(transportEasy === true)} onClick={() => setTransportEasy(true)}>
                Yes
              </button>
              <button type='button' className={choice(transportEasy === false)} onClick={() => setTransportEasy(false)}>
                No
              </button>
            </div>
          </div>
          <div>
            <p className='text-sm font-semibold mb-2'>Roughly how much did you spend per person per day? (₹)</p>
            <TextInput
              type='number'
              min={0}
              max={200000}
              placeholder='e.g. 3500'
              value={spend}
              onChange={(e) => setSpend(e.target.value)}
              className='max-w-xs'
            />
          </div>
          <div>
            <p className='text-sm font-semibold mb-2'>One tip for the next traveler (optional)</p>
            <Textarea
              rows={2}
              maxLength={280}
              placeholder='e.g. Book the Gulmarg gondola online 3 days ahead; queues are long after 10am.'
              value={tip}
              onChange={(e) => setTip(e.target.value)}
            />
          </div>
          {error && <p className='text-sm text-red-600'>{error}</p>}
          <div className='flex gap-2'>
            <Button type='submit' gradientDuoTone='tealToLime' disabled={!rating || sending}>
              {sending ? 'Saving...' : 'Submit'}
            </Button>
            <Button type='button' color='gray' onClick={() => setOpen(false)}>
              Later
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
