import { createPostTool } from "./create";
import { deletePostTool } from "./delete";
import { listPostsTool } from "./list";
import { readPostTool } from "./read";
import { updatePostTool } from "./update";

export const POST_TOOLS = {
  list_posts: listPostsTool,
  read_post: readPostTool,
  create_post: createPostTool,
  update_post: updatePostTool,
  delete_post: deletePostTool,
};
