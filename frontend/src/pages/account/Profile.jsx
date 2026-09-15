import { useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../../api/client.js';
import { userApi } from '../../api/services.js';
import { Field } from '../../components/ui/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Profile() {
  const { user, setUser, changePassword } = useAuth();
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy('profile');
    try {
      const res = await userApi.updateProfile(profile);
      setUser(res.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy('');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error('New passwords do not match');
    setBusy('password');
    try {
      await changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed. Other devices have been signed out.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={saveProfile} className="card grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="text-2xl font-semibold sm:col-span-2">Personal details</h2>
        <Field label="Full name"><input className="input" required minLength={2} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
        <Field label="Phone"><input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
        <Field label="Email" className="sm:col-span-2"><input className="input bg-stone-50" value={user.email} disabled /></Field>
        <div className="sm:col-span-2"><button className="btn-primary" disabled={busy === 'profile'}>{busy === 'profile' ? 'Saving…' : 'Save changes'}</button></div>
      </form>

      <form onSubmit={savePassword} className="card grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="text-2xl font-semibold sm:col-span-2">Change password</h2>
        <Field label="Current password" className="sm:col-span-2"><input type="password" className="input" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
        <Field label="New password"><input type="password" className="input" required minLength={8} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
        <Field label="Confirm new password"><input type="password" className="input" required autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
        <div className="sm:col-span-2"><button className="btn-outline" disabled={busy === 'password'}>{busy === 'password' ? 'Updating…' : 'Update password'}</button></div>
      </form>
    </div>
  );
}
