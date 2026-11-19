"use client";

// v2's composer look on assistant-ui's composer primitives: one box that
// sends while idle and stops the reply while it runs.

import { AuiIf, ComposerPrimitive } from "@assistant-ui/react";
import { m } from "motion/react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { fade, spring } from "@/styles/motion";

export function Composer({ placeholder = "Ask Imagine" }: { placeholder?: string }) {
  return (
    <ComposerPrimitive.Root className="mx-auto flex w-full max-w-3xl min-w-0 flex-col">
      <m.div
        layout
        transition={spring.soft}
        data-slot="composer"
        className="group/composer rounded-panel bg-imagine-surface shadow-floating p-xs has-[textarea:focus]:ring-imagine-secondary-soft relative isolate flex w-full min-w-0 flex-col overflow-hidden transition-shadow has-[textarea:focus]:ring-2"
      >
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={fade.base}
          className="gap-xs p-xs flex min-w-0 items-end"
        >
          <ComposerPrimitive.Input
            rows={1}
            autoFocus
            placeholder={placeholder}
            aria-label="Message the agent"
            enterKeyHint="send"
            className="type-body placeholder:text-imagine-foreground-faint px-xs py-xs field-sizing-content max-h-40 min-h-7 min-w-0 flex-1 resize-none overflow-x-hidden bg-transparent outline-none"
          />
          <AuiIf condition={(s) => !s.thread.isRunning}>
            <ComposerPrimitive.Send asChild>
              <Button type="submit" size="icon-sm" aria-label="Send">
                <Icon name="arrow-up" size="s" />
              </Button>
            </ComposerPrimitive.Send>
          </AuiIf>
          <AuiIf condition={(s) => s.thread.isRunning}>
            <ComposerPrimitive.Cancel asChild>
              <Button type="button" size="icon-sm" aria-label="Stop generating">
                <Icon name="stop" size="s" />
              </Button>
            </ComposerPrimitive.Cancel>
          </AuiIf>
        </m.div>
      </m.div>
    </ComposerPrimitive.Root>
  );
}
