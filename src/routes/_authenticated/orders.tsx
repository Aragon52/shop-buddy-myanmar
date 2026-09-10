import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, Phone, ZoomIn } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { listOrders, updateOrderStatus, type Order } from "@/lib/maket.functions";
import { formatDateTime, formatMmk, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/format";

const ordersQuery = queryOptions({
  queryKey: ["orders"],
  queryFn: () => listOrders(),
});

export const Route = createFileRoute("/_authenticated/orders")({
  loader: ({ context }) => context.queryClient.ensureQueryData(ordersQuery),
  component: OrdersPage,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </p>
  ),
  notFoundComponent: () => <p className="p-6 text-sm">No orders found.</p>,
});

const FILTERS = ["all", "pending", "confirmed", "shipped", "cancelled"] as const;

const csvCell = (value: string | number): string => `"${String(value).replace(/"/g, '""')}"`;

function exportCsv(orders: Order[]) {
  const header = [
    "Date",
    "Buyer",
    "Phone",
    "City",
    "Address",
    "Map link",
    "Payment",
    "Product",
    "Quantity",
    "Total (MMK)",
    "Status",
  ];
  const rows = orders.map((order) => [
    formatDateTime(order.createdAt),
    order.buyerName,
    order.buyerPhone,
    order.deliveryCity,
    order.deliveryAddress,
    order.mapUrl ?? "",
    order.paymentMethod === "cod" ? "Cash on delivery" : "Paid in advance",
    order.productName,
    order.quantity,
    order.totalMmk,
    ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status,
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `maket-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function OrdersPage() {
  const { data: orders } = useSuspenseQuery(ordersQuery);
  const queryClient = useQueryClient();
  const changeStatus = useServerFn(updateOrderStatus);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const mutation = useMutation({
    mutationFn: (input: { orderId: string; status: OrderStatus }) => changeStatus({ data: input }),
    onSuccess: async (_result, input) => {
      toast.success(`Order marked as ${ORDER_STATUS_LABELS[input.status].toLowerCase()}.`);
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["shop-overview"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const visible = filter === "all" ? orders : orders.filter((order) => order.status === filter);
  const selected = orders.find((order) => order.id === selectedId) ?? null;

  return (
    <AppShell
      title="Orders"
      subtitle={`${orders.length} total`}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCsv(visible)}
          disabled={!visible.length}
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      }
    >
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {option === "all" ? "All" : ORDER_STATUS_LABELS[option]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No orders in this view yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {visible.map((order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => setSelectedId(order.id)}
                className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{order.buyerName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.productName} × {order.quantity} · {order.deliveryCity}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDateTime(order.createdAt)}</span>
                  <span className="font-semibold text-foreground">{formatMmk(order.totalMmk)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
          {selected ? (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="flex flex-wrap items-center gap-2">
                  {selected.buyerName}
                  <StatusBadge status={selected.status} />
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-4 px-4 pb-6">
                <div className="rounded-2xl border border-border p-4 text-sm">
                  <Row label="Product" value={`${selected.productName} × ${selected.quantity}`} />
                  <Row label="Total" value={formatMmk(selected.totalMmk)} />
                  <Row label="City" value={selected.deliveryCity} />
                  <Row label="Address" value={selected.deliveryAddress} />
                  <Row
                    label="Payment"
                    value={
                      selected.paymentMethod === "cod"
                        ? "Cash on delivery"
                        : "Paid in advance"
                    }
                  />
                  <Row label="Ordered" value={formatDateTime(selected.createdAt)} />
                  {selected.mapUrl ? (
                    <div className="mt-3">
                      <a
                        href={selected.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                      >
                        <MapPin className="size-4" />
                        Open pinned location
                      </a>
                    </div>
                  ) : null}
                  <div className="mt-3">
                    <a
                      href={`tel:${selected.buyerPhone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                    >
                      <Phone className="size-4" />
                      {selected.buyerPhone}
                    </a>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Payment screenshot</p>
                  {selected.screenshotUrl ? (
                    <button
                      type="button"
                      onClick={() => setZoomed(true)}
                      className="relative block w-full overflow-hidden rounded-2xl border border-border"
                    >
                      <img
                        src={selected.screenshotUrl}
                        alt={`Payment screenshot from ${selected.buyerName}`}
                        className="max-h-64 w-full object-contain bg-muted"
                      />
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-medium text-background">
                        <ZoomIn className="size-3.5" /> Tap to zoom
                      </span>
                    </button>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      {selected.paymentMethod === "cod"
                        ? "Cash on delivery — collect the payment at the door."
                        : "The buyer did not attach a screenshot."}
                    </p>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    size="lg"
                    disabled={mutation.isPending || selected.status === "confirmed"}
                    onClick={() => mutation.mutate({ orderId: selected.id, status: "confirmed" })}
                  >
                    Confirm order
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    disabled={mutation.isPending || selected.status === "shipped"}
                    onClick={() => mutation.mutate({ orderId: selected.id, status: "shipped" })}
                  >
                    Mark as shipped
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-destructive sm:col-span-2"
                    disabled={mutation.isPending || selected.status === "cancelled"}
                    onClick={() => mutation.mutate({ orderId: selected.id, status: "cancelled" })}
                  >
                    Cancel order
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={zoomed} onOpenChange={setZoomed}>
        <DialogContent className="max-w-[95vw] p-2 sm:max-w-2xl">
          <DialogTitle className="sr-only">Payment screenshot</DialogTitle>
          {selected?.screenshotUrl ? (
            <img
              src={selected.screenshotUrl}
              alt="Payment screenshot, full size"
              className="max-h-[80vh] w-full object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
