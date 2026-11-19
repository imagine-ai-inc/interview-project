# Imagine Agent

A simplified copy of the Imagine v2 web app: one streaming agent chat in the v2 shell, with a panel that shows the posts and workspace files the agent works on.

- **Agent**: Mastra, on `google/gemini-3.8-flash`.
- **Streaming**: `handleChatStream` from `@mastra/ai-sdk`, returned as an AI SDK UI message stream.
- **Frontend**: assistant-ui with `useChatRuntime` and `AssistantChatTransport`.
- **Posts**: a local SQLite database (`data/imagine.db`, created and seeded on first run).
- **Files and commands**: a Mastra workspace with `LocalFilesystem` and `LocalSandbox`, both rooted at `./workspace`. On macOS the sandbox runs under Seatbelt, so commands cannot write outside `./workspace` or reach the network.
- **Skills**: `pdf`, `brand-voice`, `linkedin-hooks`, and `content-repurposing`, in `src/mastra/skills`.
- **No memory**: the client sends the whole conversation each turn and the server stores nothing, so a refresh ends the conversation.

## Run it

```bash
npm install
npm run dev
```

Create a `.env` file with `GOOGLE_GENERATIVE_AI_API_KEY=<your Gemini key>`, then open [http://localhost:3000](http://localhost:3000).

Delete `data/imagine.db*` to reset the posts to the three seed posts.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Starts the app |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest: the posts repository and the post tools, against an in-memory database |

## Layout

```
src/
├── app/
│   ├── page.tsx                      # The shell: sidebar, chat, inspector
│   └── api/
│       ├── chat/route.ts             # POST: streams the agent's reply
│       ├── posts/route.ts            # GET: posts for the panel
│       └── workspace/                # GET: the file tree, and a file's bytes
├── mastra/
│   ├── index.ts                      # The Mastra instance (no storage)
│   ├── agents/unified/               # The agent and its prompt
│   ├── tools/post/                   # list, read, create, update, delete
│   ├── workspaces/local.ts           # LocalFilesystem + LocalSandbox
│   └── skills/                       # SKILL.md playbooks
├── lib/
│   ├── db.ts                         # SQLite connection, schema, seed
│   ├── posts/                        # Zod schemas and the repository
│   ├── workspace/                    # Tree listing for the panel
│   └── agent/tool-labels.ts          # How tool calls read in the chat
├── components/
│   ├── ui/                           # v2 primitives: button, tooltip, icon, …
│   ├── layout/                       # Shell and sidebar
│   ├── assistant-ui/                 # Thread, tool rows, markdown
│   └── features/                     # Agent chat, inspector, post preview
└── styles/                           # v2 tokens, globals, motion presets
workspace/                            # The agent's files; it writes to exports/ and scripts/
```

## Agent tools

| Tool | From |
| --- | --- |
| `list_posts`, `read_post`, `create_post`, `update_post`, `delete_post` | `src/mastra/tools/post` |
| `mastra_workspace_read_file`, `write_file`, `edit_file`, `list_files`, `grep`, `delete`, `file_stat`, `mkdir` | `LocalFilesystem` |
| `mastra_workspace_execute_command`, `get_process_output`, `kill_process` | `LocalSandbox` |
| `skill`, `skill_read`, `skill_search` | The skills directory |

## The PDF skill

`src/mastra/skills/pdf` is adapted from Anthropic's Apache-2.0 `pdf` skill and rewritten around `pdf-lib`, so it runs on Node in the sandbox without Python. The agent writes a script into `workspace/scripts/`, runs it with `node`, and saves the PDF to `workspace/exports/`. See `NOTICE.md` there for what changed.

## Differences from v2

- One agent route, no auth, no orgs, no threads list, no memory.
- E2B is replaced by `LocalSandbox`; the S3-backed filesystem by `LocalFilesystem`.
- Icons are Lucide, mapped to v2's Font Awesome names in `components/ui/icon.tsx`.
- Below 1024px the inspector opens as a sheet over the page instead of a column.
