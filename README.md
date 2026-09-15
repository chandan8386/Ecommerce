# Aurum Jewelry — Full-Stack E-commerce Platform

A jewelry store with three connected apps:

| App | Stack | Dev URL |
|---|---|---|
| **Storefront** (`/frontend`) | React 18, Vite, Tailwind CSS v4, React Router | http://localhost:5173 |
| **Admin dashboard** (`/admin`) | React 18, Vite, Tailwind CSS v4, Recharts | http://localhost:5174 |
| **REST API** (`/backend`) | Node.js 20, Express 4, Mongoose 8, JWT, Zod | http://localhost:5000 |
| **Database** (`/database`) | MongoDB 7 plus seed data | mongodb://127.0.0.1:27017 |

Images go to **Cloudinary** when it's configured. Otherwise they're saved to the local `/uploads` folder. Payments use **Razorpay**. If no Razorpay keys are set and you're in development, a **mock gateway** runs the full checkout flow instead.

---

## 1. Quick start

### Prerequisites
- **Node.js 20.6 or newer** (`node -v`)
- **MongoDB 6 or newer**, from one of these:
  - Docker: `docker compose up -d` (uses the bundled `docker-compose.yml`)
  - A local install: https://www.mongodb.com/try/download/community
  - MongoDB Atlas: paste the connection string into `MONGO_URI`

### Setup commands

```bash
# 1. Install dependencies for all three apps (run from the project root)
npm install
npm run install:all

# 2. Create environment files
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
cp admin/.env.example    admin/.env
#   Windows PowerShell:  Copy-Item backend/.env.example backend/.env   (and so on)

# 3. Start MongoDB (skip this if you already run it locally or use Atlas)
docker compose up -d

# 4. Seed demo data: categories, 32 products, customers, orders, coupons, banners
npm run seed

# 5. Start the API, storefront and admin together
npm run dev
```

Then open:
- Storefront: http://localhost:5173
- Admin: http://localhost:5174
- API health check: http://localhost:5000/api/health

To run one app at a time, use `npm run dev:backend`, `npm run dev:frontend` or `npm run dev:admin`.

### Demo accounts (created by the seed)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@aurum.com` | `Admin@12345` |
| Customer | `customer@aurum.com` | `Customer@123` |

Demo coupons: `WELCOME10` (10% off, max ₹2,000, once per customer), `FLAT500` (₹500 off orders over ₹5,000), `SPARKLE15` (15% off orders over ₹25,000).

> Running `npm run seed` **wipes and re-creates** the database. `npm run seed:destroy --prefix backend` only wipes it.

---

## 2. Folder structure

```
/
├── package.json              # Root scripts: install:all, dev, seed, build
├── docker-compose.yml        # MongoDB 7 for local development
├── uploads/                  # Local image storage (used when Cloudinary isn't configured)
├── database/
│   ├── seed-data.mjs         # Demo categories, products, coupons, banners
│   └── README.md             # Collections, indexes, relationships
├── backend/
│   ├── .env.example
│   └── src/
│       ├── server.js         # Boot, DB connect, graceful shutdown, background jobs
│       ├── app.js            # Express app: security middleware, routes, errors
│       ├── config/           # env.js (typed env + validation), db.js
│       ├── models/           # User, Category, Product, Cart, Wishlist, Coupon, Order, Banner
│       ├── validators/       # Zod schemas for every request body and query
│       ├── middleware/       # auth (JWT + RBAC), validate, upload (multer), rateLimit, error
│       ├── services/         # pricing, inventory, order, payment (Razorpay), storage, catalog
│       ├── controllers/      # auth, user, category, product, cart, wishlist, coupon, order, payment, banner, admin, seo
│       ├── routes/           # One router per resource, mounted under /api
│       ├── utils/            # ApiError, asyncHandler, token, helpers
│       └── seed/             # seed.js + artwork.js (generates SVG product images)
├── frontend/
│   ├── .env.example
│   ├── public/               # favicon, robots.txt
│   └── src/
│       ├── api/              # axios client + typed service functions
│       ├── context/          # AuthContext, CartContext (guest + server cart), WishlistContext
│       ├── components/       # layout/ (Header, Footer), product/ (ProductCard, FilterSidebar),
│       │                     # ui/ (Icons, Price, Pagination…), SEO, AddressForm, OrderTimeline
│       ├── pages/            # Home, Shop, ProductDetail, Cart, Checkout, OrderSuccess, TrackOrder,
│       │                     # Wishlist, auth/ (Login, Register), account/ (Profile, Addresses, Orders, OrderDetail)
│       └── utils/            # format.js, razorpay.js
└── admin/
    ├── .env.example
    └── src/
        ├── api/              # axios client + services
        ├── context/          # AuthContext (admin-only)
        ├── components/       # Layout (sidebar), ui (Modal, StatCard, Pagination…), ImageUploader
        ├── pages/            # Login, Dashboard, Products, ProductForm, Categories, Inventory,
        │                     # Orders, OrderDetail, Customers, Coupons, Banners, Reports
        └── utils/format.js
```

