# Database

MongoDB with Mongoose schemas. Schemas are defined in `backend/src/models`, and indexes are created automatically when the app starts.

## Seeding

```bash
npm run seed                          # from the project root: wipe the DB and load demo data
npm run seed:destroy --prefix backend # wipe only
```

The seed script (`backend/src/seed/seed.js`) reads `seed-data.mjs` in this folder and creates:
- 15 categories: 4 top-level, 11 subcategories
- 32 products across rings, necklaces, earrings and bracelets, with generated SVG artwork in `/uploads/seed`
- 1 admin, 1 demo customer and 8 more customers
- 36 historical orders spread over the last 45 days, so the dashboard and reports have data
- 3 coupons and 5 banners

To change the demo catalog, edit `seed-data.mjs` and run the seed again.

## Collections

```
users ──┬──< orders >── products >── categories (self-referencing parent)
        ├── carts (1:1) ──< items → products
        └── wishlists (1:1) ──< products
coupons   (referenced from orders by code)
banners
```

### users
| Field | Type | Notes |
|---|---|---|
| name, email, phone | String | `email` is unique and lowercase |
| password | String | bcrypt hash, `select: false` |
| role | `customer` \| `admin` | indexed |
| addresses[] | embedded | label, fullName, phone, line1, line2, city, state, postalCode, country, isDefault |
| isBlocked | Boolean | |
| tokenVersion | Number | incrementing it revokes every JWT issued earlier |
| lastLoginAt, createdAt, updatedAt | Date | |

### categories
| Field | Type | Notes |
|---|---|---|
| name, slug | String | `slug` is unique |
| parent | ObjectId → categories | `null` for top level. Indexed |
| image | `{ url, publicId, alt }` | |
| description, sortOrder, isActive, seo{metaTitle, metaDescription} | | |

### products
| Field | Type | Notes |
|---|---|---|
| name, slug, sku | String | `slug` and `sku` are unique |
| category | ObjectId → categories | the leaf category |
| categoryPath[] | ObjectId[] | the category and its ancestors, so filtering by a parent category also matches subcategories. Indexed |
| price, compareAtPrice | Number | `compareAtPrice` is the MRP; the discount % is a virtual |
| stock, lowStockThreshold, soldCount | Number | stock changes atomically when orders are placed or cancelled |
| material, purity, gemstone, weight | | `material` is indexed |
| colors[], sizes[], tags[] | String[] | `colors` and `sizes` are indexed |
| images[] | `{ url, publicId, alt }` | the first image is the cover |
| isActive, isFeatured | Boolean | both indexed |
| rating, numReviews | Number | |
| seo | `{ metaTitle, metaDescription }` | |

Other indexes: a weighted text index on name, tags, material, gemstone and shortDescription; plus `price` and `createdAt`.

### carts
`user` (unique) and `items[] { product, quantity (1–20), size, color }`. Prices aren't stored here; they're always read live from `products`.

### wishlists
`user` (unique) and `products[]`.

### coupons
| Field | Notes |
|---|---|
| code | unique, uppercase |
| discountType | `percent` or `fixed` |
| discountValue, minOrderAmount, maxDiscountAmount | `maxDiscountAmount` of 0 means no cap |
| startsAt, expiresAt | optional validity window |
| usageLimit, usedCount | `usageLimit` of 0 means unlimited. `usedCount` is incremented atomically |
| perUserLimit | checked against the customer's non-cancelled orders |
| isActive | |

### orders
| Field | Notes |
|---|---|
| orderNumber | unique, e.g. `AUR-20260915-A1B2C3` |
| user, email | `user` is indexed |
| items[] | a snapshot taken at purchase: product, name, slug, sku, image, price, quantity, size, color, lineTotal |
| shippingAddress | a snapshot of the address |
| pricing | subtotal, discount, shipping, tax, total, currency |
| coupon | `{ code, discount }` |
| payment | method (`razorpay`/`cod`), status (`pending`/`paid`/`failed`/`refunded`), razorpayOrderId (indexed), razorpayPaymentId, razorpaySignature, paidAt, failureReason |
| status | `pending → confirmed → processing → shipped → out_for_delivery → delivered`, plus `cancelled` and `returned`. Indexed |
| statusHistory[] | `{ status, note, at, by }` — drives the customer-facing timeline |
| tracking | courier, trackingNumber, url |
| stockReleased | guarantees stock is returned only once |
| expiresAt | deadline for unpaid online orders; the expiry job cancels them after it |
| customerNote, adminNote, deliveredAt, cancelledAt | |

Indexes: `createdAt`, and a compound `{ status, expiresAt }` used by the expiry job.

### banners
title, subtitle, image, link, buttonText, position (`hero` or `promo`), sortOrder, isActive, and an optional startsAt/endsAt schedule.
