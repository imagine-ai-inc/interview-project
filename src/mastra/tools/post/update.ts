import { createTool } from "@mastra/core/tools";

import { getPostsRepository } from "@/lib/posts/repository";
import { postSchema, updatePostInputSchema } from "@/lib/posts/schema";

export const updatePostTool = createTool({
  id: "update_post",
  description:
    "Update a post. Pass only the fields to change; content and tags are " +
    "replaced as a whole, so read the post first when editing them.",
  inputSchema: updatePostInputSchema,
  outputSchema: postSchema,
  execute: async (input) => getPostsRepository().update(input),
});
