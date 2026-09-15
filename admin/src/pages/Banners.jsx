import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../api/client.js';
import { bannerApi } from '../api/services.js';
import ImageUploader from '../components/ImageUploader.jsx';
import { ConfirmDialog, Field, Modal, PageHeader, PageLoader, Toggle } from '../components/ui.jsx';
import { formatDate, toDateInput } from '../utils/format.js';

const EMPTY = { title: '', subtitle: '', link: '/shop', buttonText: 'Shop Now', position: 'hero', sortOrder: 0, isActive: true, startsAt: '', endsAt: '' };

export default function Banners() {
  const [banners, setBanners] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [existing, setExisting] = useState([]);
  const [file, setFile] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = () => bannerApi.list().then((r) => setBanners(r.data)).catch((err) => toast.error(errorMessage(err)));
  useEffect(() => {
    load();
  }, []);

  const open = (b) => {
    setEditing(b || {});
    setForm(b ? { ...EMPTY, ...b, startsAt: toDateInput(b.startsAt), endsAt: toDateInput(b.endsAt) } : EMPTY);
    setExisting(b?.image ? [b.image] : []);
    setFile([]);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    if (form.title.trim().length < 2) return toast.error('Title is required');
    if (!file.length && !existing.length) return toast.error('Banner image is required');
    const fd = new FormData();
    ['title', 'subtitle', 'link', 'buttonText', 'position', 'sortOrder', 'startsAt', 'endsAt'].forEach((k) => fd.append(k, form[k] ?? ''));
    fd.append('isActive', String(form.isActive));
    if (file[0]) fd.append('image', file[0]);
    setSaving(true);
    try {
      if (editing._id) await bannerApi.update(editing._id, fd);
      else await bannerApi.create(fd);
      toast.success('Banner saved');
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
      await bannerApi.remove(toDelete._id);
      toast.success('Banner deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (!banners) return <PageLoader />;

  const groups = [['hero', 'Hero carousel', 'Recommended 1600×700'], ['promo', 'Promo tiles', 'Recommended 1000×500']];

  return (
    <>
      <PageHeader title="Banners" subtitle="Home page hero slides and promotional tiles" actions={<button className="btn-brand" onClick={() => open(null)}>+ Add banner</button>} />
      {groups.map(([pos, label, hint]) => (
        <section key={pos} className="mb-8">
          <h2 className="mb-3 font-semibold">{label} <span className="text-xs font-normal text-slate-500">· {hint}</span></h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {banners.filter((b) => b.position === pos).map((b) => (
              <div key={b._id} className="panel overflow-hidden">
                <div className="relative">
                  <img src={b.image?.url} alt={b.title} className="aspect-[16/7] w-full object-cover" />
                  {!b.isActive && <span className="absolute left-2 top-2 badge border-slate-300 bg-white text-slate-700">Hidden</span>}
                </div>
                <div className="p-4">
                  <p className="font-medium">{b.title}</p>
                  <p className="truncate text-sm text-slate-500">{b.subtitle}</p>
                  <p className="mt-1 text-xs text-slate-400">Order {b.sortOrder} · → {b.link}{(b.startsAt || b.endsAt) && ` · ${b.startsAt ? formatDate(b.startsAt) : 'now'} – ${b.endsAt ? formatDate(b.endsAt) : '∞'}`}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="btn-secondary px-3 py-1 text-xs" onClick={() => open(b)}>Edit</button>
                    <button className="btn-ghost text-xs text-rose-600" onClick={() => setToDelete(b)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {banners.filter((b) => b.position === pos).length === 0 && <p className="text-sm text-slate-500">No banners yet.</p>}
          </div>
        </section>
      ))}

      <Modal
        open={Boolean(editing)}
        title={editing?._id ? 'Edit banner' : 'New banner'}
        onClose={() => setEditing(null)}
        size="max-w-2xl"
        footer={<><button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn-brand" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save banner'}</button></>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="label">Image *</span>
            <ImageUploader multiple={false} existing={existing} onExistingChange={setExisting} files={file} onFilesChange={setFile} />
          </div>
          <Field label="Title *"><input className="input" maxLength={120} value={form.title} onChange={set('title')} /></Field>
          <Field label="Subtitle"><input className="input" maxLength={250} value={form.subtitle} onChange={set('subtitle')} /></Field>
          <Field label="Link" hint="e.g. /category/rings or /shop?material=Silver"><input className="input" value={form.link} onChange={set('link')} /></Field>
          <Field label="Button text"><input className="input" maxLength={30} value={form.buttonText} onChange={set('buttonText')} /></Field>
          <Field label="Position">
            <select className="input" value={form.position} onChange={set('position')}>
              <option value="hero">Hero carousel</option>
              <option value="promo">Promo tile</option>
            </select>
          </Field>
          <Field label="Sort order"><input type="number" className="input" value={form.sortOrder} onChange={set('sortOrder')} /></Field>
          <Field label="Show from"><input type="date" className="input" value={form.startsAt} onChange={set('startsAt')} /></Field>
          <Field label="Show until"><input type="date" className="input" value={form.endsAt} onChange={set('endsAt')} /></Field>
          <div className="sm:col-span-2"><Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} title="Delete banner" message={`Delete banner "${toDelete?.title}"?`} onConfirm={remove} onClose={() => setToDelete(null)} />
    </>
  );
}
