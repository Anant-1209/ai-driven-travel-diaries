import fs from 'fs';
import Trip from '../models/trip.model.js';
import Post from '../models/post.model.js';
import { escapeHtml } from './sanitize.js';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200';

let cachedIndex;
const readIndex = (indexFile) => {
  if (cachedIndex === undefined) {
    try {
      cachedIndex = fs.readFileSync(indexFile, 'utf8');
    } catch {
      cachedIndex = null;
    }
  }
  return cachedIndex;
};

export const renderWithMeta = (html, meta) => {
  const tags = [
    ['og:title', meta.title],
    ['og:description', meta.description],
    ['og:image', meta.image],
    ['og:url', meta.url],
    ['og:type', 'article'],
  ]
    .filter(([, value]) => value)
    .map(([property, value]) => `<meta property="${property}" content="${escapeHtml(value)}">`)
    .join('');
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace('</head>', `${tags}<meta name="twitter:card" content="summary_large_image"></head>`);
};

const findMeta = async ({ shareId, slug }) => {
  if (shareId) {
    const trip = await Trip.findOne({ shareId, isPublic: true }).lean();
    if (!trip) return null;
    const place = trip.placeSlug ? await Post.findOne({ slug: trip.placeSlug }).select('image').lean() : null;
    return {
      title: `${trip.title} | Travel Diaries`,
      description: `${trip.days}-day ${trip.budget.toLowerCase()} trip plan for ${trip.destination}. Open the day-by-day itinerary.`,
      image: place?.image || DEFAULT_IMAGE,
    };
  }
  const post = await Post.findOne({ slug }).select('title content image').lean();
  if (!post) return null;
  return {
    title: `${post.title} | Travel Diaries`,
    description: post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
    image: post.image,
  };
};

// Chat apps don't run JavaScript, so shared links need preview tags in the initial HTML.
export const socialPreview = (indexFile) => async (req, res, next) => {
  try {
    const html = readIndex(indexFile);
    if (!html) return next();
    const meta = await findMeta(req.params);
    if (!meta) return next();
    const origin = `${req.protocol}://${req.get('host')}`;
    const image = meta.image?.startsWith('/') ? origin + meta.image : meta.image;
    res.type('html').send(renderWithMeta(html, { ...meta, image, url: origin + req.originalUrl }));
  } catch (error) {
    next(error);
  }
};
