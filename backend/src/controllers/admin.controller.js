import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, paginationMeta, parsePagination } from '../utils/helpers.js';

// Orders that count towards revenue: confirmed onwards, excluding cancelled/returned.
const REVENUE_MATCH = { status: { $in: ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'] } };

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** GET /admin/dashboard */
export const getDashboard = asyncHandler(async (_req, res) => {
  const today = startOfDay();
  const thirtyDaysAgo = new Date(today.getTime() - 29 * 86400000);
  const prevPeriodStart = new Date(thirtyDaysAgo.getTime() - 30 * 86400000);

  const [
    revenueAgg,
    todayAgg,
    periodAgg,
    prevPeriodAgg,
    ordersByStatus,
    totalOrders,
    totalCustomers,
    newCustomers,
    totalProducts,
    lowStock,
    outOfStock,
    recentOrders,
    salesSeries,
    topProducts,
  ] = await Promise.all([
    Order.aggregate([{ $match: REVENUE_MATCH }, { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { ...REVENUE_MATCH, createdAt: { $gte: today } } }, { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { ...REVENUE_MATCH, createdAt: { $gte: thirtyDaysAgo } } }, { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { ...REVENUE_MATCH, createdAt: { $gte: prevPeriodStart, $lt: thirtyDaysAgo } } }, { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: thirtyDaysAgo } }),
    Product.countDocuments(),
    Product.find({ isActive: true, stock: { $gt: 0 }, $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
      .select('name sku stock lowStockThreshold images')
      .sort({ stock: 1 })
      .limit(8)
      .lean(),
    Product.countDocuments({ stock: 0 }),
    Order.find().sort({ createdAt: -1 }).limit(8).select('orderNumber shippingAddress.fullName pricing.total status payment.status payment.method createdAt').lean(),
    Order.aggregate([
      { $match: { ...REVENUE_MATCH, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: REVENUE_MATCH },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, image: { $first: '$items.image' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
  ]);

  // Fill missing days so the chart has a continuous x-axis.
  const seriesMap = new Map(salesSeries.map((s) => [s._id, s]));
  const series = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 86400000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hit = seriesMap.get(key);
    series.push({ date: key, revenue: hit?.revenue || 0, orders: hit?.orders || 0 });
  }

  const growth = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);
  const period = periodAgg[0] || { revenue: 0, orders: 0 };
  const prev = prevPeriodAgg[0] || { revenue: 0, orders: 0 };
  const revenue = revenueAgg[0] || { revenue: 0, orders: 0 };

  res.json({
    success: true,
    data: {
      stats: {
        totalRevenue: revenue.revenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        todayRevenue: todayAgg[0]?.revenue || 0,
        todayOrders: todayAgg[0]?.orders || 0,
        last30Revenue: period.revenue,
        last30Orders: period.orders,
        revenueGrowth: growth(period.revenue, prev.revenue),
        ordersGrowth: growth(period.orders, prev.orders),
        averageOrderValue: revenue.orders ? Math.round(revenue.revenue / revenue.orders) : 0,
        newCustomers,
        outOfStock,
      },
      ordersByStatus: Object.fromEntries(ordersByStatus.map((s) => [s._id, s.count])),
      salesSeries: series,
      recentOrders,
      lowStock,
      topProducts,
    },
  });
});

/** GET /admin/reports/sales?from&to&groupBy=day|week|month */
export const getSalesReport = asyncHandler(async (req, res) => {
  const to = req.query.to ? new Date(new Date(req.query.to).setHours(23, 59, 59, 999)) : new Date();
  const from = req.query.from ? startOfDay(new Date(req.query.from)) : new Date(startOfDay(to).getTime() - 29 * 86400000);
  if (from > to) throw ApiError.badRequest('"from" must be before "to"');

  const format = { day: '%Y-%m-%d', week: '%G-W%V', month: '%Y-%m' }[req.query.groupBy];
  const match = { ...REVENUE_MATCH, createdAt: { $gte: from, $lte: to } };

  const [series, totals, topProducts, paymentMethods, statusBreakdown, topCategories] = await Promise.all([
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
          subtotal: { $sum: '$pricing.subtotal' },
          discount: { $sum: '$pricing.discount' },
          tax: { $sum: '$pricing.tax' },
          shipping: { $sum: '$pricing.shipping' },
          items: { $sum: { $sum: '$items.quantity' } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
          discount: { $sum: '$pricing.discount' },
          tax: { $sum: '$pricing.tax' },
          shipping: { $sum: '$pricing.shipping' },
          items: { $sum: { $sum: '$items.quantity' } },
          customers: { $addToSet: '$user' },
        },
      },
    ]),
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, sku: { $first: '$items.sku' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([{ $match: match }, { $group: { _id: '$payment.method', orders: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: from, $lte: to } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
      { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'categories', localField: 'p.category', foreignField: '_id', as: 'c' } },
      { $unwind: { path: '$c', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$c.name', 'Uncategorised'] }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { revenue: -1 } },
    ]),
  ]);

  const t = totals[0] || { orders: 0, revenue: 0, discount: 0, tax: 0, shipping: 0, items: 0, customers: [] };
  res.json({
    success: true,
    data: {
      range: { from, to, groupBy: req.query.groupBy },
      totals: {
        orders: t.orders,
        revenue: t.revenue,
        discount: t.discount,
        tax: t.tax,
        shipping: t.shipping,
        items: t.items,
        customers: t.customers.length,
        averageOrderValue: t.orders ? Math.round(t.revenue / t.orders) : 0,
      },
      series: series.map(({ _id, ...rest }) => ({ period: _id, ...rest })),
      topProducts,
      topCategories: topCategories.map(({ _id, ...rest }) => ({ category: _id, ...rest })),
      paymentMethods: paymentMethods.map(({ _id, ...rest }) => ({ method: _id, ...rest })),
      statusBreakdown: Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count])),
    },
  });
});

/** GET /admin/customers */
export const listCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const match = { role: 'customer' };
  if (req.query.status === 'blocked') match.isBlocked = true;
  if (req.query.status === 'active') match.isBlocked = false;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    match.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [data, total] = await Promise.all([
    User.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'orders',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$uid'] } } },
            {
              $group: {
                _id: null,
                orders: { $sum: 1 },
                spent: { $sum: { $cond: [{ $in: ['$status', REVENUE_MATCH.status.$in] }, '$pricing.total', 0] } },
                lastOrderAt: { $max: '$createdAt' },
              },
            },
          ],
          as: 'stats',
        },
      },
      {
        $project: {
          name: 1, email: 1, phone: 1, isBlocked: 1, createdAt: 1, lastLoginAt: 1,
          orderCount: { $ifNull: [{ $first: '$stats.orders' }, 0] },
          totalSpent: { $ifNull: [{ $first: '$stats.spent' }, 0] },
          lastOrderAt: { $first: '$stats.lastOrderAt' },
        },
      },
    ]),
    User.countDocuments(match),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(page, limit, total) });
});

/** GET /admin/customers/:id */
export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).lean();
  if (!customer) throw ApiError.notFound('Customer not found');
  delete customer.password;
  delete customer.tokenVersion;
  const orders = await Order.find({ user: customer._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('orderNumber pricing.total status payment.status createdAt')
    .lean();
  res.json({ success: true, data: { customer, orders } });
});

/** PATCH /admin/customers/:id/block */
export const setCustomerBlocked = asyncHandler(async (req, res) => {
  const blocked = Boolean(req.body?.isBlocked);
  const customer = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'customer' },
    // Blocking also invalidates existing sessions.
    { $set: { isBlocked: blocked }, ...(blocked && { $inc: { tokenVersion: 1 } }) },
    { new: true }
  );
  if (!customer) throw ApiError.notFound('Customer not found');
  res.json({ success: true, data: customer });
});
