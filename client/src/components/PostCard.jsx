import { Link } from 'react-router-dom';
import moment from 'moment';

export default function PostCard({ post }) {
  // Estimate read time from content length (~200 words per minute)
  const wordCount = post.content ? post.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const formattedDate = moment(post.createdAt || post.updatedAt).format('MMM D, YYYY').toUpperCase();
  const badgeClass = `badge badge-${post.category || 'uncategorized'}`;

  return (
    <div className='group w-full sm:w-[340px] overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300'>
      <Link to={`/post/${post.slug}`} className='block overflow-hidden'>
        <img
          src={post.image}
          alt={post.title}
          loading='lazy'
          className='h-[220px] w-full object-cover transition-transform duration-500 group-hover:scale-105'
        />
      </Link>
      <div className='p-5 flex flex-col gap-3'>
        <div className='flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide'>
          <span>{formattedDate}</span>
          <span>{readTime} MIN READ</span>
        </div>
        <Link to={`/post/${post.slug}`}>
          <h3 className='text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-snug'>
            {post.title}
          </h3>
        </Link>
        <span className={badgeClass}>
          {post.category || 'uncategorized'}
        </span>
        <Link
          to={`/post/${post.slug}`}
          className='inline-flex items-center gap-2 mt-1 px-4 py-2 text-xs font-semibold tracking-wider uppercase border-2 border-slate-800 dark:border-slate-200 text-slate-800 dark:text-slate-200 rounded-full w-fit hover:bg-slate-800 hover:text-white dark:hover:bg-slate-200 dark:hover:text-slate-900 transition-all duration-300'
        >
          Read Story
        </Link>
      </div>
    </div>
  );
}
