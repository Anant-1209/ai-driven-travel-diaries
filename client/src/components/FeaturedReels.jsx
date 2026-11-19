import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function FeaturedReels() {
  const [guides, setGuides] = useState([]);
  const [stories, setStories] = useState([]);

  useEffect(() => {
    fetch('/api/post/getposts?hasVideo=true&limit=6')
      .then((res) => (res.ok ? res.json() : { posts: [] }))
      .then((data) => setGuides(data.posts))
      .catch(() => {});
    fetch('/api/story?featured=true&limit=8')
      .then((res) => (res.ok ? res.json() : []))
      .then(setStories)
      .catch(() => {});
  }, []);

  const items = [
    ...guides.map((post) => ({
      key: post._id,
      video: post.videoUrl,
      poster: post.image,
      title: post.title,
      label: 'Official guide',
      link: `/post/${post.slug}`,
    })),
    ...stories.map((story) => {
      const first = story.media[0];
      return {
        key: story._id,
        video: first.type === 'video' ? first.url : null,
        image: first.type === 'image' ? first.url : null,
        title: story.caption,
        label: `@${story.userId.username}`,
        link: story.placeSlug ? `/post/${story.placeSlug}` : '/community',
      };
    }),
  ];

  if (items.length === 0) return null;

  return (
    <section className='py-12 max-w-7xl mx-auto px-4'>
      <p className='text-xs font-semibold tracking-[0.2em] uppercase text-teal-600 dark:text-teal-400 mb-2'>
        Real places, real travelers
      </p>
      <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-6'>
        Watch before you go
      </h2>
      <div className='flex gap-4 overflow-x-auto snap-x pb-3'>
        {items.map((item) => (
          <div key={item.key} className='w-64 shrink-0 snap-start rounded-2xl overflow-hidden bg-slate-900 text-white shadow-lg'>
            {item.video ? (
              <video
                src={item.video}
                poster={item.poster}
                controls
                muted
                playsInline
                preload='metadata'
                className='w-full h-96 object-cover bg-black'
              />
            ) : (
              <img src={item.image} alt='' loading='lazy' className='w-full h-96 object-cover' />
            )}
            <div className='p-3'>
              <span className='text-[10px] uppercase tracking-wider text-teal-300 font-bold'>{item.label}</span>
              <p className='text-sm line-clamp-2 mt-1'>{item.title}</p>
              <Link to={item.link} className='text-xs text-teal-300 hover:underline mt-2 inline-block'>
                Open →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
