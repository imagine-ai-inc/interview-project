"use client";

// v2's tool row: a collapsible trigger that names the call, with its
// arguments, result, or error inside.

import {
  useToolCallElapsed,
  type ToolCallMessagePartComponent,
  type ToolCallMessagePartStatus,
} from "@assistant-ui/react";
import { ChevronDownIcon, LoaderIcon, XCircleIcon } from "lucide-react";
import { memo } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { describeTool } from "@/lib/agent/tool-labels";
import { cn } from "@/lib/cn";

const formatToolDuration = (ms: number) => {
  if (ms < 1000) return "<1s";
  const seconds = ms / 1000;
  if (seconds < 10) return `${(Math.floor(seconds * 10) / 10).toFixed(1)}s`;
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
};

function ToolDuration() {
  const elapsedMs = useToolCallElapsed();
  if (elapsedMs === undefined) return null;
  return (
    <span className="text-muted-foreground text-xs tabular-nums">
      {formatToolDuration(elapsedMs)}
    </span>
  );
}

function errorText(status: ToolCallMessagePartStatus): string | null {
  if (status.type !== "incomplete" || !status.error) return null;
  return typeof status.error === "string"
    ? status.error
    : JSON.stringify(status.error);
}

const stringify = (value: unknown) =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);

function Block({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium">{title}</p>
      <pre className="bg-muted/50 text-foreground/90 mt-1 max-h-64 overflow-auto rounded-md p-2.5 text-xs whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

const ToolFallbackImpl: ToolCallMessagePartComponent = ({
  toolName,
  args,
  argsText,
  result,
  status,
}) => {
  const { icon, title } = describeTool(toolName, args);
  const running = status.type === "running";
  const cancelled = status.type === "incomplete" && status.reason === "cancelled";
  const failed = status.type === "incomplete" && !cancelled;
  const error = errorText(status);

  return (
    <Collapsible data-slot="tool-fallback-root" className="w-full">
      <CollapsibleTrigger
        data-slot="tool-fallback-trigger"
        className="group/trigger type-small text-muted-foreground hover:text-foreground flex w-full items-center gap-2 py-1.5 transition-colors"
      >
        {running ? (
          <LoaderIcon className="size-4 shrink-0 animate-spin [animation-duration:0.6s]" />
        ) : failed ? (
          <XCircleIcon className="text-destructive size-4 shrink-0" />
        ) : (
          <Icon name={icon} size="s" className="w-4 shrink-0" />
        )}
        <span
          className={cn(
            "relative inline-block text-start leading-none",
            cancelled && "line-through",
          )}
        >
          <span>{title}</span>
          {running ? (
            <span
              aria-hidden
              className="aui-shimmer pointer-events-none absolute inset-0 motion-reduce:animate-none"
            >
              {title}
            </span>
          ) : null}
        </span>
        <ToolDuration />
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 -rotate-90 opacity-0 transition-[rotate,opacity] duration-200 group-hover/trigger:opacity-100 group-focus-visible/trigger:opacity-100 group-data-[state=open]/trigger:rotate-0 group-data-[state=open]/trigger:opacity-100 motion-reduce:transition-none"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden motion-reduce:animate-none">
        <div className="type-small flex flex-col gap-2 ps-6 pt-1 pb-2">
          {argsText ? <Block title="Input">{argsText}</Block> : null}
          {result !== undefined ? (
            <Block title="Result">{stringify(result)}</Block>
          ) : null}
          {error ? (
            <Block title={cancelled ? "Cancelled" : "Error"}>{error}</Block>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const ToolFallback = memo(ToolFallbackImpl);
