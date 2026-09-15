import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../../api/client.js';
import { userApi } from '../../api/services.js';
import AddressForm from '../../components/AddressForm.jsx';
import { MapPinIcon } from '../../components/ui/Icons.jsx';
import { EmptyState, PageLoader } from '../../components/ui/index.jsx';

export default function Addresses() {
  const [addresses, setAddresses] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    userApi.addresses().then((r) => setAddresses(r.data)).catch(() => setAddresses([]));
  }, []);

  const run = async (fn, success) => {
    setBusy(true);
    try {
      const res = await fn();
      setAddresses(res.data);
      setEditing(null);
      if (success) toast.success(success);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!addresses) return <PageLoader />;

  if (editing) {
    return (
      <div className="card p-6">
        <h2 className="mb-5 text-2xl font-semibold">{editing === 'new' ? 'Add address' : 'Edit address'}</h2>
        <AddressForm
          initial={editing === 'new' ? { isDefault: addresses.length === 0 } : editing}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSubmit={(body) =>
            editing === 'new'
              ? run(() => userApi.addAddress(body), 'Address added')
              : run(() => userApi.updateAddress(editing._id, body), 'Address updated')
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Saved addresses</h2>
        {addresses.length < 10 && <button className="btn-primary px-4 py-2" onClick={() => setEditing('new')}>+ Add address</button>}
      </div>
      {addresses.length === 0 ? (
        <div className="card"><EmptyState icon={<MapPinIcon className="h-8 w-8" />} title="No saved addresses" message="Add an address for faster checkout." /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a._id} className={`card p-5 text-sm ${a.isDefault ? 'border-gold-400' : ''}`}>
              <div className="flex items-center gap-2">
                <p className="font-medium">{a.fullName}</p>
                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] uppercase text-stone-600">{a.label}</span>
                {a.isDefault && <span className="rounded bg-gold-100 px-1.5 py-0.5 text-[10px] uppercase text-gold-800">Default</span>}
              </div>
              <p className="mt-2 text-stone-600">{a.line1}{a.line2 && `, ${a.line2}`}</p>
              <p className="text-stone-600">{a.city}, {a.state} {a.postalCode}, {a.country}</p>
              <p className="mt-1 text-stone-500">{a.phone}</p>
              <div className="mt-4 flex gap-4 text-xs font-medium">
                <button className="text-ink hover:underline" onClick={() => setEditing(a)}>Edit</button>
                {!a.isDefault && <button className="text-gold-700 hover:underline" onClick={() => run(() => userApi.setDefaultAddress(a._id), 'Default address updated')}>Set as default</button>}
                <button className="text-rose-600 hover:underline" onClick={() => window.confirm('Delete this address?') && run(() => userApi.deleteAddress(a._id), 'Address deleted')}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
