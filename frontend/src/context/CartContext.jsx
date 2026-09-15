import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../api/client.js';
import { cartApi } from '../api/services.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
const GUEST_KEY = 'aurum_guest_cart';
const COUPON_KEY = 'aurum_coupon';

const EMPTY = { items: [], itemCount: 0, pricing: { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 }, coupon: null, couponError: null, issues: [] };

const readGuest = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
  } catch {
    return [];
  }
};

/** Guest carts are priced locally for display only; the server re-prices everything at checkout. */
const guestSummary = (lines) => {
  const items = lines.map((l) => ({ ...l, lineTotal: l.product.price * l.quantity }));
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return { ...EMPTY, items, itemCount: items.reduce((n, i) => n + i.quantity, 0), pricing: { ...EMPTY.pricing, subtotal, total: subtotal, estimated: true } };
};

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState(() => localStorage.getItem(COUPON_KEY) || '');
  const couponRef = useRef(couponCode);
  couponRef.current = couponCode;

  const saveCoupon = (code) => {
    setCouponCode(code);
    if (code) localStorage.setItem(COUPON_KEY, code);
    else localStorage.removeItem(COUPON_KEY);
  };

  const applyServerCart = useCallback((res) => {
    setCart(res.data);
    // Drop a stored coupon that's no longer valid so it doesn't keep erroring.
    if (couponRef.current && res.data.couponError) saveCoupon('');
    return res.data;
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return setCart(guestSummary(readGuest()));
    setLoading(true);
    try {
      applyServerCart(await cartApi.get(couponRef.current || undefined));
    } catch {
      /* keep previous state */
    } finally {
      setLoading(false);
    }
  }, [user, applyServerCart]);

  // On login: merge the guest cart into the account cart.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCart(guestSummary(readGuest()));
      return;
    }
    const guest = readGuest();
    (async () => {
      if (guest.length) {
        try {
          await cartApi.merge(guest.map((l) => ({ productId: l.product._id, quantity: l.quantity, size: l.size, color: l.color })));
          localStorage.removeItem(GUEST_KEY);
        } catch {
          /* ignore merge failures */
        }
      }
      refresh();
    })();
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const writeGuest = (lines) => {
    localStorage.setItem(GUEST_KEY, JSON.stringify(lines));
    setCart(guestSummary(lines));
  };

  const addItem = async (product, { quantity = 1, size = '', color = '' } = {}) => {
    if (user) {
      try {
        applyServerCart(await cartApi.add({ productId: product._id, quantity, size, color }, couponRef.current || undefined));
        toast.success('Added to bag');
        return true;
      } catch (err) {
        toast.error(errorMessage(err));
        return false;
      }
    }
    const lines = readGuest();
    const existing = lines.find((l) => l.product._id === product._id && l.size === size && l.color === color);
    const nextQty = (existing?.quantity || 0) + quantity;
    if (nextQty > product.stock) {
      toast.error(`Only ${product.stock} available`);
      return false;
    }
    if (existing) existing.quantity = Math.min(nextQty, 20);
    else
      lines.push({
        _id: `${product._id}-${size}-${color}`,
        product: { _id: product._id, name: product.name, slug: product.slug, price: product.price, compareAtPrice: product.compareAtPrice, stock: product.stock, material: product.material, image: product.images?.[0]?.url || product.image || '' },
        quantity,
        size,
        color,
      });
    writeGuest(lines);
    toast.success('Added to bag');
    return true;
  };

  const updateQuantity = async (itemId, quantity) => {
    if (user) {
      try {
        applyServerCart(await cartApi.update(itemId, quantity, couponRef.current || undefined));
      } catch (err) {
        toast.error(errorMessage(err));
      }
      return;
    }
    const lines = readGuest().map((l) => (l._id === itemId ? { ...l, quantity: Math.min(quantity, l.product.stock, 20) } : l));
    writeGuest(lines);
  };

  const removeItem = async (itemId) => {
    if (user) {
      try {
        applyServerCart(await cartApi.remove(itemId, couponRef.current || undefined));
      } catch (err) {
        toast.error(errorMessage(err));
      }
      return;
    }
    writeGuest(readGuest().filter((l) => l._id !== itemId));
  };

  const applyCoupon = async (code) => {
    const res = await cartApi.get(code);
    if (res.data.couponError) throw new Error(res.data.couponError);
    saveCoupon(res.data.coupon.code);
    setCart(res.data);
    return res.data.coupon;
  };

  const removeCoupon = async () => {
    saveCoupon('');
    if (user) applyServerCart(await cartApi.get());
  };

  const resetAfterOrder = () => {
    saveCoupon('');
    setCart(EMPTY);
  };

  const value = useMemo(
    () => ({ cart, loading, couponCode, addItem, updateQuantity, removeItem, applyCoupon, removeCoupon, refresh, resetAfterOrder }),
    [cart, loading, couponCode, user] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
