import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { couponApi } from '../api/services.js';
import SEO from '../components/SEO.jsx';
import { BagIcon, TagIcon, TrashIcon } from '../components/ui/Icons.jsx';
import { EmptyState, PageLoader, QuantitySelector } from '../components/ui/index.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/format.js';

export function OrderSummary({ cart, children }) {
  const p = cart.pricing;
  return (
    <div className="card p-6">
      <h2 className="text-2xl font-semibold">Order Summary</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between"><dt className="text-stone-600">Subtotal ({cart.itemCount} items)</dt><dd>{formatPrice(p.subtotal, true)}</dd></div>
        {p.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {cart.coupon && `(${cart.coupon.code})`}</dt><dd>−{formatPrice(p.discount, true)}</dd></div>}
        {p.estimated ? (
          <div className="flex justify-between text-stone-500"><dt>Shipping & taxes</dt><dd>Calculated at checkout</dd></div>
        ) : (
          <>
            <div className="flex justify-between"><dt className="text-stone-600">Shipping</dt><dd>{p.shipping === 0 ? <span className="text-emerald-700">Free</span> : formatPrice(p.shipping, true)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-600">GST ({p.taxRate ?? 3}%)</dt><dd>{formatPrice(p.tax, true)}</dd></div>
          </>
        )}
        <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(p.total, true)}</dd></div>
      </dl>
      {!p.estimated && p.shipping > 0 && p.freeShippingThreshold > 0 && (
        <p className="mt-3 rounded-lg bg-gold-50 px-3 py-2 text-xs text-gold-800">Add {formatPrice(p.freeShippingThreshold - (p.subtotal - p.discount))} more for free shipping</p>
      )}
      {children}
    </div>
  );
}

function CouponBox() {
  const { user } = useAuth();
  const { cart, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState([]);

  useEffect(() => {
    couponApi.available().then((r) => setAvailable(r.data)).catch(() => {});
  }, []);

  const apply = async (value = code) => {
    if (!user) return toast('Sign in to apply coupons', { icon: '🔒' });
    if (!value.trim()) return;
    setBusy(true);
    try {
      const c = await applyCoupon(value.trim().toUpperCase());
      toast.success(`${c.code} applied — you saved ${formatPrice(c.discount)}`);
      setCode('');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (cart.coupon) {
    return (
      <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-emerald-800"><TagIcon className="h-4 w-4" /><strong>{cart.coupon.code}</strong> applied</span>
        <button onClick={removeCoupon} className="text-xs text-stone-600 underline">Remove</button>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <form onSubmit={(e) => { e.preventDefault(); apply(); }} className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="input uppercase" aria-label="Coupon code" />
        <button className="btn-outline px-4 py-2" disabled={busy}>{busy ? '…' : 'Apply'}</button>
      </form>
      {available.length > 0 && (
        <div className="mt-3 space-y-2">
          {available.map((c) => (
            <button key={c.code} onClick={() => apply(c.code)} className="flex w-full items-center justify-between rounded-lg border border-dashed border-gold-300 px-3 py-2 text-left text-xs hover:bg-gold-50">
              <span><strong className="text-gold-700">{c.code}</strong> <span className="text-stone-600">— {c.description}</span></span>
              <span className="text-gold-700">Apply</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Cart() {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (loading && !cart.items.length) return <PageLoader />;
  if (!cart.items.length) {
    return (
      <>
        <SEO title="Shopping Bag" noindex />
        <EmptyState icon={<BagIcon className="h-8 w-8" />} title="Your bag is empty" message="Discover pieces you'll love and add them to your bag." action={<Link to="/shop" className="btn-primary">Start shopping</Link>} />
      </>
    );
  }

  const issueFor = (id) => cart.issues?.find((i) => String(i.itemId) === String(id));
  const hasIssues = cart.issues?.length > 0;

  return (
    <div className="container-page py-10">
      <SEO title="Shopping Bag" noindex />
      <h1 className="text-4xl font-semibold">Shopping Bag</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-stone-200 border-y border-stone-200">
          {cart.items.map((item) => {
            const issue = issueFor(item._id);
            return (
              <li key={item._id} className="flex gap-4 py-6">
                <Link to={`/product/${item.product.slug}`} className="shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="h-28 w-28 rounded-xl object-cover sm:h-32 sm:w-32" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link to={`/product/${item.product.slug}`} className="font-medium hover:text-gold-700">{item.product.name}</Link>
                      <p className="mt-1 text-xs text-stone-500">
                        {[item.product.material, item.color, item.size && `Size ${item.size}`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <p className="font-semibold">{formatPrice(item.lineTotal)}</p>
                  </div>
                  <p className="mt-1 text-sm text-stone-500">{formatPrice(item.product.price)} each</p>
                  {issue && <p className="mt-2 text-sm text-rose-600">{issue.message}</p>}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <QuantitySelector value={item.quantity} max={Math.min(item.product.stock, 20)} onChange={(q) => updateQuantity(item._id, q)} />
                    <button onClick={() => removeItem(item._id)} className="flex items-center gap-1 text-sm text-stone-500 hover:text-rose-600">
                      <TrashIcon className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary cart={cart}>
            <CouponBox />
            <button
              className="btn-primary mt-6 w-full"
              disabled={hasIssues}
              onClick={() => (user ? navigate('/checkout') : navigate('/login', { state: { from: '/checkout' } }))}
            >
              {user ? 'Proceed to Checkout' : 'Sign in to Checkout'}
            </button>
            {hasIssues && <p className="mt-2 text-center text-xs text-rose-600">Please resolve the issues above to continue</p>}
            <Link to="/shop" className="mt-3 block text-center text-sm text-stone-600 underline-offset-4 hover:underline">Continue shopping</Link>
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}
