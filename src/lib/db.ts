import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "imagine.db");
export const sqlite = new Database(dbPath);

// Initialize schema
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'linkedin',
    status TEXT NOT NULL DEFAULT 'draft',
    scheduled_at TEXT,
    tags TEXT,
    author_name TEXT NOT NULL DEFAULT 'Alex Rivera',
    author_handle TEXT NOT NULL DEFAULT '@alex_growth',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Seed with initial realistic posts if empty
const count = sqlite.prepare("SELECT count(*) as count FROM posts").get() as { count: number };
if (count.count === 0) {
  const insert = sqlite.prepare(`
    INSERT INTO posts (id, title, content, channel, status, scheduled_at, tags, author_name, author_handle, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    "post_1",
    "The Content Approval Bottleneck",
    "90% of B2B content teams are moving fast in the wrong direction.\n\nThey spend $15k/month on agencies.\nThey debate tone in 6 Slack channels.\nThey post once every 3 weeks when everyone finally agrees.\n\nThe bottleneck was never 'ideas'. It was the approval loop.\n\nImagine an engine that understands your brand voice so deeply that executive thought leadership publishes on autopilot.\n\nThat's what high-velocity teams are doing today.",
    "linkedin",
    "scheduled",
    "2026-11-20T14:00:00.000Z",
    JSON.stringify(["#B2BGrowth", "#ContentMarketing", "#AIWorkflow"]),
    "Alex Rivera",
    "@alex_growth",
    new Date(Date.now() - 3600000 * 24).toISOString(),
    new Date(Date.now() - 3600000 * 24).toISOString()
  );

  insert.run(
    "post_2",
    "Why Founders Sound Like ChatGPT",
    "Founders think AI content is cheap.\nIn reality, bad AI content costs you pipeline.\n\nWhen your posts sound like a marketing brochure, buyers tune out. When your posts sound like a peer who has been in the trenches, buyers book calls.\n\nCodify your brand voice once. Never prompt from scratch again.",
    "linkedin",
    "planned",
    "2026-11-22T16:30:00.000Z",
    JSON.stringify(["#FounderLedGrowth", "#SaaS"]),
    "Alex Rivera",
    "@alex_growth",
    new Date(Date.now() - 3600000 * 12).toISOString(),
    new Date(Date.now() - 3600000 * 12).toISOString()
  );

  insert.run(
    "post_3",
    "Workflow Breakdown: From Doc to 3 Posts",
    "How we turn 1 internal notion doc into a full week of multi-channel distribution without hiring an agency:\n\n1. Extract 3 core contrarian insights\n2. Format 1 executive LinkedIn teardown\n3. Spin out a tactical 4-tweet thread\n\nScale without the noise.",
    "x",
    "draft",
    null,
    JSON.stringify(["#BuildInPublic", "#Growth"]),
    "Alex Rivera",
    "@alex_growth",
    new Date().toISOString(),
    new Date().toISOString()
  );
}
