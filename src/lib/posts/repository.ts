import { randomUUID } from "node:crypto";

import { DEFAULT_AUTHOR, getDb, type SqliteDatabase } from "@/lib/db";

import {
  createPostInputSchema,
  listPostsInputSchema,
  postSchema,
  updatePostInputSchema,
  type CreatePostInput,
  type ListPostsInput,
  type Post,
  type PostStatus,
  type UpdatePostInput,
} from "./schema";

interface PostRow {
  id: string;
  title: string;
  content: string;
  channel: string;
  status: string;
  scheduled_at: string | null;
  tags: string;
  author_name: string;
  author_handle: string;
  created_at: string;
  updated_at: string;
}

export class PostNotFoundError extends Error {
  constructor(id: string) {
    super(`Post ${id} not found`);
    this.name = "PostNotFoundError";
  }
}

export class InvalidPostError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPostError";
  }
}

function toPost(row: PostRow): Post {
  return postSchema.parse({
    id: row.id,
    title: row.title,
    content: row.content,
    channel: row.channel,
    status: row.status,
    scheduledAt: row.scheduled_at,
    tags: JSON.parse(row.tags),
    authorName: row.author_name,
    authorHandle: row.author_handle,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function assertSchedulable(status: PostStatus, scheduledAt: string | null) {
  if (status === "scheduled" && !scheduledAt) {
    throw new InvalidPostError("A scheduled post needs a scheduledAt time");
  }
}

export function createPostsRepository(db: SqliteDatabase) {
  const selectById = db.prepare<[string], PostRow>(
    "SELECT * FROM posts WHERE id = ?",
  );

  function get(id: string): Post {
    const row = selectById.get(id);
    if (!row) throw new PostNotFoundError(id);
    return toPost(row);
  }

  function list(filters: ListPostsInput = {}): Post[] {
    const { status, channel } = listPostsInputSchema.parse(filters);
    const rows = db
      .prepare<
        { status: string | null; channel: string | null },
        PostRow
      >(
        `SELECT * FROM posts
         WHERE (@status IS NULL OR status = @status)
           AND (@channel IS NULL OR channel = @channel)
         ORDER BY COALESCE(scheduled_at, created_at) ASC`,
      )
      .all({ status: status ?? null, channel: channel ?? null });
    return rows.map(toPost);
  }

  function create(input: CreatePostInput): Post {
    const data = createPostInputSchema.parse(input);
    assertSchedulable(data.status, data.scheduledAt);
    const id = `post_${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO posts (id, title, content, channel, status, scheduled_at, tags, author_name, author_handle, created_at, updated_at)
       VALUES (@id, @title, @content, @channel, @status, @scheduledAt, @tags, @authorName, @authorHandle, @now, @now)`,
    ).run({
      id,
      title: data.title,
      content: data.content,
      channel: data.channel,
      status: data.status,
      scheduledAt: data.scheduledAt,
      tags: JSON.stringify(data.tags),
      authorName: DEFAULT_AUTHOR.name,
      authorHandle: DEFAULT_AUTHOR.handle,
      now,
    });
    return get(id);
  }

  function update(input: UpdatePostInput): Post {
    const { id, ...changes } = updatePostInputSchema.parse(input);
    const next = { ...get(id), ...stripUndefined(changes) };
    assertSchedulable(next.status, next.scheduledAt);
    db.prepare(
      `UPDATE posts SET title = @title, content = @content, channel = @channel,
         status = @status, scheduled_at = @scheduledAt, tags = @tags, updated_at = @updatedAt
       WHERE id = @id`,
    ).run({
      id,
      title: next.title,
      content: next.content,
      channel: next.channel,
      status: next.status,
      scheduledAt: next.scheduledAt,
      tags: JSON.stringify(next.tags),
      updatedAt: new Date().toISOString(),
    });
    return get(id);
  }

  function remove(id: string): Post {
    const post = get(id);
    db.prepare("DELETE FROM posts WHERE id = ?").run(id);
    return post;
  }

  return { get, list, create, update, remove };
}

export type PostsRepository = ReturnType<typeof createPostsRepository>;

/** Omitted update fields parse as `undefined`; they must not overwrite stored values. */
function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined),
  ) as Partial<T>;
}

let repository: PostsRepository | undefined;

export function getPostsRepository(): PostsRepository {
  repository ??= createPostsRepository(getDb());
  return repository;
}
