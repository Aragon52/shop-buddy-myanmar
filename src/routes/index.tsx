import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Link2, PackageCheck, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maket — sell from your TikTok bio link" },
      {
        name: "description",
        content:
          "Maket turns your TikTok bio link into a checkout page and collects every order in one place, with payment screenshots and delivery sheets.",
      },
      { property: "og:title", content: "Maket — sell from your TikTok bio link" },
      {
        property: "og:description",
        content: "One link in your bio. Every order, payment and delivery sheet in one dashboard.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Link2,
    title: "One link in your bio",
    text: "Buyers pick a product, fill in delivery details and attach their payment screenshot.",
  },
  {
    icon: ShieldCheck,
    title: "Check payments fast",
    text: "Open any screenshot full screen to verify a KBZPay or WavePay transfer, then confirm.",
  },
  {
    icon: PackageCheck,
    title: "Courier-ready sheets",
    text: "Export your order list to a spreadsheet for Royal Express or Ninja Van pickups.",
  },
  {
    icon: BarChart3,
    title: "Stock and sales at a glance",
    text: "See total sales in MMK, pending orders and low stock alerts on the home screen.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-14">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          For TikTok sellers in Myanmar
        </span>
        <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Stop sorting orders in your chat box.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Maket collects every order from your bio link, keeps the payment screenshot beside the
          delivery address, and gives you a courier sheet in one tap.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/dashboard">Open my dashboard</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">Create a shop</Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border bg-card p-5">
              <feature.icon className="size-5 text-primary" />
              <h2 className="mt-3 text-base font-semibold">{feature.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
