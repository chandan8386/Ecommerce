import mongoose from 'mongoose';
import { Cart } from '../models/Cart.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Wishlist } from '../models/Wishlist.js';
import { getCategoryPath, uniqueSlug } from '../services/catalog.service.js';
import { deleteImages, saveImages } from '../services/storage.service.js';
import { MAX_IMAGES } from '../middleware/upload.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, paginationMeta, parsePagination, slugify, toList } from '../utils/helpers.js';

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  popular: { soldCount: -1, _id: 1 },
  rating: { rating: -1, numReviews: -1 },
  name: { name: 1 },
  relevance: { isFeatured: -1, soldCount: -1 },
};

const LIST_FIELDS =
  'name slug sku price compareAtPrice stock material purity colors sizes images category rating numReviews isFeatured isActive soldCount lowStockThreshold createdAt';

const listRegex = (values) => values.map((v) => new RegExp(`^${escapeRegex(v)}$`, 'i'));

async function buildFilter(query, { admin = false } = {}) {
  const filter = {};

  if (!admin) filter.isActive = true;
  else if (query.status === 'active') filter.isActive = true;
  else if (query.status === 'inactive') filter.isActive = false;
  else if (query.status === 'out_of_stock') filter.stock = 0;
  else if (query.status === 'low_stock') {
    filter.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };
  }

  if (query.category) {
    const cat = mongoose.isValidObjectId(query.category)
      ? await Category.findById(query.category).select('_id').lean()
      : await Category.findOne({ slug: query.category }).select('_id').lean();
    if (!cat) return null; // unknown category → empty result
    filter.categoryPath = cat._id;
  }

  const materials = toList(query.material);
  const colors = toList(query.color);
  const sizes = toList(query.size);
  if (materials.length) filter.material = { $in: listRegex(materials) };
  if (colors.length) filter.colors = { $in: listRegex(colors) };
  if (sizes.length) filter.sizes = { $in: listRegex(sizes) };

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
  }
  if (query.featured) filter.isFeatured = true;
  if (query.inStock) filter.stock = { $gt: 0 };

  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { tags: rx }, { material: rx }, { gemstone: rx }];
  }
  return filter;
}

/** GET /products — public listing with filters, search, sorting and pagination */
export const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 12, maxLimit: 60 });
  const filter = await buildFilter(req.query);
  if (!filter) return res.json({ success: true, data: [], pagination: paginationMeta(page, limit, 0) });

  const sort = SORTS[req.query.sort] || SORTS.newest;
  const [data, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).select(LIST_FIELDS).populate('category', 'name slug').lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, data: data.map(withVirtuals), pagination: paginationMeta(page, limit, total) });
});

/** GET /products/admin — admin listing incl. inactive/stock filters */
export const adminListProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const filter = await buildFilter(req.query, { admin: true });
  if (!filter) return res.json({ success: true, data: [], pagination: paginationMeta(page, limit, 0) });
  const sort = SORTS[req.query.sort] || SORTS.newest;
  const [data, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).select(LIST_FIELDS).populate('category', 'name slug').lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, data: data.map(withVirtuals), pagination: paginationMeta(page, limit, total) });
});

const withVirtuals = (p) => ({
  ...p,
  inStock: p.stock > 0,
  discountPercent:
    p.compareAtPrice > p.price ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0,
});

