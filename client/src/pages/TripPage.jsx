import { Alert, Button, Spinner } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import { whatsappUrl, tripShareText } from '../utils/share';
import { TripCountdown, TripChecklist, TripFeedback } from '../components/TripTools';

export default function TripPage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setError(null);
    fetch(`/api/trip/s/${shareId}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setTrip(data);
        else setError(data.message || 'Trip not found');
      })
      .catch(() => setError('Could not load this trip. Please try again.'));
  }, [shareId, currentUser?._id]);

  const shareUrl = `${window.location.origin}/trip/${shareId}`;

  const updateTrip = async (changes) => {
    const res = await fetch(`/api/trip/${trip._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    const data = await res.json();
    if (res.ok) setTrip((prev) => ({ ...prev, ...changes }));
    else alert(data.message);
  };

  const copyToMyTrips = async () => {
    if (!currentUser) {
      navigate(`/sign-in?redirect=/trip/${shareId}`);
      return;
    }
    try {
      setBusy(true);
      const res = await fetch(`/api/trip/s/${shareId}/copy`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) navigate(`/trip/${data.shareId}`);
      else alert(data.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteTrip = async () => {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return;
    const res = await fetch(`/api/trip/${trip._id}`, { method: 'DELETE' });
    if (res.ok) navigate('/dashboard?tab=trips');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (error) {
    return (
      <div className='max-w-2xl mx-auto p-6 min-h-screen'>
        <Alert color='failure'>{error}</Alert>
        <Link to='/ai-planner' className='inline-block mt-4 text-teal-600 hover:underline'>
          Plan a new trip →
        </Link>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spinner size='xl' />
      </div>
    );
  }

  return (
    <main className='max-w-4xl mx-auto p-4 min-h-screen'>
      <Helmet>
        <title>{trip.title} | Travel Diaries</title>
      </Helmet>

      <div className='rounded-3xl bg-gradient-to-r from-teal-700 to-blue-700 text-white p-6 sm:p-8 shadow-xl'>
        <p className='text-xs uppercase tracking-widest text-teal-200'>Trip plan</p>
        <h1 className='text-3xl sm:text-4xl font-extrabold mt-1'>{trip.title}</h1>
        <p className='mt-2 text-teal-100'>
          {trip.destination} · {trip.days} {trip.days === 1 ? 'day' : 'days'} · {trip.budget} budget
        </p>
        <div className='mt-4 flex flex-wrap items-center gap-3 text-sm text-teal-100'>
          {trip.owner && (
            <span className='flex items-center gap-2'>
              <img src={trip.owner.profilePicture} alt='' className='w-6 h-6 rounded-full object-cover' />
              Planned by @{trip.owner.username}
            </span>
          )}
          {trip.copies > 0 && <span>· Copied by {trip.copies} {trip.copies === 1 ? 'traveler' : 'travelers'}</span>}
          {!trip.isPublic && <span className='px-2 py-0.5 rounded-full bg-white/20 text-xs'>Private</span>}
        </div>
      </div>

      <div className='print:hidden flex flex-wrap gap-2 mt-5'>
        {trip.isPublic && (
          <a
            href={whatsappUrl(tripShareText(trip, shareUrl))}
            target='_blank'
            rel='noopener noreferrer'
            className='px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold'
          >
            Share on WhatsApp
          </a>
        )}
        {trip.isPublic && (
          <Button size='sm' color='light' onClick={copyLink}>
            {linkCopied ? 'Link copied!' : 'Copy link'}
          </Button>
        )}
        <Button size='sm' color='light' onClick={() => window.print()}>
          Download PDF
        </Button>
        {!trip.isOwner && (
          <Button size='sm' gradientDuoTone='purpleToBlue' onClick={copyToMyTrips} disabled={busy}>
            {currentUser ? 'Copy to my trips' : 'Sign in to copy this trip'}
          </Button>
        )}
        {trip.isOwner && (
          <>
            <Button size='sm' color='light' onClick={() => updateTrip({ isPublic: !trip.isPublic })}>
              {trip.isPublic ? 'Make private' : 'Make public'}
            </Button>
            <Button size='sm' color='failure' outline onClick={deleteTrip}>
              Delete
            </Button>
          </>
        )}
      </div>

      {trip.isOwner && !trip.isPublic && (
        <p className='print:hidden mt-3 text-sm text-slate-500'>
          Only you can see this trip. Make it public to share it with family and friends.
        </p>
      )}

      {trip.isOwner && <TripCountdown trip={trip} onUpdate={updateTrip} />}

      {trip.placeSlug && (
        <Link
          to={`/post/${trip.placeSlug}`}
          className='print:hidden inline-block mt-4 text-sm font-semibold text-teal-600 hover:underline'
        >
          Read the {trip.destination} travel guide →
        </Link>
      )}

      <article className='mt-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-sm prose dark:prose-invert max-w-none'>
        <ReactMarkdown>{trip.itinerary}</ReactMarkdown>
      </article>

      {trip.isOwner && (
        <>
          <TripChecklist trip={trip} onUpdate={updateTrip} />
          <TripFeedback trip={trip} onSubmitted={(changes) => setTrip((prev) => ({ ...prev, ...changes }))} />
        </>
      )}

      <p className='print:hidden mt-4 text-xs text-slate-500'>
        AI-generated plan. Check timings, prices and permits locally before you travel.
      </p>
    </main>
  );
}
