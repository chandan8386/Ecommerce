import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { wishlistApi } from '../api/services.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const refresh = useCallback(async () => {
    if (!user) return setItems([]);
    setLoading(true);
    try {
      setItems((await wishlistApi.get()).data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const ids = useMemo(() => new Set(items.map((p) => p._id)), [items]);

  const toggle = async (product) => {
    if (!user) {
      toast('Sign in to save items to your wishlist', { icon: '♡' });
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    try {
      const inList = ids.has(product._id);
      const res = inList ? await wishlistApi.remove(product._id) : await wishlistApi.add(product._id);
      setItems(res.data);
      toast.success(inList ? 'Removed from wishlist' : 'Saved to wishlist');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const value = useMemo(() => ({ items, ids, loading, toggle, refresh }), [items, ids, loading, refresh]); // eslint-disable-line react-hooks/exhaustive-deps
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
