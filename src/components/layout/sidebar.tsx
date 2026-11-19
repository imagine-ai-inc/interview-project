"use client";

// v2's rail: one row shape repeated, an icon gutter and a label that clips
// away when the rail collapses, with a tooltip that names the row once it has.

import { ThreadListPrimitive } from "@assistant-ui/react";
import { useTheme } from "next-themes";
import type { ComponentProps, ReactNode } from "react";

import { useInspector } from "@/components/features/inspector/context";
import { useShell } from "@/components/layout/shell";
import { BrandMark, Wordmark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

const ROW =
  "flex h-8 w-full items-center overflow-hidden rounded-control pr-s pl-xs text-left transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 group-data-[collapsed]:justify-center group-data-[collapsed]:px-0";
const QUIET =
  "text-imagine-foreground-muted hover:bg-imagine-foreground/5 hover:text-imagine-foreground";
const SELECTED = "bg-imagine-foreground/8 text-imagine-foreground";

function SidebarRow({
  icon,
  label,
  selected = false,
  className,
  ...props
}: ComponentProps<"button"> & {
  icon: IconName;
  label: string;
  selected?: boolean;
}) {
  const { left } = useShell();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-current={selected ? "page" : undefined}
          className={cn(ROW, selected ? SELECTED : QUIET, className)}
          {...props}
        >
          <span className="relative flex size-6 shrink-0 items-center justify-center">
            <Icon name={icon} size="s" />
          </span>
          <SidebarRowLabel
            className={selected ? "font-semibold" : "font-medium"}
          >
            {label}
          </SidebarRowLabel>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" hidden={!left.collapsed}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarRowLabel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "pl-xs type-small max-w-70 min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-out",
        "group-data-[collapsed]:pointer-events-none group-data-[collapsed]:max-w-0 group-data-[collapsed]:p-0 group-data-[collapsed]:opacity-0",
        "motion-reduce:transition-none",
        className,
      )}
    >
      {children}
    </span>
  );
}

function SidebarBrand() {
  const { left } = useShell();

  return (
    <div className="px-xs flex h-8 shrink-0 items-center overflow-hidden">
      <button
        type="button"
        onClick={left.collapsed ? left.toggle : undefined}
        aria-label={left.collapsed ? "Expand sidebar" : "Imagine AI"}
        className="flex min-w-0 flex-1 items-center overflow-hidden outline-none group-data-[collapsed]:justify-center"
      >
        <BrandMark className="text-imagine-foreground hidden size-6 group-data-[collapsed]:block" />
        <Wordmark className="text-imagine-foreground h-5 group-data-[collapsed]:hidden" />
      </button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Collapse sidebar"
            onClick={left.toggle}
            className="text-imagine-foreground-faint hover:text-imagine-foreground ml-auto shrink-0 group-data-[collapsed]:hidden"
          >
            <Icon name="chevron-left" size="s" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Collapse</TooltipContent>
      </Tooltip>
    </div>
  );
}

/** The theme is only known after hydration, so the row names the action, not the mode. */
function SidebarThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <SidebarRow
      icon="moon"
      label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    />
  );
}

/** The app rail. "New session" opens an empty thread; nothing is stored. */
export function AppSidebar() {
  const { left } = useShell();
  const inspector = useInspector();

  return (
    <aside
      data-collapsed={left.collapsed || undefined}
      className="group bg-imagine-background text-imagine-foreground h-full w-full min-w-0 overflow-x-hidden"
    >
      <div className="px-s py-m group-data-[collapsed]:px-xs flex h-full min-h-0 w-full min-w-0 flex-col overflow-x-hidden">
        <SidebarBrand />
        <ThreadListPrimitive.New asChild>
          <SidebarRow icon="pen-to-square" label="New session" className="mt-m" />
        </ThreadListPrimitive.New>
        <nav aria-label="Main" className="mt-l flex flex-col gap-px">
          <SidebarRow icon="message" label="Agent" selected />
          <SidebarRow
            icon="calendar"
            label="Posts"
            onClick={() => inspector.show("posts")}
          />
          <SidebarRow
            icon="folder"
            label="Files"
            onClick={() => inspector.show("files")}
          />
        </nav>
        <div className="mt-auto flex flex-col gap-px">
          <SidebarThemeToggle />
        </div>
      </div>
    </aside>
  );
}
