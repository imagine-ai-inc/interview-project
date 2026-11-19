"use client";

import {
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  useMessageTiming,
  useScrollLock,
  useThreadViewportStore,
  type AssistantState,
} from "@assistant-ui/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { useShallow } from "zustand/shallow";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { describeTool, describeTools } from "@/lib/agent/tool-labels";
import { cn } from "@/lib/cn";

import { MarkdownText } from "./markdown-text";
import {
  RunActivity,
  ToolGroup,
  type RunActivityEntry,
  type RunActivityStatus,
} from "./run-activity";
import { ToolFallback } from "./tool-fallback";

const isEmptyThread = (s: AssistantState) => s.thread.messages.length === 0;

/** Fills its parent; the viewport inside is the scrollport. */
function ThreadRoot({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <ThreadPrimitive.Root
      className={cn("aui-root flex min-h-0 flex-1 flex-col", className)}
    >
      {children}
    </ThreadPrimitive.Root>
  );
}

function ThreadViewport({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <ThreadPrimitive.Viewport className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-scroll overscroll-none scroll-smooth">
      <div
        className={cn("pt-l flex w-full min-w-0 flex-1 flex-col", className)}
      >
        {children}
      </div>
    </ThreadPrimitive.Viewport>
  );
}

/** Renders only while the thread has no messages. */
function ThreadEmpty({ children }: { children: ReactNode }) {
  return <AuiIf condition={isEmptyThread}>{children}</AuiIf>;
}

function ThreadMessages() {
  return (
    <div className="type-small mb-6 flex flex-col gap-y-4 empty:hidden">
      <ThreadPrimitive.Messages>{() => <ThreadMessage />}</ThreadPrimitive.Messages>
    </div>
  );
}

/** Pins the composer to the foot of the viewport, with the scroll and suggestion rows above it. */
function ThreadFooter({
  suggestions,
  children,
}: {
  suggestions: readonly string[];
  children: ReactNode;
}) {
  return (
    <ThreadPrimitive.ViewportFooter className="pb-l **:data-[slot=composer]:shadow-raised bg-imagine-surface before:from-imagine-surface sticky bottom-0 z-10 mt-auto flex flex-col gap-4 overflow-visible before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-6 before:bg-linear-to-t before:to-transparent">
      <ThreadScrollToBottom />
      <AuiIf condition={(s) => isEmptyThread(s) && s.composer.isEmpty}>
        <ThreadSuggestions suggestions={suggestions} />
      </AuiIf>
      {children}
    </ThreadPrimitive.ViewportFooter>
  );
}

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);

  if (isEditing) return <EditComposer />;
  if (role === "user") return <UserMessage />;
  return <AssistantMessage />;
};

const ThreadScrollToBottom: FC = () => (
  <ThreadPrimitive.ScrollToBottom asChild>
    <TooltipIconButton
      tooltip="Scroll to bottom"
      side="top"
      variant="outline"
      className="bg-imagine-surface-raised shadow-floating mb-s absolute right-0 bottom-full z-10 rounded-full disabled:invisible"
    >
      <Icon name="arrow-down" size="s" />
    </TooltipIconButton>
  </ThreadPrimitive.ScrollToBottom>
);

const ThreadSuggestions: FC<{ suggestions: readonly string[] }> = ({
  suggestions,
}) => (
  <div className="flex w-full flex-wrap items-center justify-center gap-2 px-4">
    {suggestions.map((prompt) => (
      <div
        key={prompt}
        className="animate-in fill-mode-both fade-in slide-in-from-bottom-2 duration-200"
      >
        <ThreadPrimitive.Suggestion prompt={prompt} send asChild>
          <Button
            variant="ghost"
            className="type-small border-border/60 text-foreground hover:bg-muted h-auto rounded-full border px-3.5 py-1.5 font-normal whitespace-nowrap"
          >
            {prompt}
          </Button>
        </ThreadPrimitive.Suggestion>
      </div>
    ))}
  </div>
);

