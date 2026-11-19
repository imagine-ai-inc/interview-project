import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** A quiet line in an empty, loading, or failed panel. */
export function PanelMessage({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "error";
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "type-small p-l",
        tone === "error" ? "text-destructive" : "text-imagine-foreground-muted",
      )}
    >
      {children}
    </p>
  );
}
