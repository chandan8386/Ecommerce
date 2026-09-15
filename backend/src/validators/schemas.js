import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const idParam = z.object({ id: objectId });

const trimmed = (max) => z.string().trim().max(max);
const boolish = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1');
const numberish = z.coerce.number();
// Multipart forms send arrays as JSON strings or comma lists.
const stringList = z
  .union([z.array(z.string()), z.string()])
  .transform((v) => {
    if (Array.isArray(v)) return v.map((s) => s.trim()).filter(Boolean);
    const s = v.trim();
    if (s.startsWith('[')) {
      try {
        return JSON.parse(s).map((x) => String(x).trim()).filter(Boolean);
      } catch {
        return [];
      }
    }
    return s.split(',').map((x) => x.trim()).filter(Boolean);
  });

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

/* ---------- Auth & users ---------- */
export const registerSchema = z.object({
  name: trimmed(80).min(2, 'Name is required'),
  email: z.string().trim().toLowerCase().email(),
  phone: trimmed(20).optional().default(''),
  password,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: trimmed(80).min(2).optional(),
  phone: trimmed(20).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

export const addressSchema = z.object({
  label: trimmed(30).optional().default('Home'),
  fullName: trimmed(100).min(2),
  phone: trimmed(20).regex(/^[+\d\s-]{7,20}$/, 'Invalid phone number'),
  line1: trimmed(200).min(3),
  line2: trimmed(200).optional().default(''),
  city: trimmed(80).min(2),
  state: trimmed(80).min(2),
  postalCode: trimmed(12).regex(/^[A-Za-z\d\s-]{3,12}$/, 'Invalid postal code'),
  country: trimmed(60).optional().default('India'),
  isDefault: z.boolean().optional().default(false),
});

/* ---------- Catalog ---------- */
const seoSchema = z
  .union([
    z.object({ metaTitle: trimmed(70).optional(), metaDescription: trimmed(170).optional() }),
    z.string().transform((s) => {
      try {
        return JSON.parse(s);
      } catch {
        return {};
      }
    }),
  ])
  .optional();

export const categorySchema = z.object({
  name: trimmed(80).min(2),
  slug: trimmed(100).optional(),
  description: trimmed(1000).optional(),
  parent: z
    .union([objectId, z.literal(''), z.literal('null'), z.null()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v && v !== 'null' ? v : null)),
  isActive: boolish.optional(),
  sortOrder: numberish.int().optional(),
  removeImage: boolish.optional(),
  seo: seoSchema,
});

export const productSchema = z.object({
  name: trimmed(150).min(2),
  slug: trimmed(160).optional(),
  sku: trimmed(40).min(2),
  shortDescription: trimmed(300).optional(),
  description: trimmed(5000).optional(),
  category: objectId,
  price: numberish.min(0),
  compareAtPrice: numberish.min(0).optional(),
  stock: numberish.int().min(0),
  lowStockThreshold: numberish.int().min(0).optional(),
  material: trimmed(50).min(2),
  purity: trimmed(30).optional(),
  colors: stringList.optional(),
  sizes: stringList.optional(),
  tags: stringList.optional(),
  weight: numberish.min(0).optional(),
  gemstone: trimmed(50).optional(),
  isActive: boolish.optional(),
  isFeatured: boolish.optional(),
  // JSON array of publicIds of existing images to keep (in order). Used on update.
  keepImages: stringList.optional(),
  seo: seoSchema,
});

export const productUpdateSchema = productSchema.partial();
export const categoryUpdateSchema = categorySchema.partial();

export const inventoryUpdateSchema = z.object({
  items: z
    .array(
      z.object({
        id: objectId,
        stock: z.number().int().min(0).optional(),
        price: z.number().min(0).optional(),
        compareAtPrice: z.number().min(0).optional(),
      })
    )
    .min(1)
    .max(200),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: trimmed(100).optional(),
  category: trimmed(100).optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  featured: boolish.optional(),
  inStock: boolish.optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular', 'rating', 'name', 'relevance']).optional(),
  // admin only
  status: z.enum(['active', 'inactive', 'all', 'low_stock', 'out_of_stock']).optional(),
});

/* ---------- Cart & wishlist ---------- */
export const addToCartSchema = z.object({
  productId: objectId,
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  size: trimmed(20).optional().default(''),
  color: trimmed(30).optional().default(''),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(20),
});

export const mergeCartSchema = z.object({
  items: z.array(addToCartSchema).max(50),
});

/* ---------- Coupons ---------- */
export const applyCouponSchema = z.object({ code: trimmed(30).min(1) });

const optionalDate = z
  .union([z.coerce.date(), z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === undefined ? undefined : v || null));

export const couponSchema = z
  .object({
    code: trimmed(30).min(3).regex(/^[A-Za-z0-9_-]+$/, 'Only letters, numbers, _ and -'),
    description: trimmed(200).optional(),
    discountType: z.enum(['percent', 'fixed']),
    discountValue: z.coerce.number().positive(),
    minOrderAmount: z.coerce.number().min(0).optional(),
    maxDiscountAmount: z.coerce.number().min(0).optional(),
    startsAt: optionalDate,
    expiresAt: optionalDate,
    usageLimit: z.coerce.number().int().min(0).optional(),
    perUserLimit: z.coerce.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((c) => c.discountType !== 'percent' || c.discountValue <= 100, {
    message: 'Percentage discount cannot exceed 100',
    path: ['discountValue'],
  });

/* ---------- Orders & payments ---------- */
export const createOrderSchema = z
  .object({
    addressId: objectId.optional(),
    shippingAddress: addressSchema.omit({ label: true, isDefault: true }).optional(),
    paymentMethod: z.enum(['razorpay', 'cod']),
    couponCode: trimmed(30).optional(),
    customerNote: trimmed(500).optional(),
    saveAddress: z.boolean().optional().default(true),
  })
  .refine((d) => d.addressId || d.shippingAddress, {
    message: 'A shipping address is required',
    path: ['shippingAddress'],
  });

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const paymentFailedSchema = z.object({
  orderId: objectId,
  reason: trimmed(300).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned']),
  note: trimmed(300).optional(),
  tracking: z
    .object({
      courier: trimmed(60).optional(),
      trackingNumber: trimmed(60).optional(),
      url: z.union([z.string().trim().url(), z.literal('')]).optional(),
    })
    .optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  q: trimmed(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const trackOrderSchema = z.object({
  orderNumber: trimmed(40).min(3),
  email: z.string().trim().toLowerCase().email(),
});

/* ---------- Banners ---------- */
export const bannerSchema = z.object({
  title: trimmed(120).min(2),
  subtitle: trimmed(250).optional(),
  link: trimmed(300).optional(),
  buttonText: trimmed(30).optional(),
  position: z.enum(['hero', 'promo']).optional(),
  sortOrder: numberish.int().optional(),
  isActive: boolish.optional(),
  startsAt: optionalDate,
  endsAt: optionalDate,
});

export const bannerUpdateSchema = bannerSchema.partial();

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: trimmed(100).optional(),
  status: z.enum(['active', 'blocked', 'all']).optional(),
});

/* ---------- Reports ---------- */
export const reportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});
