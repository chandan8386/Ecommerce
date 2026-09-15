import mongoose from 'mongoose';
import { round2 } from '../utils/helpers.js';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 30 },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, min: 0, default: 0 },
    maxDiscountAmount: { type: Number, min: 0, default: 0 }, // 0 = no cap
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, min: 0, default: 0 }, // 0 = unlimited
    perUserLimit: { type: Number, min: 0, default: 1 }, // 0 = unlimited
    usedCount: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/** Returns the discount amount for a given subtotal (does not check validity). */
couponSchema.methods.computeDiscount = function computeDiscount(subtotal) {
  let discount =
    this.discountType === 'percent' ? (subtotal * this.discountValue) / 100 : this.discountValue;
  if (this.maxDiscountAmount > 0) discount = Math.min(discount, this.maxDiscountAmount);
  return round2(Math.min(discount, subtotal));
};

export const Coupon = mongoose.model('Coupon', couponSchema);
