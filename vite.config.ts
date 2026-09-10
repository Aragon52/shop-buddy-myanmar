// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null,
        filename: "sw.js",
        devOptions: { enabled: false },
        manifest: {
          id: "/dashboard",
          name: "Maket — mart in your pocket",
          short_name: "Maket",
          description:
            "Collect orders from your TikTok bio link and manage payments, stock and deliveries from your phone.",
          start_url: "/dashboard",
          scope: "/",
          display: "standalone",
          display_override: ["window-controls-overlay", "standalone", "minimal-ui", "browser"],
          orientation: "portrait",
          background_color: "#ffffff",
          theme_color: "#4f46e5",
          lang: "en",
          dir: "ltr",
          prefer_related_applications: false,
          categories: ["business", "shopping", "productivity"],
          launch_handler: { client_mode: "navigate-existing" },
          handle_links: "preferred",
          edge_side_panel: { preferred_width: 420 },
          scope_extensions: [],
          icons: [
            { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            {
              src: "/pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          shortcuts: [
            {
              name: "Orders",
              short_name: "Orders",
              description: "See the newest orders and confirm payments",
              url: "/orders",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
            },
            {
              name: "Products",
              short_name: "Products",
              description: "Update stock and add new products",
              url: "/products",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
            },
            {
              name: "Shop settings",
              short_name: "Settings",
              description: "Edit payment details and delivery options",
              url: "/settings",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
            },
          ],
          screenshots: [
            {
              src: "/screenshots/dashboard-wide-1200x630.jpg",
              sizes: "1200x630",
              type: "image/jpeg",
              form_factor: "wide",
              label: "Sales, pending orders and low stock at a glance",
            },
            {
              src: "/screenshots/orders-wide-1200x630.jpg",
              sizes: "1200x630",
              type: "image/jpeg",
              form_factor: "wide",
              label: "Newest orders first with payment screenshots",
            },
            {
              src: "/screenshots/products-wide-1200x630.jpg",
              sizes: "1200x630",
              type: "image/jpeg",
              form_factor: "wide",
              label: "Product list with stock and active status",
            },
            {
              src: "/screenshots/dashboard-narrow-630x1200.jpg",
              sizes: "630x1200",
              type: "image/jpeg",
              form_factor: "narrow",
              label: "Dashboard on a phone",
            },
            {
              src: "/screenshots/orders-narrow-630x1200.jpg",
              sizes: "630x1200",
              type: "image/jpeg",
              form_factor: "narrow",
              label: "Order list on a phone",
            },
            {
              src: "/screenshots/products-narrow-630x1200.jpg",
              sizes: "630x1200",
              type: "image/jpeg",
              form_factor: "narrow",
              label: "Products on a phone",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "maket-pages",
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
            {
              urlPattern: ({ url, request, sameOrigin }) =>
                sameOrigin &&
                (request.destination === "script" ||
                  request.destination === "style" ||
                  request.destination === "font") &&
                url.pathname.startsWith("/_build/"),
              handler: "CacheFirst",
              options: {
                cacheName: "maket-assets",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === "image",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "maket-images",
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 14 },
              },
            },
          ],
        },
      }),
    ],
  },
});
