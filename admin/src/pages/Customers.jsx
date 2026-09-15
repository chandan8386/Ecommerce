import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { customerApi } from '../api/services.js';
import { EmptyRow, Modal, PageHeader, PageLoader, Pagination, Spinner, StatusBadge } from '../components/ui.jsx';
import { formatDate, formatPrice } from '../utils/format.js';

function CustomerModal({ id, onClose, onChanged }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!id) return;
    setData(null);
    customerApi.get(id).then((r) => setData(r.data)).catch((err) => toast.error(errorMessage(err)));
  }, [id]);

  const c = data?.customer;
  return (
    <Modal open={Boolean(id)} title="Customer details" onClose={onClose} size="max-w-2xl">
      {!data ? <PageLoader /> : (
        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{c.name}</p>
              <p className="text-slate-600">{c.email}{c.phone && ` · ${c.phone}`}</p>
              <p className="text-xs text-slate-500">Joined {formatDate(c.createdAt)} · Last login {formatDate(c.lastLoginAt)}</p>
            </div>
            <button
              className={c.isBlocked ? 'btn-secondary' : 'btn-danger'}
              onClick={async () => {
                try {
                  await customerApi.setBlocked(c._id, !c.isBlocked);
                  setData({ ...data, customer: { ...c, isBlocked: !c.isBlocked } });
                  toast.success(c.isBlocked ? 'Customer unblocked' : 'Customer blocked');
                  onChanged();
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
            >
              {c.isBlocked ? 'Unblock' : 'Block customer'}
            </button>
          </div>
          {c.addresses?.length > 0 && (
            <div>
              <p className="mb-2 font-medium">Addresses</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {c.addresses.map((a) => (
                  <div key={a._id} className="rounded-lg border border-slate-200 p-3 text-slate-600">
                    <p className="font-medium text-slate-800">{a.fullName} {a.isDefault && <span className="text-xs text-brand-600">(default)</span>}</p>
                    <p>{a.line1}, {a.city}, {a.state} {a.postalCode}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 font-medium">Orders ({data.orders.length})</p>
            <table className="table">
              <thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {data.orders.length === 0 ? <EmptyRow colSpan={4} message="No orders yet" /> : data.orders.map((o) => (
                  <tr key={o._id}>
                    <td><Link to={`/orders/${o._id}`} className="text-brand-700 hover:underline" onClick={onClose}>{o.orderNumber}</Link></td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>{formatPrice(o.pricing.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Customers() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('q') || '');
  const [selected, setSelected] = useState(null);
  const query = Object.fromEntries(params.entries());

  const load = () => {
    setLoading(true);
    customerApi
      .list({ limit: 10, ...query })
      .then(setResult)
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  };
  useEffect(load, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const setParam = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  return (
    <>
      <PageHeader title="Customers" subtitle={`${result.pagination?.total ?? '…'} registered customers`} />
      <div className="panel">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <form onSubmit={(e) => { e.preventDefault(); setParam({ q: search }); }} className="flex min-w-60 flex-1 gap-2">
            <input className="input" placeholder="Search name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn-secondary">Search</button>
          </form>
          <select className="input w-auto" value={query.status || ''} onChange={(e) => setParam({ status: e.target.value })}>
            <option value="">All customers</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div className="relative overflow-x-auto">
          {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60"><Spinner /></div>}
          <table className="table">
            <thead><tr><th>Customer</th><th>Phone</th><th>Joined</th><th>Orders</th><th>Total spent</th><th>Last order</th><th>Status</th></tr></thead>
            <tbody>
              {result.data.length === 0 && !loading ? <EmptyRow colSpan={7} /> : result.data.map((c) => (
                <tr key={c._id} className="cursor-pointer" onClick={() => setSelected(c._id)}>
                  <td>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </td>
                  <td className="text-slate-600">{c.phone || '—'}</td>
                  <td className="whitespace-nowrap text-slate-500">{formatDate(c.createdAt)}</td>
                  <td>{c.orderCount}</td>
                  <td className="whitespace-nowrap font-medium">{formatPrice(c.totalSpent)}</td>
                  <td className="whitespace-nowrap text-slate-500">{formatDate(c.lastOrderAt)}</td>
                  <td>{c.isBlocked ? <span className="badge border-rose-200 bg-rose-50 text-rose-700">Blocked</span> : <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">Active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={result.pagination} onChange={(page) => setParam({ page: String(page) })} />
      </div>
      <CustomerModal id={selected} onClose={() => setSelected(null)} onChanged={load} />
    </>
  );
}
