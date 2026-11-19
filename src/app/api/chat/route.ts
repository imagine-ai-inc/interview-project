import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse, validateUIMessages } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getMastra } from "@/mastra";
import { UNIFIED_AGENT_ID } from "@/mastra/agents/unified";

export const maxDuration = 300;

const chatRequestSchema = z.object({
  id: z.string().optional(),
  messages: z.array(z.unknown()).min(1),
  trigger: z.enum(["submit-message", "regenerate-message"]).optional(),
});

export async function POST(request: Request) {
  const parsed = chatRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: z.prettifyError(parsed.error) },
      { status: 400 },
    );
  }

  let messages;
  try {
    messages = await validateUIMessages({ messages: parsed.data.messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid messages";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const stream = await handleChatStream({
    mastra: getMastra(),
    agentId: UNIFIED_AGENT_ID,
    version: "v7",
    sendReasoning: true,
    params: {
      id: parsed.data.id,
      trigger: parsed.data.trigger,
      messages,
      abortSignal: request.signal,
    },
  });

  return createUIMessageStreamResponse({ stream });
}
