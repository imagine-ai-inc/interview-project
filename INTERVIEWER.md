# Interviewer Guide: "Untangle a Mess" Mastra Agent Chat

This guide is for the interviewer conducting the **60-minute practical refactoring + feature round**.

---

## 1. Interview Overview & Philosophy

In this round, the candidate inherits a **lightweight, vibe-coded prototype of ImagineAI's Unified Agent Chat**, built with **Mastra** and styled with our **v2 web app aesthetic**.

The application manages:
- **Social Posts in SQLite (`data/imagine.db`)**: `create_post`, `list_posts`, `update_post`.
- **Local Filesystem (`workspace/`)**: `read_file`, `write_file`, `list_files`.
- **Editorial Skills (`skills/`)**: `load_skill` (`brand-voice`, `linkedin-hooks`, `content-repurposing`).

Everything runs locally with **zero external dependencies and zero API keys**.

The candidate must:
1. Walk through the code and identify the architectural smells.
2. Refactor the monolithic `src/mastra/agent.ts` into a clean, modular, typed agent architecture with a proper database repository.
3. Fix the 3 quiet bugs (guided by failing tests in `npm test`).
4. Add a light feature at minute 35 (e.g. an `export_calendar_summary` tool).

---

## 2. Minute-by-Minute Schedule

### 00:00 – 05:00: Context & Hand-Off
- Tell the candidate:
  > *"Imagine one of our engineers quickly vibe-coded an agent chat prototype for our marketing team using Mastra. It lets you chat with an agent to draft and schedule posts in a local SQLite database, read/write files in a local workspace, and apply brand voice skills. The UI looks just like our v2 web app and it runs, but under the hood, all the tools and raw SQLite queries are lumped together in one messy file with `any` types and inconsistent error handling. Your goal is to untangle it, fix any subtle bugs you spot, and then we'll add a quick tool to it."*
- Have candidate run:
  ```bash
  npm install
  npm run dev
  npm test
  ```
- Have candidate share screen.

### 05:00 – 15:00: Code Exploration & Walkthrough
- Ask the candidate:
  > *"Before changing anything, walk me through `src/mastra/agent.ts`. What tools exist? What architectural red flags or code smells do you notice?"*
- **What to look for**:
  - Do they notice raw SQLite queries (`sqlite.prepare(...)`) executed directly inside tool handlers?
  - Do they spot inconsistent error handling (some tools throw, some return error objects, some log to console and return `{ success: false }`)?
  - Do they notice `any` types everywhere?
  - Did they run `npm test` and note the 3 failing tests?

### 15:00 – 35:00: The Refactor
- Candidate begins refactoring.
- Let them drive. Don't prescribe an exact folder structure; observe their natural engineering instincts.
- **Signals to watch**:
  - Do they extract tools into modular files (e.g. `tools/posts.ts`, `tools/workspace.ts`, `tools/skills.ts`)?
  - Do they create a clean repository abstraction for the SQLite database (`entities/posts/repository.ts` or `lib/db/posts.ts`)?
  - Do they introduce strong TypeScript types/interfaces?
  - Do they fix the 3 quiet bugs (see Section 4)?
  - Do all tests in `npm test` turn green?

### 35:00 – 50:00: The Feature Request
- Around minute 35, interrupt gently:
  > *"Our team needs a new tool called `export_calendar_summary`. It should query all scheduled posts from SQLite, format them into a clean markdown table/summary of dates and channels, and save it to `workspace/content-calendar.md`. Can you add this tool to the agent?"*
- **The Divergence**:
  - **Candidate with good refactor**: Reuses their clean posts repository, creates a new tool in `tools/`, wires it into the agent, and unskips the test in `test/agent.test.ts`. Done in ~8 minutes!
  - **Candidate who didn't refactor**: Stitches more raw SQLite queries and file writes directly into `src/mastra/agent.ts`, fighting their own untyped code.

### 50:00 – 60:00: Wrap-Up & Discussion
- Ask:
  > *"If you had another day on this codebase, what would you improve next?"*
- Give them 5–7 minutes to ask questions about ImagineAI.

---

## 3. Catalog of Intentional Smells Baked In

