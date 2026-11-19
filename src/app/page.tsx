"use client";

import { AgentChatPage } from "@/components/features/agent/agent-chat-page";
import { ChatHeader } from "@/components/features/agent/chat-header";
import { ChatRuntimeProvider } from "@/components/features/agent/chat-runtime-provider";
import { InspectorProvider } from "@/components/features/inspector/context";
import { Inspector } from "@/components/features/inspector/inspector";
import { AppSidebar } from "@/components/layout/sidebar";
import { Shell } from "@/components/layout/shell";

export default function AgentPage() {
  return (
    <ChatRuntimeProvider>
      <Shell.Frame>
        <InspectorProvider>
          <Shell.Left>
            <AppSidebar />
          </Shell.Left>
          <Shell.Center>
            <ChatHeader />
            <AgentChatPage />
          </Shell.Center>
          <Shell.Right label="Inspector">
            <Inspector />
          </Shell.Right>
        </InspectorProvider>
      </Shell.Frame>
    </ChatRuntimeProvider>
  );
}