/** GET /products/filters — facet values for the filter sidebar */
export const getFilterOptions = asyncHandler(async (req, res) => {
  const match = { isActive: true };
  if (req.query.category) {
    const cat = await Category.findOne({ slug: req.query.category }).select('_id').lean();
    if (cat) match.categoryPath = cat._id;
  }
  const [facets] = await Product.aggregate([
    { $match: match },
    {
      $facet: {
        materials: [{ $group: { _id: '$material', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        colors: [{ $unwind: '$colors' }, { $group: { _id: '$colors', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        sizes: [{ $unwind: '$sizes' }, { $group: { _id: '$sizes', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        price: [{ $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }],
      },
    },
  ]);
  const fmt = (arr) => arr.filter((x) => x._id).map((x) => ({ value: x._id, count: x.count }));
  res.json({
    success: true,
    data: {
      materials: fmt(facets.materials),
      colors: fmt(facets.colors),
      sizes: fmt(facets.sizes),
      price: { min: facets.price[0]?.min ?? 0, max: facets.price[0]?.max ?? 0 },
    },
  });
});

/** GET /products/suggest?q= — lightweight search autocomplete */
export const suggestProducts = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 60);
  if (q.length < 2) return res.json({ success: true, data: [] });
  const rx = new RegExp(escapeRegex(q), 'i');
  const data = await Product.find({ isActive: true, $or: [{ name: rx }, { tags: rx }, { material: rx }] })
    .sort({ soldCount: -1 })
    .limit(6)
    .select('name slug price images')
    .lean();
  res.json({
    success: true,
    data: data.map((p) => ({ _id: p._id, name: p.name, slug: p.slug, price: p.price, image: p.images?.[0]?.url || '' })),
  });
});

/** GET /products/slug/:slug — public product detail + related products */
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name slug parent');
  if (!product) throw ApiError.notFound('Product not found');

  const [related, pathIds] = await Promise.all([
    Product.find({ _id: { $ne: product._id }, isActive: true, category: product.category?._id })
      .sort({ soldCount: -1 })
      .limit(8)
      .select(LIST_FIELDS)
      .lean(),
    product.category ? getCategoryPath(product.category._id) : [],
  ]);
  const cats = await Category.find({ _id: { $in: pathIds } }).select('name slug').lean();
  const breadcrumbs = pathIds.slice().reverse().map((id) => cats.find((c) => c._id.equals(id))).filter(Boolean);

  res.json({ success: true, data: { product, related: related.map(withVirtuals), breadcrumbs } });
});

/** GET /products/:id — admin detail */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ success: true, data: product });
});

async function assertCategory(id) {
  if (!(await Category.exists({ _id: id }))) throw ApiError.badRequest('Category not found');
}

export const createProduct = asyncHandler(async (req, res) => {
  const { keepImages, ...body } = req.body;
  await assertCategory(body.category);
  if (!req.files?.length) throw ApiError.badRequest('At least one product image is required');

  body.slug = await uniqueSlug(Product, slugify(body.slug || body.name));
  body.categoryPath = await getCategoryPath(body.category);
  body.images = await saveImages(req.files, 'products', body.name);

  try {
    const product = await Product.create(body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    await deleteImages(body.images); // don't leave orphaned uploads behind
    throw err;
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  const { keepImages, ...body } = req.body;

  if (body.category && String(body.category) !== String(product.category)) {
    await assertCategory(body.category);
    body.categoryPath = await getCategoryPath(body.category);
  }
  if (body.slug || (body.name && body.name !== product.name)) {
    const base = slugify(body.slug || product.slug);
    if (base !== product.slug) body.slug = await uniqueSlug(Product, base, product._id);
  }

  // keepImages (ordered publicIds/urls) decides which existing images survive.
  let kept = product.images;
  let removed = [];
  if (keepImages) {
    const keys = keepImages;
    kept = keys
      .map((k) => product.images.find((img) => img.publicId === k || img.url === k))
      .filter(Boolean);
    removed = product.images.filter((img) => !kept.includes(img));
  }
  const newCount = req.files?.length || 0;
  if (kept.length + newCount > MAX_IMAGES) throw ApiError.badRequest(`A product can have at most ${MAX_IMAGES} images`);
  if (kept.length + newCount === 0) throw ApiError.badRequest('A product needs at least one image');

  const uploaded = newCount ? await saveImages(req.files, 'products', body.name || product.name) : [];
  body.images = [...kept.map((i) => i.toObject?.() ?? i), ...uploaded];

  product.set(body);
  try {
    await product.save();
  } catch (err) {
    await deleteImages(uploaded);
    throw err;
  }
  await deleteImages(removed);
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  await product.deleteOne();
  await Promise.all([
    Cart.updateMany({}, { $pull: { items: { product: product._id } } }),
    Wishlist.updateMany({}, { $pull: { products: product._id } }),
    deleteImages(product.images),
  ]);
  res.json({ success: true, message: 'Product deleted' });
});

/** PATCH /products/inventory — bulk stock / price update */
export const updateInventory = asyncHandler(async (req, res) => {
  const ops = req.body.items.map(({ id, ...fields }) => ({
    updateOne: { filter: { _id: id }, update: { $set: fields } },
  }));
  const result = await Product.bulkWrite(ops);
  res.json({ success: true, data: { matched: result.matchedCount, modified: result.modifiedCount } });
});
