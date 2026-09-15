import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '../api/services.js';
import { ProductGrid } from '../components/product/ProductCard.jsx';
import SEO from '../components/SEO.jsx';
import { HeartIcon, RefreshIcon, ShieldIcon, TruckIcon } from '../components/ui/Icons.jsx';
import { Breadcrumbs, EmptyState, PageLoader, Price, QuantitySelector, Rating } from '../components/ui/index.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { SITE_NAME, SITE_URL } from '../utils/format.js';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { ids, toggle } = useWishlist();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [optionError, setOptionError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setState({ loading: true, data: null, error: null });
    setActiveImage(0);
    setQuantity(1);
    setSize('');
    catalogApi
      .product(slug)
      .then((r) => {
        setState({ loading: false, data: r.data, error: null });
        setColor(r.data.product.colors?.[0] || '');
      })
      .catch((err) => setState({ loading: false, data: null, error: err.response?.status === 404 ? 'notfound' : 'error' }));
  }, [slug]);

  if (state.loading) return <PageLoader />;
  if (state.error) {
    return <EmptyState title={state.error === 'notfound' ? 'Product not found' : 'Something went wrong'} message="This piece may no longer be available." action={<Link to="/shop" className="btn-primary">Continue shopping</Link>} />;
  }

  const { product, related, breadcrumbs } = state.data;
  const saved = ids.has(product._id);
  const inStock = product.stock > 0;
  const maxQty = Math.min(product.stock, 20);

  const add = async (buyNow = false) => {
    if (product.sizes?.length && !size) {
      setOptionError('Please select a size');
      return;
    }
    setOptionError('');
    setAdding(true);
    const ok = await addItem(product, { quantity, size, color });
    setAdding(false);
    if (ok && buyNow) navigate('/cart');
  };

  const specs = [
    ['Material', product.material],
    ['Purity', product.purity],
    ['Gemstone', product.gemstone],
    ['Weight', product.weight ? `${product.weight} g` : ''],
    ['SKU', product.sku],
  ].filter(([, v]) => v);

  return (
    <div className="container-page py-8">
      <SEO
        title={product.seo?.metaTitle || product.name}
        description={product.seo?.metaDescription || product.shortDescription}
        image={product.images?.[0]?.url}
        type="product"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: product.images.map((i) => i.url),
          description: product.shortDescription || product.description,
          sku: product.sku,
          material: product.material,
          brand: { '@type': 'Brand', name: SITE_NAME },
          ...(product.numReviews > 0 && { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.numReviews } }),
          offers: {
            '@type': 'Offer',
            url: `${SITE_URL}/product/${product.slug}`,
            priceCurrency: 'INR',
            price: product.price,
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        }}
      />
      <Breadcrumbs items={[...breadcrumbs.map((b) => ({ label: b.name, to: `/category/${b.slug}` })), { label: product.name }]} />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="flex flex-col-reverse gap-4 sm:flex-row">
          <div className="no-scrollbar flex gap-3 overflow-x-auto sm:w-20 sm:flex-col">
            {product.images.map((img, i) => (
              <button key={img.url} onClick={() => setActiveImage(i)} className={`aspect-square w-20 shrink-0 overflow-hidden rounded-xl border-2 ${i === activeImage ? 'border-gold-500' : 'border-transparent'}`} aria-label={`View image ${i + 1}`}>
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <div className="relative flex-1 overflow-hidden rounded-2xl bg-stone-100">
            <img src={product.images[activeImage]?.url} alt={product.images[activeImage]?.alt || product.name} className="aspect-square w-full object-cover" />
            {product.discountPercent > 0 && <span className="absolute left-4 top-4 rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold text-white">{product.discountPercent}% OFF</span>}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold-600">{product.category?.name}</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight">{product.name}</h1>
          {product.numReviews > 0 && <Rating value={product.rating} count={product.numReviews} className="mt-3" />}
          <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" className="mt-4" />
          <p className="mt-1 text-xs text-stone-500">Inclusive of all taxes</p>
          {product.shortDescription && <p className="mt-5 leading-relaxed text-stone-600">{product.shortDescription}</p>}

          {product.colors?.length > 0 && (
            <div className="mt-6">
              <p className="label">Metal colour: <span className="font-normal text-stone-500">{color}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={`chip px-4 py-2 text-sm ${color === c ? 'border-ink bg-ink text-white' : 'border-stone-300 bg-white hover:border-ink'}`} aria-pressed={color === c}>{c}</button>
                ))}
              </div>
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div className="mt-5">
              <p className="label">Size {size && <span className="font-normal text-stone-500">: {size}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => { setSize(s); setOptionError(''); }} className={`chip min-w-12 justify-center px-4 py-2 text-sm ${size === s ? 'border-ink bg-ink text-white' : 'border-stone-300 bg-white hover:border-ink'}`} aria-pressed={size === s}>{s}</button>
                ))}
              </div>
              {optionError && <p className="mt-2 text-sm text-rose-600">{optionError}</p>}
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <QuantitySelector value={quantity} onChange={setQuantity} max={maxQty || 1} disabled={!inStock} />
            <p className={`text-sm ${inStock ? (product.stock <= 5 ? 'text-rose-600' : 'text-emerald-700') : 'text-stone-500'}`}>
              {inStock ? (product.stock <= 5 ? `Only ${product.stock} left — order soon` : 'In stock, ready to ship') : 'Currently out of stock'}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary flex-1" disabled={!inStock || adding} onClick={() => add(false)}>{adding ? 'Adding…' : 'Add to Bag'}</button>
            <button className="btn-gold flex-1" disabled={!inStock || adding} onClick={() => add(true)}>Buy Now</button>
            <button onClick={() => toggle(product)} className={`btn-outline px-4 ${saved ? 'text-rose-500' : ''}`} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={saved}>
              <HeartIcon filled={saved} />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-center text-xs text-stone-600">
            <div className="flex flex-col items-center gap-1.5"><TruckIcon className="h-6 w-6 text-gold-600" />Free insured shipping</div>
            <div className="flex flex-col items-center gap-1.5"><ShieldIcon className="h-6 w-6 text-gold-600" />Certified authentic</div>
            <div className="flex flex-col items-center gap-1.5"><RefreshIcon className="h-6 w-6 text-gold-600" />15-day returns</div>
          </div>

          <div className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
            <details open className="py-4">
              <summary className="cursor-pointer list-none font-medium">Description</summary>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">{product.description}</p>
            </details>
            <details open className="py-4">
              <summary className="cursor-pointer list-none font-medium">Specifications</summary>
              <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                {specs.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-stone-500">{k}</dt>
                    <dd className="text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 text-3xl font-semibold">You may also love</h2>
          <ProductGrid products={related.slice(0, 4)} />
        </section>
      )}
    </div>
  );
}
