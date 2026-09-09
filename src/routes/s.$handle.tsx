import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getPublicStore, placeOrder } from "@/lib/bioshop.functions";
import { formatMmk } from "@/lib/format";

const storeQuery = (handle: string) =>
  queryOptions({
    queryKey: ["public-store", handle],
    queryFn: () => getPublicStore({ data: { handle } }),
  });

export const Route = createFileRoute("/s/$handle")({
  loader: async ({ context, params }) => {
    const store = await context.queryClient.ensureQueryData(storeQuery(params.handle));
    if (!store) throw notFound();
    return store;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Shop not found" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.seller.businessName} — order online`;
    const description = `Order from ${loaderData.seller.businessName} and pay with KBZPay, WavePay or AYAPay. Delivery across Myanmar.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: StorePage,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </p>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">This shop link does not exist.</p>
    </div>
  ),
});

function StorePage() {
  const { handle } = Route.useParams();
  const { data: store } = useSuspenseQuery(storeQuery(handle));
  const submitOrder = useServerFn(placeOrder);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ total: number } | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);

  if (!store) return null;
  const selected = store.products.find((product) => product.id === selectedId) ?? null;

  const payments = [
    { label: "KBZPay", name: store.seller.kbzpayName, number: store.seller.kbzpayNumber },
    { label: "WavePay", name: store.seller.wavepayName, number: store.seller.wavepayNumber },
    { label: "AYAPay", name: store.seller.ayapayName, number: store.seller.ayapayNumber },
  ].filter((method) => method.number.length > 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const value = (field: string) => String(form.get(field) ?? "").trim();
    const quantity = Number(form.get("quantity") ?? 1);

    setBusy(true);
    try {
      let screenshotPath: string | null = null;
      if (screenshot) {
        const extension = screenshot.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${store.seller.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage
          .from("payment-screenshots")
          .upload(path, screenshot);
        if (error) throw new Error(error.message);
        screenshotPath = path;
      }

      const result = await submitOrder({
        data: {
          sellerId: store.seller.id,
          productId: selected.id,
          buyerName: value("buyerName"),
          buyerPhone: value("buyerPhone"),
          deliveryCity: value("deliveryCity"),
          deliveryAddress: value("deliveryAddress"),
          quantity: Math.max(1, Math.round(quantity)),
          screenshotPath,
        },
      });

      setDone({ total: result.total });
      setSelectedId(null);
      setScreenshot(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your order.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" />
          <h1 className="mt-3 text-xl font-bold">Order sent</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {store.seller.businessName} will check your payment of {formatMmk(done.total)} and
            confirm on the phone number you gave.
          </p>
          <Button className="mt-5 w-full" onClick={() => setDone(null)}>
            Order something else
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="border-b border-border bg-card px-5 py-6">
        <div className="mx-auto max-w-2xl">
          <ShoppingBag className="size-6 text-primary" />
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
            {store.seller.businessName}
          </h1>
          <p className="text-sm text-muted-foreground">@{store.seller.tiktokHandle}</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-6">
        {payments.length > 0 ? (
          <section className="rounded-2xl border border-border bg-accent/40 p-4">
            <h2 className="text-sm font-semibold">Pay to</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {payments.map((method) => (
                <li key={method.label} className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{method.label}</span>
                  <span className="text-muted-foreground">
                    {method.number}
                    {method.name ? ` · ${method.name}` : ""}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Transfer first, then attach the screenshot with your order.
            </p>
          </section>
        ) : null}

        <h2 className="mt-6 text-sm font-semibold">Products</h2>
        {store.products.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            This shop has no products on sale right now.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {store.products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => setSelectedId(product.id)}
                className={`overflow-hidden rounded-2xl border bg-card text-left transition-colors ${
                  selectedId === product.id ? "border-primary" : "border-border"
                }`}
              >
                <span className="block aspect-square w-full bg-muted">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </span>
                <span className="block p-3">
                  <span className="block truncate text-sm font-semibold">{product.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatMmk(product.priceMmk)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {selected ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Order {selected.name}</h2>
            <div className="space-y-1.5">
              <Label htmlFor="buyerName">Your name</Label>
              <Input id="buyerName" name="buyerName" required maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="buyerPhone">Phone number</Label>
              <Input id="buyerPhone" name="buyerPhone" required maxLength={40} placeholder="09 7xx xxx xxx" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="deliveryCity">City</Label>
                <Input id="deliveryCity" name="deliveryCity" required maxLength={60} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" min={1} max={50} defaultValue={1} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deliveryAddress">Delivery address</Label>
              <Textarea id="deliveryAddress" name="deliveryAddress" required maxLength={400} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="screenshot">Payment screenshot</Label>
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Sending…" : `Send order · ${formatMmk(selected.priceMmk)}`}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
