import { describe, expect, it } from "vitest";

import { POST_TOOLS } from "@/mastra/tools/post";

// IMAGINE_DB_PATH is `:memory:` under vitest, so these share one fresh database.

describe("post tools", () => {
  it("lists scheduled posts", async () => {
    const result = await POST_TOOLS.list_posts.execute?.(
      { status: "scheduled" },
      {},
    );
    expect(result).toMatchObject({ posts: [{ id: "post_1" }] });
  });

  it("creates, updates, and deletes a post", async () => {
    const created = await POST_TOOLS.create_post.execute?.(
      {
        title: "Tool test",
        content: "Hello",
        channel: "x",
        status: "draft",
        scheduledAt: null,
        tags: [],
      },
      {},
    );
    expect(created).toMatchObject({ channel: "x", status: "draft" });
    const id = created && "id" in created ? created.id : "";

    const updated = await POST_TOOLS.update_post.execute?.(
      { id, tags: ["#Test"] },
      {},
    );
    expect(updated).toMatchObject({ id, tags: ["#Test"], content: "Hello" });

    await POST_TOOLS.delete_post.execute?.({ id }, {});
    await expect(POST_TOOLS.read_post.execute?.({ id }, {})).rejects.toThrow(
      `Post ${id} not found`,
    );
  });

  it("rejects input that does not match the schema", async () => {
    const result = await POST_TOOLS.create_post.execute?.(
      {
        title: "Bad",
        content: "Body",
        channel: "linkedin",
        // @ts-expect-error -- `status` must be one of the post statuses
        status: "archived",
        scheduledAt: null,
        tags: [],
      },
      {},
    );
    expect(result).toMatchObject({ error: true });
  });
});
