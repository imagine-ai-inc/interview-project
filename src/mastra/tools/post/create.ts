import { createTool } from "@mastra/core/tools";

import { getPostsRepository } from "@/lib/posts/repository";
import { createPostInputSchema, postSchema } from "@/lib/posts/schema";

export const createPostTool = createTool({
  id: "create_post",
  description:
    "Create a post in the content calendar. Defaults to a LinkedIn draft. " +
    "A scheduled post needs scheduledAt.",
  inputSchema: createPostInputSchema,
  outputSchema: postSchema,
  execute: async (input) => getPostsRepository().create(input),
});
