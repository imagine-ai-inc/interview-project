import { Agent } from "@mastra/core/agent";
import { join } from "node:path";

import { POST_TOOLS } from "@/mastra/tools/post";
import { localWorkspace } from "@/mastra/workspaces/local";

import { buildUnifiedInstructionsPrompt } from "./prompts/instructions";

export const UNIFIED_AGENT_ID = "unified";

export const SKILLS_DIR = join(process.cwd(), "src/mastra/skills");

/** No memory: the client sends the whole conversation, so a refresh ends it. */
export function createUnifiedAgent() {
  return new Agent({
    id: UNIFIED_AGENT_ID,
    name: "Unified Agent",
    description: "Plans, writes, and manages posts and workspace files",
    instructions: () => buildUnifiedInstructionsPrompt({ now: new Date() }),
    model: "google/gemini-3.8-flash",
    tools: POST_TOOLS,
    workspace: localWorkspace,
    skills: [SKILLS_DIR],
    defaultOptions: { maxSteps: 30 },
  });
}
