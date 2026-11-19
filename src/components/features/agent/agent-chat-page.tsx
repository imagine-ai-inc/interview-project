"use client";

import { m } from "motion/react";

import { Thread } from "@/components/assistant-ui/thread";
import { BrandMark } from "@/components/ui/brand-mark";
import { fade } from "@/styles/motion";

import { Composer } from "./composer";

const SUGGESTIONS = [
  "What posts are scheduled?",
  "Draft a LinkedIn post from drafts/agency-teardown.md",
  "Make a PDF one-pager of the approval bottleneck post",
] as const;

/** The brand mark behind an empty chat, out of flow so the composer opens over it. */
function ChatEmptyMark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
    >
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade.slow}>
        <BrandMark className="text-imagine-foreground/8 size-16" />
      </m.div>
    </div>
  );
}

/** The full page chat. */
export function AgentChatPage() {
  return (
    <Thread.Root className="relative isolate min-w-0">
      <Thread.Empty>
        <ChatEmptyMark />
      </Thread.Empty>
      <Thread.Viewport className="px-l pt-l md:pt-xxl mx-auto max-w-3xl">
        <Thread.Messages />
        <Thread.Footer suggestions={SUGGESTIONS}>
          <Composer />
        </Thread.Footer>
      </Thread.Viewport>
    </Thread.Root>
  );
}
