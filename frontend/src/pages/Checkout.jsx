import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { orderApi, paymentApi, userApi } from '../api/services.js';
import AddressForm from '../components/AddressForm.jsx';
import SEO from '../components/SEO.jsx';
import { PageLoader } from '../components/ui/index.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/format.js';
import { payWithRazorpay } from '../utils/razorpay.js';
import { OrderSummary } from './Cart.jsx';

export default function Checkout() {
  const { user } = useAuth();
  const { cart, loading, couponCode, resetAfterOrder, refresh } = useCart();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState(null);
  const [addressId, setAddressId] = useState('');
  const [adding, setAdding] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);

  useEffect(() => {
    refresh();
    userApi.addresses().then((r) => {
      setAddresses(r.data);
      setAddressId(r.data.find((a) => a.isDefault)?._id || r.data[0]?._id || '');
      if (!r.data.length) setAdding(true);
    });
    paymentApi.config().then((r) => setPaymentConfig(r.data)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!placing && !loading && cart.items.length === 0) return <Navigate to="/cart" replace />;
  if (!addresses) return <PageLoader />;

  const saveAddress = async (body) => {
    try {
      const res = await userApi.addAddress(body);
      setAddresses(res.data);
      setAddressId(res.data[res.data.length - 1]._id);
      setAdding(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const placeOrder = async () => {
    if (!addressId) return toast.error('Please add a delivery address');
    setPlacing(true);
    let created;
    try {
      const res = await orderApi.create({ addressId, paymentMethod, couponCode: couponCode || undefined, customerNote: note || undefined });
      created = res.data;
      resetAfterOrder();

      if (paymentMethod === 'cod') {
        navigate(`/order-success/${created.order._id}`, { replace: true });
        return;
      }
      await payWithRazorpay(created.payment);
      navigate(`/order-success/${created.order._id}`, { replace: true });
    } catch (err) {
      if (created) {
        // Order exists but payment didn't complete — user can retry from the order page.
        toast.error(`${errorMessage(err)}. You can retry payment from your order.`);
        navigate(`/account/orders/${created.order._id}`, { replace: true });
      } else {
        toast.error(errorMessage(err));
        refresh();
        setPlacing(false);
      }
    }
  };

  const hasIssues = cart.issues?.length > 0;

  return (
    <div className="container-page py-10">
      <SEO title="Checkout" noindex />
      <h1 className="text-4xl font-semibold">Checkout</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          {/* Address */}
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">1. Delivery address</h2>
              {!adding && <button className="text-sm font-medium text-gold-700 hover:underline" onClick={() => setAdding(true)}>+ Add new</button>}
            </div>
            {adding ? (
              <div className="mt-5">
                <AddressForm initial={{ fullName: user.name, phone: user.phone, isDefault: addresses.length === 0 }} onSubmit={saveAddress} onCancel={addresses.length ? () => setAdding(false) : undefined} submitLabel="Use this address" />
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <label key={a._id} className={`cursor-pointer rounded-xl border-2 p-4 text-sm transition ${addressId === a._id ? 'border-gold-500 bg-gold-50/50' : 'border-stone-200 hover:border-stone-300'}`}>
                    <input type="radio" name="address" className="sr-only" checked={addressId === a._id} onChange={() => setAddressId(a._id)} />
                    <p className="font-medium">{a.fullName} <span className="ml-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] uppercase text-stone-600">{a.label}</span></p>
                    <p className="mt-1 text-stone-600">{a.line1}{a.line2 && `, ${a.line2}`}</p>
                    <p className="text-stone-600">{a.city}, {a.state} {a.postalCode}</p>
                    <p className="mt-1 text-stone-500">{a.phone}</p>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="card p-6">
            <h2 className="text-2xl font-semibold">2. Payment method</h2>
            <div className="mt-5 space-y-3">
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${paymentMethod === 'razorpay' ? 'border-gold-500 bg-gold-50/50' : 'border-stone-200'}`}>
                <input type="radio" name="pm" className="mt-1 accent-gold-600" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                <div>
                  <p className="font-medium">Pay online <span className="text-xs text-stone-500">(UPI, cards, net banking, wallets)</span></p>
                  <p className="text-sm text-stone-500">Secured by Razorpay{paymentConfig?.mock && <span className="ml-1 rounded bg-amber-100 px-1.5 text-xs text-amber-800">demo mode</span>}</p>
                </div>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${paymentMethod === 'cod' ? 'border-gold-500 bg-gold-50/50' : 'border-stone-200'}`}>
                <input type="radio" name="pm" className="mt-1 accent-gold-600" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <div>
                  <p className="font-medium">Cash on delivery</p>
                  <p className="text-sm text-stone-500">Pay when your order arrives</p>
                </div>
              </label>
            </div>
            <label className="mt-5 block">
              <span className="label">Order note (optional)</span>
              <textarea className="input" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Gift message, delivery instructions…" />
            </label>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary cart={cart}>
            <ul className="mt-5 max-h-64 space-y-3 overflow-y-auto border-t border-stone-200 pt-5">
              {cart.items.map((i) => (
                <li key={i._id} className="flex items-center gap-3 text-sm">
                  <img src={i.product.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="line-clamp-1">{i.product.name}</p>
                    <p className="text-xs text-stone-500">Qty {i.quantity}{i.size && ` · ${i.size}`}</p>
                  </div>
                  <span>{formatPrice(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            {hasIssues && <p className="mt-4 text-sm text-rose-600">Some items need attention. <Link to="/cart" className="underline">Review bag</Link></p>}
            <button className="btn-gold mt-6 w-full" disabled={placing || hasIssues || adding || !addressId} onClick={placeOrder}>
              {placing ? 'Processing…' : paymentMethod === 'cod' ? `Place Order · ${formatPrice(cart.pricing.total)}` : `Pay ${formatPrice(cart.pricing.total)}`}
            </button>
            <p className="mt-3 text-center text-xs text-stone-500">By placing your order you agree to our terms & return policy.</p>
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}
