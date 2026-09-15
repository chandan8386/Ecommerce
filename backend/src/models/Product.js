import mongoose from 'mongoose';
import { imageSchema } from './Category.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    shortDescription: { type: String, trim: true, maxlength: 300, default: '' },
    description: { type: String, trim: true, maxlength: 5000, default: '' },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    // The category plus all of its ancestors, so filtering by a parent category
    // also returns products in its subcategories.
    categoryPath: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true }],

    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0, default: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 5 },

    material: { type: String, trim: true, required: true, index: true },
    purity: { type: String, trim: true, default: '' },
    colors: [{ type: String, trim: true }],
    sizes: [{ type: String, trim: true }],
    weight: { type: Number, min: 0, default: 0 }, // grams
    gemstone: { type: String, trim: true, default: '' },

    images: { type: [imageSchema], default: [] },
    tags: [{ type: String, trim: true, lowercase: true }],

    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },

    rating: { type: Number, min: 0, max: 5, default: 0 },
    numReviews: { type: Number, min: 0, default: 0 },
    soldCount: { type: Number, min: 0, default: 0 },

    seo: {
      metaTitle: { type: String, maxlength: 70, default: '' },
      metaDescription: { type: String, maxlength: 170, default: '' },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.index(
  { name: 'text', tags: 'text', material: 'text', gemstone: 'text', shortDescription: 'text' },
  { weights: { name: 10, tags: 5, material: 3, gemstone: 3, shortDescription: 1 }, name: 'product_text' }
);
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ colors: 1 });
productSchema.index({ sizes: 1 });

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

productSchema.virtual('discountPercent').get(function discountPercent() {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

export const Product = mongoose.model('Product', productSchema);
