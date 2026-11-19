"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Database,
  FolderTree,
  Zap,
  Bot,
  User,
  ThumbsUp,
  MessageSquare,
  Repeat,
  SendHorizontal,
  RefreshCw,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Code2,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  channel: string;
  status: "draft" | "planned" | "scheduled" | "published";
  scheduledAt: string | null;
  tags: string[];
  authorName: string;
  authorHandle: string;
  createdAt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolExecutions?: Array<{ toolName: string; args: any; result: any }>;
  timestamp: string;
}

export default function AgentChatV2Page() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_welcome",
      role: "assistant",
      content:
        "Hello! I'm Imagine's **Unified Agent** running locally on **Mastra**.\n\nI have direct access to your local SQLite database (`imagine.db`), your workspace editorial guidelines, and content skills.\n\nHow can I help you scale content today?",
      timestamp: "2026-11-19T08:00:00.000Z",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [workspaceFiles, setWorkspaceFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>("brand-voice.md");
  const [fileContent, setFileContent] = useState<string>("");

  const [rightTab, setRightTab] = useState<"post_preview" | "sqlite_db" | "workspace">("post_preview");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    fetchPosts();
    fetchWorkspaceFiles();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      fetchFileContent(selectedFile);
    }
  }, [selectedFile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
        if (!selectedPost && data.posts.length > 0) {
          setSelectedPost(data.posts[0]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch posts:", e);
    }
  }

  async function fetchWorkspaceFiles() {
    try {
      const res = await fetch("/api/workspace");
      const data = await res.json();
      if (data.files) {
        setWorkspaceFiles(data.files);
      }
    } catch (e) {
      console.error("Failed to list files:", e);
    }
  }

  async function fetchFileContent(filePath: string) {
    try {
      const res = await fetch(`/api/workspace?file=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.content) {
        setFileContent(data.content);
      }
    } catch (e) {
      console.error("Failed to read file:", e);
    }
  }

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: "msg_" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: "msg_" + Date.now(),
            role: "assistant",
            content: data.message.content,
            toolExecutions: data.message.toolExecutions,
            timestamp: data.message.timestamp,
          },
        ]);
      }

      // Re-fetch posts after turn to see live changes in SQLite
      await fetchPosts();
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "msg_" + Date.now(),
          role: "assistant",
          content: "⚠️ Failed to execute turn. Check the terminal console for details.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-imagine-background text-imagine-foreground overflow-hidden font-sans">
      {/* 1. LEFT SIDEBAR / NAV RAIL (Imagine v2 Style) */}
      <aside className="w-64 border-r border-imagine-border bg-imagine-surface flex flex-col shrink-0">
        {/* Org Header */}
        <div className="p-4 border-b border-imagine-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-control bg-imagine-primary text-imagine-primary-foreground flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
              IM
            </div>
            <div>
              <div className="font-semibold text-xs text-imagine-foreground">
                ImagineAI Labs
              </div>
              <div className="text-[11px] text-imagine-foreground-muted flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Mastra Agent v2
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1">
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 rounded-control bg-imagine-background font-medium text-xs text-imagine-foreground"
          >
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-imagine-secondary" />
              <span>Unified Agent</span>
            </div>
            <span className="text-[10px] bg-imagine-secondary-soft text-imagine-secondary-strong px-1.5 py-0.5 rounded font-mono">
              chat
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRightTab("sqlite_db")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-control text-xs text-imagine-foreground-muted hover:bg-imagine-background hover:text-imagine-foreground transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-imagine-foreground-muted" />
              <span>SQLite Posts</span>
            </div>
            <span className="text-[10px] bg-imagine-border text-imagine-foreground-muted px-1.5 py-0.5 rounded font-mono">
              {posts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRightTab("workspace")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-control text-xs text-imagine-foreground-muted hover:bg-imagine-background hover:text-imagine-foreground transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FolderTree className="w-4 h-4 text-imagine-foreground-muted" />
              <span>Workspace Files</span>
            </div>
            <span className="text-[10px] bg-imagine-border text-imagine-foreground-muted px-1.5 py-0.5 rounded font-mono">
              {workspaceFiles.length}
            </span>
          </button>
        </div>

        {/* Scheduled Posts Quick Section */}
        <div className="px-4 py-2 border-t border-imagine-border flex-1 overflow-y-auto">
          <div className="text-[11px] font-semibold text-imagine-foreground-muted uppercase tracking-wider mb-2">
            Active Posts (SQLite)
          </div>
          <div className="space-y-1.5">
            {posts.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPost(p);
                  setRightTab("post_preview");
                }}
                className={`p-2 rounded-control text-xs cursor-pointer border transition-all ${
                  selectedPost?.id === p.id
                    ? "bg-imagine-background border-imagine-secondary/40 text-imagine-foreground shadow-xs"
                    : "border-transparent hover:bg-imagine-background text-imagine-foreground-muted hover:text-imagine-foreground"
                }`}
              >
                <div className="font-medium truncate">{p.title}</div>
                <div className="flex items-center justify-between text-[10px] mt-1 text-imagine-foreground-faint">
                  <span className="uppercase">{p.channel}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-medium ${
                      p.status === "scheduled"
                        ? "bg-blue-50 text-blue-700"
                        : p.status === "published"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-imagine-border bg-imagine-background/50 text-[11px] text-imagine-foreground-muted flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-imagine-secondary" />
            <span>Mastra Tools: 7 active</span>
          </div>
          <code className="text-[10px] bg-imagine-border/50 px-1 py-0.5 rounded font-mono">
            npm test
          </code>
        </div>
      </aside>

      {/* 2. CENTER PANE: AGENT CHAT (Assistant UI + Mastra) */}
      <main className="flex-1 flex flex-col min-w-0 bg-imagine-background">
        {/* Top Header */}
        <header className="h-13 border-b border-imagine-border bg-imagine-surface/80 backdrop-blur-sm px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-xs text-imagine-foreground">
              Unified Agent Chat
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-imagine-secondary-soft text-imagine-secondary-strong font-medium">
              vibe-coded prototype
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: "msg_welcome",
                    role: "assistant",
                    content:
                      "Chat history reset. How can I help you with your posts or workspace files?",
                    timestamp: new Date().toISOString(),
                  },
                ]);
              }}
              type="button"
              className="text-xs text-imagine-foreground-muted hover:text-imagine-foreground px-2.5 py-1 rounded-control border border-imagine-border hover:bg-imagine-surface transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              Clear Thread
            </button>
          </div>
        </header>

        {/* Messages Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-xs ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-control bg-imagine-primary text-imagine-primary-foreground flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] space-y-2.5 ${
                    m.role === "user"
                      ? "bg-imagine-primary text-imagine-primary-foreground rounded-panel p-3.5 shadow-sm"
                      : "bg-imagine-surface border border-imagine-border rounded-panel p-4 shadow-sm text-imagine-foreground"
                  }`}
                >
                  {/* Tool Call Badges if assistant executed tools */}
                  {m.toolExecutions && m.toolExecutions.length > 0 && (
                    <div className="space-y-1.5 pb-2 mb-2 border-b border-imagine-border">
                      {m.toolExecutions.map((tx, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-1.5 rounded-control bg-imagine-background text-[11px] font-mono text-imagine-foreground-muted border border-imagine-border"
                        >
                          <Zap className="w-3 h-3 text-imagine-secondary shrink-0" />
                          <span className="font-semibold text-imagine-foreground">
                            {tx.toolName}
                          </span>
                          <span className="text-imagine-foreground-faint truncate">
                            {JSON.stringify(tx.args)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-line leading-relaxed">
                    {m.content}
                  </div>
                </div>

                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-control bg-imagine-secondary text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 text-xs justify-start">
                <div className="w-7 h-7 rounded-control bg-imagine-primary text-imagine-primary-foreground flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-imagine-surface border border-imagine-border rounded-panel p-3.5 text-xs text-imagine-foreground-muted flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-imagine-secondary" />
                  Mastra agent executing tools...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer Dock */}
        <div className="p-4 border-t border-imagine-border bg-imagine-surface/80 backdrop-blur-sm shrink-0">
          <div className="max-w-3xl mx-auto space-y-2.5">
            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleSendMessage("What posts are currently scheduled in SQLite?")}
                className="px-2.5 py-1 rounded-full bg-imagine-background hover:bg-imagine-border/50 text-imagine-foreground-muted hover:text-imagine-foreground border border-imagine-border transition-colors flex items-center gap-1"
              >
                <span>📅 What posts are scheduled?</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage("Draft a LinkedIn post using our brand voice guidelines")}
                className="px-2.5 py-1 rounded-full bg-imagine-background hover:bg-imagine-border/50 text-imagine-foreground-muted hover:text-imagine-foreground border border-imagine-border transition-colors flex items-center gap-1"
              >
                <span>✍️ Draft post using brand voice</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage("Read workspace/content-calendar.md and suggest 2 campaign ideas")}
                className="px-2.5 py-1 rounded-full bg-imagine-background hover:bg-imagine-border/50 text-imagine-foreground-muted hover:text-imagine-foreground border border-imagine-border transition-colors flex items-center gap-1"
              >
                <span>📁 Read content calendar</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage("Publish post_1 to LinkedIn")}
                className="px-2.5 py-1 rounded-full bg-imagine-background hover:bg-imagine-border/50 text-imagine-foreground-muted hover:text-imagine-foreground border border-imagine-border transition-colors flex items-center gap-1"
              >
                <span>🚀 Publish post_1</span>
              </button>
            </div>

            {/* Input Form */}
            <div className="relative bg-imagine-surface border border-imagine-border rounded-panel shadow-sm focus-within:ring-1 focus-within:ring-imagine-secondary transition-all">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask the agent to create posts, inspect SQLite, or read workspace files... (Press Enter to send)"
                className="w-full p-3.5 pr-14 bg-transparent text-xs text-imagine-foreground placeholder:text-imagine-foreground-faint focus:outline-none resize-none"
              />

              <button
                type="button"
                disabled={loading || !input.trim()}
                onClick={() => handleSendMessage()}
                className="absolute right-3 bottom-3 w-8 h-8 rounded-control bg-imagine-secondary hover:bg-imagine-secondary-strong disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 3. RIGHT INSET: LIVE PREVIEW & INSPECTOR (Imagine v2 Style) */}
      <aside className="w-96 border-l border-imagine-border bg-imagine-surface flex flex-col shrink-0">
        {/* Tabs Bar */}
        <div className="p-2 border-b border-imagine-border flex items-center gap-1 bg-imagine-background/50">
          <button
            type="button"
            onClick={() => setRightTab("post_preview")}
            className={`flex-1 py-1.5 px-2 rounded-control text-xs font-medium text-center transition-colors ${
              rightTab === "post_preview"
                ? "bg-imagine-surface text-imagine-foreground shadow-xs font-semibold"
                : "text-imagine-foreground-muted hover:text-imagine-foreground"
            }`}
          >
            Post Preview
          </button>

          <button
            type="button"
            onClick={() => setRightTab("sqlite_db")}
            className={`flex-1 py-1.5 px-2 rounded-control text-xs font-medium text-center transition-colors ${
              rightTab === "sqlite_db"
                ? "bg-imagine-surface text-imagine-foreground shadow-xs font-semibold"
                : "text-imagine-foreground-muted hover:text-imagine-foreground"
            }`}
          >
            SQLite ({posts.length})
          </button>

          <button
            type="button"
            onClick={() => setRightTab("workspace")}
            className={`flex-1 py-1.5 px-2 rounded-control text-xs font-medium text-center transition-colors ${
              rightTab === "workspace"
                ? "bg-imagine-surface text-imagine-foreground shadow-xs font-semibold"
                : "text-imagine-foreground-muted hover:text-imagine-foreground"
            }`}
          >
            Workspace
          </button>
        </div>

        {/* Tab 1: Live Post Preview (Imagine v2 LinkedInPostCard) */}
        {rightTab === "post_preview" && (
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {selectedPost ? (
              <div className="bg-imagine-surface rounded-panel border border-imagine-border p-5 shadow-raised space-y-3.5">
                {/* Header with Avatar & Author */}
                <div className="flex items-center gap-3 border-b border-imagine-border pb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-imagine-primary to-imagine-secondary flex items-center justify-center text-white font-semibold text-xs shadow-xs">
                    AR
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-imagine-foreground">
                      {selectedPost.authorName}
                    </div>
                    <div className="text-[11px] text-imagine-foreground-muted">
                      VP of Growth at ImagineAI • 1st
                    </div>
                    <div className="text-[10px] text-imagine-foreground-faint">
                      {selectedPost.scheduledAt
                        ? `Scheduled for ${new Date(selectedPost.scheduledAt).toLocaleString()} • 🌐`
                        : "Draft • Just now"}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="font-semibold text-xs text-imagine-foreground">
                  {selectedPost.title}
                </div>

                {/* Body Text */}
                <div className="text-xs text-imagine-foreground whitespace-pre-line leading-relaxed">
                  {selectedPost.content}
                </div>

                {/* Hashtags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedPost.tags && selectedPost.tags.length > 0 ? (
                    selectedPost.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium bg-imagine-secondary-soft text-imagine-secondary-strong px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-imagine-foreground-faint">
                      No tags attached
                    </span>
                  )}
                </div>

                {/* LinkedIn Action Bar */}
                <div className="border-t border-imagine-border pt-3 flex items-center justify-between text-[11px] text-imagine-foreground-muted">
                  <span className="flex items-center gap-1 hover:text-imagine-foreground cursor-pointer">
                    <ThumbsUp className="w-3.5 h-3.5" /> Like
                  </span>
                  <span className="flex items-center gap-1 hover:text-imagine-foreground cursor-pointer">
                    <MessageSquare className="w-3.5 h-3.5" /> Comment
                  </span>
                  <span className="flex items-center gap-1 hover:text-imagine-foreground cursor-pointer">
                    <Repeat className="w-3.5 h-3.5" /> Repost
                  </span>
                  <span className="flex items-center gap-1 hover:text-imagine-foreground cursor-pointer">
                    <SendHorizontal className="w-3.5 h-3.5" /> Send
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-imagine-foreground-muted">
                No post selected. Ask the agent to draft one!
              </div>
            )}
          </div>
        )}

        {/* Tab 2: SQLite Live Database Inspector */}
        {rightTab === "sqlite_db" && (
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-imagine-border">
              <span className="text-xs font-semibold text-imagine-foreground">
                SQLite: <code className="text-imagine-secondary">posts</code> table
              </span>
              <button
                type="button"
                onClick={fetchPosts}
                className="text-[11px] text-imagine-foreground-muted hover:text-imagine-foreground flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            <div className="space-y-2">
              {posts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPost(p);
                    setRightTab("post_preview");
                  }}
                  className="p-3 rounded-control border border-imagine-border bg-imagine-background hover:bg-imagine-border/30 transition-colors cursor-pointer space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-imagine-secondary font-semibold">
                      {p.id}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        p.status === "scheduled"
                          ? "bg-blue-50 text-blue-700"
                          : p.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="font-semibold text-imagine-foreground truncate">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-imagine-foreground-muted line-clamp-2">
                    {p.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Workspace File Inspector */}
        {rightTab === "workspace" && (
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            <div className="text-xs font-semibold text-imagine-foreground pb-2 border-b border-imagine-border">
              Local Files: <code className="text-imagine-secondary">./workspace/</code>
            </div>

            <div className="flex flex-wrap gap-1 pb-2">
              {workspaceFiles.map((file) => (
                <button
                  key={file}
                  type="button"
                  onClick={() => setSelectedFile(file)}
                  className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                    selectedFile === file
                      ? "bg-imagine-secondary text-white border-imagine-secondary font-semibold"
                      : "bg-imagine-background text-imagine-foreground-muted border-imagine-border hover:text-imagine-foreground"
                  }`}
                >
                  {file}
                </button>
              ))}
            </div>

            <div className="bg-imagine-background p-3 rounded-control border border-imagine-border font-mono text-[11px] text-imagine-foreground overflow-x-auto max-h-[400px] whitespace-pre-wrap">
              {fileContent || "Select a file to inspect"}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
