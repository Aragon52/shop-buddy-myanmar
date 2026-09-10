import logo from "@/assets/maket-logo.png";
import { cn } from "@/lib/utils";

type BrandMarkSize = "sm" | "md" | "lg";

const SIZES: Record<BrandMarkSize, { img: string; px: number; name: string; tagline: string }> = {
  sm: { img: "size-9", px: 40, name: "text-lg", tagline: "text-xs" },
  md: { img: "size-14", px: 64, name: "text-2xl", tagline: "text-sm" },
  lg: { img: "size-20 sm:size-24", px: 112, name: "text-3xl sm:text-4xl", tagline: "text-sm" },
};

export function BrandMark({
  className,
  showTagline = false,
  size = "sm",
  animated = false,
}: {
  className?: string;
  showTagline?: boolean;
  size?: BrandMarkSize;
  animated?: boolean;
}) {
  const s = SIZES[size];

  return (
    <div
      className={cn(
        "group flex items-center gap-3.5",
        animated && "animate-fade-in",
        className,
      )}
    >
      <div className="relative shrink-0">
        {animated ? (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary/20 blur-xl transition-opacity duration-500 group-hover:opacity-100 opacity-70"
          />
        ) : null}
        <img
          src={logo}
          alt="Maket logo"
          width={s.px}
          height={s.px}
          loading="eager"
          className={cn(
            "relative shrink-0 transition-transform duration-500 ease-out will-change-transform group-hover:scale-110 group-hover:-rotate-3",
            s.img,
          )}
        />
      </div>
      <div className="leading-tight">
        <span className={cn("block font-extrabold tracking-tight", s.name)}>Maket</span>
        {showTagline ? (
          <span className={cn("block text-muted-foreground", s.tagline)}>Mart in your pocket</span>
        ) : null}
      </div>
    </div>
  );
}
