import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardApi } from '../api/services.js';
import { PageHeader, PageLoader, StatCard, StatusBadge } from '../components/ui.jsx';
import { formatCompact, formatDate, formatNumber, formatPrice, STATUS_LABELS } from '../utils/format.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardApi.get().then((r) => setData(r.data)).catch(() => setError(true));
  }, []);

  if (error) return <p className="panel p-6 text-rose-600">Failed to load dashboard.</p>;
  if (!data) return <PageLoader />;
  const { stats, salesSeries, recentOrders, lowStock, topProducts, ordersByStatus } = data;
  const statusTotal = Object.values(ordersByStatus).reduce((a, b) => a + b, 0) || 1;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your store performance" actions={<Link to="/reports" className="btn-secondary">Full reports</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={formatPrice(stats.totalRevenue)} sub={`${formatCompact(stats.last30Revenue)} last 30 days`} trend={stats.revenueGrowth} />
        <StatCard label="Orders" value={formatNumber(stats.totalOrders)} sub={`${stats.todayOrders} today · ${stats.last30Orders} in 30 days`} trend={stats.ordersGrowth} />
        <StatCard label="Customers" value={formatNumber(stats.totalCustomers)} sub={`+${stats.newCustomers} in 30 days`} />
        <StatCard label="Products" value={formatNumber(stats.totalProducts)} sub={`${stats.outOfStock} out of stock`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="panel p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Revenue — last 30 days</h2>
              <p className="text-xs text-slate-500">Today: {formatPrice(stats.todayRevenue)} · AOV {formatPrice(stats.averageOrderValue)}</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesSeries} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b8862b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#b8862b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={60} />
                <Tooltip formatter={(v, n) => (n === 'revenue' ? [formatPrice(v), 'Revenue'] : [v, 'Orders'])} labelFormatter={formatDate} />
                <Area type="monotone" dataKey="revenue" stroke="#b8862b" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-4 font-semibold">Orders by status</h2>
          <ul className="space-y-3">
            {Object.keys(STATUS_LABELS).map((s) => (
              <li key={s}>
                <div className="mb-1 flex justify-between text-sm">
                  <Link to={`/orders?status=${s}`} className="hover:underline">{STATUS_LABELS[s]}</Link>
                  <span className="text-slate-500">{ordersByStatus[s] || 0}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-brand-400" style={{ width: `${((ordersByStatus[s] || 0) / statusTotal) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="panel overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-semibold">Recent orders</h2>
            <Link to="/orders" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td><Link to={`/orders/${o._id}`} className="font-medium text-brand-700 hover:underline">{o.orderNumber}</Link></td>
                    <td>{o.shippingAddress?.fullName}</td>
                    <td className="whitespace-nowrap text-slate-500">{formatDate(o.createdAt)}</td>
                    <td>{formatPrice(o.pricing.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Low stock</h2>
              <Link to="/inventory?status=low_stock" className="text-sm text-brand-600 hover:underline">Manage</Link>
            </div>
            {lowStock.length === 0 ? <p className="text-sm text-slate-500">All products are well stocked.</p> : (
              <ul className="space-y-3">
                {lowStock.map((p) => (
                  <li key={p._id} className="flex items-center gap-3 text-sm">
                    <img src={p.images?.[0]?.url} alt="" className="h-9 w-9 rounded object-cover" />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="badge border-amber-200 bg-amber-50 text-amber-700">{p.stock} left</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="panel p-5">
            <h2 className="mb-3 font-semibold">Top sellers</h2>
            <ul className="space-y-3">
              {topProducts.map((p, i) => (
                <li key={p._id} className="flex items-center gap-3 text-sm">
                  <span className="w-4 text-slate-400">{i + 1}</span>
                  <img src={p.image} alt="" className="h-9 w-9 rounded object-cover" />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-slate-500">{p.quantity} sold</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
