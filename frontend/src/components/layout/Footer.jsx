import { Link } from 'react-router-dom';
import { SITE_NAME } from '../../utils/format.js';
import { RefreshIcon, ShieldIcon, TruckIcon, GemIcon } from '../ui/Icons.jsx';

const perks = [
  { icon: TruckIcon, title: 'Free insured shipping', text: 'On orders above ₹999' },
  { icon: ShieldIcon, title: 'Certified & hallmarked', text: 'BIS gold, IGI diamonds' },
  { icon: RefreshIcon, title: '15-day returns', text: 'No questions asked' },
  { icon: GemIcon, title: 'Lifetime care', text: 'Free cleaning & polish' },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-stone-300">
      <div className="border-b border-white/10">
        <div className="container-page grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="h-7 w-7 shrink-0 text-gold-300" />
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="text-xs text-stone-400">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-3xl font-bold text-white">AURUM<span className="text-gold-400">.</span></p>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">
            Fine jewellery crafted in gold, platinum and sterling silver — designed to be worn every day and treasured forever.
          </p>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">Shop</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/category/rings" className="hover:text-gold-300">Rings</Link></li>
            <li><Link to="/category/necklaces" className="hover:text-gold-300">Necklaces</Link></li>
            <li><Link to="/category/earrings" className="hover:text-gold-300">Earrings</Link></li>
            <li><Link to="/category/bracelets-bangles" className="hover:text-gold-300">Bracelets & Bangles</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">Help</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/track-order" className="hover:text-gold-300">Track your order</Link></li>
            <li><Link to="/account/orders" className="hover:text-gold-300">My orders</Link></li>
            <li><Link to="/account" className="hover:text-gold-300">My account</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">Contact</p>
          <ul className="space-y-2 text-sm text-stone-400">
            <li>support@aurum.example</li>
            <li>+91 80 0000 0000</li>
            <li>Mon–Sat, 10am–7pm IST</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
