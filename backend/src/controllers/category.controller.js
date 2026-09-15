import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { deleteImage, saveImage } from '../services/storage.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { slugify } from '../utils/helpers.js';
import { uniqueSlug, getCategoryPath, getDescendantIds } from '../services/catalog.service.js';

const buildTree = (categories) => {
  const byId = new Map(categories.map((c) => [c._id.toString(), { ...c, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    const parentId = node.parent?.toString();
    if (parentId && byId.has(parentId)) byId.get(parentId).children.push(node);
    else roots.push(node);
  }
  return roots;
};

/** GET /categories?tree=true  (public: active only) */
export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .select('-__v')
    .lean();
  const data = req.query.tree === 'true' ? buildTree(categories) : categories;
  res.json({ success: true, data });
});

/** GET /categories/admin/all (admin: all + product counts) */
export const adminListCategories = asyncHandler(async (_req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }).populate('parent', 'name slug').lean(),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const countMap = new Map(counts.map((c) => [c._id?.toString(), c.count]));
  res.json({
    success: true,
    data: categories.map((c) => ({ ...c, productCount: countMap.get(c._id.toString()) || 0 })),
  });
});

/** GET /categories/:slug  (public) */
export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!category) throw ApiError.notFound('Category not found');

  const [children, pathIds] = await Promise.all([
    Category.find({ parent: category._id, isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    getCategoryPath(category._id),
  ]);
  const ancestors = await Category.find({ _id: { $in: pathIds } }).select('name slug').lean();
  const breadcrumbs = pathIds
    .slice()
    .reverse()
    .map((id) => ancestors.find((a) => a._id.equals(id)))
    .filter(Boolean);

  res.json({ success: true, data: { ...category, children, breadcrumbs } });
});

async function assertValidParent(parentId, selfId) {
  if (!parentId) return;
  const parent = await Category.findById(parentId);
  if (!parent) throw ApiError.badRequest('Parent category not found');
  if (selfId) {
    const descendants = await getDescendantIds(selfId);
    if (descendants.some((id) => id.equals(parentId))) {
      throw ApiError.badRequest('A category cannot be moved under itself or its subcategory');
    }
  }
}

export const createCategory = asyncHandler(async (req, res) => {
  const { removeImage, ...body } = req.body;
  await assertValidParent(body.parent);
  body.slug = await uniqueSlug(Category, slugify(body.slug || body.name));
  if (req.file) body.image = await saveImage(req.file, 'categories', body.name);
  const category = await Category.create(body);
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  const { removeImage, ...body } = req.body;

  if (body.parent !== undefined) await assertValidParent(body.parent, category._id);
  if (body.slug || (body.name && body.name !== category.name && !body.slug)) {
    const base = slugify(body.slug || body.name);
    if (base !== category.slug) body.slug = await uniqueSlug(Category, base, category._id);
  }

  const oldImage = category.image;
  if (req.file) body.image = await saveImage(req.file, 'categories', body.name || category.name);
  else if (removeImage) body.image = null;

  const parentChanged = body.parent !== undefined && String(body.parent) !== String(category.parent);
  category.set(body);
  await category.save();

  if ((req.file || removeImage) && oldImage?.publicId) await deleteImage(oldImage.publicId);

  if (parentChanged) {
    // Rebuild categoryPath for products in this category and all descendants.
    const ids = await getDescendantIds(category._id);
    for (const id of ids) {
      const path = await getCategoryPath(id);
      await Product.updateMany({ category: id }, { $set: { categoryPath: path } });
    }
  }
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  const [children, products] = await Promise.all([
    Category.countDocuments({ parent: category._id }),
    Product.countDocuments({ category: category._id }),
  ]);
  if (children) throw ApiError.badRequest('Delete or move its subcategories first');
  if (products) throw ApiError.badRequest(`This category has ${products} product(s). Move them first.`);
  await category.deleteOne();
  if (category.image?.publicId) await deleteImage(category.image.publicId);
  res.json({ success: true, message: 'Category deleted' });
});
