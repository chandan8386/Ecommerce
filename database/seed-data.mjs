/**
 * Demo catalogue for Aurum Jewelry.
 * Consumed by backend/src/seed/seed.js — run `npm run seed` from /backend.
 *
 * Categories reference their parent by slug. Products reference their category by slug.
 * `shape` + `metal` + `gem` drive the generated SVG product artwork.
 */

export const categories = [
  { name: 'Rings', slug: 'rings', description: 'Engagement rings, wedding bands and statement cocktail rings.', sortOrder: 1 },
  { name: 'Engagement Rings', slug: 'engagement-rings', parent: 'rings', sortOrder: 1 },
  { name: 'Wedding Bands', slug: 'wedding-bands', parent: 'rings', sortOrder: 2 },
  { name: 'Cocktail Rings', slug: 'cocktail-rings', parent: 'rings', sortOrder: 3 },

  { name: 'Necklaces', slug: 'necklaces', description: 'Pendants, chains and chokers for every neckline.', sortOrder: 2 },
  { name: 'Pendants', slug: 'pendants', parent: 'necklaces', sortOrder: 1 },
  { name: 'Chains', slug: 'chains', parent: 'necklaces', sortOrder: 2 },
  { name: 'Chokers', slug: 'chokers', parent: 'necklaces', sortOrder: 3 },

  { name: 'Earrings', slug: 'earrings', description: 'Studs, hoops and drops crafted to catch the light.', sortOrder: 3 },
  { name: 'Studs', slug: 'studs', parent: 'earrings', sortOrder: 1 },
  { name: 'Hoops', slug: 'hoops', parent: 'earrings', sortOrder: 2 },
  { name: 'Drop Earrings', slug: 'drop-earrings', parent: 'earrings', sortOrder: 3 },

  { name: 'Bracelets & Bangles', slug: 'bracelets-bangles', description: 'Bangles, cuffs and charm bracelets.', sortOrder: 4 },
  { name: 'Bangles', slug: 'bangles', parent: 'bracelets-bangles', sortOrder: 1 },
  { name: 'Bracelets', slug: 'bracelets', parent: 'bracelets-bangles', sortOrder: 2 },
];

const RING_SIZES = ['6', '8', '10', '12', '14', '16'];
const BANGLE_SIZES = ['2.4', '2.6', '2.8'];
const CHAIN_LENGTHS = ['16 in', '18 in', '20 in'];

