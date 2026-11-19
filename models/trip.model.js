import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shareId: { type: String, required: true, unique: true },
    title: { type: String, required: true, maxlength: 120 },
    destination: { type: String, required: true, maxlength: 100 },
    placeSlug: { type: String, default: null, index: true },
    days: { type: Number, required: true, min: 1, max: 14 },
    budget: { type: String, required: true, enum: ['Budget', 'Moderate', 'Luxury'] },
    itinerary: { type: String, required: true, maxlength: 30000 },
    isPublic: { type: Boolean, default: true },
    copiedFrom: { type: String, default: null },
    copies: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
