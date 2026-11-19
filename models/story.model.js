import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
  },
  { _id: false }
);

const storySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    placeSlug: { type: String, default: null, index: true },
    caption: { type: String, required: true, maxlength: 1000 },
    media: {
      type: [mediaSchema],
      validate: [(media) => media.length >= 1 && media.length <= 5, 'Add 1 to 5 photos or videos'],
    },
    likes: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    likesCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

storySchema.index({ createdAt: -1 });

const Story = mongoose.model('Story', storySchema);

export default Story;
