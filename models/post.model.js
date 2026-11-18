import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      default:
        'https://as2.ftcdn.net/v2/jpg/03/73/40/25/1000_F_373402561_BzQGinkNOK3wf9QrmWvgpgc8X0MKyax0.jpg',
    },
    images: {
      type: [String],
      default: [],
    },
    videoUrl: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      default: 'uncategorized',
    },
    region: {
      type: String,
      default: null,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    state: {
      type: String,
      default: 'India',
    },
    coordinates: {
      lat: { type: Number, default: 20.5937 },
      lng: { type: Number, default: 78.9629 },
    },
    bestSeason: {
      type: String,
      default: 'October to March',
    },
    nearestHubs: {
      airport: { type: String, default: 'Nearest major domestic airport' },
      railway: { type: String, default: 'Nearest Indian Railways (IRCTC) junction' },
      highway: { type: String, default: 'National Highway network' },
    },
    budgetINR: {
      backpacker: { type: Number, default: 1500 },
      moderate: { type: Number, default: 4500 },
      luxury: { type: Number, default: 12000 },
    },
    permits: {
      type: String,
      default: 'No special permit required for Indian citizens.',
    },
    highlights: {
      type: [String],
      default: [],
    },
    waypoints: [
      {
        name: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        day: { type: Number, default: 1 },
        description: { type: String, default: '' },
        distanceKm: { type: Number, default: 0 },
        transport: { type: String, default: 'Road' },
      },
    ],
  },
  { timestamps: true }
);

// High-performance compound indexes for MongoDB Atlas Free Tier (M0) resilience
postSchema.index({ category: 1, updatedAt: -1 });
postSchema.index({ region: 1, updatedAt: -1 });
postSchema.index({ updatedAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ state: 1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