const MessageError: FC = () => (
  <MessagePrimitive.Error>
    <ErrorPrimitive.Root className="animate-in bg-destructive/[0.06] dark:bg-destructive/10 fade-in my-2 flex items-start gap-2.5 rounded-2xl px-4 py-3 duration-300 motion-reduce:animate-none">
      <Icon
        name="triangle-exclamation"
        size="s"
        className="text-destructive/80 mt-0.5 shrink-0"
      />
      <div className="min-w-0">
        <p className="text-destructive font-medium">Something went wrong</p>
        <ErrorPrimitive.Message className="text-destructive/60 mt-0.5 line-clamp-2" />
      </div>
      <ActionBarPrimitive.Reload asChild>
        <button
          type="button"
          className="text-destructive hover:bg-destructive/10 ms-auto flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
        >
          <Icon name="arrows-rotate" size="s" />
          Retry
        </button>
      </ActionBarPrimitive.Reload>
    </ErrorPrimitive.Root>
  </MessagePrimitive.Error>
);

const formatDuration = (ms: number) => {
  const seconds = Math.max(1, Math.round(ms / 1000));
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

/** Time since `since`, ticking each second; only this text re-renders. */
const RunningFor: FC<{ since: number }> = ({ since }) => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <>{formatDuration(now - since)}</>;
};

const runStatus = (s: AssistantState): RunActivityStatus => {
  const status = s.message.status;
  if (status?.type !== "incomplete") return status?.type ?? "complete";
  return status.reason === "cancelled" || status.reason === "error"
    ? status.reason
    : "incomplete";
};

/** What the row says before its duration, and without one. */
const STATUS_LABELS: Record<RunActivityStatus, [timed: string, bare: string]> =
  {
    running: ["Working for", "Working"],
    "requires-action": ["Needs your input", "Needs your input"],
    complete: ["Worked for", "Completed"],
    cancelled: ["Stopped after", "Stopped"],
    error: ["Failed after", "Failed"],
    incomplete: ["Incomplete", "Incomplete"],
  };

const Thinking: FC = () => (
  <div className="text-imagine-foreground-muted">
    <MarkdownText />
  </div>
);

const PART_COMPONENTS = {
  Text: MarkdownText,
  Reasoning: Thinking,
  tools: { Fallback: ToolFallback },
};

interface ToolCallStep {
  id: string;
  toolName: string;
  args: Readonly<Record<string, unknown>>;
  running: boolean;
  content: ReactNode;
}

/**
 * Reasoning, tools, and the text between them fold into one disclosure; the
 * text after the last step is the answer.
 */
