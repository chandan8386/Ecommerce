import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { catalogApi } from '../api/services.js';
import FilterSidebar from '../components/product/FilterSidebar.jsx';
import { ProductGrid } from '../components/product/ProductCard.jsx';
import SEO from '../components/SEO.jsx';
import { CloseIcon, FilterIcon, SearchIcon } from '../components/ui/Icons.jsx';
import { Breadcrumbs, EmptyState, Pagination } from '../components/ui/index.jsx';

const SORT_OPTIONS = [
  ['newest', 'Newest'],
  ['popular', 'Bestselling'],
  ['price_asc', 'Price: Low to High'],
  ['price_desc', 'Price: High to Low'],
  ['rating', 'Top Rated'],
];

const FILTER_KEYS = ['q', 'material', 'color', 'size', 'minPrice', 'maxPrice', 'inStock', 'featured', 'sort', 'page'];

export default function Shop() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useState(null);
  const [options, setOptions] = useState(null);
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const values = useMemo(() => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || undefined])), [params]);
  const page = Number(values.page) || 1;

  useEffect(() => {
    setCategory(null);
    if (slug) catalogApi.category(slug).then((r) => setCategory(r.data)).catch(() => setCategory(false));
    catalogApi.filters(slug).then((r) => setOptions(r.data)).catch(() => {});
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const query = { ...values, category: slug, page, limit: 12 };
    Object.keys(query).forEach((k) => query[k] === undefined && delete query[k]);
    catalogApi
      .products(query)
      .then((r) => setResult(r))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [values, slug, page]);

  const update = (patch, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === undefined || v === '' ? next.delete(k) : next.set(k, v)));
    if (resetPage && !('page' in patch)) next.delete('page');
    setParams(next);
    if ('page' in patch) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (values.q) next.set('q', values.q);
    if (values.sort) next.set('sort', values.sort);
    setParams(next);
  };

  if (slug && category === false) {
    return <EmptyState title="Category not found" message="The collection you're looking for doesn't exist." action={<Link to="/shop" className="btn-primary">Shop all jewellery</Link>} />;
  }

  const title = values.q ? `Results for “${values.q}”` : category?.name || (values.featured ? 'Featured Pieces' : 'All Jewellery');
  const total = result.pagination?.total ?? 0;
  const activeChips = ['material', 'color', 'size']
    .flatMap((k) => (values[k] ? values[k].split(',').map((v) => ({ k, v })) : []));

  return (
    <div className="container-page py-8">
      <SEO
        title={category?.seo?.metaTitle || title}
        description={category?.seo?.metaDescription || category?.description || `Shop ${title.toLowerCase()} in gold, diamond and silver at Aurum Jewelry.`}
        noindex={Boolean(values.q) || page > 1}
      />
      <Breadcrumbs items={category ? category.breadcrumbs.map((b) => ({ label: b.name, to: `/category/${b.slug}` })) : [{ label: values.q ? 'Search' : 'Shop' }]} />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-4xl font-semibold sm:text-5xl">{title}</h1>
          {category?.description && <p className="mt-2 max-w-2xl text-stone-600">{category.description}</p>}
          <p className="mt-2 text-sm text-stone-500">{loading ? 'Loading…' : `${total} ${total === 1 ? 'piece' : 'pieces'}`}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setDrawer(true)} className="btn-outline px-4 py-2.5 lg:hidden"><FilterIcon className="h-4 w-4" /> Filters</button>
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" value={values.sort || 'newest'} onChange={(e) => update({ sort: e.target.value })} className="input w-auto rounded-full py-2.5">
            {SORT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {category?.children?.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-4">
          {category.children.map((c) => (
            <Link key={c._id} to={`/category/${c.slug}`} className="chip shrink-0 border-stone-300 bg-white px-4 py-2 text-sm hover:border-ink">{c.name}</Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <FilterSidebar options={options} values={values} onChange={update} onClear={clearFilters} />
          </div>
        </aside>

        <section aria-live="polite">
          {activeChips.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {activeChips.map(({ k, v }) => (
                <button key={`${k}-${v}`} onClick={() => update({ [k]: values[k].split(',').filter((x) => x !== v).join(',') || undefined })} className="chip gap-1.5 border-gold-300 bg-gold-50 text-gold-800">
                  {v} <CloseIcon className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          {error ? (
            <EmptyState title="Couldn't load products" message="Please check your connection and try again." action={<button className="btn-primary" onClick={() => update({})}>Retry</button>} />
          ) : !loading && result.data.length === 0 ? (
            <EmptyState icon={<SearchIcon className="h-8 w-8" />} title="No pieces found" message="Try removing some filters or searching for something else." action={<button className="btn-primary" onClick={clearFilters}>Clear filters</button>} />
          ) : (
            <ProductGrid products={result.data} loading={loading} columns="grid-cols-2 md:grid-cols-3" />
          )}
          <Pagination page={page} pages={result.pagination?.pages} onChange={(p) => update({ page: p }, false)} />
        </section>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white">
            <div className="flex items-center justify-between border-b p-4">
              <span className="font-medium">Filters</span>
              <button onClick={() => setDrawer(false)} aria-label="Close filters"><CloseIcon /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <FilterSidebar options={options} values={values} onChange={update} onClear={clearFilters} />
            </div>
            <div className="border-t p-4">
              <button className="btn-primary w-full" onClick={() => setDrawer(false)}>Show {total} results</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
