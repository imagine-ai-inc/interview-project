"use client";

import { useShell } from "@/components/layout/shell";
import { Icon } from "@/components/ui/icon";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";

/** The center's header: the session title and the way back to a shut side. */
export function ChatHeader() {
  const { left, right } = useShell();

  return (
    <header className="px-l flex h-12 shrink-0 items-center gap-2">
      {left.collapsed ? (
        <TooltipIconButton
          tooltip="Expand sidebar"
          side="right"
          onClick={left.toggle}
          className="text-imagine-foreground-faint hover:text-imagine-foreground -ml-2 hidden md:flex"
        >
          <Icon name="chevron-right" size="s" />
        </TooltipIconButton>
      ) : null}
      <span className="type-small truncate font-medium">New session</span>
      {right.collapsed ? (
        <TooltipIconButton
          tooltip="Open panel"
          onClick={right.toggle}
          className="text-imagine-foreground-faint hover:text-imagine-foreground ml-auto"
        >
          <Icon name="sidebar" size="s" />
        </TooltipIconButton>
      ) : null}
    </header>
  );
}
