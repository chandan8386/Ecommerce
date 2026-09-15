import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../api/client.js';
import { categoryApi } from '../api/services.js';
import ImageUploader from '../components/ImageUploader.jsx';
import { ConfirmDialog, EmptyRow, Field, Modal, PageHeader, PageLoader, Pagination, Toggle } from '../components/ui.jsx';

const PAGE_SIZE = 10;

const EMPTY = { name: '', slug: '', description: '', parent: '', sortOrder: 0, isActive: true, seo: { metaTitle: '', metaDescription: '' } };

export default function Categories() {
  const [categories, setCategories] = useState(null);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | {} (new) | category
  const [form, setForm] = useState(EMPTY);
  const [existingImage, setExistingImage] = useState([]);
  const [file, setFile] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = () => categoryApi.list().then((r) => setCategories(r.data)).catch((err) => toast.error(errorMessage(err)));
  useEffect(() => {
    load();
  }, []);

  const open = (cat) => {
    setEditing(cat || {});
    setForm(cat ? { ...EMPTY, ...cat, parent: cat.parent?._id || '', seo: { ...EMPTY.seo, ...cat.seo } } : EMPTY);
    setExistingImage(cat?.image ? [cat.image] : []);
    setFile([]);
  };

  const save = async () => {
    if (form.name.trim().length < 2) return toast.error('Name is required');
    const fd = new FormData();
    ['name', 'description', 'sortOrder'].forEach((k) => fd.append(k, form[k] ?? ''));
    if (form.slug) fd.append('slug', form.slug);
    fd.append('parent', form.parent || '');
    fd.append('isActive', String(form.isActive));
    fd.append('seo', JSON.stringify(form.seo));
    if (file[0]) fd.append('image', file[0]);
    else if (editing._id && editing.image && existingImage.length === 0) fd.append('removeImage', 'true');

    setSaving(true);
    try {
      if (editing._id) await categoryApi.update(editing._id, fd);
      else await categoryApi.create(fd);
      toast.success('Category saved');
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
      await categoryApi.remove(toDelete._id);
      toast.success('Category deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
      setToDelete(null);
    }
  };

  if (!categories) return <PageLoader />;

  // Order parents followed by their children
  const parents = categories.filter((c) => !c.parent);
  const ordered = parents.flatMap((p) => [p, ...categories.filter((c) => c.parent?._id === p._id)]);
  const orphans = categories.filter((c) => c.parent && !parents.some((p) => p._id === c.parent._id));
  const rows = [...ordered, ...orphans];
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <PageHeader title="Categories" subtitle="Organise products into categories and subcategories" actions={<button className="btn-brand" onClick={() => open(null)}>+ Add category</button>} />
      <div className="panel overflow-x-auto">
        <table className="table">
          <thead><tr><th>Category</th><th>Slug</th><th>Products</th><th>Order</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <EmptyRow colSpan={6} /> : pageRows.map((c) => (
              <tr key={c._id}>
                <td>
                  <div className={`flex items-center gap-3 ${c.parent ? 'pl-8' : ''}`}>
                    {c.parent && <span className="text-slate-300">└</span>}
                    {c.image?.url ? <img src={c.image.url} alt="" className="h-9 w-9 rounded object-cover" /> : <span className="h-9 w-9 rounded bg-slate-100" />}
                    <span className={c.parent ? '' : 'font-medium'}>{c.name}</span>
                  </div>
                </td>
                <td className="text-slate-500">{c.slug}</td>
                <td>{c.productCount}</td>
                <td>{c.sortOrder}</td>
                <td><span className={`badge ${c.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>{c.isActive ? 'Active' : 'Hidden'}</span></td>
                <td className="whitespace-nowrap text-right">
                  <button className="btn-ghost text-xs" onClick={() => open(c)}>Edit</button>
                  <button className="btn-ghost text-xs text-rose-600" onClick={() => setToDelete(c)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination pagination={{ page: currentPage, pages, total: rows.length, limit: PAGE_SIZE }} onChange={setPage} />
      </div>

      <Modal
        open={Boolean(editing)}
        title={editing?._id ? 'Edit category' : 'New category'}
        onClose={() => setEditing(null)}
        size="max-w-2xl"
        footer={<><button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn-brand" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name *"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Slug" hint="Auto-generated if empty"><input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
          <Field label="Parent category">
            <select className="input" value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
              <option value="">— None (top level) —</option>
              {parents.filter((p) => p._id !== editing?._id).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Sort order"><input type="number" className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Meta title"><input className="input" maxLength={70} value={form.seo.metaTitle} onChange={(e) => setForm({ ...form, seo: { ...form.seo, metaTitle: e.target.value } })} /></Field>
          <Field label="Meta description"><input className="input" maxLength={170} value={form.seo.metaDescription} onChange={(e) => setForm({ ...form, seo: { ...form.seo, metaDescription: e.target.value } })} /></Field>
          <div className="sm:col-span-2"><Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active" /></div>
          <div className="sm:col-span-2">
            <span className="label">Image</span>
            <ImageUploader multiple={false} existing={existingImage} onExistingChange={setExistingImage} files={file} onFilesChange={setFile} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} title="Delete category" message={`Delete "${toDelete?.name}"? Categories with products or subcategories can't be deleted.`} onConfirm={remove} onClose={() => setToDelete(null)} />
    </>
  );
}
