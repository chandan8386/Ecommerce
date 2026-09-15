import { useEffect } from 'react';
import { STATUS_LABELS, STATUS_STYLES } from '../utils/format.js';

export const Spinner = ({ className = 'h-5 w-5' }) => (
  <span className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} role="status" aria-label="Loading" />
);

export const PageLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center text-brand-500"><Spinner className="h-8 w-8" /></div>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const StatusBadge = ({ status, label }) => (
  <span className={`badge ${STATUS_STYLES[status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>{label || STATUS_LABELS[status] || status}</span>
);

export const Field = ({ label, error, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    {label && <span className="label">{label}</span>}
    {children}
    {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
  </label>
);

export const Toggle = ({ checked, onChange, label }) => (
  <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-brand-500' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'left-4.5' : 'left-0.5'}`} />
    </button>
    {label}
  </label>
);

export const EmptyRow = ({ colSpan, message = 'No records found' }) => (
  <tr><td colSpan={colSpan} className="py-12 text-center text-slate-500">{message}</td></tr>
);

export function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.pages <= 1) return pagination ? <p className="px-4 py-3 text-xs text-slate-500">{pagination.total} records</p> : null;
  const { page, pages, total, limit } = pagination;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
      <p className="text-xs text-slate-500">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
      <div className="flex gap-1">
        <button className="btn-secondary px-3 py-1" disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</button>
        <span className="px-3 py-1 text-slate-600">{page} / {pages}</span>
        <button className="btn-secondary px-3 py-1" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer, size = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-slate-900/50" onClick={onClose} />
      <div className={`relative w-full ${size} rounded-xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close">×</button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', onConfirm, onClose, busy }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="max-w-md"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}

export const StatCard = ({ label, value, sub, trend, icon }) => (
  <div className="panel p-5">
    <div className="flex items-start justify-between">
      <p className="text-sm text-slate-500">{label}</p>
      {icon && <span className="rounded-lg bg-brand-50 p-2 text-brand-600">{icon}</span>}
    </div>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    <div className="mt-1 flex items-center gap-2 text-xs">
      {trend !== undefined && trend !== null && (
        <span className={trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%</span>
      )}
      {sub && <span className="text-slate-500">{sub}</span>}
    </div>
  </div>
);
