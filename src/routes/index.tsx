import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Link2, PackageCheck, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { getSiteOrigin } from "@/lib/site.functions";


export const Route = createFileRoute("/")({
  loader: () => getSiteOrigin(),
  head: ({ loaderData }) => {
    const shareImage = loaderData?.origin ? `${loaderData.origin}/share-cover.jpg` : null;
    return {
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
          content:
            "One link in your bio. Every order, payment and delivery sheet in one dashboard.",
        },
        ...(shareImage
          ? [
              { property: "og:image", content: shareImage },
              { property: "og:image:alt", content: "Maket — mart in your pocket" },
              { name: "twitter:image", content: shareImage },
            ]
          : []),
      ],
    };
  },
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
        <BrandMark showTagline size="lg" animated className="mb-9" />
        <span className="inline-flex animate-fade-in items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary [animation-delay:80ms]">
          For TikTok sellers in Myanmar
        </span>
        <h1 className="mt-5 animate-fade-in text-4xl font-extrabold leading-tight tracking-tight [animation-delay:140ms] sm:text-5xl">
          Stop sorting orders in your chat box.
        </h1>
        <p className="mt-4 animate-fade-in text-base text-muted-foreground [animation-delay:200ms]">
          Maket collects every order from your bio link, keeps the payment screenshot beside the
          delivery address, and gives you a courier sheet in one tap.
        </p>

        <div className="mt-7 flex animate-fade-in flex-wrap gap-3 [animation-delay:260ms]">
          <Button
            asChild
            size="lg"
            className="transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Link to="/dashboard">Open my dashboard</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Link to="/auth">Create a shop</Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "animate-fade-in rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg",
                CARD_DELAYS[index],
              )}
            >
              <feature.icon className="size-5 text-primary transition-transform duration-300 group-hover:scale-110" />
              <h2 className="mt-3 text-base font-semibold">{feature.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