export const products = [
  // ---------- Engagement rings ----------
  { name: 'Eternal Solitaire Diamond Ring', sku: 'RNG-ENG-001', category: 'engagement-rings', price: 84999, compareAtPrice: 94999, stock: 12, material: 'White Gold', purity: '18K', colors: ['White Gold', 'Yellow Gold'], sizes: RING_SIZES, weight: 3.2, gemstone: 'Diamond', isFeatured: true, rating: 4.9, numReviews: 128, soldCount: 310, tags: ['solitaire', 'diamond', 'proposal', 'bridal'], shape: 'ring', metal: 'white', gem: 'diamond',
    shortDescription: 'A 0.5 ct brilliant-cut diamond held high in a classic six-prong setting.',
    description: 'Our signature solitaire features a certified 0.5 carat round brilliant diamond (VS1, G colour) set in a timeless six-prong crown. The slim 18K band sits comfortably for everyday wear and pairs beautifully with our wedding bands. Comes with an IGI certificate and lifetime cleaning service.' },
  { name: 'Halo Rose Gold Engagement Ring', sku: 'RNG-ENG-002', category: 'engagement-rings', price: 67999, compareAtPrice: 72999, stock: 8, material: 'Rose Gold', purity: '18K', colors: ['Rose Gold'], sizes: RING_SIZES, weight: 3.6, gemstone: 'Diamond', isFeatured: true, rating: 4.8, numReviews: 64, soldCount: 142, tags: ['halo', 'diamond', 'rose gold'], shape: 'ring', metal: 'rose', gem: 'diamond',
    shortDescription: 'A centre diamond wrapped in a sparkling halo of micro-pavé stones.',
    description: 'A romantic halo design with a 0.35 ct centre stone surrounded by 18 micro-pavé diamonds, set in warm 18K rose gold. The pavé continues halfway down the band for extra brilliance.' },
  { name: 'Platinum Three-Stone Ring', sku: 'RNG-ENG-003', category: 'engagement-rings', price: 125000, compareAtPrice: 0, stock: 4, material: 'Platinum', purity: 'PT950', colors: ['Platinum'], sizes: RING_SIZES, weight: 5.1, gemstone: 'Diamond', rating: 5, numReviews: 21, soldCount: 37, tags: ['three stone', 'platinum', 'past present future'], shape: 'ring', metal: 'platinum', gem: 'diamond',
    shortDescription: 'Past, present and future — three diamonds in hypoallergenic platinum.',
    description: 'Three matched round diamonds totalling 0.9 ct set in durable PT950 platinum. Naturally white, hypoallergenic and made to last generations.' },
  { name: 'Emerald Cut Sapphire Ring', sku: 'RNG-ENG-004', category: 'engagement-rings', price: 58500, compareAtPrice: 64000, stock: 6, material: 'Yellow Gold', purity: '18K', colors: ['Yellow Gold', 'White Gold'], sizes: RING_SIZES, weight: 3.9, gemstone: 'Sapphire', rating: 4.7, numReviews: 33, soldCount: 58, tags: ['sapphire', 'emerald cut', 'coloured stone'], shape: 'ring', metal: 'gold', gem: 'sapphire',
    shortDescription: 'A deep blue Ceylon sapphire flanked by tapered baguette diamonds.',
    description: 'A 1.2 ct emerald-cut Ceylon sapphire flanked by two tapered baguette diamonds in 18K yellow gold. A modern heirloom with vintage character.' },

  // ---------- Wedding bands ----------
  { name: 'Classic Comfort-Fit Gold Band', sku: 'RNG-WED-001', category: 'wedding-bands', price: 28999, compareAtPrice: 0, stock: 40, material: 'Yellow Gold', purity: '22K', colors: ['Yellow Gold'], sizes: RING_SIZES, weight: 4.5, gemstone: '', rating: 4.8, numReviews: 210, soldCount: 520, tags: ['wedding', 'band', 'plain', 'unisex'], shape: 'band', metal: 'gold', gem: 'none',
    shortDescription: 'A 4 mm comfort-fit band in rich 22K hallmarked gold.',
    description: 'A timeless 4 mm wedding band with a domed, comfort-fit interior. BIS hallmarked 22K gold with a high-polish finish. Free engraving available.' },
  { name: 'Diamond Eternity Band', sku: 'RNG-WED-002', category: 'wedding-bands', price: 72999, compareAtPrice: 79999, stock: 10, material: 'White Gold', purity: '18K', colors: ['White Gold', 'Rose Gold', 'Yellow Gold'], sizes: RING_SIZES, weight: 2.8, gemstone: 'Diamond', isFeatured: true, rating: 4.9, numReviews: 87, soldCount: 164, tags: ['eternity', 'diamond', 'anniversary'], shape: 'band', metal: 'white', gem: 'diamond',
    shortDescription: 'A continuous circle of 22 shared-prong diamonds.',
    description: 'Twenty-two round diamonds (1.1 ct total) set all the way around in a shared-prong setting. The perfect anniversary or stacking ring.' },
  { name: 'Brushed Platinum Men\'s Band', sku: 'RNG-WED-003', category: 'wedding-bands', price: 46999, compareAtPrice: 0, stock: 15, material: 'Platinum', purity: 'PT950', colors: ['Platinum'], sizes: ['16', '18', '20', '22', '24'], weight: 8.2, gemstone: '', rating: 4.6, numReviews: 45, soldCount: 96, tags: ['men', 'platinum', 'brushed'], shape: 'band', metal: 'platinum', gem: 'none',
    shortDescription: 'A 6 mm satin-brushed band with polished bevelled edges.',
    description: 'A contemporary 6 mm platinum band with a satin-brushed centre and polished bevelled edges. Heavy, substantial and made for daily wear.' },

  // ---------- Cocktail rings ----------
  { name: 'Ruby Blossom Cocktail Ring', sku: 'RNG-CKT-001', category: 'cocktail-rings', price: 38999, compareAtPrice: 44999, stock: 7, material: 'Yellow Gold', purity: '18K', colors: ['Yellow Gold'], sizes: RING_SIZES, weight: 6.3, gemstone: 'Ruby', rating: 4.7, numReviews: 29, soldCount: 51, tags: ['ruby', 'floral', 'statement', 'party'], shape: 'ring', metal: 'gold', gem: 'ruby',
    shortDescription: 'Seven Burmese rubies arranged as a blooming flower.',
    description: 'A statement floral ring with seven oval rubies forming the petals around a diamond centre. Finished with hand-engraved leaves on the shank.' },
  { name: 'Emerald Art Deco Ring', sku: 'RNG-CKT-002', category: 'cocktail-rings', price: 52499, compareAtPrice: 0, stock: 3, material: 'White Gold', purity: '18K', colors: ['White Gold'], sizes: RING_SIZES, weight: 5.8, gemstone: 'Emerald', rating: 4.8, numReviews: 18, soldCount: 22, tags: ['emerald', 'art deco', 'vintage'], shape: 'ring', metal: 'white', gem: 'emerald',
    shortDescription: 'A Colombian emerald in a geometric 1920s-inspired frame.',
    description: 'A rectangular Colombian emerald set in a stepped Art Deco frame of milgrain-edged white gold and baguette diamonds.' },
  { name: 'Sterling Silver Moonstone Ring', sku: 'RNG-CKT-003', category: 'cocktail-rings', price: 3499, compareAtPrice: 4299, stock: 55, material: 'Silver', purity: '925', colors: ['Silver'], sizes: RING_SIZES, weight: 4.1, gemstone: 'Moonstone', rating: 4.5, numReviews: 156, soldCount: 480, tags: ['silver', 'moonstone', 'boho', 'gift'], shape: 'ring', metal: 'silver', gem: 'pearl',
    shortDescription: 'A glowing rainbow moonstone cabochon in oxidised 925 silver.',
    description: 'A rainbow moonstone cabochon in a hand-finished oxidised sterling silver setting with a delicate twisted-rope border.' },

  // ---------- Pendants ----------
  { name: 'Diamond Heart Pendant', sku: 'NCK-PEN-001', category: 'pendants', price: 32999, compareAtPrice: 36999, stock: 18, material: 'Rose Gold', purity: '18K', colors: ['Rose Gold', 'White Gold', 'Yellow Gold'], sizes: CHAIN_LENGTHS, weight: 2.4, gemstone: 'Diamond', isFeatured: true, rating: 4.8, numReviews: 94, soldCount: 260, tags: ['heart', 'diamond', 'valentine', 'gift'], shape: 'pendant', metal: 'rose', gem: 'diamond',
    shortDescription: 'An open heart outlined with pavé diamonds, with chain.',
    description: 'An open heart pendant outlined with 26 pavé diamonds, suspended from a fine adjustable cable chain. Arrives gift-boxed.' },
  { name: 'Evil Eye Sapphire Pendant', sku: 'NCK-PEN-002', category: 'pendants', price: 18499, compareAtPrice: 0, stock: 22, material: 'Yellow Gold', purity: '14K', colors: ['Yellow Gold'], sizes: CHAIN_LENGTHS, weight: 1.9, gemstone: 'Sapphire', rating: 4.6, numReviews: 58, soldCount: 133, tags: ['evil eye', 'protection', 'sapphire'], shape: 'pendant', metal: 'gold', gem: 'sapphire',
    shortDescription: 'A protective evil-eye charm with a blue sapphire centre.',
    description: 'A protective evil-eye charm in 14K gold with a round blue sapphire iris and enamel detailing, on a 1 mm box chain.' },
  { name: 'Freshwater Pearl Drop Pendant', sku: 'NCK-PEN-003', category: 'pendants', price: 4999, compareAtPrice: 5999, stock: 60, material: 'Silver', purity: '925', colors: ['Silver', 'Yellow Gold'], sizes: CHAIN_LENGTHS, weight: 3.0, gemstone: 'Pearl', rating: 4.4, numReviews: 203, soldCount: 610, tags: ['pearl', 'minimal', 'office wear'], shape: 'pendant', metal: 'silver', gem: 'pearl',
    shortDescription: 'A lustrous 9 mm freshwater pearl on a sterling silver chain.',
    description: 'A single 9 mm AAA freshwater pearl with high lustre, capped in sterling silver and hung from a fine curb chain.' },

  // ---------- Chains ----------
  { name: '22K Gold Rope Chain', sku: 'NCK-CHN-001', category: 'chains', price: 96999, compareAtPrice: 0, stock: 9, material: 'Yellow Gold', purity: '22K', colors: ['Yellow Gold'], sizes: ['18 in', '20 in', '22 in', '24 in'], weight: 16.5, gemstone: '', rating: 4.9, numReviews: 72, soldCount: 118, tags: ['chain', 'rope', 'traditional', 'men', 'women'], shape: 'chain', metal: 'gold', gem: 'none',
    shortDescription: 'A hallmarked 22K rope chain with a secure lobster clasp.',
    description: 'A 3 mm twisted rope chain in BIS hallmarked 22K gold. Diamond-cut links catch the light from every angle. Lobster clasp.' },
  { name: 'Figaro Silver Chain', sku: 'NCK-CHN-002', category: 'chains', price: 2799, compareAtPrice: 3499, stock: 80, material: 'Silver', purity: '925', colors: ['Silver'], sizes: ['18 in', '20 in', '22 in'], weight: 7.2, gemstone: '', rating: 4.5, numReviews: 118, soldCount: 390, tags: ['chain', 'figaro', 'unisex', 'daily wear'], shape: 'chain', metal: 'silver', gem: 'none',
    shortDescription: 'A classic 3+1 figaro chain in rhodium-plated 925 silver.',
    description: 'Classic figaro links in solid 925 sterling silver with anti-tarnish rhodium plating.' },
  { name: 'Paperclip Link Necklace', sku: 'NCK-CHN-003', category: 'chains', price: 21999, compareAtPrice: 24999, stock: 14, material: 'Yellow Gold', purity: '14K', colors: ['Yellow Gold', 'Rose Gold'], sizes: CHAIN_LENGTHS, weight: 5.4, gemstone: '', isFeatured: true, rating: 4.7, numReviews: 40, soldCount: 88, tags: ['paperclip', 'layering', 'trendy'], shape: 'chain', metal: 'gold', gem: 'none',
    shortDescription: 'Elongated paperclip links, made for layering.',
    description: 'A modern paperclip-link necklace in 14K gold. Wear it alone or layer it with pendants.' },

  // ---------- Chokers ----------
  { name: 'Kundan Bridal Choker', sku: 'NCK-CHK-001', category: 'chokers', price: 145000, compareAtPrice: 159000, stock: 2, material: 'Yellow Gold', purity: '22K', colors: ['Yellow Gold'], sizes: ['Adjustable'], weight: 42, gemstone: 'Emerald', isFeatured: true, rating: 5, numReviews: 12, soldCount: 15, tags: ['kundan', 'bridal', 'traditional', 'wedding'], shape: 'choker', metal: 'gold', gem: 'emerald',
    shortDescription: 'Handcrafted kundan choker with emerald drops and pearl strings.',
    description: 'A heritage bridal choker handcrafted by Jaipur artisans: uncut polki set in 22K gold with emerald drops, finished with meenakari enamel on the reverse and adjustable silk dori.' },
  { name: 'Tennis Diamond Choker', sku: 'NCK-CHK-002', category: 'chokers', price: 189000, compareAtPrice: 0, stock: 0, material: 'White Gold', purity: '18K', colors: ['White Gold'], sizes: ['14 in', '15 in'], weight: 18, gemstone: 'Diamond', rating: 4.9, numReviews: 9, soldCount: 11, tags: ['tennis', 'diamond', 'luxury'], shape: 'choker', metal: 'white', gem: 'diamond',
    shortDescription: 'A line of 4 ct graduated diamonds in four-prong settings.',
    description: 'A red-carpet tennis choker with 72 graduated round diamonds (4 ct total) in 18K white gold, with a hidden box clasp and double safety latch.' },

  // ---------- Studs ----------
  { name: 'Diamond Solitaire Studs', sku: 'EAR-STD-001', category: 'studs', price: 42999, compareAtPrice: 47999, stock: 20, material: 'White Gold', purity: '18K', colors: ['White Gold', 'Yellow Gold'], sizes: [], weight: 1.6, gemstone: 'Diamond', isFeatured: true, rating: 4.9, numReviews: 176, soldCount: 402, tags: ['studs', 'diamond', 'everyday', 'gift'], shape: 'stud', metal: 'white', gem: 'diamond',
    shortDescription: 'A matched pair of 0.25 ct diamonds with screw-back posts.',
    description: 'A perfectly matched pair of round brilliant diamonds (0.5 ct total) in four-prong martini settings with secure screw backs.' },
  { name: 'Pearl Button Studs', sku: 'EAR-STD-002', category: 'studs', price: 2499, compareAtPrice: 2999, stock: 120, material: 'Silver', purity: '925', colors: ['Silver'], sizes: [], weight: 1.2, gemstone: 'Pearl', rating: 4.6, numReviews: 312, soldCount: 950, tags: ['pearl', 'studs', 'office wear', 'minimal'], shape: 'stud', metal: 'silver', gem: 'pearl',
    shortDescription: 'Classic 7 mm freshwater button pearls.',
    description: 'Seven millimetre white freshwater button pearls on hypoallergenic sterling silver posts.' },
  { name: 'Ruby Flower Studs', sku: 'EAR-STD-003', category: 'studs', price: 15999, compareAtPrice: 0, stock: 16, material: 'Rose Gold', purity: '14K', colors: ['Rose Gold', 'Yellow Gold'], sizes: [], weight: 1.8, gemstone: 'Ruby', rating: 4.5, numReviews: 41, soldCount: 77, tags: ['ruby', 'flower', 'studs'], shape: 'stud', metal: 'rose', gem: 'ruby',
    shortDescription: 'Five-petal ruby flowers with a diamond centre.',
    description: 'Delicate five-petal flowers of pear-shaped rubies around a single diamond, set in 14K rose gold.' },

  // ---------- Hoops ----------
  { name: 'Huggie Diamond Hoops', sku: 'EAR-HOP-001', category: 'hoops', price: 26999, compareAtPrice: 29999, stock: 25, material: 'Yellow Gold', purity: '18K', colors: ['Yellow Gold', 'White Gold'], sizes: ['Small', 'Medium'], weight: 2.9, gemstone: 'Diamond', rating: 4.8, numReviews: 83, soldCount: 205, tags: ['huggie', 'hoops', 'diamond', 'stacking'], shape: 'hoop', metal: 'gold', gem: 'diamond',
    shortDescription: 'Snug huggie hoops lined with channel-set diamonds.',
    description: 'Twelve millimetre huggie hoops with a row of channel-set diamonds and a click-down hinge closure.' },
  { name: 'Classic Gold Hoops', sku: 'EAR-HOP-002', category: 'hoops', price: 19499, compareAtPrice: 0, stock: 30, material: 'Yellow Gold', purity: '22K', colors: ['Yellow Gold'], sizes: ['20 mm', '30 mm', '40 mm'], weight: 3.5, gemstone: '', rating: 4.7, numReviews: 99, soldCount: 240, tags: ['hoops', 'gold', 'classic'], shape: 'hoop', metal: 'gold', gem: 'none',
    shortDescription: 'Polished tubular hoops in hallmarked 22K gold.',
    description: 'Lightweight hollow tubular hoops in 22K gold with a high-polish finish and secure latch-back closure.' },
  { name: 'Silver Twisted Hoops', sku: 'EAR-HOP-003', category: 'hoops', price: 1899, compareAtPrice: 2399, stock: 90, material: 'Silver', purity: '925', colors: ['Silver'], sizes: ['25 mm', '35 mm'], weight: 4.0, gemstone: '', rating: 4.4, numReviews: 187, soldCount: 530, tags: ['hoops', 'silver', 'twisted', 'gift'], shape: 'hoop', metal: 'silver', gem: 'none',
    shortDescription: 'Twisted-rope texture hoops in sterling silver.',
    description: 'Twisted-rope hoops in 925 sterling silver that reflect light as you move.' },

  // ---------- Drops ----------
  { name: 'Emerald Chandelier Earrings', sku: 'EAR-DRP-001', category: 'drop-earrings', price: 64999, compareAtPrice: 71999, stock: 5, material: 'Yellow Gold', purity: '22K', colors: ['Yellow Gold'], sizes: [], weight: 12.4, gemstone: 'Emerald', rating: 4.9, numReviews: 22, soldCount: 31, tags: ['chandelier', 'emerald', 'festive', 'bridal'], shape: 'drop', metal: 'gold', gem: 'emerald',
    shortDescription: 'Tiered chandelier drops with emerald briolettes.',
    description: 'Three-tier chandelier earrings in 22K gold, dripping with emerald briolettes and seed pearls. Push-back with ear chain support.' },
  { name: 'Sapphire Teardrop Earrings', sku: 'EAR-DRP-002', category: 'drop-earrings', price: 36999, compareAtPrice: 0, stock: 11, material: 'White Gold', purity: '18K', colors: ['White Gold'], sizes: [], weight: 3.8, gemstone: 'Sapphire', rating: 4.7, numReviews: 27, soldCount: 45, tags: ['sapphire', 'teardrop', 'evening'], shape: 'drop', metal: 'white', gem: 'sapphire',
    shortDescription: 'Pear-shaped sapphires hanging from diamond halos.',
    description: 'Pear-cut blue sapphires suspended beneath round diamond halos in 18K white gold.' },

  // ---------- Bangles ----------
  { name: 'Antique Temple Gold Bangles (Pair)', sku: 'BRC-BNG-001', category: 'bangles', price: 158000, compareAtPrice: 0, stock: 4, material: 'Yellow Gold', purity: '22K', colors: ['Yellow Gold'], sizes: BANGLE_SIZES, weight: 38, gemstone: 'Ruby', isFeatured: true, rating: 5, numReviews: 16, soldCount: 24, tags: ['temple', 'antique', 'bangles', 'traditional'], shape: 'bangle', metal: 'gold', gem: 'ruby',
    shortDescription: 'A pair of antique-finish temple bangles with ruby accents.',
    description: 'A pair of South Indian temple-style bangles in antique-finished 22K gold, embossed with goddess motifs and accented with rubies.' },
  { name: 'Diamond Cuff Bangle', sku: 'BRC-BNG-002', category: 'bangles', price: 88999, compareAtPrice: 96999, stock: 6, material: 'Rose Gold', purity: '18K', colors: ['Rose Gold', 'White Gold'], sizes: BANGLE_SIZES, weight: 14, gemstone: 'Diamond', rating: 4.8, numReviews: 19, soldCount: 28, tags: ['cuff', 'diamond', 'modern'], shape: 'bangle', metal: 'rose', gem: 'diamond',
    shortDescription: 'An open cuff with pavé diamond terminals.',
    description: 'A sleek open cuff in 18K rose gold with pavé diamond terminals and a gentle flex fit.' },
  { name: 'Oxidised Silver Kada', sku: 'BRC-BNG-003', category: 'bangles', price: 3999, compareAtPrice: 4999, stock: 3, material: 'Silver', purity: '925', colors: ['Silver'], sizes: BANGLE_SIZES, weight: 22, gemstone: '', rating: 4.5, numReviews: 64, soldCount: 170, tags: ['kada', 'oxidised', 'ethnic', 'men'], shape: 'bangle', metal: 'silver', gem: 'none',
    shortDescription: 'A bold hand-engraved oxidised silver kada.',
    description: 'A heavy hand-engraved kada in oxidised 925 sterling silver with a hinged screw opening.' },

  // ---------- Bracelets ----------
  { name: 'Diamond Tennis Bracelet', sku: 'BRC-BRC-001', category: 'bracelets', price: 112000, compareAtPrice: 124000, stock: 5, material: 'White Gold', purity: '18K', colors: ['White Gold', 'Yellow Gold'], sizes: ['6.5 in', '7 in', '7.5 in'], weight: 9.5, gemstone: 'Diamond', isFeatured: true, rating: 4.9, numReviews: 38, soldCount: 49, tags: ['tennis', 'diamond', 'bracelet', 'luxury'], shape: 'bracelet', metal: 'white', gem: 'diamond',
    shortDescription: 'A flexible line of 3 ct diamonds with a double safety clasp.',
    description: 'Forty-two round brilliant diamonds (3 ct total) in four-prong settings on a supple 18K white gold line.' },
  { name: 'Charm Link Bracelet', sku: 'BRC-BRC-002', category: 'bracelets', price: 5999, compareAtPrice: 6999, stock: 45, material: 'Silver', purity: '925', colors: ['Silver', 'Rose Gold'], sizes: ['6.5 in', '7 in', '7.5 in'], weight: 11, gemstone: '', rating: 4.6, numReviews: 142, soldCount: 360, tags: ['charm', 'bracelet', 'gift', 'personalised'], shape: 'bracelet', metal: 'silver', gem: 'none',
    shortDescription: 'A rolo-link bracelet ready for your charms.',
    description: 'A sterling silver rolo-link bracelet with a heart toggle clasp, ready to be personalised with charms.' },
  { name: 'Evil Eye Rose Gold Bracelet', sku: 'BRC-BRC-003', category: 'bracelets', price: 12999, compareAtPrice: 0, stock: 0, material: 'Rose Gold', purity: '14K', colors: ['Rose Gold'], sizes: ['Adjustable'], weight: 2.2, gemstone: 'Sapphire', rating: 4.5, numReviews: 36, soldCount: 90, tags: ['evil eye', 'bracelet', 'protection', 'minimal'], shape: 'bracelet', metal: 'rose', gem: 'sapphire',
    shortDescription: 'A dainty evil-eye charm on an adjustable chain.',
    description: 'A dainty evil-eye charm in 14K rose gold with a sapphire iris on an adjustable slider chain.' },
];

