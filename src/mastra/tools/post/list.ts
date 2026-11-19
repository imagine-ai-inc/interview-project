import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { getPostsRepository } from "@/lib/posts/repository";
import { listPostsInputSchema, postSchema } from "@/lib/posts/schema";

export const listPostsTool = createTool({
  id: "list_posts",
  description:
    "List posts in the content calendar, soonest first. Filter by status " +
    "(draft, planned, scheduled, published) or channel (linkedin, x).",
  inputSchema: listPostsInputSchema,
  outputSchema: z.object({ posts: z.array(postSchema) }),
  execute: async (filters) => ({ posts: getPostsRepository().list(filters) }),
});
