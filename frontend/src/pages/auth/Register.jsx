import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client.js';
import SEO from '../../components/SEO.jsx';
import { Field } from '../../components/ui/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const validate = (f) => {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Please enter your name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email';
  if (f.phone && !/^[+\d\s-]{7,20}$/.test(f.phone)) e.phone = 'Enter a valid phone number';
  if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'At least 8 characters with a letter and a number';
  if (f.password !== f.confirm) e.confirm = 'Passwords do not match';
  return e;
};

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const { confirm, ...body } = form;
      await register(body);
      toast.success('Account created — welcome to Aurum!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <SEO title="Create Account" noindex />
      <div className="card w-full max-w-md p-8">
        <h1 className="text-center text-4xl font-semibold">Create account</h1>
        <p className="mt-2 text-center text-sm text-stone-500">Save favourites, track orders and check out faster</p>
        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          <Field label="Full name" error={errors.name}><input className="input" autoComplete="name" value={form.name} onChange={set('name')} /></Field>
          <Field label="Email" error={errors.email}><input type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Phone (optional)" error={errors.phone}><input className="input" autoComplete="tel" value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Password" error={errors.password}><input type="password" className="input" autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
          <Field label="Confirm password" error={errors.confirm}><input type="password" className="input" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} /></Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create Account'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-600">
          Already have an account? <Link to="/login" state={location.state} className="font-medium text-gold-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
