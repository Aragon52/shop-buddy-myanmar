import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Copy, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getPublicStore, placeCartOrder } from "@/lib/bioshop.functions";
import { formatMmk, MYANMAR_CITIES } from "@/lib/format";

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
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
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

type SuccessOrder = {
  items: Array<{ name: string; quantity: number; totalMmk: number }>;
  total: number;
};

const OTHER_CITY = "__other__";

function StorePage() {
  const { handle } = Route.useParams();
  const { data: store } = useSuspenseQuery(storeQuery(handle));
  const submitOrder = useServerFn(placeCartOrder);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [step, setStep] = useState<"browse" | "checkout">("browse");
  const [city, setCity] = useState<string>("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<SuccessOrder | null>(null);

  const products = useMemo(() => store?.products ?? [], [store]);

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantity]) => {
          const product = products.find((candidate) => candidate.id === productId);
          return product ? { product, quantity } : null;
        })
        .filter((line): line is { product: (typeof products)[number]; quantity: number } =>
          Boolean(line),
        ),
    [cart, products],
  );

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.product.priceMmk * line.quantity, 0);

  if (!store) return null;

  const payments = [
    { label: "KBZPay", name: store.seller.kbzpayName, number: store.seller.kbzpayNumber },
    { label: "WavePay", name: store.seller.wavepayName, number: store.seller.wavepayNumber },
    { label: "AYA Pay", name: store.seller.ayapayName, number: store.seller.ayapayNumber },
  ].filter((method) => method.number.length > 0);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy, please select the text manually.");
    }
  };

  const setQuantity = (productId: string, quantity: number) => {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[productId];
      else next[productId] = Math.min(50, quantity);
      return next;
    });
  };

  const resetAll = () => {
    setCart({});
    setCity("");
    setScreenshot(null);
    setStep("browse");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lines.length === 0) return;
    if (!screenshot) {
      toast.error("Please attach your payment screenshot.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const value = (field: string) => String(form.get(field) ?? "").trim();
    const chosenCity = city === OTHER_CITY ? value("otherCity") : city;
    if (!chosenCity) {
      toast.error("Please choose your city or township.");
      return;
    }

    setBusy(true);
    try {
      const extension = screenshot.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${store.seller.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("payment-screenshots").upload(path, screenshot);
      if (error) throw new Error(error.message);

      const result = await submitOrder({
        data: {
          sellerId: store.seller.id,
          items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
          buyerName: value("buyerName"),
          buyerPhone: value("buyerPhone"),
          deliveryCity: chosenCity,
          deliveryAddress: value("deliveryAddress"),
          screenshotPath: path,
        },
      });

      setDone({ items: result.items, total: result.total });
      resetAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your order.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
        <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <h1 className="mt-4 text-xl font-bold">Order received</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you for your order! The seller will verify your payment and contact you shortly.
          </p>
          <ul className="mt-5 space-y-2 text-left text-sm">
            {done.items.map((item) => (
              <li key={item.name} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {item.name} × {item.quantity}
                </span>
                <span className="shrink-0 font-medium">{formatMmk(item.totalMmk)}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <p className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>{formatMmk(done.total)}</span>
          </p>
          <Button className="mt-5 w-full" size="lg" onClick={() => setDone(null)}>
            Order something else
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="border-b border-border bg-card px-5 py-6">
        <div className="mx-auto max-w-2xl">
          <ShoppingBag className="size-6 text-primary" />
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
            {store.seller.businessName}
          </h1>
          <p className="text-sm text-muted-foreground">@{store.seller.tiktokHandle}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            No account needed — pick your items, pay, and share your delivery details.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6">
        {step === "browse" ? (
          <section aria-label="Products">
            <h2 className="text-sm font-semibold">Products</h2>
            {products.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                This shop has no products on sale right now.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {products.map((product) => {
                  const quantity = cart[product.id] ?? 0;
                  const soldOut = product.stockQuantity <= 0;
                  return (
                    <article
                      key={product.id}
                      className={`overflow-hidden rounded-2xl border bg-card ${
                        quantity > 0 ? "border-primary" : "border-border"
                      }`}
                    >
                      <div className="aspect-square w-full bg-muted">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="size-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : null}
                      </div>
                      <div className="space-y-2 p-3">
                        <p className="truncate text-sm font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatMmk(product.priceMmk)}
                        </p>
                        {soldOut ? (
                          <Button size="sm" variant="secondary" className="w-full" disabled>
                            Sold out
                          </Button>
                        ) : quantity > 0 ? (
                          <div className="flex items-center justify-between gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              aria-label={`Remove one ${product.name}`}
                              onClick={() => setQuantity(product.id, quantity - 1)}
                            >
                              <Minus className="size-4" />
                            </Button>
                            <span className="text-sm font-semibold">{quantity}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              aria-label={`Add one ${product.name}`}
                              onClick={() => setQuantity(product.id, quantity + 1)}
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="w-full"
                            onClick={() => setQuantity(product.id, 1)}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Your items</h2>
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep("browse")}>
                  Add more
                </Button>
              </div>
              <ul className="mt-3 space-y-3">
                {lines.map((line) => (
                  <li key={line.product.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{line.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.quantity} × {formatMmk(line.product.priceMmk)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatMmk(line.product.priceMmk * line.quantity)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${line.product.name}`}
                      onClick={() => setQuantity(line.product.id, 0)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Delivery details</h2>
              <div className="space-y-2">
                <Label htmlFor="buyerName">Full name</Label>
                <Input id="buyerName" name="buyerName" required maxLength={80} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyerPhone">Phone number</Label>
                <Input
                  id="buyerPhone"
                  name="buyerPhone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  maxLength={40}
                  placeholder="09 7xx xxx xxx"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City or township</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger id="city" className="h-12">
                    <SelectValue placeholder="Choose your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {MYANMAR_CITIES.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                    <SelectItem value={OTHER_CITY}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {city === OTHER_CITY ? (
                <div className="space-y-2">
                  <Label htmlFor="otherCity">Your city or township</Label>
                  <Input id="otherCity" name="otherCity" required maxLength={60} className="h-12" />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Full delivery address</Label>
                <Textarea
                  id="deliveryAddress"
                  name="deliveryAddress"
                  required
                  maxLength={400}
                  rows={4}
                  placeholder="House number, street, township, landmark"
                />
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border bg-accent/40 p-4">
              <h2 className="text-sm font-semibold">Pay {formatMmk(total)}</h2>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => copy(String(total), "Amount")}
              >
                <span>{formatMmk(total)}</span>
                <Copy className="size-4" />
              </Button>
              {payments.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  This shop has not added payment details yet — contact the seller on TikTok.
                </p>
              ) : (
                <ul className="space-y-3">
                  {payments.map((method) => (
                    <li
                      key={method.label}
                      className="rounded-xl border border-border bg-card p-3 text-sm"
                    >
                      <p className="font-semibold">{method.label}</p>
                      {method.name ? (
                        <p className="text-xs text-muted-foreground">{method.name}</p>
                      ) : null}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate font-medium">{method.number}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => copy(method.number, `${method.label} number`)}
                        >
                          <Copy className="mr-1 size-3.5" />
                          Copy
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-2">
                <Label htmlFor="screenshot">Upload payment screenshot</Label>
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  required
                  className="h-12 py-2.5"
                  onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  Transfer the exact amount first, then attach your receipt screenshot.
                </p>
              </div>
            </section>

            <Button
              type="submit"
              size="lg"
              className="h-14 w-full text-base"
              disabled={busy || lines.length === 0 || !screenshot}
            >
              {busy ? "Sending your order…" : `Place order · ${formatMmk(total)}`}
            </Button>
          </form>
        )}
      </main>

      {itemCount > 0 && step === "browse" ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
          <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
              <p className="truncate text-base font-bold">{formatMmk(total)}</p>
            </div>
            <Button size="lg" className="h-12 shrink-0" onClick={() => setStep("checkout")}>
              Checkout
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
