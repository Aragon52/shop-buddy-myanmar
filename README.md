# Maket

Create a mobile-first, minimalist Seller Dashboard for a social commerce order management platform called "BioShop". The app is designed for TikTok and social media sellers in Myanmar to manage high-volume orders without manual chat box sorting.



Key Features & Views needed in this dashboard:

1. Relational Database Schema:

- Sellers: id, business_name, phone, tiktok_handle, payment_methods (JSON or text fields for KBZPay, WavePay, AYA pay details).

- Products: id, seller_id, name, price (in MMK), stock_quantity, image_url, status (active/inactive).

- Orders: id, product_id, seller_id, buyer_name, buyer_phone, delivery_city, delivery_address, payment_screenshot_url, order_status (Pending, Confirmed, Shipped, Cancelled), created_at.



2. Dashboard Home Screen:

- A high-level analytics summary showing: Total Sales (MMK), Total Pending Orders, and Low Stock Alerts.

- A prominent "Copy Store Link" button that copies the seller's public checkout URL (e.g., ://website.com) to their clipboard so they can paste it into their TikTok bio.



3. Order Management Screen:

- A clean, scrollable list of orders sorted by 'created_at' descending.

- Visual badge indicators for order status (e.g., Orange for Pending, Green for Confirmed, Blue for Shipped).

- Clicking an order opens a detailed modal showing the buyer's delivery information, an option to click and expand/zoom the uploaded Payment Screenshot image for manual KPay verification, and buttons to change status to "Confirm" or "Mark as Shipped".

- A "Export to CSV/Excel" button at the top to download the current order list so sellers can easily print or send delivery sheets to local couriers like Royal Express or Ninja Van.



4. Product Inventory Screen:

- A grid view of listed products showing images, current stock, and a quick toggle to activate/deactivate listings.

- An "Add Product" button that opens a simple form to upload an image, set the name, input the price in MMK, and define current stock.



5. Shop Settings Screen:

- Forms to update Business Name, Phone Number, and text fields to save payment collection details (e.g., KBZPay Account Number and Name, WavePay details) which will be shown to buyers on checkout.



Design Style:

Clean, modern, and mobile-optimized using shadcn/ui components. Use a vibrant, user-friendly color scheme (like deep indigo or emerald accents) that looks professional. Ensure all layouts work perfectly on mobile screens, as these sellers operate primari

ly from their smartphones.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://shop-buddy-myanmar.xn--artsys-dva.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ca04b054-d21c-47a2-a0cd-6f90c77e9424).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
