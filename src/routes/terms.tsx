import { createFileRoute } from "@tanstack/react-router";

import { ContactEmail, LegalLayout } from "./privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — Maket" },
      {
        name: "description",
        content:
          "The rules for using Maket to run a shop, collect orders and handle payments with buyers.",
      },
      { property: "og:title", content: "Terms of service — Maket" },
      {
        property: "og:description",
        content: "Seller responsibilities, acceptable use and account terms for Maket.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout title="Terms of service" updated="11/09/2026">
      <p>
        By creating a shop or placing an order on Maket, you agree to these terms. If you do not
        agree, please do not use the app.
      </p>

      <h2>What Maket does</h2>
      <p>
        Maket gives sellers a shop link, an order list, stock tracking and delivery sheets. Maket is
        a tool for organising orders. We are not the seller, we do not hold stock, we do not deliver
        goods and we do not process payments.
      </p>

      <h2>Seller responsibilities</h2>
      <ul>
        <li>Give accurate business, contact, shop location and payment details.</li>
        <li>Only list products you are allowed to sell, with correct prices and stock.</li>
        <li>Fulfil confirmed orders, or cancel and refund promptly where you cannot.</li>
        <li>Verify payment screenshots yourself before confirming an order.</li>
        <li>Handle buyer information only for completing the order, and keep it confidential.</li>
        <li>Follow the laws and tax rules that apply to your business.</li>
      </ul>

      <h2>Buyer orders</h2>
      <p>
        An order placed through a shop link is a request to the seller. The sale contract is between
        the buyer and the seller. Questions about a product, payment, delivery, refund or exchange go
        to the seller who received the order.
      </p>

      <h2>Payments</h2>
      <p>
        Payments are made directly to the seller, either in advance by mobile wallet transfer or as
        cash on delivery where the seller allows it. Maket never receives or holds your money.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>No illegal, counterfeit, stolen or restricted goods.</li>
        <li>No fraud, spam, harassment or impersonation of another business.</li>
        <li>No attempts to break, overload or gain unauthorised access to the service.</li>
      </ul>
      <p>
        We may suspend or remove a shop that breaks these rules or puts buyers at risk, with notice
        where possible.
      </p>

      <h2>Your account</h2>
      <p>
        Keep your password private and tell us straight away if you think someone else has access to
        your shop. You are responsible for activity carried out with your login.
      </p>

      <h2>Availability</h2>
      <p>
        We work to keep Maket running, but the service is provided as is, without guarantees of
        uninterrupted availability. To the extent the law allows, we are not liable for lost sales,
        lost data or indirect losses arising from your use of the app.
      </p>

      <h2>Ending use</h2>
      <p>
        You can stop using Maket at any time and ask for your account to be deleted. We may end
        access if these terms are seriously or repeatedly broken.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Continued use after an update means you accept the new version.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <ContactEmail />
      </p>
    </LegalLayout>
  );
}
