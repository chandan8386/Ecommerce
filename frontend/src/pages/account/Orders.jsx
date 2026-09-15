import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderApi } from '../../api/services.js';
import { PackageIcon } from '../../components/ui/Icons.jsx';
import { EmptyState, PageLoader, Pagination, StatusBadge } from '../../components/ui/index.jsx';
import { formatDate, formatPrice } from '../../utils/format.js';

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const [result, setResult] = useState(null);

  useEffect(() => {
    orderApi.my(page).then(setResult).catch(() => setResult({ data: [], pagination: null }));
  }, [page]);

  if (!result) return <PageLoader />;
  if (!result.data.length) {
    return <div className="card"><EmptyState icon={<PackageIcon className="h-8 w-8" />} title="No orders yet" message="When you place an order it will appear here." action={<Link to="/shop" className="btn-primary">Start shopping</Link>} /></div>;
  }

  return (
    <div>
      <h2 className="mb-5 text-2xl font-semibold">My orders</h2>
      <ul className="space-y-4">
        {result.data.map((o) => (
          <li key={o._id}>
            <Link to={`/account/orders/${o._id}`} className="card block p-5 transition hover:border-gold-300 hover:shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{o.orderNumber}</p>
                  <p className="text-xs text-stone-500">Placed {formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} items</p>
                </div>
                <div className="flex items-center gap-3">
                  {o.status === 'pending' && o.payment.status !== 'paid' && <span className="chip border-amber-300 bg-amber-50 text-amber-800">Payment pending</span>}
                  <StatusBadge status={o.status} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-3">
                  {o.items.slice(0, 4).map((i, idx) => (
                    <img key={idx} src={i.image} alt={i.name} className="h-12 w-12 rounded-full border-2 border-white object-cover" />
                  ))}
                  {o.items.length > 4 && <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-stone-100 text-xs">+{o.items.length - 4}</span>}
                </div>
                <p className="font-semibold">{formatPrice(o.pricing.total)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination page={page} pages={result.pagination?.pages} onChange={(p) => setParams({ page: p })} />
    </div>
  );
}
