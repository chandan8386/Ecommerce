import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { errorMessage } from '../api/client.js';
import { dashboardApi } from '../api/services.js';
import { PageHeader, PageLoader, Pagination, StatCard } from '../components/ui.jsx';

const PAGE_SIZE = 10;
import { downloadCsv, formatCompact, formatNumber, formatPrice, STATUS_LABELS, toDateInput } from '../utils/format.js';

const PIE_COLORS = ['#b8862b', '#334155', '#94a3b8', '#d4a53c', '#64748b', '#e2e8f0'];

const PRESETS = [
  ['7d', 'Last 7 days', 6, 'day'],
  ['30d', 'Last 30 days', 29, 'day'],
  ['90d', 'Last 90 days', 89, 'week'],
  ['12m', 'Last 12 months', 364, 'month'],
];

export default function Reports() {
  const today = new Date();
  const [range, setRange] = useState({ from: toDateInput(new Date(today.getTime() - 29 * 86400000)), to: toDateInput(today), groupBy: 'day' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seriesPage, setSeriesPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setSeriesPage(1);
    dashboardApi
      .salesReport(range)
      .then((r) => setData(r.data))
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [range]);

  const preset = (days, groupBy) => setRange({ from: toDateInput(new Date(Date.now() - days * 86400000)), to: toDateInput(new Date()), groupBy });

  const exportCsv = () => {
    if (!data?.series.length) return toast.error('Nothing to export');
    downloadCsv(`sales-${range.from}-to-${range.to}.csv`, data.series.map((s) => ({
      period: s.period, orders: s.orders, items: s.items, subtotal: s.subtotal, discount: s.discount, shipping: s.shipping, tax: s.tax, revenue: s.revenue,
    })));
  };

  return (
    <>
      <PageHeader title="Sales reports" subtitle="Revenue counts confirmed, processing, shipped and delivered orders" actions={<button className="btn-secondary" onClick={exportCsv}>Export CSV</button>} />

      <div className="panel mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="flex flex-wrap gap-1">
          {PRESETS.map(([key, label, days, g]) => (
            <button key={key} className="btn-secondary px-3 py-1.5 text-xs" onClick={() => preset(days, g)}>{label}</button>
          ))}
        </div>
        <label className="text-sm"><span className="label">From</span><input type="date" className="input" value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label>
        <label className="text-sm"><span className="label">To</span><input type="date" className="input" value={range.to} min={range.from} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label>
        <label className="text-sm"><span className="label">Group by</span>
          <select className="input" value={range.groupBy} onChange={(e) => setRange({ ...range, groupBy: e.target.value })}>
            <option value="day">Day</option><option value="week">Week</option><option value="month">Month</option>
          </select>
        </label>
      </div>

      {loading || !data ? <PageLoader /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue" value={formatPrice(data.totals.revenue)} sub={`Tax ${formatCompact(data.totals.tax)} · Shipping ${formatCompact(data.totals.shipping)}`} />
            <StatCard label="Orders" value={formatNumber(data.totals.orders)} sub={`${formatNumber(data.totals.items)} items sold`} />
            <StatCard label="Average order value" value={formatPrice(data.totals.averageOrderValue)} sub={`${data.totals.customers} unique customers`} />
            <StatCard label="Discounts given" value={formatPrice(data.totals.discount)} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <section className="panel p-5 xl:col-span-2">
              <h2 className="mb-4 font-semibold">Revenue & orders</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={16} />
                    <YAxis yAxisId="rev" tickFormatter={formatCompact} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={60} />
                    <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v, n) => (n === 'Revenue' ? formatPrice(v) : v)} />
                    <Legend />
                    <Line yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#b8862b" strokeWidth={2} dot={false} />
                    <Line yAxisId="ord" type="monotone" dataKey="orders" name="Orders" stroke="#334155" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="panel p-5">
              <h2 className="mb-4 font-semibold">Payment methods</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.paymentMethods} dataKey="revenue" nameKey="method" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {data.paymentMethods.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatPrice(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {data.paymentMethods.map((m, i) => (
                  <li key={m.method} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1">{m.method === 'cod' ? 'Cash on delivery' : 'Online (Razorpay)'}</span>
                    <span className="text-slate-500">{m.orders} · {formatCompact(m.revenue)}</span>
                  </li>
                ))}
              </ul>
              <h3 className="mb-2 mt-6 font-semibold">Order statuses in range</h3>
              <ul className="space-y-1 text-sm">
                {Object.entries(data.statusBreakdown).map(([s, n]) => (
                  <li key={s} className="flex justify-between"><span>{STATUS_LABELS[s] || s}</span><span className="text-slate-500">{n}</span></li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <section className="panel p-5">
              <h2 className="mb-4 font-semibold">Revenue by category</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topCategories} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tickFormatter={formatCompact} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 12, fill: '#334155' }} />
                    <Tooltip formatter={(v) => formatPrice(v)} />
                    <Bar dataKey="revenue" name="Revenue" fill="#b8862b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="panel overflow-hidden">
              <h2 className="px-5 py-4 font-semibold">Top products</h2>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>#</th><th>Product</th><th>Units</th><th className="text-right">Revenue</th></tr></thead>
                  <tbody>
                    {data.topProducts.map((p, i) => (
                      <tr key={p._id}>
                        <td className="text-slate-400">{i + 1}</td>
                        <td><p className="max-w-xs truncate">{p.name}</p><p className="text-xs text-slate-500">{p.sku}</p></td>
                        <td>{p.quantity}</td>
                        <td className="text-right font-medium">{formatPrice(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="panel mt-6 overflow-hidden">
            <h2 className="px-5 py-4 font-semibold">Breakdown by {range.groupBy}</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Period</th><th>Orders</th><th>Items</th><th>Subtotal</th><th>Discount</th><th>Shipping</th><th>Tax</th><th className="text-right">Revenue</th></tr></thead>
                <tbody>
                  {data.series.slice((seriesPage - 1) * PAGE_SIZE, seriesPage * PAGE_SIZE).map((s) => (
                    <tr key={s.period}>
                      <td>{s.period}</td><td>{s.orders}</td><td>{s.items}</td><td>{formatPrice(s.subtotal)}</td><td>{formatPrice(s.discount)}</td><td>{formatPrice(s.shipping)}</td><td>{formatPrice(s.tax)}</td>
                      <td className="text-right font-medium">{formatPrice(s.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={{ page: seriesPage, pages: Math.max(1, Math.ceil(data.series.length / PAGE_SIZE)), total: data.series.length, limit: PAGE_SIZE }}
              onChange={setSeriesPage}
            />
          </section>
        </>
      )}
    </>
  );
}
