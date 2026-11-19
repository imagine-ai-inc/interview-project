import { cn } from "@/lib/cn";

export function Wordmark({
  className,
  label = "Imagine AI",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("imagine-wordmark bg-current", className)}
    />
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("imagine-mark bg-current", className)}
    />
  );
}
