# Buyer checkout page upgrade

The public shop link already exists and works for one product at a time. This upgrade turns it into a proper mobile checkout: a cart, a sticky total bar, a spacious delivery form, copy-to-clipboard payment numbers, a required payment screenshot, and a polished success screen. No account or login for buyers.

## What the buyer will see

1. **Shop header** — business name, TikTok handle, and a short "no account needed" line.
2. **Product grid** — image, name, price in MMK, and an "Add" button. Tapping again increases quantity; a small minus/plus control appears for items in the cart. Out-of-stock items show a disabled "Sold out" state.
3. **Sticky bottom bar** — always visible once something is in the cart: item count, total in MMK, and a "Checkout" button. Tapping it opens the checkout sheet, which lists each item with quantity, price, and a remove button.
4. **Delivery form** (spacious, thumb-friendly fields):
   - Full name
   - Phone number (numeric keypad on mobile)
   - City/township — dropdown of main Myanmar cities (Yangon, Mandalay, Nay Pyi Taw, Taunggyi, Bago, Mawlamyine, Pathein, Monywa, Myitkyina, Sittwe, Magway, Hpa-An) plus an "Other" option that reveals a free-text field
   - Full delivery address (textarea)
5. **Payment section** — only the payment methods the seller has filled in (KBZPay, WavePay, AYA Pay), each with account name, number, and a copy button that confirms "Number copied". The exact amount to transfer is shown with its own copy button.
6. **Payment screenshot** — required image upload with a thumbnail preview; the Place order button stays disabled until a screenshot is attached and the form is complete.
7. **Order success screen** — green checkmark, order summary (items, quantities, total), and the message "Thank you for your order! The seller will verify your payment and contact you shortly." Plus a button to order again.

Every order arrives in the seller's dashboard with status Pending, exactly as today.

## Speed

The page keeps its current server-rendered loading, lazy-loaded product images, no extra libraries, and no blocking work before the first paint. The checkout sheet and screenshot preview are the only interactive additions.

## Technical notes

- Rewrite `src/routes/s.$handle.tsx` around cart state (`Map<productId, quantity>`), a sticky summary bar, a `Sheet`-based checkout step, and a success view. Keep the existing loader/`head()` metadata and not-found handling.
- Add a `placeCartOrder` public server function in `src/lib/bioshop.functions.ts`: validates a line-item array with Zod, re-reads each product server-side (must belong to the seller and be active), computes unit prices and total from the database rather than the client, then inserts one `orders` row per line item with `order_status: 'pending'` and the shared buyer/delivery/screenshot fields. Returns the item summary and total for the success screen. Keep `placeOrder` in place or remove it once the new function replaces its only caller.
- The `orders` table stays unchanged: a multi-item cart becomes several pending rows sharing buyer details and the same screenshot path, which the existing dashboard, filters, and CSV export already handle.
- Screenshot upload continues to go to the private `payment-screenshots` bucket under the seller's id, before the order insert; the upload is now mandatory client-side and the server requires a non-null path.
- Add the Myanmar city list to `src/lib/format.ts` as a named const.
- Use existing shadcn primitives (`Button`, `Input`, `Label`, `Textarea`, `Select`, `Sheet`, `Separator`) and `formatMmk`; no new dependencies.
- Verify in a mobile viewport that a two-item cart produces two pending orders visible on the seller's orders screen.
