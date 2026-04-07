# Deploying SUNBOUND BOHEME

This project is ready for:

- Frontend on Vercel
- Backend on Render
- Custom domains:
  - `sunboundboheme.com` for the frontend
  - `api.sunboundboheme.com` for the backend

## 1. Push the repo to GitHub

1. Create a GitHub repository.
2. Push the full `C:\Sunbound Boheme` project to that repository.

## 2. Deploy the backend to Render

### Create the service

1. Log into Render.
2. Click `New +`.
3. Choose `Blueprint` if Render detects `render.yaml`, or create a `Web Service` manually.
4. Connect your GitHub repository.
5. If creating manually, use:
   - Root Directory: `server`
   - Build Command: `npm install && npx prisma generate && npx prisma db push --accept-data-loss`
   - Start Command: `npm start`

### Add a persistent disk

If you do not use the `render.yaml` blueprint flow, add a disk manually:

- Mount path: `/var/data`
- Size: `1 GB`

Set:

```env
DATABASE_URL=file:/var/data/sunbound-boheme.db
```

### Backend environment variables

In Render, add these environment variables:

```env
CLIENT_URL=https://sunboundboheme.com
FRONTEND_URLS=https://www.sunboundboheme.com,https://sunboundboheme.vercel.app
STRIPE_SECRET_KEY=...
ADMIN_PASSWORD_HASH=...
ADMIN_SESSION_SECRET=...
SMTP_HOST=smtppro.zoho.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@sunboundboheme.com
SMTP_PASS=...
SMTP_FROM=support@sunboundboheme.com
ORDER_NOTIFY_TO=support@sunboundboheme.com
```

After the first deploy, Render will give you a backend URL like:

- `https://sunbound-boheme-api.onrender.com`

## 3. Deploy the frontend to Vercel

1. Log into Vercel.
2. Click `Add New...` then `Project`.
3. Import the same GitHub repository.
4. Set the Root Directory to `client`.
5. Vercel should detect Vite automatically.

### Frontend environment variable

In Vercel, add:

```env
VITE_API_URL=https://sunbound-boheme-api.onrender.com
```

Then deploy.

## 4. Connect the custom domains

### Frontend domain on Vercel

In Vercel:

1. Open your frontend project.
2. Go to `Settings` -> `Domains`.
3. Add:
   - `sunboundboheme.com`
   - `www.sunboundboheme.com`

Vercel will show the DNS records to add in Squarespace.

### Backend domain on Render

In Render:

1. Open the backend service.
2. Go to `Settings` -> `Custom Domains`.
3. Add:
   - `api.sunboundboheme.com`

Render will show the DNS record to add in Squarespace.

## 5. Add DNS records in Squarespace

Use Squarespace DNS settings for `sunboundboheme.com`.

Add whatever Vercel and Render each tell you to add.

Common pattern:

- `sunboundboheme.com` and `www` point to Vercel
- `api` points to Render

## 6. Update production URLs after domains are live

Once both domains are working, update:

### Render backend

```env
CLIENT_URL=https://sunboundboheme.com
FRONTEND_URLS=https://www.sunboundboheme.com,https://sunboundboheme.vercel.app
```

### Vercel frontend

```env
VITE_API_URL=https://api.sunboundboheme.com
```

Redeploy both after changing those values.

## 7. Final production checklist

1. Visit `https://sunboundboheme.com`
2. Confirm the shop loads products.
3. Confirm admin login still works at `/alliesthrone`
4. Place one real test order.
5. Confirm:
   - order saves in admin
   - customer email sends
   - support inbox notification sends
   - shipping address appears in admin
