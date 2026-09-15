import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Banner, Cart, Category, Coupon, Order, Product, User, Wishlist } from '../models/index.js';
import { UPLOAD_ROOT } from '../services/storage.service.js';
import { generateOrderNumber, round2 } from '../utils/helpers.js';
import { banners, categories, coupons, products } from '../../../database/seed-data.mjs';
import { bannerSvg, productSvg } from './artwork.js';

const destroyOnly = process.argv.includes('--destroy');

async function writeAsset(relPath, content) {
  const full = path.join(UPLOAD_ROOT, 'seed', relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, 'utf8');
  // publicId left empty so deleting a demo product never removes shared seed files
  return { url: `${env.apiUrl}/uploads/seed/${relPath}`, publicId: '' };
}

async function clear() {
  await Promise.all([Order, Cart, Wishlist, Product, Category, Coupon, Banner, User].map((M) => M.deleteMany({})));
  await fs.rm(path.join(UPLOAD_ROOT, 'seed'), { recursive: true, force: true });
  console.log('[seed] database cleared');
}

async function seedCategories() {
  const bySlug = new Map();
  for (const c of categories.filter((x) => !x.parent)) {
    const doc = await Category.create({ ...c, parent: null });
    bySlug.set(c.slug, doc);
  }
  for (const c of categories.filter((x) => x.parent)) {
    const parent = bySlug.get(c.parent);
    const doc = await Category.create({ ...c, parent: parent._id });
    bySlug.set(c.slug, doc);
  }
  // Category images: reuse the artwork of a representative product
  const reps = { rings: ['ring', 'gold', 'diamond'], necklaces: ['pendant', 'rose', 'diamond'], earrings: ['drop', 'gold', 'emerald'], 'bracelets-bangles': ['bangle', 'gold', 'ruby'] };
  for (const [slug, [shape, metal, gem]] of Object.entries(reps)) {
    const image = await writeAsset(`categories/${slug}.svg`, productSvg({ shape, metal, gem, variant: 1 }));
    await Category.updateOne({ slug }, { $set: { image: { ...image, alt: slug } } });
  }
  console.log(`[seed] ${bySlug.size} categories`);
  return bySlug;
}

async function seedProducts(catMap) {
  const docs = [];
  for (const p of products) {
    const { shape, metal, gem, category, ...data } = p;
    const cat = catMap.get(category);
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const images = [];
    for (let v = 0; v < 3; v++) {
      const img = await writeAsset(`products/${slug}-${v + 1}.svg`, productSvg({ shape, metal, gem, variant: v }));
      images.push({ ...img, alt: `${p.name} view ${v + 1}` });
    }
    docs.push({
      ...data,
      slug,
      category: cat._id,
      categoryPath: cat.parent ? [cat._id, cat.parent] : [cat._id],
      images,
      lowStockThreshold: 5,
      seo: { metaTitle: `${p.name} | Aurum Jewelry`.slice(0, 70), metaDescription: p.shortDescription.slice(0, 170) },
    });
  }
  const created = await Product.insertMany(docs);
  console.log(`[seed] ${created.length} products`);
  return created;
}

async function seedUsers() {
  const admin = await User.create({
    name: 'Store Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@aurum.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    role: 'admin',
  });
  const address = { label: 'Home', fullName: 'Priya Sharma', phone: '9876543210', line1: '221 MG Road', line2: 'Near City Mall', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'India', isDefault: true };
  const demo = await User.create({ name: 'Priya Sharma', email: 'customer@aurum.com', password: 'Customer@123', phone: '9876543210', addresses: [address] });

  const names = ['Arjun Mehta', 'Kavya Iyer', 'Rohan Gupta', 'Ananya Reddy', 'Vikram Singh', 'Sneha Patel', 'Aditya Rao', 'Meera Nair'];
  const cities = [['Mumbai', 'Maharashtra', '400001'], ['Chennai', 'Tamil Nadu', '600001'], ['Delhi', 'Delhi', '110001'], ['Hyderabad', 'Telangana', '500001'], ['Jaipur', 'Rajasthan', '302001'], ['Ahmedabad', 'Gujarat', '380001'], ['Pune', 'Maharashtra', '411001'], ['Kochi', 'Kerala', '682001']];
  const others = await User.create(
    names.map((name, i) => ({
      name,
      email: `${name.split(' ')[0].toLowerCase()}@example.com`,
      password: 'Customer@123',
      phone: `98${String(10000000 + i * 1234567).slice(0, 8)}`,
      addresses: [{ fullName: name, phone: '9800000000', line1: `${10 + i} Lake View Road`, city: cities[i][0], state: cities[i][1], postalCode: cities[i][2], isDefault: true }],
      createdAt: new Date(Date.now() - (i + 1) * 5 * 86400000),
    }))
  );
  console.log(`[seed] users: admin=${admin.email}, demo customer=${demo.email}, +${others.length} customers`);
  return [demo, ...others];
}

