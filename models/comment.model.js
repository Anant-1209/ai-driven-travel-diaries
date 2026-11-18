import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    postId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    likes: {
      type: Array,
      default: [],
    },
    numberOfLikes: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    tripType: {
      type: String,
      default: 'Explorer', // 'Family Trip', 'Solo Traveler', 'Couple Getaway', 'Friends Group'
    },
    isWorthIt: {
      type: String,
      default: 'Worth It!', // 'Worth It!', 'Must Visit', 'Overrated', 'Good with Precautions'
    },
    photoUrl: {
      type: String,
      default: null,
    },
    visitDate: {
      type: String,
      default: 'Recently Visited',
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
