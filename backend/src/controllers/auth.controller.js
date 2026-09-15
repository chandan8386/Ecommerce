import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

const authResponse = (res, user, status = 200) =>
  res.status(status).json({ success: true, data: { user, token: signToken(user) } });

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');
  const user = await User.create({ name, email, phone, password, role: 'customer' });
  authResponse(res, user, 201);
});

async function authenticate(email, password) {
  const user = await User.findOne({ email }).select('+password +tokenVersion');
  // Same message for unknown email and wrong password to avoid account enumeration.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (user.isBlocked) throw ApiError.forbidden('Your account has been blocked. Contact support.');
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  return user;
}

export const login = asyncHandler(async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);
  authResponse(res, user);
});

export const adminLogin = asyncHandler(async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);
  if (user.role !== 'admin') throw ApiError.forbidden('Admin access required');
  authResponse(res, user);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password +tokenVersion');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = req.body.newPassword;
  user.tokenVersion += 1; // signs out other sessions
  await user.save();
  authResponse(res, user);
});

export const logoutAll = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  res.json({ success: true, message: 'Signed out from all devices' });
});
