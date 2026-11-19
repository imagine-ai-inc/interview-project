"use client";

import { m } from "motion/react";
import { useState } from "react";

import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { Post, PostStatus } from "@/lib/posts/schema";
import { fade } from "@/styles/motion";

const ACTIONS: readonly { icon: IconName; label: string }[] = [
  { icon: "thumbs-up", label: "Like" },
  { icon: "comment", label: "Comment" },
  { icon: "repost", label: "Repost" },
  { icon: "paper-plane", label: "Send" },
];

/** v2's calendar colors: rose scheduled, green published, gold planned. */
const STATUS_CHIP: Record<PostStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-imagine-foreground/8 text-imagine-foreground-muted",
  },
  planned: { label: "Planned", className: "bg-imagine-tag-4/16 text-imagine-foreground" },
  scheduled: { label: "Scheduled", className: "bg-imagine-tag-1/16 text-imagine-foreground" },
  published: { label: "Published", className: "bg-imagine-tag-2/16 text-imagine-foreground" },
};

/** Where LinkedIn folds a post: about two lines before "…more", or three source lines. */
const FOLD_CHARS = 140;
const FOLD_LINES = 3;

function foldBody(body: string): { shown: string; folded: boolean } {
  const lineBreak = body.split("\n", FOLD_LINES).join("\n").length;
  const limit = Math.min(FOLD_CHARS, lineBreak);
  if (body.length <= limit) return { shown: body, folded: false };
  const cut = body.slice(0, limit);
  const word = cut.lastIndexOf(" ");
  return {
    shown: (word > limit / 2 ? cut.slice(0, word) : cut).trimEnd(),
    folded: true,
  };
}

function formatWhen(post: Post): string {
  if (!post.scheduledAt) return "Not scheduled";
  return new Date(post.scheduledAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StatusChip({ status }: { status: PostStatus }) {
  const chip = STATUS_CHIP[status];
  return (
    <span
      className={cn(
        "type-caption rounded-control px-1.5 py-0.5 font-medium",
        chip.className,
      )}
    >
      {chip.label}
    </span>
  );
}

function FoldedBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const fold = foldBody(body);
  const folded = !expanded && fold.folded;

  return (
    <p className="type-small whitespace-pre-line">
      {folded ? fold.shown : body}
      {folded ? (
        <>
          …{" "}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-imagine-foreground-muted hover:text-imagine-foreground focus-visible:ring-ring/40 rounded-[2px] outline-none hover:underline focus-visible:ring-2"
          >
            more
          </button>
        </>
      ) : null}
    </p>
  );
}

/** A post the way the feed shows it, folded behind "…more", with its status. */
export function PostPreview({ post }: { post: Post }) {
  return (
    <m.article
      layout
      transition={fade.base}
      className="rounded-panel bg-imagine-surface shadow-raised flex flex-col overflow-hidden"
    >
      <header className="gap-s px-l pt-l flex items-start">
        <span className="bg-imagine-secondary-soft text-imagine-secondary-strong type-small flex size-10 shrink-0 items-center justify-center rounded-full font-semibold">
          {initials(post.authorName)}
        </span>
        <div className="min-w-0 flex-1 leading-none">
          <p className="type-small truncate leading-5 font-semibold">
            {post.authorName}
          </p>
          <p className="type-caption text-imagine-foreground-muted gap-xs mt-px flex items-center">
            {formatWhen(post)}
            <span aria-hidden="true">•</span>
            <Icon
              name={post.channel === "x" ? "x-twitter" : "linkedin-in"}
              size="s"
              className="[font-size:var(--imagine-text-caption-size)]"
            />
          </p>
        </div>
        <StatusChip status={post.status} />
      </header>
      <div className="px-l pt-s min-w-0">
        <p className="type-caption text-imagine-foreground-muted mb-xs font-medium">
          {post.title}
        </p>
        <FoldedBody body={post.content} />
        {post.tags.length > 0 ? (
          <p className="type-small text-imagine-tag-3 mt-s">
            {post.tags.join(" ")}
          </p>
        ) : null}
      </div>
      <div className="gap-l px-l py-m flex items-center">
        {ACTIONS.map((action) => (
          <span
            key={action.label}
            aria-label={action.label}
            className="text-imagine-foreground-muted inline-flex items-center"
          >
            <Icon name={action.icon} size="m" />
          </span>
        ))}
        <span className="type-caption text-imagine-foreground-faint ml-auto font-mono">
          {post.id}
        </span>
      </div>
    </m.article>
  );
}
