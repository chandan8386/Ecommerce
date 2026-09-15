import mongoose from 'mongoose';
import { imageSchema } from './Category.js';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    subtitle: { type: String, trim: true, maxlength: 250, default: '' },
    image: { type: imageSchema, required: true },
    link: { type: String, trim: true, default: '/shop' },
    buttonText: { type: String, trim: true, maxlength: 30, default: 'Shop Now' },
    position: { type: String, enum: ['hero', 'promo'], default: 'hero', index: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Banner = mongoose.model('Banner', bannerSchema);