---

## 3. Environment variables

### `backend/.env`
| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | | `development` or `production` |
| `PORT` | | API port (default `5000`) |
| `API_URL` | ✔ prod | Public API URL. Used to build local image URLs |
| `CLIENT_URLS` | ✔ | Comma-separated CORS allow-list (storefront and admin origins) |
| `STORE_URL` | | Storefront URL used in `sitemap.xml` |
| `MONGO_URI` | ✔ | MongoDB connection string |
| `JWT_SECRET` | ✔ prod | At least 32 random characters. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | | Token lifetime (default `7d`) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | | Admin account created by the seed |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | | Set all three to store images in Cloudinary |
| `CLOUDINARY_FOLDER` | | Cloudinary folder prefix |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | ✔ prod | Razorpay API keys |
| `RAZORPAY_WEBHOOK_SECRET` | recommended | Secret for verifying webhook signatures |
| `CURRENCY`, `TAX_RATE`, `SHIPPING_FEE`, `FREE_SHIPPING_THRESHOLD` | | Pricing rules |
| `PENDING_ORDER_TTL_MINUTES` | | How long an unpaid online order is held before it's auto-cancelled (default 30) |

The API **refuses to start in production** if `JWT_SECRET` is weak or the Razorpay keys are missing.

### `frontend/.env` and `admin/.env`
| Variable | Description |
|---|---|
| `VITE_API_URL` | `/api` in development (Vite proxies it). The full URL in production, e.g. `https://api.example.com/api` |
| `VITE_PROXY_TARGET` | Backend origin for the dev proxy (default `http://localhost:5000`) |
| `VITE_SITE_URL`, `VITE_SITE_NAME` | Storefront only. Used for canonical URLs and Open Graph tags |
| `VITE_STORE_URL` | Admin only. Target of the "view on store" links |

---

## 4. API reference

Base URL: `/api`. Every response has the shape `{ success, data, pagination?, message?, details? }`.
Auth header: `Authorization: Bearer <token>`. 🔒 = logged-in user, 👑 = admin only.

### Auth and users
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create a customer account → `{ user, token }` |
| POST | `/auth/login` | Customer login |
| POST | `/auth/admin/login` | Admin login (rejects non-admins) |
| GET 🔒 | `/auth/me` | Current user |
| PATCH 🔒 | `/auth/password` | Change password (signs out other sessions) |
| POST 🔒 | `/auth/logout-all` | Invalidate all tokens |
| PATCH 🔒 | `/users/me` | Update name and phone |
| GET/POST 🔒 | `/users/me/addresses` | List or add addresses (max 10) |
| PUT/DELETE 🔒 | `/users/me/addresses/:id` | Update or delete an address |
| PATCH 🔒 | `/users/me/addresses/:id/default` | Set the default address |

### Catalog
| Method | Endpoint | Description |
|---|---|---|
| GET | `/categories?tree=true` | Active categories, optionally as a tree |
| GET | `/categories/:slug` | Category with children and breadcrumbs |
| GET 👑 | `/categories/admin/all` | All categories with product counts |
| POST/PUT/DELETE 👑 | `/categories[/:id]` | CRUD (multipart, `image` field). Delete is blocked while the category has products or children |
| GET | `/products` | List products. Query: `page, limit, q, category (slug), material, color, size` (comma lists), `minPrice, maxPrice, inStock, featured, sort=newest\|price_asc\|price_desc\|popular\|rating\|name` |
| GET | `/products/filters?category=` | Facets: materials, colors, sizes, price range |
| GET | `/products/suggest?q=` | Search autocomplete |
| GET | `/products/slug/:slug` | Product detail, related products, breadcrumbs |
| GET 👑 | `/products/admin/list` | Admin list, plus `status=active\|inactive\|low_stock\|out_of_stock` |
| GET 👑 | `/products/:id` | Product by id |
| POST 👑 | `/products` | Create (multipart: fields plus up to 10 `images`) |
| PUT 👑 | `/products/:id` | Update. `keepImages` = JSON array of publicIds to keep, in order. New `images` are appended |
| DELETE 👑 | `/products/:id` | Delete the product and its images, and remove it from carts and wishlists |
| PATCH 👑 | `/products/inventory` | Bulk update `{ items: [{ id, stock?, price?, compareAtPrice? }] }` |

