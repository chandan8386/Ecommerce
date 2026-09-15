import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogApi } from '../api/services.js';
import { ProductGrid } from '../components/product/ProductCard.jsx';
import SEO from '../components/SEO.jsx';
import { ChevronLeft, ChevronRight } from '../components/ui/Icons.jsx';
import { SITE_NAME, SITE_URL } from '../utils/format.js';

function HeroCarousel({ banners }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) {
    return <div className="aspect-[16/9] w-full animate-pulse bg-stone-200 sm:aspect-[16/7]" />;
  }
  const go = (d) => setIndex((i) => (i + d + banners.length) % banners.length);

  return (
    <section className="relative overflow-hidden bg-ink" aria-roledescription="carousel">
      {banners.map((b, i) => (
        <div key={b._id} className={`transition-opacity duration-700 ${i === index ? 'relative opacity-100' : 'absolute inset-0 opacity-0'}`} aria-hidden={i !== index}>
          <img src={b.image.url} alt={b.image.alt || b.title} className="h-[26rem] w-full object-cover sm:h-auto sm:aspect-[16/7]" fetchPriority={i === 0 ? 'high' : 'auto'} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
          <div className="container-page absolute inset-0 flex flex-col justify-center">
            <div className="max-w-lg text-white">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gold-200">New Collection</p>
              {i === 0 ? <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">{b.title}</h1> : <h2 className="text-4xl font-semibold leading-tight sm:text-6xl">{b.title}</h2>}
              {b.subtitle && <p className="mt-4 text-base text-white/85 sm:text-lg">{b.subtitle}</p>}
              <Link to={b.link || '/shop'} className="btn-gold mt-8">{b.buttonText || 'Shop Now'}</Link>
            </div>
          </div>
        </div>
      ))}
      {banners.length > 1 && (
        <>
          <button onClick={() => go(-1)} className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/40 sm:block" aria-label="Previous slide"><ChevronLeft /></button>
          <button onClick={() => go(1)} className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/40 sm:block" aria-label="Next slide"><ChevronRight /></button>
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((b, i) => (
              <button key={b._id} onClick={() => setIndex(i)} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-white' : 'w-3 bg-white/50'}`} aria-label={`Go to slide ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

const SectionTitle = ({ eyebrow, title, link }) => (
  <div className="mb-8 flex items-end justify-between gap-4">
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-gold-600">{eyebrow}</p>
      <h2 className="mt-1 text-3xl font-semibold sm:text-4xl">{title}</h2>
    </div>
    {link && <Link to={link} className="shrink-0 text-sm font-medium text-stone-700 underline-offset-4 hover:underline">View all</Link>}
  </div>
);

export default function Home() {
  const [hero, setHero] = useState([]);
  const [promos, setPromos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState({ items: [], loading: true });
  const [bestsellers, setBestsellers] = useState({ items: [], loading: true });
  const [arrivals, setArrivals] = useState({ items: [], loading: true });

  useEffect(() => {
    catalogApi.banners('hero').then((r) => setHero(r.data)).catch(() => {});
    catalogApi.banners('promo').then((r) => setPromos(r.data)).catch(() => {});
    catalogApi.categories(true).then((r) => setCategories(r.data)).catch(() => {});
    const load = (params, set) =>
      catalogApi.products({ limit: 8, ...params }).then((r) => set({ items: r.data, loading: false })).catch(() => set({ items: [], loading: false }));
    load({ featured: true, sort: 'popular' }, setFeatured);
    load({ sort: 'popular' }, setBestsellers);
    load({ sort: 'newest' }, setArrivals);
  }, []);

  return (
    <>
      <SEO
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'JewelryStore',
          name: SITE_NAME,
          url: SITE_URL,
          potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/shop?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
        }}
      />
      <HeroCarousel banners={hero} />

      <section className="container-page py-16">
        <SectionTitle eyebrow="Explore" title="Shop by Category" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {categories.map((c) => (
            <Link key={c._id} to={`/category/${c.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-200">
              {c.image?.url && <img src={c.image.url} alt={c.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-2xl font-semibold">{c.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/80">{c.children?.length || 0} collections →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page py-8">
        <SectionTitle eyebrow="Handpicked" title="Featured Pieces" link="/shop?featured=true" />
        <ProductGrid products={featured.items} loading={featured.loading} />
      </section>

      {promos.length > 0 && (
        <section className="container-page grid gap-6 py-16 md:grid-cols-2">
          {promos.map((p) => (
            <Link key={p._id} to={p.link || '/shop'} className="group relative overflow-hidden rounded-2xl">
              <img src={p.image.url} alt={p.image.alt || p.title} loading="lazy" className="aspect-[2/1] w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/50 to-transparent p-8 text-white">
                <h3 className="text-3xl font-semibold">{p.title}</h3>
                {p.subtitle && <p className="mt-2 max-w-xs text-sm text-white/85">{p.subtitle}</p>}
                <span className="mt-4 text-sm font-medium underline underline-offset-4">{p.buttonText}</span>
              </div>
            </Link>
          ))}
        </section>
      )}

      <section className="container-page py-8">
        <SectionTitle eyebrow="Most loved" title="Bestsellers" link="/shop?sort=popular" />
        <ProductGrid products={bestsellers.items} loading={bestsellers.loading} />
      </section>

      <section className="my-16 bg-ink py-20 text-center text-white">
        <div className="container-page max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-300">Our Promise</p>
          <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">Crafted to be treasured</h2>
          <p className="mt-5 text-stone-300">
            Every piece is BIS hallmarked or IGI certified, inspected by hand and delivered fully insured — with lifetime cleaning, easy exchanges and honest pricing.
          </p>
          <Link to="/shop" className="btn-gold mt-8">Discover the collection</Link>
        </div>
      </section>

      <section className="container-page py-8">
        <SectionTitle eyebrow="Just in" title="New Arrivals" link="/shop?sort=newest" />
        <ProductGrid products={arrivals.items} loading={arrivals.loading} />
      </section>
    </>
  );
}
