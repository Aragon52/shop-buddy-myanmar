import logo from "@/assets/maket-logo.png";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logo}
        alt="Maket logo"
        width={40}
        height={40}
        loading="lazy"
        className="size-9 shrink-0"
      />
      <div className="leading-tight">
        <span className="block text-lg font-extrabold tracking-tight">Maket</span>
        {showTagline ? (
          <span className="block text-xs text-muted-foreground">Mart in your pocket</span>
        ) : null}
      </div>
    </div>
  );
}
