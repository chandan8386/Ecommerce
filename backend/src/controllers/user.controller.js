import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $set: req.body }, { new: true, runValidators: true });
  res.json({ success: true, data: user });
});

export const listAddresses = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.addresses });
});

const normaliseDefault = (user, preferredId) => {
  if (!user.addresses.length) return;
  const target = preferredId
    ? user.addresses.id(preferredId)
    : user.addresses.find((a) => a.isDefault) || user.addresses[0];
  user.addresses.forEach((a) => {
    a.isDefault = a._id.equals(target._id);
  });
};

export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.addresses.length >= 10) throw ApiError.badRequest('You can save up to 10 addresses');
  user.addresses.push(req.body);
  const added = user.addresses[user.addresses.length - 1];
  normaliseDefault(user, req.body.isDefault || user.addresses.length === 1 ? added._id : null);
  await user.save();
  res.status(201).json({ success: true, data: user.addresses });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.id);
  if (!address) throw ApiError.notFound('Address not found');
  address.set(req.body);
  normaliseDefault(user, req.body.isDefault ? address._id : null);
  await user.save();
  res.json({ success: true, data: user.addresses });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.id);
  if (!address) throw ApiError.notFound('Address not found');
  address.deleteOne();
  normaliseDefault(user);
  await user.save();
  res.json({ success: true, data: user.addresses });
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.addresses.id(req.params.id)) throw ApiError.notFound('Address not found');
  normaliseDefault(user, req.params.id);
  await user.save();
  res.json({ success: true, data: user.addresses });
});
