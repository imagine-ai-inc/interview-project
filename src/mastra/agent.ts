import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { sqlite } from "@/lib/db";

// ============================================================================
// IMAGINE AI UNIFIED AGENT & TOOLS (V1 PROTOTYPE - VIBE CODED)
//
// TODO: Break this down into modular tool files and clean up repository logic!
// A lot of any types here, and tool error handling is all over the place.
// ============================================================================

// ----------------------------------------------------------------------------
// TOOL 1: list_posts
// ----------------------------------------------------------------------------
export const listPostsTool = createTool({
  id: "list_posts",
  description: "List or query posts from the local SQLite database by status or channel",
  inputSchema: z.object({
    status: z.string().optional().describe("Filter by status: draft, planned, scheduled, published"),
    channel: z.string().optional().describe("Filter by channel: linkedin, x"),
    limit: z.number().optional().describe("Maximum number of posts to return"),
  }),
  outputSchema: z.any(),
  execute: async (input: any) => {
    try {
      let query = "SELECT * FROM posts WHERE 1=1";
      const params: any[] = [];

      if (input.status) {
        query += " AND status = ?";
        params.push(input.status.toLowerCase());
      }
      if (input.channel) {
        query += " AND channel = ?";
        params.push(input.channel.toLowerCase());
      }

      query += " ORDER BY created_at DESC";

      if (input.limit) {
        query += " LIMIT ?";
        params.push(input.limit);
      }

      const rows: any[] = sqlite.prepare(query).all(...params);

      // ----------------------------------------------------------------------
      // QUIET BUG 1: Tags split bug
      // Tags are stored as JSON strings in SQLite, e.g. '["#B2BGrowth","#AI"]'.
      // Instead of JSON.parse, the vibe-coder wrote `row.tags.split(",")`,
      // which results in messy strings with brackets: ['["#B2BGrowth"', '"#AI"]']!
      // ----------------------------------------------------------------------
      const formattedPosts = rows.map((row: any) => {
        let parsedTags: any[] = [];
        if (row.tags) {
          // BUG: splits json string on comma instead of JSON.parse!
          parsedTags = row.tags.split(",").map((t: string) => t.trim());
        }
        return {
          id: row.id,
          title: row.title,
          content: row.content,
          channel: row.channel,
          status: row.status,
          scheduledAt: row.scheduled_at,
          tags: parsedTags,
          authorName: row.author_name,
          createdAt: row.created_at,
        };
      });

      return {
        success: true,
        count: formattedPosts.length,
        posts: formattedPosts,
      };
    } catch (err: any) {
      // Error handling style 1: Returns error object
      return { status: "error", error: err.message };
    }
  },
});

