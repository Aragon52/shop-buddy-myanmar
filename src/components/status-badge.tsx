import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/format";

const STYLES: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  confirmed: "bg-success/15 text-success-foreground border-success/30",
  shipped: "bg-info/15 text-info-foreground border-info/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = (Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).includes(status as OrderStatus)
    ? (status as OrderStatus)
    : "pending";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STYLES[key],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[key]}
    </span>
  );
}
