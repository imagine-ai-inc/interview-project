# ImagineAI Mastra Agent Chat — Engineering Interview

Welcome to the **"Untangle a Mess"** engineering interview round!

---

## 1. Context

You've inherited an internal prototype for **ImagineAI's Unified Agent Chat**, modeled after our v2 web application.

The application allows our marketing team to interact with an AI agent to:
- **Manage Posts (SQLite)**: Create, list, schedule, update, and publish social posts stored in a local SQLite database (`data/imagine.db`).
- **Workspace Filesystem**: Inspect and edit marketing assets in the local `./workspace/` directory (`brand-voice.md`, `content-calendar.md`, drafts).
- **Skills**: Consult editorial playbooks in `./skills/` (`brand-voice`, `linkedin-hooks`, `content-repurposing`).

A teammate quickly "vibe-coded" this prototype to validate the concept using **Mastra** and **assistant-ui** styling. The UI looks great and runs smoothly, but under the hood:
- All tools and execution logic were jammed into a single messy file (`src/mastra/agent.ts`).
- Untyped `any` types and inline database queries are scattered everywhere.
- Tool error handling is inconsistent (throwing raw errors, returning error objects, or silently swallowing failures).
- A few quiet bugs hide in tool parsing, status updates, and filesystem operations.

Your mission in this session is to **untangle the agent and tools architecture**, **fix the quiet bugs**, and then **extend the agent with a new tool/feature**.

---

## 2. Quickstart (Under 2 Minutes)

Clone or open the repository, install dependencies, and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You can click any of the prompt chips (e.g. *"What posts are currently scheduled?"* or *"Draft post using brand voice"*) to watch the agent execute tools against the local SQLite database and workspace filesystem in real time.

### Running Tests

We have included a fast unit test suite (<150ms) to act as your safety net while you refactor:

```bash
npm test
```

*(You will notice 3 tests currently fail — these point directly to quiet bugs in tool parsing and filesystem handling!)*

---

## 3. Project Structure

```
interview-project/
├── data/
│   └── imagine.db          # Local SQLite database (posts table)
├── workspace/              # Local marketing files (brand-voice.md, content-calendar.md)
├── skills/                 # Editorial skills (brand-voice, linkedin-hooks, etc.)
├── src/
│   ├── lib/
│   │   └── db.ts           # SQLite connection & schema initialization
│   ├── mastra/
│   │   └── agent.ts        # The vibe-coded monster file (tools + runner)
│   └── app/
│       ├── page.tsx        # Imagine v2 web app UI (Chat + Live Post Preview + SQLite Inspector)
│       └── api/
│           ├── chat/       # Agent chat endpoint
│           ├── posts/      # Live SQLite posts inspector endpoint
│           └── workspace/  # Live workspace files inspector endpoint
└── test/
    └── agent.test.ts       # Test suite for Mastra tools
```

---

## 4. Session Flow (~60 Minutes)

1. **0 – 5 min**: Context & orientation. Share screen and verify the app runs.
2. **5 – 15 min**: Code walkthrough. Inspect `src/mastra/agent.ts` and talk through what you see before changing anything.
3. **15 – 35 min**: **Refactor**.
   - Modularize the tools (e.g. `src/mastra/tools/posts.ts`, `src/mastra/tools/workspace.ts`, `src/mastra/tools/skills.ts`).
   - Introduce clean TypeScript interfaces and input/output schemas (no more `any`).
   - Create a clean database repository layer for SQLite operations.
   - Standardize tool error handling.
   - Fix the 3 quiet bugs so all tests turn green.
4. **35 – 50 min**: **Light Feature**. The interviewer will ask you to add a new tool or capability (e.g. an `export_calendar_summary` tool).
5. **50 – 60 min**: Wrap-up, "What would you do with another day?", and questions.

---

## 5. What We're Looking For

- **Code Organization & Modularity**: Breaking down monolithic code into focused, maintainable units.
- **Type Safety**: Proper TypeScript types without relying on `any`.
- **Database Abstraction**: Clean separation between agent tools and raw SQLite queries.
- **Error Handling**: Predictable, robust error responses.
- **Product Mindset**: Thinking through how the agent interfaces with tools and UI state.
