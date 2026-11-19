"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  AssistantChatTransport,
  useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { useState, type ReactNode } from "react";

/**
 * The chat runtime. Without a history adapter the thread lives only in this
 * component, and the transport sends the whole conversation each turn, so
 * the server keeps nothing and a refresh starts over.
 */
export function ChatRuntimeProvider({ children }: { children: ReactNode }) {
  const [transport] = useState(
    () => new AssistantChatTransport({ api: "/api/chat" }),
  );
  const runtime = useChatRuntime({ transport });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