### Cart, wishlist and coupons
| Method | Endpoint | Description |
|---|---|---|
| GET 🔒 | `/cart?coupon=CODE` | Priced cart summary (subtotal, discount, shipping, tax, total, stock issues) |
| POST 🔒 | `/cart/items` | `{ productId, quantity, size, color }`. Size and colour are validated against the product |
| PATCH/DELETE 🔒 | `/cart/items/:itemId` | Update quantity or remove an item |
| DELETE 🔒 | `/cart` | Clear the cart |
| POST 🔒 | `/cart/merge` | Merge the guest (localStorage) cart after login |
| GET 🔒 | `/wishlist` | Wishlist products |
| POST/DELETE 🔒 | `/wishlist/:productId` | Add or remove a product |
| GET | `/coupons/available` | Active coupons to display |
| POST 🔒 | `/coupons/apply` | Validate `{ code }` against the cart |
| GET/POST/PUT/DELETE 👑 | `/coupons[/:id]` | Coupon CRUD |

### Orders and payments
| Method | Endpoint | Description |
|---|---|---|
| POST 🔒 | `/orders` | `{ addressId \| shippingAddress, paymentMethod: razorpay\|cod, couponCode?, customerNote? }` |
| GET 🔒 | `/orders/my` | My orders (paginated) |
| GET 🔒 | `/orders/:id` | Order detail (owner or admin) |
| POST 🔒 | `/orders/:id/cancel` | Cancel while status is pending, confirmed or processing. Restores stock and refunds if paid |
| GET | `/orders/track?orderNumber=&email=` | Public order tracking |
| GET 👑 | `/orders` | Filter by `status, paymentStatus, q, from, to` |
| PATCH 👑 | `/orders/:id/status` | `{ status, note?, tracking? }`. Only valid transitions are allowed |
| PATCH 👑 | `/orders/:id/note` | Internal admin note |
| GET | `/payments/config` | Public Razorpay key and mock flag |
| POST 🔒 | `/payments/razorpay/orders/:id` | Retry payment for a pending order |
| POST 🔒 | `/payments/razorpay/verify` | Verify the checkout signature → order confirmed and paid |
| POST 🔒 | `/payments/razorpay/failed` | Record a failed or dismissed attempt |
| POST | `/payments/razorpay/webhook` | Razorpay webhook (`payment.captured`, `order.paid`, `payment.failed`) |

### Admin, banners and SEO
| Method | Endpoint | Description |
|---|---|---|
| GET 👑 | `/admin/dashboard` | KPIs, 30-day sales series, orders by status, recent orders, low stock, top products |
| GET 👑 | `/admin/reports/sales?from&to&groupBy=day\|week\|month` | Totals, time series, top products and categories, payment methods |
| GET 👑 | `/admin/customers` | Customers with order count and total spent |
| GET 👑 | `/admin/customers/:id` | Customer detail with order history |
| PATCH 👑 | `/admin/customers/:id/block` | `{ isBlocked }`. Blocking also invalidates the customer's sessions |
| GET | `/banners?position=hero\|promo` | Active, scheduled banners |
| GET/POST/PUT/DELETE 👑 | `/banners[/admin/all\|/:id]` | Banner CRUD (multipart `image`) |
| GET | `/sitemap.xml` | Generated sitemap covering categories and products |
| GET | `/api/health` | Liveness and DB status |

---

## 5. How the key flows work

### Authentication and roles
- Passwords are hashed with bcrypt (12 rounds). JWTs are signed with `JWT_SECRET` and carry `sub`, `role` and `tv` (token version).
- Every request re-loads the user and compares `tokenVersion`. Changing a password, "logout all" or blocking a user therefore revokes old tokens immediately.
- `protect` checks for a valid token and `authorize('admin')` enforces the role. Admin routes use both.
- The storefront and admin keep separate tokens (`aurum_token` and `aurum_admin_token`). A 401 response logs the user out automatically.

### Cart, pricing and stock
- **Guest carts** live in localStorage and are merged into the account cart on login.
- **Prices are always recalculated on the server** from the database: subtotal − coupon, then shipping (free above the threshold), then GST.
- **Stock is reserved atomically** when an order is placed, using `updateOne({ stock: { $gte: qty } }, { $inc: { stock: -qty } })`, so two shoppers can't buy the last item at the same time. If any line fails, every reservation made so far is rolled back.
- Coupon uses are claimed atomically too, respecting both the global and per-customer limits.
- Stock (and the coupon use) is released **exactly once** when an order is cancelled, returned, or expires unpaid. A background job runs every minute to cancel online orders that stay unpaid past `PENDING_ORDER_TTL_MINUTES`.