const AssistantRun: FC = () => {
  const parts = useAuiState(useShallow((s) => s.message.parts));
  const status = useAuiState(runStatus);
  const totalMs = useMessageTiming()?.totalStreamTime;
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  // Not `message.createdAt`: the converter re-dates the streaming message on
  // every chunk, so that anchor would keep snapping the count back to 1s.
  const [startedAt] = useState(Date.now);
  const rootRef = useRef<HTMLDivElement>(null);
  const lockScroll = useScrollLock(rootRef, 200);
  const viewport = useThreadViewportStore({ optional: true });
  const running = status === "running";
  const open = userOpen ?? running;

  // Open while it runs and fold when it settles, unless the reader chose.
  const wasRunning = useRef(running);
  useLayoutEffect(() => {
    if (wasRunning.current === running) return;
    wasRunning.current = running;
    if (userOpen === null && !viewport?.getState().isAtBottom) lockScroll();
  }, [running, userOpen, lockScroll, viewport]);

  const lastStep = parts.findLastIndex(
    (part) => part.type === "reasoning" || part.type === "tool-call",
  );
  const entries: RunActivityEntry[] = [];
  const answer: ReactNode[] = [];
  let calls: ToolCallStep[] = [];
  // Calls made in a row are one step; thinking or text between them ends it.
  const endCalls = () => {
    const [first] = calls;
    if (first === undefined) return;
    if (calls.length === 1) {
      entries.push({
        id: first.id,
        kind: "tool",
        label: describeTool(first.toolName, first.args).title,
        content: first.content,
      });
    } else {
      const summary = describeTools(calls);
      entries.push({
        id: first.id,
        kind: "tool",
        label: summary,
        content: (
          <ToolGroup
            summary={summary}
            running={calls.some((call) => call.running)}
          >
            {calls.map((call) => call.content)}
          </ToolGroup>
        ),
      });
    }
    calls = [];
  };
  parts.forEach((part, index) => {
    const content = (
      <MessagePrimitive.PartByIndex
        key={index}
        index={index}
        components={PART_COMPONENTS}
      />
    );
    const id = String(index);
    if (part.type === "tool-call") {
      calls.push({
        id: part.toolCallId,
        toolName: part.toolName,
        args: part.args,
        running: part.status.type === "running",
        content,
      });
    } else if (part.type === "reasoning") {
      endCalls();
      entries.push({ id, kind: "commentary", label: "Thinking", content });
    } else if (part.type === "text" && index < lastStep) {
      // Blank text between calls renders nothing, so it doesn't split them.
      if (!part.text.trim()) return;
      endCalls();
      const label = (part.text.trim().split("\n", 1)[0] ?? "").replace(
        /[#*_`>]/g,
        "",
      );
      entries.push({ id, kind: "commentary", label, content });
    } else if (part.type !== "data") {
      answer.push(content);
    }
  });
  endCalls();

  if (entries.length === 0 && status === "complete") {
    return <div className="font-research">{answer}</div>;
  }

  const started = parts.some(
    (part) => part.type !== "text" || part.text.trim() !== "",
  );
  const [timed, bare] =
    running && !started ? ["Thinking", "Thinking"] : STATUS_LABELS[status];
  const duration =
    timed === bare ? undefined : running ? (
      <RunningFor since={startedAt} />
    ) : totalMs === undefined ? undefined : (
      formatDuration(totalMs)
    );

  return (
    <div ref={rootRef}>
      <RunActivity
        status={status}
        statusLabel={duration === undefined ? bare : timed}
        durationLabel={duration}
        entries={entries}
        open={open}
        onOpenChange={(next) => {
          lockScroll();
          setUserOpen(next);
        }}
      >
        {answer.length > 0 ? (
          <div className="font-research">{answer}</div>
        ) : null}
      </RunActivity>
    </div>
  );
};

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root
    data-role="assistant"
    className="group/message animate-in fade-in slide-in-from-bottom-1 relative -mb-6.5 pb-6.5 duration-150"
  >
    <div className="text-foreground px-2 wrap-break-word">
      <AssistantRun />
      <MessageError />
    </div>
    <div className="ms-2 flex min-h-6.5 items-center pt-0.5 [&_button]:size-6">
      <BranchPicker />
      <AssistantActionBar />
    </div>
  </MessagePrimitive.Root>
);

const ACTION_BAR =
  "flex gap-1 text-muted-foreground opacity-0 transition-opacity group-last/message:opacity-100 group-hover/message:opacity-100 focus-within:opacity-100 motion-reduce:transition-none";

const AssistantActionBar: FC = () => (
  <ActionBarPrimitive.Root hideWhenRunning className={cn(ACTION_BAR, "-ms-1")}>
    <CopyAction />
    <ActionBarPrimitive.Reload asChild>
      <TooltipIconButton tooltip="Refresh">
        <Icon name="arrows-rotate" size="s" />
      </TooltipIconButton>
    </ActionBarPrimitive.Reload>
  </ActionBarPrimitive.Root>
);

