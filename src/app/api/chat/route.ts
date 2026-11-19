import { NextRequest, NextResponse } from "next/server";
import { runAgentChat } from "@/mastra/agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];

    const result = await runAgentChat(messages);

    return NextResponse.json({
      success: true,
      message: {
        role: "assistant",
        content: result.reply,
        toolExecutions: result.tools,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[api/chat] Error running agent:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process chat turn",
      },
      { status: 500 }
    );
  }
}
