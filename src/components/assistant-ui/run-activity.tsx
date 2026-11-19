"use client";

import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export type RunActivityStatus =
  | "running"
  | "requires-action"
  | "complete"
  | "cancelled"
  | "incomplete"
  | "error";

export interface RunActivityEntry {
  id: string;
  kind: "commentary" | "tool";
  label: string;
  content: ReactNode;
}

/**
 * assistant-ui's Run activity element, as in v2: reasoning, tools, and the
 * text between them fold into one disclosure; the answer stays outside it.
 */
export function RunActivity({
  status,
  statusLabel,
  durationLabel,
  entries,
  open,
  onOpenChange,
  children,
  className,
}: {
  status: RunActivityStatus;
  statusLabel: string;
  durationLabel?: ReactNode;
  entries: readonly RunActivityEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The final answer, outside the disclosure. */
  children?: ReactNode;
  className?: string;
}) {
  const latestActivity =
    status === "running"
      ? entries.findLast((entry) => entry.label.trim())?.label
      : undefined;

  const summary = (
    <span className="text-start tabular-nums">
      <span className={status === "running" ? "shimmer-text" : undefined}>
        {statusLabel}
      </span>
      {durationLabel != null && <> {durationLabel}</>}
    </span>
  );

  return (
    <div
      data-slot="run-activity"
      data-status={status}
      className={cn("flex min-w-0 flex-col gap-3", className)}
    >
      {entries.length > 0 ? (
        <Collapsible open={open} onOpenChange={onOpenChange}>
          <CollapsibleTrigger
            aria-busy={status === "running"}
            className="group/trigger type-small text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex max-w-full items-center gap-1.5 rounded-md pt-1 outline-none focus-visible:ring-[3px]"
          >
            {summary}
            <ChevronRightIcon
              aria-hidden="true"
              className="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/trigger:rotate-90 motion-reduce:transition-none"
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="peer data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden motion-reduce:animate-none">
            <ol className="type-small border-border ms-1.5 flex min-w-0 flex-col gap-3 border-s ps-3.5 pt-2 wrap-anywhere">
              {entries.map((entry) => (
                <li key={entry.id} data-activity-kind={entry.kind}>
                  {entry.content}
                </li>
              ))}
            </ol>
          </CollapsibleContent>
          {!open && latestActivity ? (
            <p className="type-small text-muted-foreground wrap-anywhere peer-[:not([hidden])]:hidden">
              {latestActivity}
            </p>
          ) : null}
        </Collapsible>
      ) : (
        <p className="type-small text-muted-foreground pt-1">{summary}</p>
      )}
      <span role="status" aria-atomic="true" className="sr-only">
        {statusLabel}
        {status !== "running" && durationLabel != null && <> {durationLabel}</>}
      </span>
      {children}
    </div>
  );
}

/**
 * Tool calls made in a row, folded into one row that reads like a tool's.
 * Open, the calls sit closer together than separate steps.
 */
export function ToolGroup({
  summary,
  running,
  children,
}: {
  summary: string;
  running: boolean;
  children: ReactNode;
}) {
  return (
    <Collapsible data-slot="tool-group">
      <CollapsibleTrigger className="group/trigger type-small text-muted-foreground hover:text-foreground flex w-full items-center gap-2 py-1.5 text-start transition-colors">
        <Icon name="list" size="s" className="w-4 shrink-0 text-center" />
        <span className={running ? "shimmer-text" : undefined}>{summary}</span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 -rotate-90 opacity-0 transition-[rotate,opacity] duration-200 group-hover/trigger:opacity-100 group-focus-visible/trigger:opacity-100 group-data-[state=open]/trigger:rotate-0 group-data-[state=open]/trigger:opacity-100 motion-reduce:transition-none"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden motion-reduce:animate-none">
        <div className="flex flex-col **:data-[slot=tool-fallback-trigger]:py-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
