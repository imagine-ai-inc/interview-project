"use client";

import { useShell } from "@/components/layout/shell";
import { Icon } from "@/components/ui/icon";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { cn } from "@/lib/cn";

import { useInspector, type InspectorTab } from "./context";
import { FilesPanel } from "./files-panel";
import { PostsPanel } from "./posts-panel";

const TABS: readonly { id: InspectorTab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "files", label: "Files" },
];

/** The right side: the posts the agent manages and the workspace it writes to. */
export function Inspector() {
  const { tab, show } = useInspector();
  const { right } = useShell();

  return (
    <>
      <header className="px-l flex h-12 shrink-0 items-center gap-1">
        <div role="tablist" aria-label="Inspector" className="flex gap-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => show(id)}
              className={cn(
                "type-small rounded-control h-control-xs px-2.5 font-medium transition-colors",
                tab === id
                  ? "bg-imagine-foreground/8 text-imagine-foreground"
                  : "text-imagine-foreground-muted hover:text-imagine-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <TooltipIconButton
          tooltip="Close panel"
          onClick={right.toggle}
          className="text-imagine-foreground-faint hover:text-imagine-foreground ml-auto"
        >
          <Icon name="xmark" size="s" />
        </TooltipIconButton>
      </header>
      <div
        role="tabpanel"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        {tab === "posts" ? <PostsPanel /> : <FilesPanel />}
      </div>
    </>
  );
}
