import { NavLink, Outlet } from 'react-router-dom';
import SEO from '../../components/SEO.jsx';
import { LogoutIcon, MapPinIcon, PackageIcon, UserIcon } from '../../components/ui/Icons.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const links = [
  { to: '/account', label: 'Profile', icon: UserIcon, end: true },
  { to: '/account/orders', label: 'Orders', icon: PackageIcon },
  { to: '/account/addresses', label: 'Addresses', icon: MapPinIcon },
];

export default function AccountLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="container-page py-10">
      <SEO title="My Account" noindex />
      <h1 className="text-4xl font-semibold">My Account</h1>
      <p className="mt-1 text-stone-500">{user.email}</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col" aria-label="Account">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${isActive ? 'bg-ink text-white' : 'bg-white text-stone-700 hover:bg-stone-100'}`}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
          <button onClick={logout} className="flex shrink-0 items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-rose-600 hover:bg-rose-50">
            <LogoutIcon className="h-4 w-4" /> Sign out
          </button>
        </nav>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
