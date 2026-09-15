import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../api/client.js';
import { couponApi } from '../api/services.js';
import { ConfirmDialog, EmptyRow, Field, Modal, PageHeader, Pagination, Spinner, Toggle } from '../components/ui.jsx';
import { formatDate, formatPrice, toDateInput } from '../utils/format.js';

const EMPTY = { code: '', description: '', discountType: 'percent', discountValue: '', minOrderAmount: 0, maxDiscountAmount: 0, startsAt: '', expiresAt: '', usageLimit: 0, perUserLimit: 1, isActive: true };

const couponState = (c) => {
  const now = new Date();
  if (!c.isActive) return ['Inactive', 'border-slate-200 bg-slate-100 text-slate-600'];
  if (c.expiresAt && new Date(c.expiresAt) < now) return ['Expired', 'border-rose-200 bg-rose-50 text-rose-700'];
  if (c.startsAt && new Date(c.startsAt) > now) return ['Scheduled', 'border-blue-200 bg-blue-50 text-blue-700'];
  if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) return ['Used up', 'border-amber-200 bg-amber-50 text-amber-700'];
  return ['Active', 'border-emerald-200 bg-emerald-50 text-emerald-700'];
};

export default function Coupons() {
  const [result, setResult] = useState({ data: [], pagination: null });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = () => {
    setLoading(true);
    couponApi.list({ page, limit: 10 }).then(setResult).catch((err) => toast.error(errorMessage(err))).finally(() => setLoading(false));
  };
  useEffect(load, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (c) => {
    setEditing(c || {});
    setErrors({});
    setForm(c ? { ...EMPTY, ...c, startsAt: toDateInput(c.startsAt), expiresAt: toDateInput(c.expiresAt) } : EMPTY);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    const e = {};
    if (!/^[A-Za-z0-9_-]{3,30}$/.test(form.code)) e.code = '3–30 letters, numbers, _ or -';
    const v = Number(form.discountValue);
    if (!(v > 0)) e.discountValue = 'Must be greater than 0';
    if (form.discountType === 'percent' && v > 100) e.discountValue = 'Cannot exceed 100%';
    if (form.startsAt && form.expiresAt && form.startsAt > form.expiresAt) e.expiresAt = 'Must be after the start date';
    setErrors(e);
    if (Object.keys(e).length) return;

    const body = {
      code: form.code.toUpperCase(),
      description: form.description,
      discountType: form.discountType,
      discountValue: v,
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxDiscountAmount: Number(form.maxDiscountAmount) || 0,
      usageLimit: Number(form.usageLimit) || 0,
      perUserLimit: Number(form.perUserLimit) || 0,
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt ? `${form.expiresAt}T23:59:59` : null,
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      if (editing._id) await couponApi.update(editing._id, body);
      else await couponApi.create(body);
      toast.success('Coupon saved');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await couponApi.remove(toDelete._id);
      toast.success('Coupon deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader title="Coupons" subtitle="Discount codes for your customers" actions={<button className="btn-brand" onClick={() => open(null)}>+ Create coupon</button>} />
      <div className="panel">
        <div className="relative overflow-x-auto">
          {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60"><Spinner /></div>}
          <table className="table">
            <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Usage</th><th>Valid</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {result.data.length === 0 && !loading ? <EmptyRow colSpan={7} message="No coupons yet" /> : result.data.map((c) => {
                const [label, cls] = couponState(c);
                return (
                  <tr key={c._id}>
                    <td>
                      <p className="font-mono font-semibold">{c.code}</p>
                      <p className="max-w-xs truncate text-xs text-slate-500">{c.description}</p>
                    </td>
                    <td className="whitespace-nowrap">
                      {c.discountType === 'percent' ? `${c.discountValue}%` : formatPrice(c.discountValue)}
                      {c.maxDiscountAmount > 0 && <span className="block text-xs text-slate-500">max {formatPrice(c.maxDiscountAmount)}</span>}
                    </td>
                    <td>{c.minOrderAmount ? formatPrice(c.minOrderAmount) : '—'}</td>
                    <td className="whitespace-nowrap">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}<span className="block text-xs text-slate-500">{c.perUserLimit ? `${c.perUserLimit}/customer` : 'unlimited/customer'}</span></td>
                    <td className="whitespace-nowrap text-xs text-slate-600">{c.startsAt ? formatDate(c.startsAt) : 'Now'} → {c.expiresAt ? formatDate(c.expiresAt) : 'No expiry'}</td>
                    <td><span className={`badge ${cls}`}>{label}</span></td>
                    <td className="whitespace-nowrap text-right">
                      <button className="btn-ghost text-xs" onClick={() => open(c)}>Edit</button>
                      <button className="btn-ghost text-xs text-rose-600" onClick={() => setToDelete(c)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination pagination={result.pagination} onChange={setPage} />
      </div>

      <Modal
        open={Boolean(editing)}
        title={editing?._id ? 'Edit coupon' : 'New coupon'}
        onClose={() => setEditing(null)}
        size="max-w-2xl"
        footer={<><button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn-brand" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save coupon'}</button></>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code *" error={errors.code}><input className="input font-mono uppercase" value={form.code} onChange={set('code')} /></Field>
          <Field label="Description"><input className="input" maxLength={200} value={form.description} onChange={set('description')} /></Field>
          <Field label="Type">
            <select className="input" value={form.discountType} onChange={set('discountType')}>
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed amount (₹)</option>
            </select>
          </Field>
          <Field label={`Value * ${form.discountType === 'percent' ? '(%)' : '(₹)'}`} error={errors.discountValue}><input type="number" min="0" className="input" value={form.discountValue} onChange={set('discountValue')} /></Field>
          <Field label="Minimum order (₹)"><input type="number" min="0" className="input" value={form.minOrderAmount} onChange={set('minOrderAmount')} /></Field>
          <Field label="Maximum discount (₹)" hint="0 = no cap"><input type="number" min="0" className="input" value={form.maxDiscountAmount} onChange={set('maxDiscountAmount')} /></Field>
          <Field label="Starts on"><input type="date" className="input" value={form.startsAt} onChange={set('startsAt')} /></Field>
          <Field label="Expires on" error={errors.expiresAt}><input type="date" className="input" value={form.expiresAt} onChange={set('expiresAt')} /></Field>
          <Field label="Total usage limit" hint="0 = unlimited"><input type="number" min="0" className="input" value={form.usageLimit} onChange={set('usageLimit')} /></Field>
          <Field label="Uses per customer" hint="0 = unlimited"><input type="number" min="0" className="input" value={form.perUserLimit} onChange={set('perUserLimit')} /></Field>
          <div className="sm:col-span-2"><Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} title="Delete coupon" message={`Delete coupon ${toDelete?.code}? Past orders that used it are not affected.`} onConfirm={remove} onClose={() => setToDelete(null)} />
    </>
  );
}