const UserMessage: FC = () => (
  <MessagePrimitive.Root
    data-role="user"
    className="group/message animate-in fade-in slide-in-from-bottom-1 grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 duration-150 [&:where(>*)]:col-start-2"
  >
    <div className="relative col-start-2 min-w-0">
      <div className="bg-imagine-surface-raised rounded-panel text-foreground px-3 py-1.5 wrap-break-word whitespace-pre-wrap empty:hidden">
        <MessagePrimitive.Parts />
      </div>
    </div>
    <div className="col-span-full col-start-1 row-start-3 -mt-1.5 flex min-h-6 items-center justify-end [&_button]:size-6">
      <BranchPicker className="-me-1" />
      <ActionBarPrimitive.Root className={cn(ACTION_BAR, "items-center")}>
        <CopyAction />
        <ActionBarPrimitive.Edit asChild>
          <TooltipIconButton tooltip="Edit">
            <Icon name="pen" size="s" />
          </TooltipIconButton>
        </ActionBarPrimitive.Edit>
      </ActionBarPrimitive.Root>
    </div>
  </MessagePrimitive.Root>
);

/** Copy cross-fades to a check on `data-copied`. */
const CopyAction: FC = () => (
  <ActionBarPrimitive.Copy asChild>
    <TooltipIconButton
      tooltip="Copy"
      className="group/copy grid place-items-center *:transition-[opacity,scale,filter] *:duration-200 *:[grid-area:1/1] motion-reduce:*:transition-none"
    >
      <Icon
        name="copy"
        size="s"
        className="group-data-[copied=true]/copy:scale-[0.25] group-data-[copied=true]/copy:opacity-0 group-data-[copied=true]/copy:blur-[4px]"
      />
      <Icon
        name="check"
        size="s"
        className="scale-[0.25] opacity-0 blur-[4px] group-data-[copied=true]/copy:scale-100 group-data-[copied=true]/copy:opacity-100 group-data-[copied=true]/copy:blur-none"
      />
    </TooltipIconButton>
  </ActionBarPrimitive.Copy>
);

const EditComposer: FC = () => (
  <MessagePrimitive.Root className="flex flex-col px-2">
    <ComposerPrimitive.Root className="bg-imagine-surface border-border/60 text-foreground ms-auto flex w-full max-w-[85%] flex-col gap-3 rounded-[20px] border p-3.5">
      <ComposerPrimitive.Input
        aria-label="Edit your message"
        className="bg-foreground/[0.04] text-foreground focus-visible:ring-foreground/20 dark:bg-foreground/[0.06] min-h-14 w-full resize-none rounded-xl px-3 py-2.5 leading-relaxed outline-hidden focus-visible:ring-1"
        autoFocus
      />
      <div className="flex items-center justify-end gap-2">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost" size="sm" className="rounded-full">
            Cancel
          </Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button size="sm" className="rounded-full">
            Send
          </Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  </MessagePrimitive.Root>
);

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => (
  <BranchPickerPrimitive.Root
    hideWhenSingleBranch
    className={cn(
      "text-muted-foreground -ms-2 me-2 inline-flex items-center text-xs opacity-0 transition-opacity group-hover/message:opacity-100 focus-within:opacity-100 motion-reduce:transition-none",
      className,
    )}
    {...rest}
  >
    <BranchPickerPrimitive.Previous asChild>
      <TooltipIconButton tooltip="Previous">
        <Icon name="chevron-left" size="s" />
      </TooltipIconButton>
    </BranchPickerPrimitive.Previous>
    <span className="font-medium">
      <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
    </span>
    <BranchPickerPrimitive.Next asChild>
      <TooltipIconButton tooltip="Next">
        <Icon name="chevron-right" size="s" />
      </TooltipIconButton>
    </BranchPickerPrimitive.Next>
  </BranchPickerPrimitive.Root>
);

/** The thread family, as in v2. */
export const Thread = {
  Root: ThreadRoot,
  Viewport: ThreadViewport,
  Messages: ThreadMessages,
  Footer: ThreadFooter,
  Empty: ThreadEmpty,
};
