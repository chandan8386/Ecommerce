import { Link } from 'react-router-dom';
import { ProductGrid } from '../components/product/ProductCard.jsx';
import SEO from '../components/SEO.jsx';
import { HeartIcon } from '../components/ui/Icons.jsx';
import { EmptyState, PageLoader } from '../components/ui/index.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

export default function Wishlist() {
  const { items, loading } = useWishlist();
  if (loading && !items.length) return <PageLoader />;

  return (
    <div className="container-page py-10">
      <SEO title="My Wishlist" noindex />
      {items.length === 0 ? (
        <EmptyState icon={<HeartIcon className="h-8 w-8" />} title="Your wishlist is empty" message="Tap the heart on any piece to save it here." action={<Link to="/shop" className="btn-primary">Explore jewellery</Link>} />
      ) : (
        <>
          <h1 className="mb-8 text-4xl font-semibold">My Wishlist <span className="text-2xl text-stone-400">({items.length})</span></h1>
          <ProductGrid products={items} />
        </>
      )}
    </div>
  );
}
