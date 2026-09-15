import { Link } from 'react-router-dom';
import { formatPrice, STATUS_COLORS, STATUS_LABELS } from '../../utils/format.js';
import { ChevronLeft, ChevronRight, MinusIcon, PlusIcon, StarIcon } from './Icons.jsx';

export const Spinner = ({ className = 'h-6 w-6' }) => (
  <span className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} role="status" aria-label="Loading" />
);

export const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-gold-500">
    <Spinner className="h-8 w-8" />
  </div>
);

export const Price = ({ price, compareAtPrice, className = '', size = 'md' }) => {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' };
  const discount = compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={`font-semibold text-ink ${sizes[size]}`}>{formatPrice(price)}</span>
      {discount > 0 && (
        <>
          <span className="text-sm text-stone-400 line-through">{formatPrice(compareAtPrice)}</span>
          <span className="text-xs font-semibold text-emerald-700">{discount}% off</span>
        </>
      )}
    </div>
  );
};

export const Rating = ({ value = 0, count, className = '' }) => (
  <div className={`flex items-center gap-1 ${className}`} aria-label={`Rated ${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <StarIcon key={i} filled={value >= i - 0.25} className="h-3.5 w-3.5 text-gold-500" />
    ))}
    {count !== undefined && <span className="ml-1 text-xs text-stone-500">({count})</span>}
  </div>
);

export const QuantitySelector = ({ value, onChange, max = 20, min = 1, disabled }) => (
  <div className="inline-flex items-center rounded-full border border-stone-300 bg-white">
    <button type="button" className="p-2.5 text-stone-600 hover:text-ink disabled:opacity-40" onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label="Decrease quantity">
      <MinusIcon className="h-4 w-4" />
    </button>
    <span className="w-8 text-center text-sm font-medium">{value}</span>
    <button type="button" className="p-2.5 text-stone-600 hover:text-ink disabled:opacity-40" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Increase quantity">
      <PlusIcon className="h-4 w-4" />
    </button>
  </div>
);

export const EmptyState = ({ icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
    {icon && <div className="mb-4 rounded-full bg-gold-50 p-5 text-gold-500">{icon}</div>}
    <h2 className="text-3xl font-semibold">{title}</h2>
    {message && <p className="mt-2 max-w-md text-stone-500">{message}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export const StatusBadge = ({ status }) => (
  <span className={`chip ${STATUS_COLORS[status] || 'border-stone-200'}`}>{STATUS_LABELS[status] || status}</span>
);

export const Breadcrumbs = ({ items }) => (
  <nav aria-label="Breadcrumb" className="mb-4 text-xs text-stone-500">
    <ol className="flex flex-wrap items-center gap-1">
      <li><Link to="/" className="hover:text-ink">Home</Link></li>
      {items.map((item, i) => (
        <li key={item.to || item.label} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {item.to && i < items.length - 1 ? <Link to={item.to} className="hover:text-ink">{item.label}</Link> : <span className="text-stone-700">{item.label}</span>}
        </li>
      ))}
    </ol>
  </nav>
);

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const nums = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
  const btn = 'flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm transition';
  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      <button className={`${btn} hover:bg-stone-100 disabled:opacity-40`} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {nums[0] > 1 && <span className="px-2 text-stone-400">…</span>}
      {nums.map((n) => (
        <button key={n} className={`${btn} ${n === page ? 'bg-ink text-white' : 'hover:bg-stone-100'}`} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}>
          {n}
        </button>
      ))}
      {nums[nums.length - 1] < pages && <span className="px-2 text-stone-400">…</span>}
      <button className={`${btn} hover:bg-stone-100 disabled:opacity-40`} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export const Field = ({ label, error, children, className = '' }) => (
  <label className={`block ${className}`}>
    {label && <span className="label">{label}</span>}
    {children}
    {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
  </label>
);
