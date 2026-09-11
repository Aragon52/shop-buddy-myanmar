import { createFileRoute } from "@tanstack/react-router";

import { ContactEmail, LegalLayout } from "./privacy";

export const Route = createFileRoute("/account-deletion")({
  head: () => ({
    meta: [
      { title: "Delete your Maket account and data" },
      {
        name: "description",
        content:
          "How to request deletion of your Maket seller account, shop, products, orders and uploaded images, and what is kept.",
      },
      { property: "og:title", content: "Delete your Maket account and data" },
      {
        property: "og:description",
        content: "Steps to delete your Maket account and everything stored with it.",
      },
    ],
  }),
  component: AccountDeletionPage,
});

function AccountDeletionPage() {
  return (
    <LegalLayout title="Account and data deletion" updated="11/09/2026">
      <p>
        You can ask for your Maket seller account and everything stored with it to be deleted. This
        page explains how to make the request and what happens next.
      </p>

      <h2>How to request deletion</h2>
      <ul>
        <li>
          Send an email to <ContactEmail /> from the address you use to sign in, with the subject
          "Delete my account".
        </li>
        <li>Include your shop handle so we can find the right account.</li>
        <li>
          We reply to confirm, then delete the account. Requests are completed within 30 days.
        </li>
      </ul>

      <h2>What gets deleted</h2>
      <ul>
        <li>Your sign-in account and password.</li>
        <li>Your shop details, contact information, shop location and payment account details.</li>
        <li>Your products and uploaded product photos.</li>
        <li>Your orders, buyer delivery details and uploaded payment screenshots.</li>
        <li>Your notification settings, including any saved Telegram chat ID.</li>
      </ul>
      <p>Your public shop link stops working as soon as the account is deleted.</p>

      <h2>What may be kept</h2>
      <p>
        We may keep a minimal record of the deletion request itself, and any information we are
        legally required to retain, for as long as the law requires. Data no longer connected to you
        may remain in encrypted backups for up to 30 days before it expires.
      </p>

      <h2>Deleting only part of your data</h2>
      <p>
        If you would rather keep your account, you can remove individual products and orders in the
        app, and clear your payment or Telegram details in Settings, without deleting everything.
      </p>

      <h2>Buyers</h2>
      <p>
        If you placed an order and want your details removed, contact the seller you ordered from, or
        write to <ContactEmail /> with the shop name and your order details and we will pass the
        request on.
      </p>
    </LegalLayout>
  );
}
