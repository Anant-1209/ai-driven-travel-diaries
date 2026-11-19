import Partner from '../models/partner.model.js';
import { errorHandler } from '../utils/error.js';

// Store numbers as digits with country code; 10-digit numbers are assumed to be Indian.
const normalizePhone = (value) => {
  if (value === undefined) return undefined;
  const digits = String(value).replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
};

const normalize = (data) => {
  const result = { ...data };
  for (const key of ['phone', 'whatsapp']) {
    if (key in result) result[key] = normalizePhone(result[key]);
  }
  return result;
};

export const listPartnersService = (place) =>
  Partner.find({ placeSlugs: place, active: true })
    .sort({ verified: -1, name: 1 })
    .select('-enquiries -active')
    .lean();

export const listAllPartnersService = () => Partner.find().sort({ createdAt: -1 }).lean();

export const createPartnerService = (data) => Partner.create(normalize(data));

export const updatePartnerService = async (id, data) => {
  const partner = await Partner.findByIdAndUpdate(id, { $set: normalize(data) }, { new: true, runValidators: true });
  if (!partner) throw errorHandler(404, 'Partner not found');
  return partner;
};

export const deletePartnerService = async (id) => {
  const partner = await Partner.findByIdAndDelete(id);
  if (!partner) throw errorHandler(404, 'Partner not found');
};

export const recordContactService = async (id, channel) => {
  const field = channel === 'whatsapp' ? 'whatsapp' : 'phone';
  const partner = await Partner.findOneAndUpdate(
    { _id: id, active: true, [field]: { $ne: '' } },
    { $inc: { enquiries: 1 } }
  );
  if (!partner) throw errorHandler(404, 'Partner not found');
};
