import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { categoryApi, productApi } from '../api/services.js';
import { ConfirmDialog, EmptyRow, PageHeader, Pagination, Spinner } from '../components/ui.jsx';
import { formatPrice, STORE_URL } from '../utils/format.js';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState({ data: [], pagination: null });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('q') || '');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const query = Object.fromEntries(params.entries());

  const load = () => {
    setLoading(true);
    productApi
      .list({ limit: 10, ...query })
      .then(setResult)
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [params]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    categoryApi.list().then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const setParam = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await productApi.remove(toDelete._id);
      toast.success('Product deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Products" subtitle={`${result.pagination?.total ?? '…'} products`} actions={<Link to="/products/new" className="btn-brand">+ Add product</Link>} />

      <div className="panel">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <form onSubmit={(e) => { e.preventDefault(); setParam({ q: search }); }} className="flex min-w-60 flex-1 gap-2">
            <input className="input" placeholder="Search name, SKU, material…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn-secondary">Search</button>
          </form>
          <select className="input w-auto" value={query.category || ''} onChange={(e) => setParam({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.parent ? `— ${c.name}` : c.name}</option>)}
          </select>
          <select className="input w-auto" value={query.status || ''} onChange={(e) => setParam({ status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Hidden</option>
            <option value="low_stock">Low stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
          <select className="input w-auto" value={query.sort || 'newest'} onChange={(e) => setParam({ sort: e.target.value })}>
            <option value="newest">Newest</option>
            <option value="name">Name</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="popular">Best selling</option>
          </select>
        </div>

        <div className="relative overflow-x-auto">
          {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60"><Spinner /></div>}
          <table className="table">
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th>Status</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {result.data.length === 0 && !loading ? <EmptyRow colSpan={7} message="No products match your filters" /> : result.data.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]?.url} alt="" className="h-11 w-11 rounded-lg border border-slate-200 object-cover" />
                      <div className="min-w-0">
                        <Link to={`/products/${p._id}/edit`} className="block max-w-xs truncate font-medium hover:text-brand-700">{p.name}</Link>
                        <p className="text-xs text-slate-500">{p.sku} · {p.material}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-slate-600">{p.category?.name || '—'}</td>
                  <td className="whitespace-nowrap">
                    {formatPrice(p.price)}
                    {p.compareAtPrice > p.price && <span className="block text-xs text-slate-400 line-through">{formatPrice(p.compareAtPrice)}</span>}
                  </td>
                  <td>
                    <span className={`badge ${p.stock === 0 ? 'border-rose-200 bg-rose-50 text-rose-700' : p.stock <= p.lowStockThreshold ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{p.stock}</span>
                  </td>
                  <td className="text-slate-600">{p.soldCount}</td>
                  <td>
                    <span className={`badge ${p.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>{p.isActive ? 'Active' : 'Hidden'}</span>
                    {p.isFeatured && <span className="badge ml-1 border-brand-200 bg-brand-50 text-brand-700">Featured</span>}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <a href={`${STORE_URL}/product/${p.slug}`} target="_blank" rel="noreferrer" className="btn-ghost text-xs">View</a>
                    <Link to={`/products/${p._id}/edit`} className="btn-ghost text-xs">Edit</Link>
                    <button onClick={() => setToDelete(p)} className="btn-ghost text-xs text-rose-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={result.pagination} onChange={(page) => setParam({ page: String(page) })} />
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete product"
        message={`Delete "${toDelete?.name}"? Its images will be removed and it will be taken out of all carts and wishlists. Existing orders are not affected.`}
        onConfirm={remove}
        onClose={() => setToDelete(null)}
        busy={deleting}
      />
    </>
  );
}
