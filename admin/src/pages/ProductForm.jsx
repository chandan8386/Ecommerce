import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { categoryApi, productApi } from '../api/services.js';
import ImageUploader from '../components/ImageUploader.jsx';
import { Field, PageHeader, PageLoader, Toggle } from '../components/ui.jsx';

const EMPTY = {
  name: '', sku: '', slug: '', shortDescription: '', description: '', category: '',
  price: '', compareAtPrice: '', stock: '', lowStockThreshold: 5,
  material: '', purity: '', gemstone: '', weight: '',
  colors: '', sizes: '', tags: '',
  isActive: true, isFeatured: false,
  seo: { metaTitle: '', metaDescription: '' },
};

const MATERIALS = ['Yellow Gold', 'White Gold', 'Rose Gold', 'Platinum', 'Silver'];

const validate = (f, imageCount) => {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Name is required';
  if (f.sku.trim().length < 2) e.sku = 'SKU is required';
  if (!f.category) e.category = 'Select a category';
  if (f.price === '' || Number(f.price) < 0) e.price = 'Enter a valid price';
  if (f.compareAtPrice !== '' && Number(f.compareAtPrice) > 0 && Number(f.compareAtPrice) < Number(f.price)) e.compareAtPrice = 'MRP should be higher than the selling price';
  if (f.stock === '' || !Number.isInteger(Number(f.stock)) || Number(f.stock) < 0) e.stock = 'Enter a whole number';
  if (f.material.trim().length < 2) e.material = 'Material is required';
  if (imageCount === 0) e.images = 'Add at least one image';
  return e;
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    categoryApi.list().then((r) => setCategories(r.data)).catch(() => {});
    if (!isEdit) return;
    productApi
      .get(id)
      .then(({ data: p }) => {
        setForm({
          ...EMPTY,
          ...p,
          category: p.category?._id || p.category,
          compareAtPrice: p.compareAtPrice || '',
          weight: p.weight || '',
          colors: p.colors.join(', '),
          sizes: p.sizes.join(', '),
          tags: p.tags.join(', '),
          seo: { metaTitle: p.seo?.metaTitle || '', metaDescription: p.seo?.metaDescription || '' },
        });
        setExistingImages(p.images);
      })
      .catch((err) => {
        toast.error(errorMessage(err));
        navigate('/products');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form, existingImages.length + newFiles.length);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    const fd = new FormData();
    const fields = ['name', 'sku', 'shortDescription', 'description', 'category', 'price', 'stock', 'lowStockThreshold', 'material', 'purity', 'gemstone', 'colors', 'sizes', 'tags'];
    fields.forEach((k) => fd.append(k, form[k] ?? ''));
    if (form.slug) fd.append('slug', form.slug);
    fd.append('compareAtPrice', form.compareAtPrice || 0);
    fd.append('weight', form.weight || 0);
    fd.append('isActive', String(form.isActive));
    fd.append('isFeatured', String(form.isFeatured));
    fd.append('seo', JSON.stringify(form.seo));
    if (isEdit) fd.append('keepImages', JSON.stringify(existingImages.map((img) => img.publicId || img.url)));
    newFiles.forEach((f) => fd.append('images', f));

    setSaving(true);
    setProgress(0);
    const onProgress = (ev) => ev.total && setProgress(Math.round((ev.loaded / ev.total) * 100));
    try {
      if (isEdit) await productApi.update(id, fd, onProgress);
      else await productApi.create(fd, onProgress);
      toast.success(isEdit ? 'Product updated' : 'Product created');
      navigate('/products');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  const leafFirst = [...categories].sort((a, b) => (a.parent?.name || a.name).localeCompare(b.parent?.name || b.name));

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        title={isEdit ? 'Edit product' : 'Add product'}
        subtitle={isEdit ? form.name : 'Create a new jewellery listing'}
        actions={
          <>
            <Link to="/products" className="btn-secondary">Cancel</Link>
            <button className="btn-brand" disabled={saving}>{saving ? `Saving… ${progress ? `${progress}%` : ''}` : isEdit ? 'Save changes' : 'Create product'}</button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="panel space-y-4 p-5">
            <h2 className="font-semibold">Basic information</h2>
            <Field label="Product name *" error={errors.name}><input className="input" value={form.name} onChange={set('name')} maxLength={150} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SKU *" error={errors.sku}><input className="input uppercase" value={form.sku} onChange={set('sku')} maxLength={40} /></Field>
              <Field label="URL slug" hint="Leave blank to generate from the name"><input className="input" value={form.slug} onChange={set('slug')} /></Field>
            </div>
            <Field label="Short description" hint={`${form.shortDescription.length}/300`}><textarea className="input" rows={2} maxLength={300} value={form.shortDescription} onChange={set('shortDescription')} /></Field>
            <Field label="Full description" hint={`${form.description.length}/5000`}><textarea className="input" rows={6} maxLength={5000} value={form.description} onChange={set('description')} /></Field>
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 font-semibold">Images *</h2>
            <ImageUploader existing={existingImages} onExistingChange={setExistingImages} files={newFiles} onFilesChange={setNewFiles} maxFiles={10} error={errors.images} />
            <p className="mt-3 text-xs text-slate-500">The first image is used as the cover. Square images (1:1, at least 800×800) look best.</p>
          </section>

          <section className="panel grid gap-4 p-5 sm:grid-cols-2">
            <h2 className="font-semibold sm:col-span-2">Jewellery details</h2>
            <Field label="Material *" error={errors.material}>
              <input className="input" list="materials" value={form.material} onChange={set('material')} />
              <datalist id="materials">{MATERIALS.map((m) => <option key={m} value={m} />)}</datalist>
            </Field>
            <Field label="Purity" hint="e.g. 22K, 18K, 925, PT950"><input className="input" value={form.purity} onChange={set('purity')} /></Field>
            <Field label="Gemstone"><input className="input" value={form.gemstone} onChange={set('gemstone')} placeholder="Diamond, Ruby…" /></Field>
            <Field label="Weight (grams)"><input type="number" step="0.01" min="0" className="input" value={form.weight} onChange={set('weight')} /></Field>
            <Field label="Colours" hint="Comma separated, e.g. Yellow Gold, Rose Gold"><input className="input" value={form.colors} onChange={set('colors')} /></Field>
            <Field label="Sizes" hint="Comma separated, e.g. 6, 8, 10 (leave empty if not applicable)"><input className="input" value={form.sizes} onChange={set('sizes')} /></Field>
            <Field label="Tags" hint="Comma separated keywords used in search" className="sm:col-span-2"><input className="input" value={form.tags} onChange={set('tags')} /></Field>
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="font-semibold">Search engine listing</h2>
            <Field label="Meta title" hint={`${form.seo.metaTitle.length}/70`}><input className="input" maxLength={70} value={form.seo.metaTitle} onChange={(e) => setForm({ ...form, seo: { ...form.seo, metaTitle: e.target.value } })} /></Field>
            <Field label="Meta description" hint={`${form.seo.metaDescription.length}/170`}><textarea className="input" rows={2} maxLength={170} value={form.seo.metaDescription} onChange={(e) => setForm({ ...form, seo: { ...form.seo, metaDescription: e.target.value } })} /></Field>
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel space-y-4 p-5">
            <h2 className="font-semibold">Visibility</h2>
            <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active (visible in store)" />
            <Toggle checked={form.isFeatured} onChange={(v) => setForm({ ...form, isFeatured: v })} label="Featured on home page" />
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="font-semibold">Category</h2>
            <Field label="Category *" error={errors.category}>
              <select className="input" value={form.category} onChange={set('category')}>
                <option value="">Select category</option>
                {leafFirst.map((c) => <option key={c._id} value={c._id}>{c.parent ? `${c.parent.name} › ${c.name}` : c.name}</option>)}
              </select>
            </Field>
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="font-semibold">Pricing (₹)</h2>
            <Field label="Selling price *" error={errors.price}><input type="number" min="0" step="1" className="input" value={form.price} onChange={set('price')} /></Field>
            <Field label="MRP / compare-at price" error={errors.compareAtPrice} hint="Shown struck-through when higher than the price"><input type="number" min="0" step="1" className="input" value={form.compareAtPrice} onChange={set('compareAtPrice')} /></Field>
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="font-semibold">Inventory</h2>
            <Field label="Stock quantity *" error={errors.stock}><input type="number" min="0" step="1" className="input" value={form.stock} onChange={set('stock')} /></Field>
            <Field label="Low-stock alert at"><input type="number" min="0" step="1" className="input" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} /></Field>
          </section>
        </div>
      </div>
    </form>
  );
}
