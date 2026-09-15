import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import { errorMessage } from '../../api/client.js';
import { orderApi, paymentApi } from '../../api/services.js';
import OrderTimeline from '../../components/OrderTimeline.jsx';
import { PageLoader, StatusBadge } from '../../components/ui/index.jsx';
import { formatDateTime, formatPrice } from '../../utils/format.js';
import { payWithRazorpay } from '../../utils/razorpay.js';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => orderApi.get(id).then((r) => setOrder(r.data)).catch(() => setOrder(false)), [id]);
  useEffect(() => {
    load();
  }, [load]);

  if (order === null) return <PageLoader />;
  if (order === false) return <p className="card p-6">Order not found. <Link to="/account/orders" className="underline">Back to orders</Link></p>;

  const canPay = order.status === 'pending' && order.payment.method === 'razorpay' && order.payment.status !== 'paid';
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);

  const retryPayment = async () => {
    setBusy('pay');
    try {
      const res = await paymentApi.retry(order._id);
      await payWithRazorpay(res.data);
      toast.success('Payment successful — your order is confirmed');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy('');
      load();
    }
  };

  const cancel = async () => {
    const reason = window.prompt('Why are you cancelling? (optional)');
    if (reason === null) return;
    setBusy('cancel');
    try {
      const res = await orderApi.cancel(order._id, reason);
      setOrder((o) => ({ ...o, ...res.data }));
      toast.success(order.payment.status === 'paid' ? 'Order cancelled. Your refund has been initiated.' : 'Order cancelled');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy('');
    }
  };

  const p = order.pricing;
  const a = order.shippingAddress;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/account/orders" className="text-sm text-stone-500 hover:text-ink">← All orders</Link>
          <h2 className="mt-1 text-3xl font-semibold">{order.orderNumber}</h2>
          <p className="text-sm text-stone-500">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {canPay && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="text-sm text-amber-900">
            <p className="font-medium">Payment not completed</p>
            <p>{order.expiresAt ? `Complete payment before ${formatDateTime(order.expiresAt)} or the order will be cancelled.` : 'Complete payment to confirm your order.'}</p>
            {order.payment.failureReason && <p className="mt-1 text-xs text-amber-700">Last attempt: {order.payment.failureReason}</p>}
          </div>
          <button className="btn-gold" onClick={retryPayment} disabled={busy === 'pay'}>{busy === 'pay' ? 'Opening…' : `Pay ${formatPrice(p.total)}`}</button>
        </div>
      )}

      <section className="card p-6">
        <h3 className="mb-6 text-xl font-semibold">Order status</h3>
        <OrderTimeline order={order} />
        {order.tracking?.trackingNumber && (
          <p className="mt-6 rounded-xl bg-stone-50 p-4 text-sm">
            {order.tracking.courier} · Tracking no. <strong>{order.tracking.trackingNumber}</strong>
            {order.tracking.url && <> · <a href={order.tracking.url} target="_blank" rel="noreferrer" className="text-gold-700 underline">Track shipment</a></>}
          </p>
        )}
      </section>

      <section className="card p-6">
        <h3 className="text-xl font-semibold">Items</h3>
        <ul className="mt-4 divide-y divide-stone-100">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex gap-4 py-4">
              <img src={i.image} alt={i.name} className="h-20 w-20 rounded-xl object-cover" />
              <div className="flex-1 text-sm">
                <Link to={`/product/${i.slug}`} className="font-medium hover:text-gold-700">{i.name}</Link>
                <p className="mt-1 text-xs text-stone-500">{[i.color, i.size && `Size ${i.size}`, `Qty ${i.quantity}`].filter(Boolean).join(' · ')}</p>
                <p className="mt-1 text-stone-500">{formatPrice(i.price)} each</p>
              </div>
              <p className="font-medium">{formatPrice(i.lineTotal)}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6 text-sm">
          <h3 className="mb-3 text-xl font-semibold">Delivery address</h3>
          <p className="font-medium">{a.fullName}</p>
          <p className="text-stone-600">{a.line1}{a.line2 && `, ${a.line2}`}</p>
          <p className="text-stone-600">{a.city}, {a.state} {a.postalCode}</p>
          <p className="text-stone-600">{a.country}</p>
          <p className="mt-1 text-stone-500">{a.phone}</p>
          {order.customerNote && <p className="mt-3 rounded-lg bg-stone-50 p-3 text-stone-600">Note: {order.customerNote}</p>}
        </section>
        <section className="card p-6 text-sm">
          <h3 className="mb-3 text-xl font-semibold">Payment</h3>
          <dl className="space-y-2">
            <div className="flex justify-between"><dt className="text-stone-500">Method</dt><dd>{order.payment.method === 'cod' ? 'Cash on delivery' : 'Online (Razorpay)'}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">Status</dt><dd className="capitalize">{order.payment.status}</dd></div>
            <div className="flex justify-between border-t border-stone-100 pt-2"><dt className="text-stone-500">Subtotal</dt><dd>{formatPrice(p.subtotal, true)}</dd></div>
            {p.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {order.coupon?.code && `(${order.coupon.code})`}</dt><dd>−{formatPrice(p.discount, true)}</dd></div>}
            <div className="flex justify-between"><dt className="text-stone-500">Shipping</dt><dd>{p.shipping ? formatPrice(p.shipping, true) : 'Free'}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">GST</dt><dd>{formatPrice(p.tax, true)}</dd></div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(p.total, true)}</dd></div>
          </dl>
        </section>
      </div>

      {canCancel && (
        <div className="text-right">
          <button onClick={cancel} disabled={busy === 'cancel'} className="text-sm text-rose-600 underline-offset-4 hover:underline">{busy === 'cancel' ? 'Cancelling…' : 'Cancel this order'}</button>
        </div>
      )}
    </div>
  );
}
