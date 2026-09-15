import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { HeartIcon } from '../ui/Icons.jsx';
import { Price, Rating } from '../ui/index.jsx';

export default function ProductCard({ product }) {
  const { ids, toggle } = useWishlist();
  const { addItem } = useCart();
  const saved = ids.has(product._id);
  const needsOptions = product.sizes?.length > 0 || product.colors?.length > 1;
  const [img1, img2] = product.images || [];
  const discount = product.compareAtPrice > product.price ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">
        <Link to={`/product/${product.slug}`} aria-label={product.name}>
          <img src={img1?.url} alt={img1?.alt || product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          {img2 && <img src={img2.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
        </Link>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.stock === 0 && <span className="rounded-full bg-stone-800 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">Sold out</span>}
          {product.stock > 0 && discount >= 5 && <span className="rounded-full bg-gold-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">{discount}% off</span>}
          {product.stock > 0 && product.stock <= (product.lowStockThreshold || 5) && <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-rose-600">Only {product.stock} left</span>}
        </div>
        <button
          onClick={() => toggle(product)}
          className={`absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm transition hover:scale-110 ${saved ? 'text-rose-500' : 'text-stone-600'}`}
          aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={saved}
        >
          <HeartIcon filled={saved} className="h-4 w-4" />
        </button>
        {product.stock > 0 && (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
            {needsOptions ? (
              <Link to={`/product/${product.slug}`} className="btn w-full bg-white/95 py-2.5 text-ink hover:bg-white">Choose options</Link>
            ) : (
              <button onClick={() => addItem(product, { color: product.colors?.[0] || '' })} className="btn w-full bg-white/95 py-2.5 text-ink hover:bg-white">Add to bag</button>
            )}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <p className="text-[11px] uppercase tracking-widest text-stone-500">{product.material}{product.purity ? ` · ${product.purity}` : ''}</p>
        <h3 className="line-clamp-2 font-sans text-sm font-medium leading-snug text-ink">
          <Link to={`/product/${product.slug}`} className="hover:text-gold-700">{product.name}</Link>
        </h3>
        {product.numReviews > 0 && <Rating value={product.rating} count={product.numReviews} />}
        <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" className="mt-auto pt-1" />
      </div>
    </article>
  );
}

export function ProductGrid({ products, loading, columns = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' }) {
  if (loading) {
    return (
      <div className={`grid gap-x-4 gap-y-8 sm:gap-x-6 ${columns}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square rounded-2xl bg-stone-200" />
            <div className="mt-3 h-3 w-1/3 rounded bg-stone-200" />
            <div className="mt-2 h-4 w-3/4 rounded bg-stone-200" />
            <div className="mt-2 h-4 w-1/4 rounded bg-stone-200" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`grid gap-x-4 gap-y-8 sm:gap-x-6 ${columns}`}>
      {products.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}
