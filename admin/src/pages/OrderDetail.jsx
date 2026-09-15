import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { orderApi } from '../api/services.js';
import { Field, PageHeader, PageLoader, StatusBadge } from '../components/ui.jsx';
import { formatDateTime, formatPrice, STATUS_LABELS, STATUS_TRANSITIONS } from '../utils/format.js';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState({ courier: '', trackingNumber: '', url: '' });
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState('');

  const apply = (o) => {
    setOrder(o);
    setStatus('');
    setNote('');
    setTracking({ courier: o.tracking?.courier || '', trackingNumber: o.tracking?.trackingNumber || '', url: o.tracking?.url || '' });
    setAdminNote(o.adminNote || '');
  };

  useEffect(() => {
    orderApi.get(id).then((r) => apply(r.data)).catch((err) => { toast.error(errorMessage(err)); setOrder(false); });
  }, [id]);

  if (order === null) return <PageLoader />;
  if (order === false) return <p className="panel p-6">Order not found. <Link to="/orders" className="underline">Back</Link></p>;

  const nextStatuses = STATUS_TRANSITIONS[order.status] || [];
  const needsTracking = ['shipped', 'out_for_delivery'].includes(status);

  const updateStatus = async (e) => {
    e.preventDefault();
    if (!status) return;
    if (['cancelled', 'returned'].includes(status) && !window.confirm(`Mark this order as ${STATUS_LABELS[status]}? Stock will be restored${order.payment.status === 'paid' && order.payment.method === 'razorpay' ? ' and a refund will be issued' : ''}.`)) return;
    setSaving('status');
    try {
      const body = { status, note: note || undefined };
      if (needsTracking || tracking.trackingNumber) body.tracking = tracking;
      const res = await orderApi.updateStatus(order._id, body);
      apply(res.data);
      toast.success(`Order marked as ${STATUS_LABELS[status]}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving('');
    }
  };

  const saveNote = async () => {
    setSaving('note');
    try {
      await orderApi.updateNote(order._id, adminNote);
      toast.success('Note saved');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving('');
    }
  };

  const p = order.pricing;
  const a = order.shippingAddress;

  return (
    <>
      <Link to="/orders" className="text-sm text-slate-500 hover:text-slate-800">← Orders</Link>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        subtitle={`Placed ${formatDateTime(order.createdAt)}`}
        actions={<><StatusBadge status={order.status} /><StatusBadge status={order.payment.status} label={`Payment: ${order.payment.status}`} /></>}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="panel overflow-hidden">
            <h2 className="px-5 py-4 font-semibold">Items</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Product</th><th>Options</th><th>Price</th><th>Qty</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {order.items.map((i, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="flex items-center gap-3">
                          <img src={i.image} alt="" className="h-11 w-11 rounded object-cover" />
                          <div>
                            <Link to={`/products/${i.product}/edit`} className="font-medium hover:text-brand-700">{i.name}</Link>
                            <p className="text-xs text-slate-500">{i.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-600">{[i.color, i.size].filter(Boolean).join(' / ') || '—'}</td>
                      <td>{formatPrice(i.price)}</td>
                      <td>{i.quantity}</td>
                      <td className="text-right font-medium">{formatPrice(i.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto max-w-xs space-y-1.5 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatPrice(p.subtotal)}</dd></div>
              {p.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount ({order.coupon?.code})</dt><dd>−{formatPrice(p.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{formatPrice(p.shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Tax</dt><dd>{formatPrice(p.tax)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(p.total)}</dd></div>
            </dl>
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 font-semibold">Status history</h2>
            <ol className="relative space-y-4 border-l border-slate-200 pl-6">
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white ${i === 0 ? 'bg-brand-500' : 'bg-slate-300'}`} />
                  <p className="text-sm font-medium">{STATUS_LABELS[h.status] || h.status}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(h.at)}</p>
                  {h.note && <p className="mt-1 text-sm text-slate-600">{h.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="mb-4 font-semibold">Update status</h2>
            {nextStatuses.length === 0 ? (
              <p className="text-sm text-slate-500">This order is {STATUS_LABELS[order.status].toLowerCase()} — no further changes.</p>
            ) : (
              <form onSubmit={updateStatus} className="space-y-3">
                <Field label="New status">
                  <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} required>
                    <option value="">Select…</option>
                    {nextStatuses.map((s) => (
                      <option key={s} value={s} disabled={s === 'confirmed' && order.payment.method === 'razorpay' && order.payment.status !== 'paid'}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </Field>
                {(needsTracking || order.tracking?.trackingNumber) && (
                  <>
                    <Field label="Courier"><input className="input" value={tracking.courier} onChange={(e) => setTracking({ ...tracking, courier: e.target.value })} placeholder="BlueDart, Delhivery…" /></Field>
                    <Field label="Tracking number"><input className="input" value={tracking.trackingNumber} onChange={(e) => setTracking({ ...tracking, trackingNumber: e.target.value })} /></Field>
                    <Field label="Tracking URL"><input type="url" className="input" value={tracking.url} onChange={(e) => setTracking({ ...tracking, url: e.target.value })} placeholder="https://" /></Field>
                  </>
                )}
                <Field label="Note (visible to customer)"><textarea className="input" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
                <button className="btn-brand w-full" disabled={!status || saving === 'status'}>{saving === 'status' ? 'Updating…' : 'Update status'}</button>
              </form>
            )}
          </section>

          <section className="panel space-y-1 p-5 text-sm">
            <h2 className="mb-3 font-semibold">Customer</h2>
            <p className="font-medium">{order.user?.name || a.fullName}</p>
            <p className="text-slate-600">{order.email}</p>
            {order.user?.phone && <p className="text-slate-600">{order.user.phone}</p>}
            <h3 className="pt-4 font-semibold">Shipping address</h3>
            <p>{a.fullName}</p>
            <p className="text-slate-600">{a.line1}{a.line2 && `, ${a.line2}`}</p>
            <p className="text-slate-600">{a.city}, {a.state} {a.postalCode}</p>
            <p className="text-slate-600">{a.country} · {a.phone}</p>
            {order.customerNote && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-amber-900">Customer note: {order.customerNote}</p>}
          </section>

          <section className="panel space-y-1.5 p-5 text-sm">
            <h2 className="mb-3 font-semibold">Payment</h2>
            <div className="flex justify-between"><span className="text-slate-500">Method</span><span>{order.payment.method === 'cod' ? 'Cash on delivery' : 'Razorpay'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={order.payment.status} label={order.payment.status} /></div>
            {order.payment.razorpayOrderId && <div className="flex justify-between gap-2"><span className="text-slate-500">Gateway order</span><span className="truncate font-mono text-xs">{order.payment.razorpayOrderId}</span></div>}
            {order.payment.razorpayPaymentId && <div className="flex justify-between gap-2"><span className="text-slate-500">Payment ID</span><span className="truncate font-mono text-xs">{order.payment.razorpayPaymentId}</span></div>}
            {order.payment.paidAt && <div className="flex justify-between"><span className="text-slate-500">Paid at</span><span>{formatDateTime(order.payment.paidAt)}</span></div>}
            {order.payment.failureReason && <p className="text-xs text-rose-600">Last failure: {order.payment.failureReason}</p>}
          </section>

          <section className="panel p-5">
            <h2 className="mb-3 font-semibold">Internal note</h2>
            <textarea className="input" rows={3} maxLength={1000} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Only visible to admins" />
            <button className="btn-secondary mt-2 w-full" onClick={saveNote} disabled={saving === 'note'}>{saving === 'note' ? 'Saving…' : 'Save note'}</button>
          </section>
        </div>
      </div>
    </>
  );
}
