import { beforeEach, describe, expect, it } from "vitest";

import { openDatabase } from "@/lib/db";
import {
  InvalidPostError,
  PostNotFoundError,
  createPostsRepository,
  type PostsRepository,
} from "@/lib/posts/repository";

let posts: PostsRepository;

beforeEach(() => {
  posts = createPostsRepository(openDatabase(":memory:"));
});

describe("posts repository", () => {
  it("seeds three posts with parsed tags", () => {
    const all = posts.list();
    expect(all).toHaveLength(3);
    expect(posts.get("post_1").tags).toEqual([
      "#B2BGrowth",
      "#ContentMarketing",
      "#AIWorkflow",
    ]);
  });

  it("filters by status and channel", () => {
    expect(posts.list({ status: "scheduled" }).map((p) => p.id)).toEqual([
      "post_1",
    ]);
    expect(posts.list({ channel: "x" }).map((p) => p.id)).toEqual(["post_3"]);
  });

  it("creates a LinkedIn draft by default", () => {
    const post = posts.create({ title: "Hook test", content: "Body" });
    expect(post).toMatchObject({
      channel: "linkedin",
      status: "draft",
      scheduledAt: null,
      tags: [],
      authorName: "Alex Rivera",
    });
    expect(posts.list()).toHaveLength(4);
  });

  it("updates only the fields it is given", () => {
    const updated = posts.update({ id: "post_3", status: "published" });
    expect(updated.status).toBe("published");
    expect(updated.content).toBe(posts.get("post_3").content);
    expect(updated.tags).toEqual(["#BuildInPublic", "#Growth"]);
  });

  it("keeps a scheduled post scheduled", () => {
    const updated = posts.update({
      id: "post_2",
      status: "scheduled",
      scheduledAt: "2026-12-01T09:00:00.000Z",
    });
    expect(updated.status).toBe("scheduled");
    expect(updated.scheduledAt).toBe("2026-12-01T09:00:00.000Z");
  });

  it("refuses to schedule a post without a time", () => {
    expect(() => posts.update({ id: "post_3", status: "scheduled" })).toThrow(
      InvalidPostError,
    );
  });

  it("deletes a post and reports a missing one", () => {
    posts.remove("post_3");
    expect(() => posts.get("post_3")).toThrow(PostNotFoundError);
    expect(() => posts.remove("post_3")).toThrow(PostNotFoundError);
  });
});
