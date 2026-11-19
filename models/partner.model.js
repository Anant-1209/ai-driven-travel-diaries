import mongoose from 'mongoose';

export const PARTNER_TYPES = ['hotel', 'homestay', 'houseboat', 'cab', 'bus', 'guide'];

const partnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    type: { type: String, enum: PARTNER_TYPES, required: true },
    placeSlugs: { type: [String], default: [], index: true },
    description: { type: String, default: '', maxlength: 1000 },
    priceRange: { type: String, default: '', maxlength: 60 },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    image: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    enquiries: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Partner = mongoose.model('Partner', partnerSchema);

export default Partner;
