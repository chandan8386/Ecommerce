import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client.js';
import SEO from '../../components/SEO.jsx';
import { Field } from '../../components/ui/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <SEO title="Sign In" noindex />
      <div className="card w-full max-w-md p-8">
        <h1 className="text-center text-4xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-center text-sm text-stone-500">Sign in to your Aurum account</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
          <Field label="Email">
            <input type="email" required autoComplete="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password">
            <input type="password" required autoComplete="current-password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-600">
          New to Aurum? <Link to="/register" state={location.state} className="font-medium text-gold-700 hover:underline">Create an account</Link>
        </p>
        <p className="mt-4 rounded-lg bg-stone-50 p-3 text-center text-xs text-stone-500">Demo: customer@aurum.com / Customer@123</p>
      </div>
    </div>
  );
}