### Razorpay payments
1. `POST /orders` with `paymentMethod: "razorpay"` creates an order in `pending` status, reserves stock, and creates a Razorpay order for the amount in paise.
2. The storefront opens Razorpay Checkout (`frontend/src/utils/razorpay.js`).
3. On success, the storefront calls `POST /payments/razorpay/verify`. The API checks the HMAC-SHA256 signature over `order_id|payment_id` with a timing-safe comparison, then marks the order **paid** and **confirmed** and clears the cart.
4. The **webhook** (`payment.captured`) is an idempotent server-to-server backup in case the browser closes before step 3. If a payment arrives after the order has expired, the API tries to re-reserve stock; if that fails, it refunds automatically.
5. If payment fails or the customer closes the popup, the order stays pending and the customer can **retry from the order page**.
6. When an admin cancels or returns a paid order, a refund is issued through the Razorpay API.

**Setting up Razorpay**
1. Create test keys at https://dashboard.razorpay.com/app/keys and set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
2. Add a webhook at *Settings → Webhooks* pointing to `https://<your-api>/api/payments/razorpay/webhook`, with the events `payment.captured`, `payment.failed` and `order.paid`. Put its secret in `RAZORPAY_WEBHOOK_SECRET`.
3. Test cards and UPI IDs: https://razorpay.com/docs/payments/payments/test-card-details/

**Mock mode:** when the keys are empty and `NODE_ENV` isn't `production`, `/payments/config` returns `mock: true` and checkout shows a confirm dialog that simulates success or failure. Mock mode is impossible in production.

### Image uploads
- The admin `ImageUploader` supports drag and drop, previews, reordering, removal, and client-side checks for type (JPG, PNG, WEBP, AVIF), size (5 MB) and count (10).
- The server re-validates everything with multer (mimetype, size, count) **and checks each file's magic bytes**, so a renamed non-image is rejected.
- Storage lives in `services/storage.service.js`. Files go to Cloudinary when it's configured, otherwise to `/uploads/<folder>/`. Replaced or removed images are deleted from storage, and uploads are cleaned up if saving the record fails.

### Security measures
Helmet headers, a CORS allow-list, rate limiting (1,000 requests per 15 minutes on the API, 20 failed logins per 15 minutes), `express-mongo-sanitize` against NoSQL injection, `hpp`, a 1 MB JSON body limit, Zod validation on every input, generic login errors (no account enumeration), a restrictive CSP on uploaded files, path-traversal guards, and stack traces hidden in production.

### SEO
- Per-page `<title>`, meta description, canonical URL, and Open Graph and Twitter tags via `react-helmet-async`.
- JSON-LD structured data: `Product` (with Offer and AggregateRating) and `JewelryStore` (with a SearchAction).
- Search results and account pages get `noindex`. Semantic HTML, breadcrumbs and descriptive alt text throughout.
- `GET /sitemap.xml` is generated from the live catalog, and `robots.txt` is in `frontend/public`.
- For crawlers that don't run JavaScript, put a prerender service (Prerender.io or Cloudflare) in front of the storefront, or port the pages to an SSR framework. The API needs no changes for either.

---

## 6. Production deployment

```bash
# Build the static frontends
npm run build            # → frontend/dist and admin/dist

# Run the API
cd backend && NODE_ENV=production npm start
```

Recommended setup:
- **API**: Render, Railway, Fly.io, a VPS with PM2, or Docker. Set every backend environment variable. The app sets `trust proxy`, so it runs correctly behind a load balancer.
- **Storefront and admin**: any static host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront). Set `VITE_API_URL` before building, and add an SPA fallback that rewrites every path to `/index.html`.
- **Database**: MongoDB Atlas. Indexes are defined in the models and created automatically.
- **Images**: use Cloudinary in production. Local `/uploads` doesn't survive redeploys on most platforms.
- Add both frontend origins to `CLIENT_URLS`, and set `STORE_URL` so the sitemap links are correct.
- Run the seed only once, or skip it and create the admin account yourself.

Nginx SPA fallback example:
```nginx
location / { try_files $uri /index.html; }
```

---

## 7. Verification

The project was tested end to end against a real MongoDB instance (in-memory). 72 API checks passed, covering:
- the catalog: filters, search, sorting and pagination
- auth and RBAC
- cart pricing, stock limits and the per-customer coupon limit
- COD and online (mock Razorpay) checkout, including forged-signature rejection, payment retry, stock reservation and restoration, and order tracking
- admin features: dashboard and reports, order status transitions, product create and update with multi-image upload (including magic-byte rejection), inventory, categories, coupons, banners, customer blocking
- NoSQL injection rejection

Both `frontend` and `admin` build without errors (`npm run build`).

## 8. Possible next steps
- Product reviews. `rating` and `numReviews` are already on the product model.
- Transactional email (order confirmation, password reset) through a provider such as Resend or SES.
- Stock per variant (per size or colour). Stock is currently tracked per product.
- Stripe as a second gateway. It would plug into `services/payment.service.js` behind the same order flow.