export const coupons = [
  { code: 'WELCOME10', description: '10% off your first order (max ₹2,000)', discountType: 'percent', discountValue: 10, minOrderAmount: 1000, maxDiscountAmount: 2000, perUserLimit: 1 },
  { code: 'FLAT500', description: '₹500 off orders above ₹5,000', discountType: 'fixed', discountValue: 500, minOrderAmount: 5000, perUserLimit: 0 },
  { code: 'SPARKLE15', description: '15% off diamond jewellery above ₹25,000 (max ₹10,000)', discountType: 'percent', discountValue: 15, minOrderAmount: 25000, maxDiscountAmount: 10000, usageLimit: 100, perUserLimit: 2 },
];

export const banners = [
  { title: 'The Bridal Edit', subtitle: 'Heirloom kundan, polki and diamond sets for your big day', link: '/category/necklaces', buttonText: 'Explore Bridal', position: 'hero', sortOrder: 1, theme: ['#3b0d1a', '#8a2b3c'] },
  { title: 'Diamonds, Everyday', subtitle: 'Certified solitaires and studs made for daily sparkle', link: '/category/earrings', buttonText: 'Shop Diamonds', position: 'hero', sortOrder: 2, theme: ['#0f1e2e', '#35536e'] },
  { title: 'Sterling Silver Under ₹5,000', subtitle: 'Gift-ready pieces in 925 silver', link: '/shop?material=Silver&maxPrice=5000', buttonText: 'Shop Silver', position: 'hero', sortOrder: 3, theme: ['#2d2d33', '#6b6b78'] },
  { title: 'Flat ₹500 Off', subtitle: 'Use code FLAT500 on orders above ₹5,000', link: '/shop', buttonText: 'Shop Now', position: 'promo', sortOrder: 1, theme: ['#5a3e12', '#b8893a'] },
  { title: 'New: Paperclip Chains', subtitle: 'The layering essential', link: '/category/chains', buttonText: 'Discover', position: 'promo', sortOrder: 2, theme: ['#4a2530', '#b76e79'] },
];