| Smell / Anti-Pattern | Where It Lives | Impact |
| :--- | :--- | :--- |
| **Monolithic Tool File** | `src/mastra/agent.ts` | All 7 tools + runner + raw SQLite queries packed into one 450-line file. |
| **No Database Layer** | `list_posts`, `create_post`, `update_post` | Direct `sqlite.prepare(...)` calls inside tool handlers; no separation of concerns. |
| **Pervasive `any` Types** | Throughout tool definitions | No autocomplete, no type safety, hides schema mismatches. |
| **Inconsistent Error Handling** | Across all tools | 3 different styles: `throw new Error(...)`, `{ status: "error", error: ... }`, and silent `console.error` with `{ success: false }`. |
| **Missing Path Sanitization** | `read_file`, `write_file` | Direct string concatenation with `path.join`, lacking directory recursion or boundary checks. |

---

## 4. The 3 Quiet Bugs (And Where They Are)

### Bug 1: Tags String Splitting in `list_posts`
- **Location**: `src/mastra/agent.ts` line 52:
  ```ts
  if (row.tags) {
    parsedTags = row.tags.split(",").map((t: string) => t.trim());
  }
  ```
- **Why it breaks**: Tags are stored as JSON in SQLite (e.g. `'["#B2BGrowth","#AI"]'`). Splitting on comma returns `['["#B2BGrowth"', '"#AI"]']` with ugly brackets and quotes instead of clean tag strings.
- **Fix**: Use `JSON.parse(row.tags)` with a fallback.
- **Caught by test**: `list_posts correctly parses tags without JSON brackets`.

### Bug 2: Status Capitalization in `update_post`
- **Location**: `src/mastra/agent.ts` line 165:
  ```ts
  if (input.status === "Scheduled") {
    newStatus = "scheduled";
  } else {
    newStatus = "draft"; // Silently resets to draft if status was "scheduled" (lowercase)!
  }
  ```
- **Why it breaks**: If the caller passes standard lowercase `"scheduled"`, it fails the check and silently falls back to `"draft"`.
- **Fix**: Use `input.status.toLowerCase()` and validate against allowed enum.
- **Caught by test**: `update_post supports lowercase status 'scheduled'`.

### Bug 3: Missing Parent Directory Creation in `write_file`
- **Location**: `src/mastra/agent.ts` line 270:
  ```ts
  fs.writeFileSync(fullPath, content, "utf-8");
  ```
- **Why it breaks**: If `filePath` contains a subfolder that doesn't exist yet (e.g. `"nested-test-dir/post-draft.md"`), `fs.writeFileSync` throws `ENOENT: no such file or directory`.
- **Fix**: Add `fs.mkdirSync(path.dirname(fullPath), { recursive: true })` before writing.
- **Caught by test**: `write_file creates parent directories if needed`.

---

## 5. Candidate Evaluation Rubric

### 🔴 Junior / Below Bar
- Dives straight into editing without inspecting the existing tools or tests.
- Leaves `any` types or adds `as any` casts to silence TypeScript.
- Fixes bugs with inline ad-hoc hacks without refactoring file structure.
- Copy-pastes more raw SQLite queries when asked to add the feature.
- Doesn't run or update `npm test`.

### 🟡 Mid-Level
- Spots the monolithic file structure and raw SQL queries.
- Separates tools into helper functions or separate files.
- Defines basic TypeScript interfaces for `Post`.
- Fixes the 3 quiet bugs and gets tests passing.
- Adds the feature, but might still have loose error handling.

### 🟢 Senior (Strong Hire)
- Immediately identifies: lack of data layer, mixed concerns, inconsistent error responses, and quiet parsing bugs.
- Creates a clean, idiomatic architecture:
  - `src/lib/db/posts-repository.ts`: Typed repository with `findPosts`, `createPost`, `updatePost`.
  - `src/mastra/tools/`: Clean, modular tools with typed Zod schemas.
  - Consistent error handling contract across all tools.
- Gets all tests passing quickly.
- Drops the minute-35 feature in cleanly in ~8 minutes.

### 🟣 Staff / Exceptional
- All Senior signals plus:
  - Mentions schema migration strategy for SQLite.
  - Suggests tool validation guards against path traversal for `read_file`/`write_file`.
  - Discusses streaming tool call events to the UI and optimistic UI updates for post creation.
