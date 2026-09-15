import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../api/services.js';
import SEO from '../components/SEO.jsx';
import { CheckIcon } from '../components/ui/Icons.jsx';
import { PageLoader } from '../components/ui/index.jsx';
import { formatDate, formatPrice } from '../utils/format.js';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    orderApi.get(id).then((r) => setOrder(r.data)).catch(() => setOrder(false));
  }, [id]);

  if (order === null) return <PageLoader />;
  if (order === false) return <div className="container-page py-20 text-center">Order not found. <Link to="/account/orders" className="underline">View my orders</Link></div>;

  const eta = new Date(new Date(order.createdAt).getTime() + 5 * 86400000);

  return (
    <div className="container-page max-w-2xl py-16 text-center">
      <SEO title="Order Confirmed" noindex />
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckIcon className="h-10 w-10" strokeWidth={2.5} />
      </div>
      <h1 className="mt-6 text-5xl font-semibold">Thank you!</h1>
      <p className="mt-3 text-stone-600">
        Your order <strong className="text-ink">{order.orderNumber}</strong> has been {order.payment.method === 'cod' ? 'placed' : order.payment.status === 'paid' ? 'paid and confirmed' : 'received'}.
        A confirmation has been sent to {order.email}.
      </p>

      <div className="card mt-10 p-6 text-left">
        <div className="grid gap-4 text-sm sm:grid-cols-3">
          <div><p className="text-stone-500">Total</p><p className="font-semibold">{formatPrice(order.pricing.total, true)}</p></div>
          <div><p className="text-stone-500">Payment</p><p className="font-semibold">{order.payment.method === 'cod' ? 'Cash on delivery' : `Online · ${order.payment.status}`}</p></div>
          <div><p className="text-stone-500">Estimated delivery</p><p className="font-semibold">{formatDate(eta)}</p></div>
        </div>
        <ul className="mt-6 divide-y divide-stone-100 border-t border-stone-200">
          {order.items.map((i) => (
            <li key={`${i.product}-${i.size}-${i.color}`} className="flex items-center gap-3 py-3 text-sm">
              <img src={i.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
              <span className="flex-1">{i.name} × {i.quantity}</span>
              <span>{formatPrice(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to={`/account/orders/${order._id}`} className="btn-primary">View order</Link>
        <Link to="/shop" className="btn-outline">Continue shopping</Link>
      </div>
    </div>
  );
}
