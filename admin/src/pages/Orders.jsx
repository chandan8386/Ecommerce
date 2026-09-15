import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { orderApi } from '../api/services.js';
import { EmptyRow, PageHeader, Pagination, Spinner, StatusBadge } from '../components/ui.jsx';
import { formatDateTime, formatPrice, ORDER_STATUSES, STATUS_LABELS } from '../utils/format.js';

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('q') || '');
  const query = Object.fromEntries(params.entries());

  useEffect(() => {
    setLoading(true);
    orderApi
      .list({ limit: 10, ...query })
      .then(setResult)
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const setParam = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  return (
    <>
      <PageHeader title="Orders" subtitle={`${result.pagination?.total ?? '…'} orders`} />
      <div className="panel">
        <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-slate-200 px-4 pt-3">
          {['', ...ORDER_STATUSES].map((s) => (
            <button key={s} onClick={() => setParam({ status: s })} className={`shrink-0 border-b-2 px-3 pb-3 text-sm ${(query.status || '') === s ? 'border-brand-500 font-medium text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              {s ? STATUS_LABELS[s] : 'All'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <form onSubmit={(e) => { e.preventDefault(); setParam({ q: search }); }} className="flex min-w-60 flex-1 gap-2">
            <input className="input" placeholder="Order number, email, name or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn-secondary">Search</button>
          </form>
          <select className="input w-auto" value={query.paymentStatus || ''} onChange={(e) => setParam({ paymentStatus: e.target.value })}>
            <option value="">Any payment</option>
            <option value="paid">Paid</option>
            <option value="pending">Unpaid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <input type="date" className="input w-auto" value={query.from || ''} onChange={(e) => setParam({ from: e.target.value })} aria-label="From date" />
          <input type="date" className="input w-auto" value={query.to || ''} onChange={(e) => setParam({ to: e.target.value })} aria-label="To date" />
        </div>

        <div className="relative overflow-x-auto">
          {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60"><Spinner /></div>}
          <table className="table">
            <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>
              {result.data.length === 0 && !loading ? <EmptyRow colSpan={7} message="No orders found" /> : result.data.map((o) => (
                <tr key={o._id}>
                  <td><Link to={`/orders/${o._id}`} className="font-medium text-brand-700 hover:underline">{o.orderNumber}</Link></td>
                  <td className="whitespace-nowrap text-slate-500">{formatDateTime(o.createdAt)}</td>
                  <td>
                    <p>{o.shippingAddress?.fullName}</p>
                    <p className="text-xs text-slate-500">{o.email}</p>
                  </td>
                  <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td className="whitespace-nowrap font-medium">{formatPrice(o.pricing.total)}</td>
                  <td>
                    <StatusBadge status={o.payment.status} label={`${o.payment.method === 'cod' ? 'COD' : 'Online'} · ${o.payment.status}`} />
                  </td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={result.pagination} onChange={(page) => setParam({ page: String(page) })} />
      </div>
    </>
  );
}
