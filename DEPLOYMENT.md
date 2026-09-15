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

1. https://dashboard.render.com → **New → Blueprint** → connect GitHub → pick `aurum-jewelry-ecommerce`. Render reads `render.yaml`.
2. Fill in the prompted environment variables:

| Variable | Value |
|---|---|
| `MONGO_URI` | Atlas connection string from step 1 |
| `API_URL` | `https://aurum-jewelry-api.onrender.com` (your service URL) |
| `CLIENT_URLS` | `https://<storefront>.vercel.app,https://<admin>.vercel.app`. Use `http://localhost:4400,http://localhost:4401` until Vercel is deployed, then update |
| `STORE_URL` | `https://<storefront>.vercel.app` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | **Required.** The API refuses to start in production without them. `rzp_test_…` keys work |
| `RAZORPAY_WEBHOOK_SECRET` | Secret you choose when creating the webhook (step 6) |
| `CLOUDINARY_*` | Strongly recommended. Without them, uploaded images are lost on every redeploy |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Admin account created by the seed |

`JWT_SECRET` is generated automatically.

3. Deploy, then open `https://<service>.onrender.com/api/health`. It should show `"db":"connected"`.
4. **Load demo data (optional, only once).** Render service → **Shell** → run `npm run seed`. ⚠ This erases the database and recreates the demo data.

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
| Render deploy fails: *RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required in production* | Add the Razorpay keys |
| Browser error *blocked by CORS* | `CLIENT_URLS` must exactly match the Vercel URLs (https, no trailing slash) |
| `MongoServerSelectionError` | Atlas Network Access must allow `0.0.0.0/0`; check the user and password in `MONGO_URI` |
| Storefront calls `/api` on vercel.app and gets 404 | `VITE_API_URL` wasn't set before the build. Set it and redeploy |
| Images broken after redeploy | Configure Cloudinary and re-upload the images |
| Page refresh returns 404 on Vercel | `vercel.json` must be inside the project's root directory (it is) |
