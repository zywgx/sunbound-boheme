# SUNBOUND BOHEME

A live boutique storefront for curated, small-batch fashion pieces with a private admin dashboard for product management, image uploads, order tracking, shipping controls, and customer email notifications.

Live site: [https://www.sunboundboheme.com](https://www.sunboundboheme.com)

## Overview

SUNBOUND BOHEME is a family-run ecommerce site built around a warm, editorial storefront and a practical admin experience for day-to-day shop operations.

The project includes:

- a Vite + React storefront
- a private admin login and dashboard
- Cloudinary image uploads for products
- Stripe Checkout for payments
- order capture, fulfillment tracking, and status updates
- shipping presets and per-product shipping overrides
- customer confirmation emails and internal order notifications

## Features

- Curated homepage, shop, product, support, and policies pages
- Cart with stock-aware quantity handling
- Stripe-hosted checkout flow
- Live order storage with customer and shipping details
- Admin dashboard with:
  - product creation, editing, and deletion
  - image upload workflow
  - shipping settings
  - sales metrics
  - order notes, tracking, and status updates
- Zoho SMTP email support
- Render + Vercel deployment setup

## Tech Stack

### Frontend

- React
- React Router
- Vite
- CSS

### Backend

- Node.js
- Express
- Prisma
- SQLite

### Services

- Stripe
- Cloudinary
- Zoho Mail
- Vercel
- Render

## Project Structure

```
client/   React storefront and admin UI
server/   Express API, Prisma models, Stripe, auth, email
```

## Local Development

### 1. Install dependencies

```powershell
cd client
npm install

cd ../server
npm install
```

### 2. Configure environment variables

Use these example files as a starting point:

- [`client/.env.example`](/C:/Sunbound%20Boheme/client/.env.example)
- [`server/.env.example`](/C:/Sunbound%20Boheme/server/.env.example)

### 3. Run the backend

```powershell
cd server
npm start
```

### 4. Run the frontend

```powershell
cd client
npm run dev
```

## Deployment

Deployment guidance is documented in:

- [`DEPLOYMENT.md`](/C:/Sunbound%20Boheme/DEPLOYMENT.md)
- [`LAUNCH-CHECKLIST.md`](/C:/Sunbound%20Boheme/LAUNCH-CHECKLIST.md)

Recommended setup:

- frontend on Vercel
- backend on Render
- `www.sunboundboheme.com` for the storefront
- `api.sunboundboheme.com` for the backend

## Admin

The admin dashboard supports:

- secure login
- product and shipping management
- order review and fulfillment updates
- basic sales metrics

## Notes

- Stripe webhook support is included for reliable paid-order capture.
- The project is designed for a small family-run store and can be expanded later if needed.
