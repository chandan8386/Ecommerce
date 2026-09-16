# Deployment Guide — GitHub · Render · Vercel · MongoDB Atlas

| Part | Host | Folder |
|---|---|---|
| Backend API | Render (web service) | `backend/` |
| Storefront | Vercel | `frontend/` |
| Admin dashboard | Vercel (second project) | `admin/` |
| Database | MongoDB Atlas | — |
| Images (recommended) | Cloudinary | — |

Code lives on the **`ecommerce`** branch. Render and Vercel redeploy automatically on every push to that branch.

---

## 0. Sign in to the CLIs (one time)

```powershell
gh auth login       # GitHub → HTTPS → login with a web browser
vercel login        # choose your login method
render login        # opens the browser
```

---

## 1. MongoDB Atlas (free)

1. Sign up or sign in at https://www.mongodb.com/cloud/atlas/register.
2. **Create a cluster** → choose **M0 Free** → provider AWS → region **Mumbai (ap-south-1)** → Create.
3. **Database Access** → Add New Database User → choose password authentication. Create a username and a strong password, and give it the role *Read and write to any database*.
4. **Network Access** → Add IP Address → **Allow access from anywhere (`0.0.0.0/0`)**. Render's free tier has no fixed outbound IPs, so this is required; access is still protected by the username and password.
5. **Database** → Connect → *Drivers* → copy the connection string and add the database name `aurum_jewelry`:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/aurum_jewelry?retryWrites=true&w=majority
   ```
   If the password contains `@ : / ? #`, URL-encode it.

---

## 2. Push to GitHub

A local repository with the `ecommerce` branch is already set up. Create a private repo and push:

```powershell
cd D:\Eommerce
gh repo create aurum-jewelry-ecommerce --private --source . --remote origin --push
```

`.env` files, `node_modules`, `dist`, `uploads` and the local database are git-ignored. No secrets are committed.

---

## 3. Backend on Render

1. https://dashboard.render.com → **New → Blueprint** → connect GitHub → pick the repository. Render reads `render.yaml`.

> **Root Directory.** The recommended setup is Root Directory `backend`, build `npm ci --omit=dev`, start `npm start`.
> A service created at the **repository root** also works: the root `build` script installs the backend's dependencies and the root `start` script launches the API. Building the storefront/admin from the root is intentionally *not* part of `build` (Vercel builds those); use `npm run build:web` locally for that.
2. Fill in the prompted environment variables:

| Variable | Value |
|---|---|
| `MONGO_URI` | Atlas connection string from step 1 |
| `API_URL` | `https://aurum-jewelry-api.onrender.com` (your service URL) |
| `CLIENT_URLS` | `https://<storefront>.vercel.app,https://<admin>.vercel.app`. Use `http://localhost:4400,http://localhost:4401` until Vercel is deployed, then update |
| `STORE_URL` | `https://<storefront>.vercel.app` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Recommended. Without them the API still runs, but online payment is disabled and checkout offers only Cash on Delivery. `rzp_test_…` keys work |
| `RAZORPAY_WEBHOOK_SECRET` | Secret you choose when creating the webhook (step 6) |
| `CLOUDINARY_*` | Strongly recommended. Without them, uploaded images are lost on every redeploy |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Admin account created by the seed |

`JWT_SECRET` is generated automatically.

3. Deploy, then open `https://<service>.onrender.com/api/health`.
   - **200 `"status":"ok"`**: ready.
   - **503 `"status":"degraded"`**: the response names the problem. `configErrors` / `configWarnings` list missing settings (names only, never values), and `dbError` shows why MongoDB is unreachable, with the password masked. Fix the setting in **Environment**, then **Manual Deploy → Deploy latest commit**.
4. **Demo data loads automatically** the first time the API connects to an *empty* database (products, categories, coupons and the `SEED_ADMIN_EMAIL` admin account). Set `AUTO_SEED=false` to disable this. To reset the demo data later, run `npm run seed` in the Render **Shell**. ⚠ That erases the database.
5. **Change the demo admin password** after first sign-in if the site is public.

> The free plan sleeps after 15 minutes of inactivity, and the first request afterwards takes about 30–50 seconds. Upgrade the plan for production traffic.

---

## 4. Storefront on Vercel

```powershell
cd D:\Eommerce\frontend
vercel link                      # create project "aurum-jewelry-store"
vercel env add VITE_API_URL production      # https://<service>.onrender.com/api
vercel env add VITE_SITE_URL production     # https://<storefront>.vercel.app
vercel env add VITE_SITE_NAME production    # Aurum Jewelry
vercel --prod
```

Alternatively, use the dashboard: **Add New → Project** → import the repo → set **Root Directory** to `frontend` → framework Vite → add the three env vars → Deploy. In Settings → Git, set the production branch to `ecommerce`.

## 5. Admin on Vercel

```powershell
cd D:\Eommerce\admin
vercel link                      # create project "aurum-jewelry-admin"
vercel env add VITE_API_URL production      # https://<service>.onrender.com/api
vercel env add VITE_STORE_URL production    # https://<storefront>.vercel.app
vercel --prod
```

**After both are live**, update `CLIENT_URLS` and `STORE_URL` on Render to the real Vercel URLs. Render redeploys automatically. Without this, CORS blocks the browser.

---

## 6. Razorpay webhook

Razorpay Dashboard → **Settings → Webhooks → Add**:
- URL: `https://<service>.onrender.com/api/payments/razorpay/webhook`
- Secret: any strong string. Put the same value in Render's `RAZORPAY_WEBHOOK_SECRET`.
- Events: `payment.captured`, `payment.failed`, `order.paid`

---

## 7. Checklist

- [ ] `/api/health` → `db: connected`
- [ ] Storefront loads products (network calls go to `onrender.com/api`)
- [ ] Admin login works
- [ ] Test order: pay with Razorpay test card `4111 1111 1111 1111`, any future expiry date, any CVV
- [ ] Order shows as **Paid** in the admin
- [ ] Uploaded product image still shows after a Render redeploy (needs Cloudinary)

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/api/health` returns 503 `"degraded"` | Read `configErrors`, `configWarnings` and `dbError` in the response and fix the named setting |
| Requests to the service hang with no response | The service isn't running: check Render → Logs. Make sure **Root Directory** is `backend` (the repository root also works now) and the build finished |
| Checkout only offers Cash on Delivery | Razorpay keys aren't set. Add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` and redeploy |
| Browser error *blocked by CORS* | `CLIENT_URLS` must exactly match the Vercel URLs (https, no trailing slash) |
| `MongoServerSelectionError` | Atlas Network Access must allow `0.0.0.0/0`; check the user and password in `MONGO_URI` |
| Storefront calls `/api` on vercel.app and gets 404 | `VITE_API_URL` wasn't set before the build. Set it and redeploy |
| Images broken after redeploy | Configure Cloudinary and re-upload the images |
| Page refresh returns 404 on Vercel | `vercel.json` must be inside the project's root directory (it is) |
