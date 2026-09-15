import { api } from './client.js';

const data = (p) => p.then((r) => r.data);

export const authApi = {
  register: (body) => data(api.post('/auth/register', body)),
  login: (body) => data(api.post('/auth/login', body)),
  me: () => data(api.get('/auth/me')),
  changePassword: (body) => data(api.patch('/auth/password', body)),
};

export const userApi = {
  updateProfile: (body) => data(api.patch('/users/me', body)),
  addresses: () => data(api.get('/users/me/addresses')),
  addAddress: (body) => data(api.post('/users/me/addresses', body)),
  updateAddress: (id, body) => data(api.put(`/users/me/addresses/${id}`, body)),
  deleteAddress: (id) => data(api.delete(`/users/me/addresses/${id}`)),
  setDefaultAddress: (id) => data(api.patch(`/users/me/addresses/${id}/default`)),
};

export const catalogApi = {
  categories: (tree = true) => data(api.get('/categories', { params: { tree } })),
  category: (slug) => data(api.get(`/categories/${slug}`)),
  products: (params) => data(api.get('/products', { params })),
  filters: (category) => data(api.get('/products/filters', { params: { category } })),
  suggest: (q) => data(api.get('/products/suggest', { params: { q } })),
  product: (slug) => data(api.get(`/products/slug/${slug}`)),
  banners: (position) => data(api.get('/banners', { params: { position } })),
};

export const cartApi = {
  get: (coupon) => data(api.get('/cart', { params: { coupon } })),
  add: (body, coupon) => data(api.post('/cart/items', body, { params: { coupon } })),
  update: (itemId, quantity, coupon) => data(api.patch(`/cart/items/${itemId}`, { quantity }, { params: { coupon } })),
  remove: (itemId, coupon) => data(api.delete(`/cart/items/${itemId}`, { params: { coupon } })),
  clear: () => data(api.delete('/cart')),
  merge: (items) => data(api.post('/cart/merge', { items })),
};

export const wishlistApi = {
  get: () => data(api.get('/wishlist')),
  add: (productId) => data(api.post(`/wishlist/${productId}`)),
  remove: (productId) => data(api.delete(`/wishlist/${productId}`)),
};

export const couponApi = {
  apply: (code) => data(api.post('/coupons/apply', { code })),
  available: () => data(api.get('/coupons/available')),
};

export const orderApi = {
  create: (body) => data(api.post('/orders', body)),
  my: (page = 1) => data(api.get('/orders/my', { params: { page } })),
  get: (id) => data(api.get(`/orders/${id}`)),
  cancel: (id, reason) => data(api.post(`/orders/${id}/cancel`, { reason })),
  track: (orderNumber, email) => data(api.get('/orders/track', { params: { orderNumber, email } })),
};

export const paymentApi = {
  config: () => data(api.get('/payments/config')),
  retry: (orderId) => data(api.post(`/payments/razorpay/orders/${orderId}`)),
  verify: (body) => data(api.post('/payments/razorpay/verify', body)),
  failed: (orderId, reason) => data(api.post('/payments/razorpay/failed', { orderId, reason })),
};
