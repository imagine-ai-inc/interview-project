import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export type SqliteDatabase = Database.Database;

/** `IMAGINE_DB_PATH` lets tests point at `:memory:`. */
export const DEFAULT_DB_PATH =
  process.env.IMAGINE_DB_PATH ?? join(process.cwd(), "data", "imagine.db");

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'linkedin',
    status TEXT NOT NULL DEFAULT 'draft',
    scheduled_at TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    author_name TEXT NOT NULL,
    author_handle TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

const SEED_POSTS = [
  {
    id: "post_1",
    title: "The Content Approval Bottleneck",
    content:
      "90% of B2B content teams are moving fast in the wrong direction.\n\nThey spend $15k/month on agencies.\nThey debate tone in 6 Slack channels.\nThey post once every 3 weeks when everyone finally agrees.\n\nThe bottleneck was never 'ideas'. It was the approval loop.\n\nImagine an engine that understands your brand voice so deeply that executive thought leadership publishes on autopilot.\n\nThat's what high-velocity teams are doing today.",
    channel: "linkedin",
    status: "scheduled",
    scheduledAt: "2026-11-20T14:00:00.000Z",
    tags: ["#B2BGrowth", "#ContentMarketing", "#AIWorkflow"],
  },
  {
    id: "post_2",
    title: "Why Founders Sound Like ChatGPT",
    content:
      "Founders think AI content is cheap.\nIn reality, bad AI content costs you pipeline.\n\nWhen your posts sound like a marketing brochure, buyers tune out. When your posts sound like a peer who has been in the trenches, buyers book calls.\n\nCodify your brand voice once. Never prompt from scratch again.",
    channel: "linkedin",
    status: "planned",
    scheduledAt: "2026-11-22T16:30:00.000Z",
    tags: ["#FounderLedGrowth", "#SaaS"],
  },
  {
    id: "post_3",
    title: "Workflow Breakdown: From Doc to 3 Posts",
    content:
      "How we turn 1 internal Notion doc into a full week of multi-channel distribution without hiring an agency:\n\n1. Extract 3 core contrarian insights\n2. Format 1 executive LinkedIn teardown\n3. Spin out a tactical 4-tweet thread\n\nScale without the noise.",
    channel: "x",
    status: "draft",
    scheduledAt: null,
    tags: ["#BuildInPublic", "#Growth"],
  },
] as const;

export const DEFAULT_AUTHOR = {
  name: "Alex Rivera",
  handle: "@alex_growth",
} as const;

function seed(db: SqliteDatabase) {
  const { count } = db.prepare("SELECT count(*) AS count FROM posts").get() as {
    count: number;
  };
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO posts (id, title, content, channel, status, scheduled_at, tags, author_name, author_handle, created_at, updated_at)
    VALUES (@id, @title, @content, @channel, @status, @scheduledAt, @tags, @authorName, @authorHandle, @now, @now)
  `);
  const now = new Date().toISOString();
  db.transaction(() => {
    for (const post of SEED_POSTS) {
      insert.run({
        ...post,
        tags: JSON.stringify(post.tags),
        authorName: DEFAULT_AUTHOR.name,
        authorHandle: DEFAULT_AUTHOR.handle,
        now,
      });
    }
  })();
}

/** Opens (and creates, schema and seed included) a database at `path`. */
export function openDatabase(path: string = DEFAULT_DB_PATH): SqliteDatabase {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  seed(db);
  return db;
}

const globalForDb = globalThis as typeof globalThis & {
  imagineDb?: SqliteDatabase;
};

/** One connection per server process; survives Next.js hot reload. */
export function getDb(): SqliteDatabase {
  globalForDb.imagineDb ??= openDatabase();
  return globalForDb.imagineDb;
}
