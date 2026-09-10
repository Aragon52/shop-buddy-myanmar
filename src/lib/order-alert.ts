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
  items: OrderAlertItem[];
  total: number;
};

/** Builds the plain-text new-order alert sent to the seller. */
export const buildOrderAlertMessage = (input: OrderAlertInput): string => {
  const lines = input.items.map(
    (item) => `• ${item.name} × ${item.quantity} — ${formatMmk(item.totalMmk)}`,
  );

  return [
    `🛍️ New order — ${input.shopName}`,
    "",
    ...lines,
    "",
    `Total: ${formatMmk(input.total)}`,
    `Buyer: ${input.buyerName}`,
    `Phone: ${input.buyerPhone}`,
    `Deliver to: ${input.deliveryCity} — ${input.deliveryAddress}`,
    "",
    "Status: Pending. Check the payment screenshot in your BioShop orders.",
  ].join("\n");
};
