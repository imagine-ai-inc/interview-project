import { describe, it, expect, beforeEach } from "vitest";
import {
  listPostsTool,
  createPostTool,
  updatePostTool,
  readFileTool,
  writeFileTool,
  loadSkillTool,
} from "@/mastra/agent";
import { sqlite } from "@/lib/db";
import fs from "fs";
import path from "path";

describe("Mastra Agent Tools & Local SQLite / Filesystem", () => {
  beforeEach(() => {
    // Ensure test post exists in SQLite
    const existing = sqlite.prepare("SELECT * FROM posts WHERE id = 'post_1'").get();
    if (!existing) {
      sqlite.prepare(`
        INSERT INTO posts (id, title, content, channel, status, scheduled_at, tags, author_name, author_handle, created_at, updated_at)
        VALUES ('post_1', 'Test Post', 'Content', 'linkedin', 'scheduled', null, '["#B2BGrowth","#AIWorkflow"]', 'Alex Rivera', '@alex_growth', datetime('now'), datetime('now'))
      `).run();
    }
  });

  it("create_post creates and stores a post in SQLite", async () => {
    const res: any = await (createPostTool.execute as any)({
      title: "How to Build AI Workflows",
      content: "Founders waste 10 hours a week on manual content approvals.",
      channel: "linkedin",
      status: "draft",
      tags: ["#AI", "#SaaS"],
    });

    expect(res.success).toBe(true);
    expect(res.post.id).toBeDefined();

    const row: any = sqlite.prepare("SELECT * FROM posts WHERE id = ?").get(res.post.id);
    expect(row).toBeDefined();
    expect(row.title).toBe("How to Build AI Workflows");
  });

  it("read_file reads existing workspace markdown file", async () => {
    const res: any = await (readFileTool.execute as any)({
      filePath: "brand-voice.md",
    });

    expect(res.success).toBe(true);
    expect(res.content).toContain("ImagineAI Brand Voice");
  });

  it("load_skill loads editorial instructions from skills folder", async () => {
    const res: any = await (loadSkillTool.execute as any)({
      skillName: "brand-voice",
    });

    expect(res.success).toBe(true);
    expect(res.instructions).toContain("Brand Voice");
  });

  // ==========================================================================
  // QUIET BUG 1: Tags split bug in list_posts
  // In the vibe-coded code, tags are split on commas instead of JSON.parse,
  // leaving brackets and quotes: ['["#B2BGrowth"', '"#AIWorkflow"]']
  // ==========================================================================
  it("list_posts correctly parses tags without JSON brackets (fails in un-refactored code)", async () => {
    const res: any = await (listPostsTool.execute as any)({});

    expect(res.success).toBe(true);
    expect(res.posts.length).toBeGreaterThan(0);

    const postWithTags = res.posts.find((p: any) => p.tags && p.tags.length > 0);
    expect(postWithTags).toBeDefined();

    // In un-refactored code, postWithTags.tags[0] is '["#B2BGrowth"' with bracket/quote!
    expect(postWithTags.tags[0].startsWith("[")).toBe(false);
    expect(postWithTags.tags[0].startsWith('"')).toBe(false);
  });

  // ==========================================================================
  // QUIET BUG 2: Status capitalization bug in update_post
  // In the vibe-coded code, update_post checks `status === "Scheduled"` (capital S),
  // which causes lowercase "scheduled" to silently fall back to 'draft'!
  // ==========================================================================
  it("update_post supports lowercase status 'scheduled' (fails in un-refactored code)", async () => {
    const res: any = await (updatePostTool.execute as any)({
      id: "post_1",
      status: "scheduled",
    });

    expect(res.success).toBe(true);

    const updatedRow: any = sqlite.prepare("SELECT * FROM posts WHERE id = 'post_1'").get();
    expect(updatedRow.status).toBe("scheduled");
  });

  // ==========================================================================
  // QUIET BUG 3: Nested directory creation in write_file
  // In the vibe-coded code, write_file doesn't create parent directories,
  // causing fs.writeFileSync to throw ENOENT when writing to subfolders!
  // ==========================================================================
  it("write_file creates parent directories if needed (fails in un-refactored code)", async () => {
    const nestedSubPath = "nested-test-dir/post-draft.md";
    const res: any = await (writeFileTool.execute as any)({
      filePath: nestedSubPath,
      content: "# Automated Draft\n\nContent here.",
    });

    expect(res.success).toBe(true);

    const fullPath = path.join(process.cwd(), "workspace", nestedSubPath);
    expect(fs.existsSync(fullPath)).toBe(true);

    // Cleanup
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      fs.rmdirSync(path.dirname(fullPath));
    }
  });

  // ==========================================================================
  // CANDIDATE FEATURE TEST (MINUTE 35-50): export_calendar_summary tool
  // Unskip this test when you add the calendar summary export tool!
  // ==========================================================================
  it.skip("export_calendar_summary tool generates a markdown calendar of all scheduled posts", async () => {
    // When candidate implements exportCalendarSummaryTool:
    // const res = await exportCalendarSummaryTool.execute({});
    // expect(res.success).toBe(true);
    // expect(res.summary).toContain("Scheduled Posts");
  });
});
