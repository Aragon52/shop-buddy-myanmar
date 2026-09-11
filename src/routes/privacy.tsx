import { createFileRoute, Link } from "@tanstack/react-router";

import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — Maket" },
      {
        name: "description",
        content:
          "How Maket collects, uses, stores and deletes seller and buyer information, including payment screenshots and delivery locations.",
      },
      { property: "og:title", content: "Privacy policy — Maket" },
      {
        property: "og:description",
        content: "What data Maket collects, why, how long it is kept and how to request deletion.",
      },
    ],
  }),
  component: PrivacyPage,
});

const LAST_UPDATED = "11/09/2026";

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy policy" updated={LAST_UPDATED}>
      <p>
        Maket ("Maket", "we") is an order management app for social commerce sellers. This policy
        explains what information we collect, how we use it, and the choices you have.
      </p>

      <h2>Who this policy covers</h2>
      <ul>
        <li>
          <strong>Sellers</strong> — people who create a shop and manage orders in the app.
        </li>
        <li>
          <strong>Buyers</strong> — people who place an order through a seller's public shop link.
        </li>
      </ul>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Seller account</strong> — email address and password (stored encrypted), business
          name, phone number, TikTok handle, shop category, shop address and optional shop map
          location, and the payment account names and numbers you choose to show buyers.
        </li>
        <li>
          <strong>Products</strong> — product names, prices, stock levels and product photos you
          upload.
        </li>
        <li>
          <strong>Orders</strong> — buyer name, phone number, delivery city, delivery address,
          optional delivery map location, chosen payment method, and the payment screenshot the
          buyer uploads.
        </li>
        <li>
          <strong>Notification settings</strong> — the Telegram chat ID you optionally save to
          receive new-order alerts.
        </li>
        <li>
          <strong>Technical data</strong> — basic app and error logs needed to keep the service
          running and secure.
        </li>
      </ul>
      <p>
        We do not collect payment card details and we do not process payments. Payments are made
        directly between buyer and seller through mobile wallets or cash on delivery.
      </p>

      <h2>How we use information</h2>
      <ul>
        <li>To show a seller's shop and active products to buyers.</li>
        <li>To create and track orders, and to let the seller verify a payment screenshot.</li>
        <li>To send new-order alerts to the seller in the app and, if enabled, via Telegram.</li>
        <li>To produce delivery sheets the seller can hand to a courier.</li>
        <li>To secure accounts, prevent abuse and fix problems.</li>
      </ul>
      <p>We do not sell your information and we do not use it for advertising.</p>

      <h2>Sharing</h2>
      <ul>
        <li>
          Order details are shared with the seller who received the order, and with any courier the
          seller chooses to use for delivery.
        </li>
        <li>
          Service providers that operate the app on our behalf: hosting and database (Lovable Cloud
          / Supabase), Google Maps for choosing a delivery or shop location, and Telegram if a
          seller turns on Telegram alerts.
        </li>
        <li>Authorities, where we are legally required to do so.</li>
      </ul>

      <h2>Storage and security</h2>
      <p>
        Data is stored on managed cloud infrastructure. Each seller can only access their own shop,
        products and orders. Payment screenshots are kept in private storage and are only viewable
        by the seller who received the order, through time-limited links. Traffic to and from the app
        is encrypted.
      </p>

      <h2>How long we keep data</h2>
      <p>
        Order records and payment screenshots are kept while the seller's account is active, so
        sellers can resolve delivery and payment disputes. When an account is deleted, its shop,
        products, orders and uploaded images are deleted within 30 days.
      </p>

      <h2>Your rights</h2>
      <p>
        Sellers can view and change their business, payment and shop details at any time in
        Settings, and can edit or remove products and orders. You can also ask us to give you a copy
        of your data or delete it — see <Link to="/account-deletion">account and data deletion</Link>
        .
      </p>
      <p>
        Buyers who want their order details corrected or removed should contact the seller they
        ordered from, or write to us and we will pass the request on.
      </p>

      <h2>Children</h2>
      <p>Maket is intended for business use by adults and is not directed at children.</p>

      <h2>Changes</h2>
      <p>
        If we change this policy we will update the date at the top of this page and, for important
        changes, tell sellers inside the app.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy: <ContactEmail />
      </p>
    </LegalLayout>
  );
}

export function ContactEmail() {
  return <a href="mailto:support@maket.app">support@maket.app</a>;
}

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-12">
        <BrandMark size="sm" className="mb-8" />
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_h2]:pt-4 [&_h2]:text-base [&_h2]:font-semibold [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:text-muted-foreground [&_p]:text-muted-foreground">
          {children}
        </div>
        <div className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
          <Link to="/" className="font-medium text-primary underline">
            Home
          </Link>
          <Link to="/privacy" className="font-medium text-primary underline">
            Privacy policy
          </Link>
          <Link to="/terms" className="font-medium text-primary underline">
            Terms of service
          </Link>
          <Link to="/account-deletion" className="font-medium text-primary underline">
            Delete my data
          </Link>
        </div>
      </div>
    </div>
  );
}
