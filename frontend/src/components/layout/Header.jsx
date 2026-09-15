import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { catalogApi } from '../../api/services.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { formatPrice } from '../../utils/format.js';
import { BagIcon, ChevronDown, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../ui/Icons.jsx';

function SearchBox({ onDone, autoFocus }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return setResults([]);
    const t = setTimeout(() => {
      catalogApi.suggest(term).then((r) => setResults(r.data)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
    onDone?.();
  };

  return (
    <form onSubmit={submit} className="relative w-full" role="search">
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        type="search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search rings, diamonds, gold…"
        className="input rounded-full pl-10"
        aria-label="Search products"
      />
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
          {results.map((p) => (
            <li key={p._id}>
              <Link to={`/product/${p.slug}`} onClick={() => { setOpen(false); setQ(''); onDone?.(); }} className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50">
                <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <span className="flex-1 truncate text-sm">{p.name}</span>
                <span className="text-sm font-medium">{formatPrice(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { ids } = useWishlist();
  const [categories, setCategories] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const location = useLocation();
  const accountRef = useRef(null);

  useEffect(() => {
    catalogApi.categories(true).then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const close = (e) => accountRef.current && !accountRef.current.contains(e.target) && setAccountOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const Badge = ({ n }) =>
    n > 0 ? <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-semibold text-white">{n > 99 ? '99+' : n}</span> : null;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-cream/95 backdrop-blur">
      <div className="bg-ink py-2 text-center text-xs tracking-wide text-gold-100">
        Free insured shipping above ₹999 · BIS hallmarked gold · 15-day returns
      </div>
      <div className="container-page flex h-16 items-center gap-4">
        <button className="-ml-2 p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <MenuIcon />
        </button>
        <Link to="/" className="font-display text-2xl font-bold tracking-wide text-ink">
          AURUM<span className="text-gold-500">.</span>
        </Link>

        <nav className="ml-8 hidden items-center gap-6 lg:flex" aria-label="Main">
          <NavLink to="/shop" className={({ isActive }) => `text-sm ${isActive ? 'text-gold-600' : 'text-stone-700 hover:text-ink'}`}>Shop All</NavLink>
          {categories.map((cat) => (
            <div key={cat._id} className="group relative">
              <NavLink to={`/category/${cat.slug}`} className="flex items-center gap-1 py-5 text-sm text-stone-700 hover:text-ink">
                {cat.name}
                {cat.children?.length > 0 && <ChevronDown className="h-3.5 w-3.5" />}
              </NavLink>
              {cat.children?.length > 0 && (
                <div className="invisible absolute left-0 top-full w-56 translate-y-1 rounded-2xl border border-stone-200 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {cat.children.map((sub) => (
                    <Link key={sub._id} to={`/category/${sub.slug}`} className="block rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-gold-50 hover:text-ink">
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="ml-auto hidden w-72 xl:block">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-1 xl:ml-2">
          <button className="p-2 xl:hidden" onClick={() => setSearchOpen((v) => !v)} aria-label="Search">
            <SearchIcon />
          </button>
          <Link to="/wishlist" className="relative p-2" aria-label="Wishlist">
            <HeartIcon />
            <Badge n={ids.size} />
          </Link>
          <Link to="/cart" className="relative p-2" aria-label="Shopping bag">
            <BagIcon />
            <Badge n={cart.itemCount} />
          </Link>
          <div className="relative" ref={accountRef}>
            {user ? (
              <button className="p-2" onClick={() => setAccountOpen((v) => !v)} aria-label="Account menu" aria-expanded={accountOpen}>
                <UserIcon />
              </button>
            ) : (
              <Link to="/login" className="p-2" aria-label="Sign in"><UserIcon /></Link>
            )}
            {accountOpen && user && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
                <p className="truncate px-3 py-2 text-xs text-stone-500">Hi, {user.name.split(' ')[0]}</p>
                {[['/account', 'My Profile'], ['/account/orders', 'My Orders'], ['/account/addresses', 'Addresses'], ['/wishlist', 'Wishlist'], ['/track-order', 'Track Order']].map(([to, label]) => (
                  <Link key={to} to={to} className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-50">{label}</Link>
                ))}
                <button onClick={logout} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="container-page pb-3 xl:hidden">
          <SearchBox autoFocus onDone={() => setSearchOpen(false)} />
        </div>
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col overflow-y-auto bg-white p-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-2xl font-bold">AURUM<span className="text-gold-500">.</span></span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu"><CloseIcon /></button>
            </div>
            <Link to="/shop" className="border-b border-stone-100 py-3 font-medium">Shop All</Link>
            {categories.map((cat) => (
              <details key={cat._id} className="border-b border-stone-100">
                <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-medium">
                  {cat.name}
                  <ChevronDown className="h-4 w-4" />
                </summary>
                <div className="pb-3 pl-3">
                  <Link to={`/category/${cat.slug}`} className="block py-1.5 text-sm text-stone-600">All {cat.name}</Link>
                  {cat.children?.map((sub) => (
                    <Link key={sub._id} to={`/category/${sub.slug}`} className="block py-1.5 text-sm text-stone-600">{sub.name}</Link>
                  ))}
                </div>
              </details>
            ))}
            <div className="mt-6 space-y-3 text-sm">
              <Link to="/track-order" className="block">Track Order</Link>
              {user ? (
                <>
                  <Link to="/account" className="block">My Account</Link>
                  <button onClick={logout} className="block text-rose-600">Sign out</button>
                </>
              ) : (
                <Link to="/login" className="btn-primary w-full">Sign in</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
