/** Formats an amount in Myanmar Kyat, e.g. 120000 -> "120,000 MMK". */
export const formatMmk = (amount: number): string =>
  `${new Intl.NumberFormat("en-US").format(Math.round(amount))} MMK`;

/** Formats a timestamp as DD/MM/YYYY. */
export const formatDate = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
};

/** Formats a timestamp as DD/MM/YYYY HH:mm. */
export const formatDateTime = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(date)} ${hours}:${minutes}`;
};

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

export const LOW_STOCK_THRESHOLD = 5;

/** Main delivery cities and townships offered at checkout. */
export const MYANMAR_CITIES = [
  "Yangon",
  "Mandalay",
  "Nay Pyi Taw",
  "Taunggyi",
  "Bago",
  "Mawlamyine",
  "Pathein",
  "Monywa",
  "Myitkyina",
  "Sittwe",
  "Magway",
  "Hpa-An",
] as const;
