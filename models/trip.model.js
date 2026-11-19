import mongoose from 'mongoose';

export const DEFAULT_CHECKLIST = [
  'ID proof (Aadhaar / passport) for every traveler',
  'Tickets and hotel bookings saved offline',
  'Offline maps downloaded for the area',
  'Basic medicines and first-aid kit',
  'Power bank and charging cables',
  'Some cash for places without UPI or ATMs',
  'Weather and road status checked the day before',
  'Trip plan shared with family',
];

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true, maxlength: 120 },
  done: { type: Boolean, default: false },
});

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
    startDate: { type: Date, default: null },
    status: { type: String, enum: ['planned', 'completed'], default: 'planned' },
    checklist: {
      type: [checklistItemSchema],
      default: () => DEFAULT_CHECKLIST.map((text) => ({ text })),
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      transportEasy: { type: Boolean },
      dailySpendINR: { type: Number, min: 0, max: 200000 },
      tip: { type: String, maxlength: 280 },
      submittedAt: { type: Date },
    },
  },
  { timestamps: true }
);

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
