import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { getPostsRepository } from "@/lib/posts/repository";
import { postSchema } from "@/lib/posts/schema";

export const deletePostTool = createTool({
  id: "delete_post",
  description:
    "Permanently delete a post. Only do this when the user asks for it.",
  inputSchema: z.object({
    id: z.string().describe("The post id, e.g. post_1"),
  }),
  outputSchema: postSchema,
  execute: async ({ id }) => getPostsRepository().remove(id),
});