// ----------------------------------------------------------------------------
// TOOL 2: create_post
// ----------------------------------------------------------------------------
export const createPostTool = createTool({
  id: "create_post",
  description: "Create and persist a new social post into the local SQLite database",
  inputSchema: z.object({
    title: z.string().describe("Title or headline of the post"),
    content: z.string().describe("Full body text of the post"),
    channel: z.enum(["linkedin", "x"]).default("linkedin").describe("Target platform"),
    status: z.enum(["draft", "planned", "scheduled", "published"]).default("draft"),
    scheduledAt: z.string().optional().describe("ISO date string for scheduled time"),
    tags: z.array(z.string()).optional().describe("Hashtags for the post"),
  }),
  outputSchema: z.any(),
  execute: async (input: any) => {
    // Error handling style 2: Throwing raw Error
    if (!input.content || input.content.trim().length === 0) {
      throw new Error("Post content cannot be empty");
    }

    const postId = "post_" + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();

    const insert = sqlite.prepare(`
      INSERT INTO posts (id, title, content, channel, status, scheduled_at, tags, author_name, author_handle, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      insert.run(
        postId,
        input.title || "Untitled Post",
        input.content,
        input.channel || "linkedin",
        input.status || "draft",
        input.scheduledAt || null,
        input.tags ? JSON.stringify(input.tags) : JSON.stringify([]),
        "Alex Rivera",
        "@alex_growth",
        now,
        now
      );

      return {
        success: true,
        message: `Post ${postId} created successfully`,
        post: {
          id: postId,
          title: input.title,
          content: input.content,
          channel: input.channel,
          status: input.status,
          scheduledAt: input.scheduledAt,
          tags: input.tags || [],
        },
      };
    } catch (dbErr: any) {
      // Error handling style 2: Re-throw
      throw new Error("SQLite insert failed: " + dbErr.message);
    }
  },
});

// ----------------------------------------------------------------------------
// TOOL 3: update_post
// ----------------------------------------------------------------------------
export const updatePostTool = createTool({
  id: "update_post",
  description: "Update content, status, or schedule of an existing post by ID",
  inputSchema: z.object({
    id: z.string().describe("The post ID to update e.g. post_1"),
    content: z.string().optional().describe("New content body"),
    status: z.string().optional().describe("New status: draft, planned, scheduled, published"),
    scheduledAt: z.string().optional().describe("Updated scheduled ISO date"),
    tags: z.array(z.string()).optional().describe("Updated tags"),
  }),
  outputSchema: z.any(),
  execute: async (input: any) => {
    const existing: any = sqlite.prepare("SELECT * FROM posts WHERE id = ?").get(input.id);
    if (!existing) {
      // Error handling style 3: Return false with console.error
      console.error("[update_post] Post not found with ID:", input.id);
      return { success: false, reason: "Post not found" };
    }

    // ------------------------------------------------------------------------
    // QUIET BUG 2: Status Capitalization Check
    // The developer wrote a check expecting capitalized "Scheduled" or "Published",
    // but the database enum and input schema use lowercase "scheduled" / "published"!
    // This causes status updates to fall back to 'draft' or fail!
    // ------------------------------------------------------------------------
    let newStatus = existing.status;
    if (input.status) {
      if (input.status === "Scheduled") {
        newStatus = "scheduled";
      } else if (input.status === "Published") {
        newStatus = "published";
      } else if (input.status === "Draft") {
        newStatus = "draft";
      } else {
        // BUG: If input.status is "scheduled" (lowercase), it falls through here and fails validation!
        console.warn("[update_post] Status must be Capitalized: Draft, Scheduled, Published");
        newStatus = "draft"; // silently resets to draft!
      }
    }

    const updatedContent = input.content !== undefined ? input.content : existing.content;
    const updatedScheduledAt = input.scheduledAt !== undefined ? input.scheduledAt : existing.scheduled_at;
    const updatedTags = input.tags !== undefined ? JSON.stringify(input.tags) : existing.tags;
    const now = new Date().toISOString();

    sqlite.prepare(`
      UPDATE posts
      SET content = ?, status = ?, scheduled_at = ?, tags = ?, updated_at = ?
      WHERE id = ?
    `).run(updatedContent, newStatus, updatedScheduledAt, updatedTags, now, input.id);

    return {
      success: true,
      message: `Post ${input.id} updated`,
      updatedPost: {
        id: input.id,
        status: newStatus,
        content: updatedContent,
      },
    };
  },
});

// ----------------------------------------------------------------------------
// TOOL 4: read_file
// ----------------------------------------------------------------------------
export const readFileTool = createTool({
  id: "read_file",
  description: "Read a file from the local workspace folder e.g. brand-voice.md",
  inputSchema: z.object({
    filePath: z.string().describe("Relative path inside the workspace folder e.g. brand-voice.md"),
  }),
  outputSchema: z.any(),
  execute: async ({ filePath }: { filePath: string }) => {
    const workspaceRoot = path.join(process.cwd(), "workspace");
    const fullPath = path.join(workspaceRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      return {
        success: false,
        error: `File not found at workspace/${filePath}`,
      };
    }

    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      return {
        success: true,
        filePath,
        content,
      };
    } catch (e: any) {
      throw new Error("Failed to read file: " + e.message);
    }
  },
});

// ----------------------------------------------------------------------------
// TOOL 5: write_file
// ----------------------------------------------------------------------------
export const writeFileTool = createTool({
  id: "write_file",
  description: "Write or update a file in the local workspace directory",
  inputSchema: z.object({
    filePath: z.string().describe("Relative path in workspace e.g. drafts/new-post.md"),
    content: z.string().describe("Text or markdown content to write"),
  }),
  outputSchema: z.any(),
  execute: async ({ filePath, content }: { filePath: string; content: string }) => {
    const workspaceRoot = path.join(process.cwd(), "workspace");
    const fullPath = path.join(workspaceRoot, filePath);

    // ------------------------------------------------------------------------
    // QUIET BUG 3: Missing directory creation!
    // If filePath is a nested path like "drafts/weekly-recap.md",
    // fs.writeFileSync will throw ENOENT because the subfolder might not exist!
    // ------------------------------------------------------------------------
    try {
      // BUG: forgot fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, "utf-8");
      return {
        success: true,
        message: `Saved ${filePath} successfully`,
      };
    } catch (err: any) {
      console.error("[write_file] Error writing file:", err);
      return {
        success: false,
        error: "Failed to write file: " + err.message,
      };
    }
  },
});

// ----------------------------------------------------------------------------
// TOOL 6: list_files
// ----------------------------------------------------------------------------
export const listFilesTool = createTool({
  id: "list_files",
  description: "List all files available in the local workspace directory",
  inputSchema: z.object({}),
  outputSchema: z.any(),
  execute: async () => {
    const workspaceRoot = path.join(process.cwd(), "workspace");
    function walk(dir: string, base = ""): string[] {
      let results: string[] = [];
      if (!fs.existsSync(dir)) return results;
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const rel = path.join(base, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results = results.concat(walk(full, rel));
        } else {
          results.push(rel);
        }
      }
      return results;
    }

    const files = walk(workspaceRoot);
    return {
      success: true,
      files,
    };
  },
});

// ----------------------------------------------------------------------------
// TOOL 7: load_skill
// ----------------------------------------------------------------------------
export const loadSkillTool = createTool({
  id: "load_skill",
  description: "Load editorial guidelines or instructions from a named skill e.g. brand-voice or linkedin-hooks",
  inputSchema: z.object({
    skillName: z.string().describe("Name of the skill: brand-voice, linkedin-hooks, content-repurposing"),
  }),
  outputSchema: z.any(),
  execute: async ({ skillName }: { skillName: string }) => {
    const skillPath = path.join(process.cwd(), "skills", skillName, "SKILL.md");
    if (!fs.existsSync(skillPath)) {
      return {
        success: false,
        error: `Skill '${skillName}' not found. Available skills: brand-voice, linkedin-hooks, content-repurposing`,
      };
    }
    const content = fs.readFileSync(skillPath, "utf-8");
    return {
      success: true,
      skill: skillName,
      instructions: content,
    };
  },
});

// All registered tools map
export const AGENT_TOOLS = {
  list_posts: listPostsTool,
  create_post: createPostTool,
  update_post: updatePostTool,
  read_file: readFileTool,
  write_file: writeFileTool,
  list_files: listFilesTool,
  load_skill: loadSkillTool,
};

// ----------------------------------------------------------------------------
// AGENT EXECUTION RUNNER
// Handles conversational turns, tool routing, and responses
// ----------------------------------------------------------------------------
export async function runAgentChat(messages: Array<{ role: string; content: string }>) {
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const query = lastUserMessage.toLowerCase();

  const toolExecutions: Array<{ toolName: string; args: any; result: any }> = [];
  let replyText = "";

  // 1. Post Querying Intent
  if (query.includes("scheduled") || query.includes("what posts") || query.includes("list posts") || query.includes("show posts")) {
    const result: any = listPostsTool.execute ? await (listPostsTool.execute as any)({
      status: query.includes("scheduled") ? "scheduled" : undefined,
    }) : {};
    toolExecutions.push({ toolName: "list_posts", args: { status: "scheduled" }, result });

    const posts = result.posts || [];
    replyText = `Found **${posts.length} post(s)** in the database:\n\n`;
    for (const p of posts) {
      replyText += `• **${p.title}** (${p.channel}) — Status: \`${p.status}\`\n  *Scheduled for*: ${p.scheduledAt ? new Date(p.scheduledAt).toLocaleString() : "Not set"}\n\n`;
    }
    replyText += `Would you like me to inspect any of these posts or draft a new one?`;
  }

  // 2. Draft / Create Post Intent
  else if (query.includes("draft") || query.includes("create post") || query.includes("write a post")) {
    // First read brand voice skill
    const skillRes: any = loadSkillTool.execute ? await (loadSkillTool.execute as any)({ skillName: "brand-voice" }) : {};
    toolExecutions.push({ toolName: "load_skill", args: { skillName: "brand-voice" }, result: skillRes });

    // Execute create post
    const postTitle = query.includes("agency") ? "Why In-House AI Beats $15k/mo Agencies" : "The 2026 Content Bottleneck";
    const postBody = `90% of B2B marketing teams are moving fast in the wrong direction.\n\nThey spend $15k/month on agencies.\nThey debate tone in 6 Slack channels.\nThey post once every 3 weeks when everyone finally agrees.\n\nThe bottleneck was never 'ideas'. It was the approval loop.\n\nCodify your brand voice once. Scale without the noise.`;

    const createRes: any = createPostTool.execute ? await (createPostTool.execute as any)({
      title: postTitle,
      content: postBody,
      channel: "linkedin",
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      tags: ["#B2BGrowth", "#AIWorkflow", "#ContentMarketing"],
    }) : {};

    toolExecutions.push({
      toolName: "create_post",
      args: { title: postTitle, channel: "linkedin", status: "scheduled" },
      result: createRes,
    });

    replyText = `I loaded our **brand-voice** skill and generated a new LinkedIn post matching Alex Rivera's tone:\n\n` +
      `> **${postTitle}**\n>\n` +
      `> ${postBody.replace(/\n/g, "\n> ")}\n\n` +
      `✅ Saved into SQLite with ID \`${createRes.post?.id}\` and scheduled for **${new Date(createRes.post?.scheduledAt).toLocaleString()}**.\n\n` +
      `You can review it in the live post preview pane on the right!`;
  }

  // 3. Workspace / Calendar Query Intent
  else if (query.includes("calendar") || query.includes("workspace") || query.includes("file") || query.includes("read")) {
    const listRes: any = listFilesTool.execute ? await (listFilesTool.execute as any)({}) : {};
    toolExecutions.push({ toolName: "list_files", args: {}, result: listRes });

    const targetFile = query.includes("calendar") ? "content-calendar.md" : "brand-voice.md";
    const fileRes: any = readFileTool.execute ? await (readFileTool.execute as any)({ filePath: targetFile }) : {};
    toolExecutions.push({ toolName: "read_file", args: { filePath: targetFile }, result: fileRes });

    replyText = `I checked the local workspace directory and read \`${targetFile}\`:\n\n` +
      `\`\`\`markdown\n${fileRes.content?.slice(0, 400)}...\n\`\`\`\n\n` +
      `Based on this document, we have campaigns planned around content bottlenecks and marketing agency teardowns. Would you like me to turn one of these themes into a scheduled post?`;
  }

  // 4. Update / Publish Intent
  else if (query.includes("publish") || query.includes("update")) {
    const updateRes: any = updatePostTool.execute ? await (updatePostTool.execute as any)({
      id: "post_1",
      status: "Published",
    }) : {};
    toolExecutions.push({ toolName: "update_post", args: { id: "post_1", status: "Published" }, result: updateRes });

    replyText = `Updated post \`post_1\` status to **published**! The change has been committed to the local SQLite database.`;
  }

  // Default conversational fallback
  else {
    replyText = `Hello! I'm Imagine's Unified Agent. I have direct access to your local SQLite posts database, your workspace editorial files, and brand voice skills.\n\nHere are a few things you can ask me to do:\n` +
      `• *"What posts are currently scheduled?"*\n` +
      `• *"Draft a new LinkedIn post about content bottlenecks using our brand voice"*\n` +
      `• *"Read workspace/content-calendar.md and suggest 2 topics"*\n` +
      `• *"Publish post_1 to LinkedIn"*`;
  }

  return {
    reply: replyText,
    tools: toolExecutions,
  };
}
