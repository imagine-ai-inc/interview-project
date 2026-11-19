"use client";

import { z } from "zod";

import { PostPreview } from "@/components/features/posts/post-preview";
import { POST_TOOL_NAMES } from "@/lib/agent/tool-labels";
import { postSchema } from "@/lib/posts/schema";

import { PanelMessage } from "./panel-message";
import { useJsonResource } from "./use-resource";
import { useToolRevision } from "./use-tool-revision";

const postsResponseSchema = z
  .object({ posts: z.array(postSchema) })
  .transform(({ posts }) => posts);

/** Every post, soonest first, refreshed each time the agent changes one. */
export function PostsPanel() {
  const revision = useToolRevision(POST_TOOL_NAMES);
  const posts = useJsonResource("/api/posts", postsResponseSchema, revision);

  if (posts.data === undefined) {
    return posts.status === "error" ? (
      <PanelMessage tone="error">{posts.error}</PanelMessage>
    ) : (
      <PanelMessage>Loading posts…</PanelMessage>
    );
  }
  if (posts.data.length === 0) {
    return <PanelMessage>No posts yet. Ask the agent to draft one.</PanelMessage>;
  }

  return (
    <ul className="gap-m p-l flex flex-col">
      {posts.data.map((post) => (
        <li key={post.id}>
          <PostPreview post={post} />
        </li>
      ))}
    </ul>
  );
}
