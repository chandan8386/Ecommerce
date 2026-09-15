import { useState } from 'react';
import { Field } from './ui/index.jsx';

const EMPTY = { label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false };

const STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

export function validateAddress(a) {
  const e = {};
  if (!a.fullName || a.fullName.trim().length < 2) e.fullName = 'Enter the full name';
  if (!/^[+\d\s-]{7,20}$/.test(a.phone || '')) e.phone = 'Enter a valid phone number';
  if (!a.line1 || a.line1.trim().length < 3) e.line1 = 'Enter the street address';
  if (!a.city || a.city.trim().length < 2) e.city = 'Enter the city';
  if (!a.state) e.state = 'Select the state';
  if (!/^[A-Za-z\d\s-]{3,12}$/.test(a.postalCode || '')) e.postalCode = 'Enter a valid PIN code';
  return e;
}

export default function AddressForm({ initial, onSubmit, onCancel, submitLabel = 'Save address', busy, showDefault = true }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = validateAddress(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const { _id, ...body } = form;
    onSubmit(body);
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Full name" error={errors.fullName}><input className="input" value={form.fullName} onChange={set('fullName')} autoComplete="name" /></Field>
      <Field label="Phone" error={errors.phone}><input className="input" value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" /></Field>
      <Field label="Address line 1" error={errors.line1} className="sm:col-span-2"><input className="input" value={form.line1} onChange={set('line1')} autoComplete="address-line1" placeholder="House no., street" /></Field>
      <Field label="Address line 2 (optional)" className="sm:col-span-2"><input className="input" value={form.line2} onChange={set('line2')} autoComplete="address-line2" placeholder="Landmark, area" /></Field>
      <Field label="City" error={errors.city}><input className="input" value={form.city} onChange={set('city')} autoComplete="address-level2" /></Field>
      <Field label="State" error={errors.state}>
        <select className="input" value={form.state} onChange={set('state')} autoComplete="address-level1">
          <option value="">Select state</option>
          {STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="PIN code" error={errors.postalCode}><input className="input" value={form.postalCode} onChange={set('postalCode')} autoComplete="postal-code" inputMode="numeric" /></Field>
      <Field label="Label">
        <select className="input" value={form.label} onChange={set('label')}>
          <option>Home</option><option>Work</option><option>Other</option>
        </select>
      </Field>
      {showDefault && (
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" className="h-4 w-4 accent-gold-600" checked={form.isDefault} onChange={set('isDefault')} />
          Make this my default address
        </label>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
