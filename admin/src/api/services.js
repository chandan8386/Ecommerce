import { api } from './client.js';

const data = (p) => p.then((r) => r.data);

export const authApi = {
  login: (body) => data(api.post('/auth/admin/login', body)),
  me: () => data(api.get('/auth/me')),
};

export const dashboardApi = {
  get: () => data(api.get('/admin/dashboard')),
  salesReport: (params) => data(api.get('/admin/reports/sales', { params })),
};

export const productApi = {
  list: (params) => data(api.get('/products/admin/list', { params })),
  get: (id) => data(api.get(`/products/${id}`)),
  create: (formData, onUploadProgress) => data(api.post('/products', formData, { onUploadProgress })),
  update: (id, formData, onUploadProgress) => data(api.put(`/products/${id}`, formData, { onUploadProgress })),
  remove: (id) => data(api.delete(`/products/${id}`)),
  updateInventory: (items) => data(api.patch('/products/inventory', { items })),
};

export const categoryApi = {
  list: () => data(api.get('/categories/admin/all')),
  create: (formData) => data(api.post('/categories', formData)),
  update: (id, formData) => data(api.put(`/categories/${id}`, formData)),
  remove: (id) => data(api.delete(`/categories/${id}`)),
};

export const orderApi = {
  list: (params) => data(api.get('/orders', { params })),
  get: (id) => data(api.get(`/orders/${id}`)),
  updateStatus: (id, body) => data(api.patch(`/orders/${id}/status`, body)),
  updateNote: (id, adminNote) => data(api.patch(`/orders/${id}/note`, { adminNote })),
};

export const customerApi = {
  list: (params) => data(api.get('/admin/customers', { params })),
  get: (id) => data(api.get(`/admin/customers/${id}`)),
  setBlocked: (id, isBlocked) => data(api.patch(`/admin/customers/${id}/block`, { isBlocked })),
};

export const couponApi = {
  list: (params) => data(api.get('/coupons', { params })),
  create: (body) => data(api.post('/coupons', body)),
  update: (id, body) => data(api.put(`/coupons/${id}`, body)),
  remove: (id) => data(api.delete(`/coupons/${id}`)),
};

export const bannerApi = {
  list: () => data(api.get('/banners/admin/all')),
  create: (formData) => data(api.post('/banners', formData)),
  update: (id, formData) => data(api.put(`/banners/${id}`, formData)),
  remove: (id) => data(api.delete(`/banners/${id}`)),
};
