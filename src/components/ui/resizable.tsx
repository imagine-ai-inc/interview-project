"use client";

import type { ComponentProps } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/lib/cn";

export function ResizablePanelGroup({
  className,
  ...props
}: ComponentProps<typeof Group>) {
  return (
    <Group
      className={cn("flex h-full w-full", className)}
      // The library measures and writes flex styles on the client.
      suppressHydrationWarning
      {...props}
    />
  );
}

export function ResizablePanel(props: ComponentProps<typeof Panel>) {
  return <Panel {...props} suppressHydrationWarning />;
}

export function ResizableHandle({
  className,
  ...props
}: ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn(
        // Zero width; the hit target and hover line overhang both panels.
        "group/handle relative z-20 w-0 bg-transparent outline-none",
        "before:bg-imagine-secondary before:pointer-events-none before:absolute before:inset-y-0 before:left-1/2 before:w-0.5 before:-translate-x-1/2 before:opacity-0 before:transition-opacity",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2",
        "hover:before:opacity-60 focus-visible:before:opacity-100 data-[separator=active]:before:opacity-100",
        className,
      )}
      suppressHydrationWarning
      {...props}
    />
  );
}
