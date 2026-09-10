import { formatMmk } from "@/lib/format";

export type OrderAlertItem = {
  name: string;
  quantity: number;
  totalMmk: number;
};

export type OrderAlertInput = {
  shopName: string;
  buyerName: string;
  buyerPhone: string;
  deliveryCity: string;
  deliveryAddress: string;
  paymentMethod?: "prepaid" | "cod";
  mapUrl?: string | null;
  items: OrderAlertItem[];
  total: number;
};

/** Builds the plain-text new-order alert sent to the seller. */
export const buildOrderAlertMessage = (input: OrderAlertInput): string => {
  const lines = input.items.map(
    (item) => `• ${item.name} × ${item.quantity} — ${formatMmk(item.totalMmk)}`,
  );

  const isCod = input.paymentMethod === "cod";

  return [
    `🛍️ New order — ${input.shopName}`,
    "",
    ...lines,
    "",
    `Total: ${formatMmk(input.total)}`,
    `Payment: ${isCod ? "Cash on delivery" : "Paid in advance"}`,
    `Buyer: ${input.buyerName}`,
    `Phone: ${input.buyerPhone}`,
    `Deliver to: ${input.deliveryCity} — ${input.deliveryAddress}`,
    ...(input.mapUrl ? [`Map: ${input.mapUrl}`] : []),
    "",
    isCod
      ? "Status: Pending. Collect the payment at the door."
      : "Status: Pending. Check the payment screenshot in your Maket orders.",
  ].join("\n");
};
