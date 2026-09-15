import { useState } from 'react';
import { errorMessage } from '../api/client.js';
import { orderApi } from '../api/services.js';
import OrderTimeline from '../components/OrderTimeline.jsx';
import SEO from '../components/SEO.jsx';
import { Field, StatusBadge } from '../components/ui/index.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, formatPrice } from '../utils/format.js';

export default function TrackOrder() {
  const { user } = useAuth();
  const [form, setForm] = useState({ orderNumber: '', email: user?.email || '' });
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setOrder(null);
    try {
      setOrder((await orderApi.track(form.orderNumber.trim(), form.email.trim())).data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page max-w-3xl py-12">
      <SEO title="Track Your Order" description="Track the delivery status of your Aurum Jewelry order." />
      <h1 className="text-center text-5xl font-semibold">Track your order</h1>
      <p className="mt-3 text-center text-stone-600">Enter your order number and the email used at checkout.</p>

      <form onSubmit={submit} className="card mt-8 grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Order number"><input className="input uppercase" required placeholder="AUR-20260101-ABC123" value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} /></Field>
        <Field label="Email"><input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <button className="btn-primary" disabled={busy}>{busy ? 'Searching…' : 'Track'}</button>
      </form>

      {error && <p className="mt-6 rounded-lg bg-rose-50 p-4 text-center text-sm text-rose-700">{error}</p>}

      {order && (
        <div className="card mt-8 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-stone-500">Order {order.orderNumber}</p>
              <p className="text-sm text-stone-500">Placed {formatDate(order.createdAt)} · {formatPrice(order.pricing.total)}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <div className="mt-8"><OrderTimeline order={order} /></div>
          {order.tracking?.trackingNumber && (
            <p className="mt-8 rounded-xl bg-stone-50 p-4 text-sm">
              Shipped via <strong>{order.tracking.courier}</strong> · Tracking no. <strong>{order.tracking.trackingNumber}</strong>
              {order.tracking.url && <> · <a href={order.tracking.url} target="_blank" rel="noreferrer" className="text-gold-700 underline">Track with courier</a></>}
            </p>
          )}
          <ul className="mt-6 flex flex-wrap gap-3">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex items-center gap-2 rounded-lg border border-stone-200 p-2 pr-3 text-sm">
                <img src={i.image} alt="" className="h-10 w-10 rounded object-cover" />{i.name} × {i.quantity}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
