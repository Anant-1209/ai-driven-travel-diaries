import { Alert, Button, Select, Spinner, Textarea } from 'flowbite-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi';
import { uploadMedia } from '../utils/uploadMedia';

const PAGE_SIZE = 12;

function StoryMedia({ media }) {
  return (
    <div className={`grid gap-1 ${media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {media.map((item) =>
        item.type === 'video' ? (
          <video
            key={item.url}
            src={item.url}
            controls
            playsInline
            preload='metadata'
            className='w-full h-56 object-cover bg-black rounded-lg'
          />
        ) : (
          <img key={item.url} src={item.url} alt='' loading='lazy' className='w-full h-56 object-cover rounded-lg' />
        )
      )}
    </div>
  );
}

export default function TravelerStories({ placeSlug, placeName }) {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();
  const [stories, setStories] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState([]);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (before) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (placeSlug) params.set('place', placeSlug);
      if (before) params.set('before', before);
      try {
        const res = await fetch(`/api/story?${params}`);
        const data = res.ok ? await res.json() : [];
        setStories((prev) => (before ? [...prev, ...data] : data));
        setHasMore(data.length === PAGE_SIZE);
      } finally {
        setLoading(false);
      }
    },
    [placeSlug]
  );

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, currentUser?._id]);

  useEffect(() => {
    if (placeSlug || !currentUser) return;
    fetch('/api/post/getposts?limit=50')
      .then((res) => (res.ok ? res.json() : { posts: [] }))
      .then((data) => setPlaces(data.posts.map(({ slug, title }) => ({ slug, title }))))
      .catch(() => {});
  }, [placeSlug, currentUser]);

  const handleFiles = (e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length > 5) {
      setError('You can add up to 5 photos or videos.');
      e.target.value = '';
      return;
    }
    setError(null);
    setFiles(chosen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!caption.trim() || files.length === 0) {
      setError('Add a caption and at least one photo or video.');
      return;
    }
    try {
      setError(null);
      const media = [];
      for (const [index, file] of files.entries()) {
        setStatus(`Uploading ${index + 1} of ${files.length}...`);
        media.push((await uploadMedia(file)).url);
      }
      setStatus('Posting...');
      const story = { caption, media };
      if (placeSlug || selectedPlace) story.placeSlug = placeSlug || selectedPlace;
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not post your story.');
      setStories((prev) => [data, ...prev]);
      setCaption('');
      setFiles([]);
      setSelectedPlace('');
      form.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus(null);
    }
  };

  const toggleLike = async (story) => {
    const res = await fetch(`/api/story/${story._id}/like`, { method: 'PUT' });
    if (!res.ok) return;
    const data = await res.json();
    setStories((prev) => prev.map((s) => (s._id === story._id ? { ...s, ...data } : s)));
  };

  const toggleFeatured = async (story) => {
    const res = await fetch(`/api/story/${story._id}/feature`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !story.featured }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setStories((prev) => prev.map((s) => (s._id === story._id ? { ...s, ...data } : s)));
  };

  const removeStory = async (story) => {
    if (!window.confirm('Delete this story?')) return;
    const res = await fetch(`/api/story/${story._id}`, { method: 'DELETE' });
    if (res.ok) setStories((prev) => prev.filter((s) => s._id !== story._id));
  };

  return (
    <section className='max-w-5xl mx-auto w-full px-3 my-10'>
      <p className='text-xs uppercase tracking-widest text-teal-600 font-semibold'>Community</p>
      <h2 className='text-2xl font-bold mb-4'>
        {placeName ? `Traveler stories from ${placeName}` : 'Latest traveler stories'}
      </h2>

      {currentUser ? (
        <form
          onSubmit={handleSubmit}
          className='mb-8 p-4 rounded-2xl border border-teal-500/40 bg-teal-50/40 dark:bg-slate-800/60 flex flex-col gap-3'
        >
          <Textarea
            placeholder={`Share a moment${placeName ? ` from ${placeName}` : ''}: what you saw, a tip, what it cost...`}
            rows={3}
            maxLength={1000}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          {!placeSlug && places.length > 0 && (
            <Select value={selectedPlace} onChange={(e) => setSelectedPlace(e.target.value)}>
              <option value=''>Which place is this? (optional)</option>
              {places.map((place) => (
                <option key={place.slug} value={place.slug}>
                  {place.title}
                </option>
              ))}
            </Select>
          )}
          <div className='flex flex-col sm:flex-row gap-3 sm:items-center justify-between'>
            <input
              type='file'
              multiple
              accept='image/*,video/mp4,video/webm'
              onChange={handleFiles}
              className='text-sm'
            />
            <Button type='submit' gradientDuoTone='tealToLime' disabled={Boolean(status)}>
              {status || 'Share story'}
            </Button>
          </div>
          <p className='text-xs text-slate-500'>Up to 5 photos or short videos.</p>
          {error && <Alert color='failure'>{error}</Alert>}
        </form>
      ) : (
        <p className='mb-6 text-sm text-slate-600 dark:text-slate-300'>
          <Link
            to={`/sign-in?redirect=${encodeURIComponent(location.pathname)}`}
            className='text-teal-600 font-semibold hover:underline'
          >
            Sign in
          </Link>{' '}
          to share your photos and videos and help other travelers.
        </p>
      )}

      {loading ? (
        <div className='flex justify-center py-8'>
          <Spinner />
        </div>
      ) : stories.length === 0 ? (
        <p className='text-slate-500'>No stories yet. Be the first to share one!</p>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {stories.map((story) => (
            <article
              key={story._id}
              className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3'
            >
              <div className='flex items-center gap-2 mb-2'>
                <img src={story.userId.profilePicture} alt='' className='w-8 h-8 rounded-full object-cover' />
                <div className='text-sm leading-tight'>
                  <span className='font-semibold'>@{story.userId.username}</span>
                  <span className='block text-xs text-slate-500'>
                    {new Date(story.createdAt).toLocaleDateString()}
                    {!placeSlug && story.placeSlug && (
                      <>
                        {' · '}
                        <Link to={`/post/${story.placeSlug}`} className='text-teal-600 hover:underline'>
                          {story.placeSlug.replace(/-/g, ' ')}
                        </Link>
                      </>
                    )}
                  </span>
                </div>
                {story.featured && (
                  <span className='ml-auto text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800'>
                    Featured
                  </span>
                )}
              </div>
              <StoryMedia media={story.media} />
              <p className='mt-2 text-sm whitespace-pre-line'>{story.caption}</p>
              <div className='flex items-center gap-4 mt-3 text-sm'>
                <button
                  type='button'
                  onClick={() => toggleLike(story)}
                  disabled={!currentUser}
                  title={currentUser ? 'Like' : 'Sign in to like'}
                  className='flex items-center gap-1 disabled:opacity-60'
                >
                  {story.likedByMe ? <HiHeart className='w-5 h-5 text-red-500' /> : <HiOutlineHeart className='w-5 h-5' />}
                  {story.likesCount}
                </button>
                {currentUser?.isAdmin && (
                  <button type='button' onClick={() => toggleFeatured(story)} className='text-amber-600 hover:underline'>
                    {story.featured ? 'Unfeature' : 'Feature on Home'}
                  </button>
                )}
                {(currentUser?._id === story.userId._id || currentUser?.isAdmin) && (
                  <button type='button' onClick={() => removeStory(story)} className='text-red-500 hover:underline ml-auto'>
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type='button'
          onClick={() => load(stories[stories.length - 1].createdAt)}
          className='w-full text-teal-600 text-sm py-6 hover:underline'
        >
          Show more stories
        </button>
      )}
    </section>
  );
}
