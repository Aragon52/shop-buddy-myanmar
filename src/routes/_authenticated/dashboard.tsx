import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Check, Clock, Copy, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { getShopOverview } from "@/lib/bioshop.functions";
import { formatDate, formatMmk } from "@/lib/format";

const overviewQuery = queryOptions({
  queryKey: ["shop-overview"],
  queryFn: () => getShopOverview(),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => context.queryClient.ensureQueryData(overviewQuery),
  component: Dashboard,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </p>
  ),
  notFoundComponent: () => <p className="p-6 text-sm">Shop not found.</p>,
});

function Dashboard() {
  const { data } = useSuspenseQuery(overviewQuery);
  const [copied, setCopied] = useState(false);

  const storeLink =
    typeof window === "undefined"
      ? `/s/${data.seller.tiktokHandle}`
      : `${window.location.origin}/s/${data.seller.tiktokHandle}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeLink);
      setCopied(true);
      toast.success("Store link copied — paste it in your TikTok bio.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Long-press the link to copy it manually.");
    }
  };

  return (
    <AppShell title={data.seller.businessName} subtitle={`@${data.seller.tiktokHandle}`}>
      <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">Your store link</p>
        <p className="mt-1.5 truncate text-sm font-semibold">{storeLink}</p>
        <Button
          onClick={copyLink}
          size="lg"
          className="mt-4 w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy store link"}
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <TrendingUp className="size-4 text-success" />
          <p className="mt-2 text-xs text-muted-foreground">Total sales</p>
          <p className="mt-0.5 text-xl font-bold">{formatMmk(data.totalSales)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <Clock className="size-4 text-warning" />
          <p className="mt-2 text-xs text-muted-foreground">Pending orders</p>
          <p className="mt-0.5 text-xl font-bold">{data.pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <AlertTriangle className="size-4 text-destructive" />
          <p className="mt-2 text-xs text-muted-foreground">Low stock items</p>
          <p className="mt-0.5 text-xl font-bold">{data.lowStock.length}</p>
        </div>
      </div>

      {data.lowStock.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-semibold">Running low</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {data.lowStock.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">{item.name}</span>
                <span className="shrink-0 font-semibold text-destructive">{item.stock} left</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Latest orders</h2>
        <Link to="/orders" className="text-sm font-medium text-primary">
          See all
        </Link>
      </div>

      {data.recentOrders.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No orders yet. Share your store link to start collecting orders.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {data.recentOrders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{order.buyerName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.productName} · {order.deliveryCity}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(order.createdAt)}</span>
                <span className="font-semibold text-foreground">{formatMmk(order.totalMmk)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
