"use client";

import { useAuiState, type AssistantState } from "@assistant-ui/react";

/**
 * Counts finished calls to `toolNames` across the thread, so a panel can
 * refetch each time the agent changes what it shows.
 */
export function useToolRevision(toolNames: ReadonlySet<string>): number {
  return useAuiState((s: AssistantState) =>
    s.thread.messages.reduce(
      (count, message) =>
        count +
        message.content.filter(
          (part) =>
            part.type === "tool-call" &&
            toolNames.has(part.toolName) &&
            part.result !== undefined,
        ).length,
      0,
    ),
  );
}
