import { Category } from '../models/Category.js';

/** Appends -2, -3… until the slug is unique for the model. */
export async function uniqueSlug(Model, base, excludeId) {
  const root = base || 'item';
  let slug = root;
  let i = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) })) {
    slug = `${root}-${i++}`;
  }
  return slug;
}

/** Returns [categoryId, parentId, grandparentId, …]. */
export async function getCategoryPath(categoryId) {
  const path = [];
  let current = await Category.findById(categoryId).select('parent').lean();
  const seen = new Set();
  while (current && !seen.has(current._id.toString())) {
    seen.add(current._id.toString());
    path.push(current._id);
    current = current.parent ? await Category.findById(current.parent).select('parent').lean() : null;
  }
  return path;
}

/** Returns the category id together with all descendant ids. */
export async function getDescendantIds(categoryId) {
  const all = await Category.find().select('parent').lean();
  const result = [];
  const queue = [String(categoryId)];
  while (queue.length) {
    const id = queue.shift();
    const match = all.find((c) => c._id.toString() === id);
    if (match) result.push(match._id);
    all.filter((c) => c.parent?.toString() === id).forEach((c) => queue.push(c._id.toString()));
  }
  return result;
}