async function seedOrders(customers, productDocs) {
  const statuses = ['delivered', 'delivered', 'delivered', 'shipped', 'processing', 'confirmed', 'out_for_delivery', 'cancelled', 'delivered', 'confirmed'];
  const orders = [];
  const affordable = productDocs.filter((p) => p.price < 70000);

  for (let i = 0; i < 36; i++) {
    const customer = customers[i % customers.length];
    const createdAt = new Date(Date.now() - Math.floor((i / 36) * 45 * 86400000) - Math.floor(Math.random() * 20) * 3600000);
    const lines = Array.from({ length: 1 + (i % 3) }, (_, k) => affordable[(i * 7 + k * 5) % affordable.length]);
    const items = [...new Map(lines.map((p) => [p._id.toString(), p])).values()].map((p) => {
      const quantity = 1 + ((i + p.price) % 2);
      return { product: p._id, name: p.name, slug: p.slug, sku: p.sku, image: p.images[0].url, price: p.price, quantity, size: p.sizes[0] || '', color: p.colors[0] || '', lineTotal: p.price * quantity };
    });
    const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
    const discount = i % 5 === 0 ? Math.min(round2(subtotal * 0.1), 2000) : 0;
    const taxable = subtotal - discount;
    const shipping = taxable >= env.commerce.freeShippingThreshold ? 0 : env.commerce.shippingFee;
    const tax = round2((taxable * env.commerce.taxRate) / 100);
    const status = statuses[i % statuses.length];
    const method = i % 3 === 0 ? 'cod' : 'razorpay';
    const paid = method === 'razorpay' ? status !== 'pending' : status === 'delivered';
    const addr = customer.addresses[0];

    orders.push({
      orderNumber: generateOrderNumber(),
      user: customer._id,
      email: customer.email,
      items,
      shippingAddress: { fullName: addr.fullName, phone: addr.phone, line1: addr.line1, line2: addr.line2, city: addr.city, state: addr.state, postalCode: addr.postalCode, country: addr.country },
      pricing: { subtotal, discount, shipping, tax, total: round2(taxable + shipping + tax), currency: env.commerce.currency },
      coupon: discount ? { code: 'WELCOME10', discount } : undefined,
      payment: {
        method,
        status: status === 'cancelled' && paid ? 'refunded' : paid ? 'paid' : 'pending',
        ...(method === 'razorpay' && { razorpayOrderId: `order_demo_${i}`, razorpayPaymentId: `pay_demo_${i}` }),
        paidAt: paid ? createdAt : undefined,
      },
      status,
      statusHistory: [
        { status: 'pending', note: 'Order placed', at: createdAt },
        { status: 'confirmed', note: 'Order confirmed', at: new Date(createdAt.getTime() + 3600000) },
        ...(status !== 'confirmed' ? [{ status, note: '', at: new Date(createdAt.getTime() + 2 * 86400000) }] : []),
      ],
      tracking: ['shipped', 'out_for_delivery', 'delivered'].includes(status) ? { courier: 'BlueDart', trackingNumber: `BD${100000 + i}IN`, url: '' } : undefined,
      stockReleased: status === 'cancelled',
      deliveredAt: status === 'delivered' ? new Date(createdAt.getTime() + 4 * 86400000) : undefined,
      cancelledAt: status === 'cancelled' ? new Date(createdAt.getTime() + 86400000) : undefined,
      createdAt,
      updatedAt: createdAt,
    });
  }
  await Order.insertMany(orders, { timestamps: false });
  console.log(`[seed] ${orders.length} demo orders`);
}

async function seedMarketing() {
  await Coupon.create(coupons);
  for (const b of banners) {
    const { theme, ...data } = b;
    const slug = b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const image = await writeAsset(`banners/${slug}.svg`, bannerSvg({ title: b.title, theme, position: b.position }));
    await Banner.create({ ...data, image: { ...image, alt: b.title } });
  }
  console.log(`[seed] ${coupons.length} coupons, ${banners.length} banners`);
}

async function run() {
  await connectDB();
  await clear();
  if (!destroyOnly) {
    const catMap = await seedCategories();
    const productDocs = await seedProducts(catMap);
    const customers = await seedUsers();
    await seedOrders(customers, productDocs);
    await seedMarketing();
    await Promise.all([Product.syncIndexes(), Order.syncIndexes()]);
    console.log('\n[seed] done ✔');
    console.log(`  Admin     → ${process.env.SEED_ADMIN_EMAIL || 'admin@aurum.com'} / ${process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'}`);
    console.log('  Customer  → customer@aurum.com / Customer@123');
    console.log('  Coupons   → WELCOME10, FLAT500, SPARKLE15');
  }
  await disconnectDB();
}

run().catch(async (err) => {
  console.error('[seed] failed', err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
