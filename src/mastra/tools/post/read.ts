import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { getPostsRepository } from "@/lib/posts/repository";
import { postSchema } from "@/lib/posts/schema";

export const readPostTool = createTool({
  id: "read_post",
  description: "Read a single post by id, with its full content.",
  inputSchema: z.object({
    id: z.string().describe("The post id, e.g. post_1"),
  }),
  outputSchema: postSchema,
  execute: async ({ id }) => getPostsRepository().get(id),
});
