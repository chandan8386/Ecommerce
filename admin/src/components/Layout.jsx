import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { STORE_URL } from '../utils/format.js';
import { PageLoader } from './ui.jsx';

const I = ({ d }) => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

const NAV = [
  { to: '/', label: 'Dashboard', end: true, icon: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10' },
  { to: '/orders', label: 'Orders', icon: 'M6 7h12l1 13H5L6 7ZM9 7a3 3 0 0 1 6 0' },
  { to: '/products', label: 'Products', icon: 'M6 3h12l3 6-9 12L3 9l3-6ZM3 9h18' },
  { to: '/categories', label: 'Categories', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { to: '/inventory', label: 'Inventory', icon: 'm3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10' },
  { to: '/customers', label: 'Customers', icon: 'M16 11a4 4 0 1 0-8 0M3 21a9 9 0 0 1 18 0' },
  { to: '/coupons', label: 'Coupons', icon: 'M3 12V3h9l9 9-9 9-9-9ZM7.5 7.5h.01' },
  { to: '/banners', label: 'Banners', icon: 'M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6' },
  { to: '/reports', label: 'Reports', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="text-xl font-bold tracking-wide text-white">AURUM<span className="text-brand-400">.</span></span>
        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Admin</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Admin">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'}`}>
            <I d={n.icon} /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <a href={STORE_URL} target="_blank" rel="noreferrer" className="mb-3 block text-xs text-slate-400 hover:text-white">View storefront ↗</a>
        <p className="truncate text-sm text-white">{user?.name}</p>
        <p className="truncate text-xs text-slate-400">{user?.email}</p>
        <button onClick={logout} className="mt-3 text-xs text-rose-300 hover:text-rose-200">Sign out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
        <button onClick={() => setOpen(true)} className="btn-ghost" aria-label="Open menu">
          <I d="M4 7h16M4 12h16M4 17h16" />
        </button>
        <span className="ml-2 font-bold">AURUM Admin</span>
      </header>
      <main className="w-full p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
