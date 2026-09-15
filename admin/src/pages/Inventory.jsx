import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { productApi } from '../api/services.js';
import { EmptyRow, PageHeader, Pagination, Spinner } from '../components/ui.jsx';

export default function Inventory() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState({}); // id -> { stock, price, compareAtPrice }
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState(params.get('q') || '');
  const query = Object.fromEntries(params.entries());

  const load = () => {
    setLoading(true);
    productApi
      .list({ limit: 10, sort: 'name', ...query })
      .then((r) => {
        setResult(r);
        setEdits({});
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  };
  useEffect(load, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const setParam = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  const change = (p, field, value) => {
    setEdits((prev) => {
      const row = { ...prev[p._id], [field]: value };
      const unchanged = ['stock', 'price', 'compareAtPrice'].every((f) => row[f] === undefined || Number(row[f]) === Number(p[f] || 0));
      const next = { ...prev };
      if (unchanged) delete next[p._id];
      else next[p._id] = row;
      return next;
    });
  };

  const dirty = Object.keys(edits).length;

  const save = async () => {
    const items = [];
    for (const [id, row] of Object.entries(edits)) {
      const item = { id };
      for (const f of ['stock', 'price', 'compareAtPrice']) {
        if (row[f] === undefined || row[f] === '') continue;
        const n = Number(row[f]);
        if (!Number.isFinite(n) || n < 0 || (f === 'stock' && !Number.isInteger(n))) {
          return toast.error(`Invalid ${f} value`);
        }
        item[f] = n;
      }
      items.push(item);
    }
    setSaving(true);
    try {
      const res = await productApi.updateInventory(items);
      toast.success(`Updated ${res.data.modified} product(s)`);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const val = (p, f) => (edits[p._id]?.[f] !== undefined ? edits[p._id][f] : p[f] ?? '');

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Quickly update stock levels and prices"
        actions={
          <>
            {dirty > 0 && <button className="btn-secondary" onClick={() => setEdits({})}>Discard</button>}
            <button className="btn-brand" onClick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : `Save changes${dirty ? ` (${dirty})` : ''}`}</button>
          </>
        }
      />
      <div className="panel">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <form onSubmit={(e) => { e.preventDefault(); setParam({ q: search }); }} className="flex min-w-60 flex-1 gap-2">
            <input className="input" placeholder="Search products or SKU" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn-secondary">Search</button>
          </form>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
            {[['', 'All'], ['low_stock', 'Low stock'], ['out_of_stock', 'Out of stock'], ['inactive', 'Hidden']].map(([v, l]) => (
              <button key={v} onClick={() => setParam({ status: v })} className={`rounded-md px-3 py-1.5 ${(query.status || '') === v ? 'bg-white shadow-sm' : 'text-slate-600'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="relative overflow-x-auto">
          {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60"><Spinner /></div>}
          <table className="table">
            <thead><tr><th>Product</th><th>SKU</th><th className="w-32">Stock</th><th className="w-36">Price (₹)</th><th className="w-36">MRP (₹)</th><th>Sold</th></tr></thead>
            <tbody>
              {result.data.length === 0 && !loading ? <EmptyRow colSpan={6} /> : result.data.map((p) => {
                const stock = Number(val(p, 'stock'));
                return (
                  <tr key={p._id} className={edits[p._id] ? 'bg-brand-50/50' : ''}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0]?.url} alt="" className="h-9 w-9 rounded object-cover" />
                        <span className="max-w-xs truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-slate-500">{p.sku}</td>
                    <td>
                      <input type="number" min="0" step="1" className={`input py-1.5 ${stock === 0 ? 'border-rose-300' : stock <= p.lowStockThreshold ? 'border-amber-300' : ''}`} value={val(p, 'stock')} onChange={(e) => change(p, 'stock', e.target.value)} aria-label={`Stock for ${p.name}`} />
                    </td>
                    <td><input type="number" min="0" className="input py-1.5" value={val(p, 'price')} onChange={(e) => change(p, 'price', e.target.value)} aria-label={`Price for ${p.name}`} /></td>
                    <td><input type="number" min="0" className="input py-1.5" value={val(p, 'compareAtPrice')} onChange={(e) => change(p, 'compareAtPrice', e.target.value)} aria-label={`MRP for ${p.name}`} /></td>
                    <td className="text-slate-600">{p.soldCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination pagination={result.pagination} onChange={(page) => (dirty && !window.confirm('Discard unsaved changes?') ? null : setParam({ page: String(page) }))} />
      </div>
    </>
  );
}
