# BioShop — Seller Dashboard

A mobile-first order management app for Myanmar TikTok sellers. Four screens: Home, Orders, Products, Settings, with a bottom tab bar.

## Backend

Lovable Cloud provides the database, image storage, and seller login (email + password).

Tables:
- **sellers** — business name, phone, TikTok handle, KBZPay / WavePay / AYAPay account name + number, linked to the logged-in account.
- **products** — name, price (MMK), stock quantity, image, active/inactive, owner.
- **orders** — product, buyer name, buyer phone, delivery city, delivery address, payment screenshot, status (Pending / Confirmed / Shipped / Cancelled), created date.

Each seller only sees their own data. Product images and payment screenshots go into two storage buckets: product images public, payment screenshots private to the seller.

## Screens

**Home**
- Cards: Total sales (MMK, from confirmed + shipped orders), pending orders count, low stock alerts (stock under 5).
- Large "Copy store link" button that copies the seller's public checkout URL to the clipboard with a confirmation toast.
- Short list of the 3 newest orders.

**Orders**
- Newest first, each row shows buyer name, product, city, amount and a coloured status badge (orange Pending, emerald Confirmed, blue Shipped, grey Cancelled).
- Filter chips by status.
- Tapping a row opens a full-screen sheet: buyer details, tap-to-call phone, delivery address, payment screenshot that expands to full-screen zoom for manual KPay checking, and buttons "Confirm order", "Mark as shipped", "Cancel".
- "Export CSV" button downloads the currently filtered list as a delivery sheet (buyer, phone, city, address, product, quantity, amount, status) — opens in Excel, ready for Royal Express or Ninja Van.

**Products**
- Two-column card grid: image, name, price in MMK, stock, and a switch to activate/deactivate.
- "Add product" opens a form: image upload with preview, name, price, stock. Same form used for editing; delete available from the card.
- Low-stock cards get a visible warning tint.

**Settings**
- Business name, phone, TikTok handle.
- Payment collection details: KBZPay, WavePay, AYAPay account name and number — noted as shown to buyers at checkout.
- Sign out.

## Public checkout link

The copied link points to a public store page for the seller (`/s/<handle>`) listing active products. Buyers pick a product, enter name, phone, city, address and upload a payment screenshot, creating a Pending order. This is what makes the seller dashboard have real incoming orders.

## Design

Deep indigo primary with emerald for positive states, on a near-white background. shadcn/ui components, generous tap targets, sticky bottom navigation, everything laid out for a phone first and widened gracefully on desktop. Money shown as `120,000 MMK`, dates as DD/MM/YYYY.

## Technical notes

- TanStack Start routes: `/` (home), `/orders`, `/products`, `/settings`, `/auth`, `/s/$handle` (public store). Dashboard routes sit under an authenticated layout; the store page and its order submission stay public with narrow read-only access to active products.
- Reads go through TanStack Query with route loaders; writes through server functions with authenticated access, then cache invalidation.
- CSV built client-side from the loaded order rows — no extra dependency.
- Analytics computed with a database view or aggregated query rather than pulling all orders.
- Seed data: one demo seller with a few products and orders so the dashboard is populated on first open.
