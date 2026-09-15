import { Product } from '../models/Product.js';
import { Wishlist } from '../models/Wishlist.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const respond = async (res, userId) => {
  const wishlist = await Wishlist.findOne({ user: userId })
    .populate({
      path: 'products',
      match: { isActive: true },
      select: 'name slug price compareAtPrice stock images material rating numReviews sizes colors',
    })
    .lean();
  res.json({ success: true, data: wishlist?.products || [] });
};

export const getWishlist = asyncHandler(async (req, res) => respond(res, req.user._id));

export const addToWishlist = asyncHandler(async (req, res) => {
  if (!(await Product.exists({ _id: req.params.productId, isActive: true }))) {
    throw ApiError.notFound('Product not found');
  }
  await Wishlist.updateOne(
    { user: req.user._id },
    { $addToSet: { products: req.params.productId } },
    { upsert: true }
  );
  await respond(res, req.user._id);
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: req.params.productId } });
  await respond(res, req.user._id);
});
