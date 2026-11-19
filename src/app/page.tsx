"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Mail,
  History,
  Code2,
  Copy,
  Check,
  ThumbsUp,
  MessageSquare,
  Repeat,
  Send,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Sliders,
  Building2,
  UserCheck,
} from "lucide-react";

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.91 0-1.64.73-1.64 1.64s.73 1.64 1.64 1.64 1.64-.73 1.64-1.64-.73-1.64-1.64-1.64" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface CompanyProfile {
  name: string;
  industry: string;
  valueProp: string;
  tone: string;
  targetAudience: string;
  keyDifferentiators: string[];
  website: string;
}

interface TargetPersona {
  role: string;
  seniority: string;
  industry: string;
  painPoints: string[];
  goals: string[];
}

const DEFAULT_COMPANY: CompanyProfile = {
  name: "ImagineAI",
  industry: "B2B SaaS / Content Workflow",
  valueProp: "Self-driving content engine for high-velocity marketing teams",
  tone: "Bold, authoritative, practitioner-first",
  targetAudience: "CMOs, VPs of Growth, Content Leads",
  keyDifferentiators: [
    "Deep brand voice modeling",
    "One-click multi-platform output",
    "Eliminates agency back-and-forth",
  ],
  website: "https://imagine.ai",
};

const DEFAULT_PERSONA: TargetPersona = {
  role: "VP of Growth",
  seniority: "Executive",
  industry: "B2B Enterprise Software",
  painPoints: [
    "Content team is bottlenecked on approvals",
    "Agencies cost $15k/mo with generic output",
    "Inconsistent publishing cadence",
  ],
  goals: [
    "Scale qualified inbound pipeline by 3x",
    "Build executive thought leadership for founders",
  ],
};

export default function PipelinePage() {
  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY);
  const [persona, setPersona] = useState<TargetPersona>(DEFAULT_PERSONA);
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([
    "linkedin",
    "email",
  ]);

  const [activeTab, setActiveTab] = useState<
    "linkedin" | "email" | "x_thread" | "history" | "json"
  >("linkedin");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputData, setOutputData] = useState<any>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [historyRuns, setHistoryRuns] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  // Load history runs on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/pipeline");
      if (res.ok) {
        const json = await res.json();
        setHistoryRuns(json.runs || []);
        // If we don't have output data yet, populate with the latest run
        if (!outputData && json.runs && json.runs.length > 0) {
          setOutputData(json.runs[0].outputs);
          setDurationMs(json.runs[0].durationMs);
        }
      }
    } catch (e) {
      console.error("Failed to load history runs:", e);
    }
  }

  function handleResetSample() {
    setCompany(DEFAULT_COMPANY);
    setPersona(DEFAULT_PERSONA);
    setError(null);
  }

  function toggleOutput(type: string) {
    if (selectedOutputs.includes(type)) {
      setSelectedOutputs(selectedOutputs.filter((o) => o !== type));
    } else {
      setSelectedOutputs([...selectedOutputs, type]);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyProfile: company,
          targetPersona: persona,
          outputs: selectedOutputs,
        }),
      });

      const json = await res.json();

      // Check for both HTTP errors and vibe-coded 200-with-error objects
      if (!res.ok || json.status === "error" || json.ok === false || json.success === false) {
        throw new Error(
          json.message || json.error || json.msg || "Pipeline generation failed"
        );
      }

      setOutputData(json.data);
      setDurationMs(json.durationMs || null);

      // Auto-switch to relevant tab
      if (selectedOutputs.includes("linkedin")) {
        setActiveTab("linkedin");
      } else if (selectedOutputs.includes("email")) {
        setActiveTab("email");
      } else if (selectedOutputs.includes("x_thread")) {
        setActiveTab("x_thread");
      }

      // Refresh history list
      fetchHistory();
    } catch (err: any) {
      console.error("Pipeline run error:", err);
      setError(err.message || "Failed to run pipeline");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col bg-imagine-background">
      {/* Header */}
      <header className="border-b border-imagine-border bg-imagine-surface/80 backdrop-blur-sm sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-control bg-imagine-primary text-imagine-primary-foreground flex items-center justify-center font-bold text-sm tracking-wider">
            IM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-imagine-foreground text-sm">
                Content Pipeline
              </h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-imagine-secondary-soft text-imagine-secondary-strong border border-imagine-secondary/20">
                prototype v0.1
              </span>
            </div>
            <p className="text-xs text-imagine-foreground-muted">
              Company profile & target persona to multi-channel content
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetSample}
            type="button"
            className="text-xs font-medium text-imagine-foreground-muted hover:text-imagine-foreground px-2.5 py-1.5 rounded-control border border-imagine-border hover:bg-imagine-surface transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Sample Data
          </button>
          <div className="h-4 w-px bg-imagine-border mx-1" />
          <span className="text-xs text-imagine-foreground-muted">
            Test runner: <code className="bg-imagine-border/50 px-1 py-0.5 rounded text-[11px] font-mono">npm test</code>
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pipeline Inputs Form (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          {/* Company Profile Section */}
          <div className="bg-imagine-surface rounded-panel border border-imagine-border p-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-imagine-border">
              <Building2 className="w-4 h-4 text-imagine-secondary" />
              <h2 className="font-medium text-sm text-imagine-foreground">
                Company Profile
              </h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-imagine-foreground-muted mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) =>
                    setCompany({ ...company, name: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-imagine-background border border-imagine-border rounded-control focus:outline-none focus:ring-1 focus:ring-imagine-secondary text-imagine-foreground text-xs"
                  placeholder="e.g. ImagineAI"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-imagine-foreground-muted mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={company.industry}
                    onChange={(e) =>
                      setCompany({ ...company, industry: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-imagine-background border border-imagine-border rounded-control focus:outline-none focus:ring-1 focus:ring-imagine-secondary text-imagine-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-imagine-foreground-muted mb-1">
                    Brand Tone
                  </label>
                  <input
                    type="text"
                    value={company.tone}
                    onChange={(e) =>
                      setCompany({ ...company, tone: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-imagine-background border border-imagine-border rounded-control focus:outline-none focus:ring-1 focus:ring-imagine-secondary text-imagine-foreground text-xs"
                    placeholder="e.g. Bold, practitioner-first"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-imagine-foreground-muted mb-1">
                  Core Value Proposition
                </label>
                <textarea
                  rows={2}
                  value={company.valueProp}
                  onChange={(e) =>
                    setCompany({ ...company, valueProp: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-imagine-background border border-imagine-border rounded-control focus:outline-none focus:ring-1 focus:ring-imagine-secondary text-imagine-foreground text-xs resize-none"
                />
              </div>

              <div>
                <label className="block font-medium text-imagine-foreground-muted mb-1">
                  Key Differentiators (comma-separated)
                </label>
                <input
                  type="text"
                  value={company.keyDifferentiators.join(", ")}
                  onChange={(e) =>
                    setCompany({
                      ...company,
                      keyDifferentiators: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-1.5 bg-imagine-background border border-imagine-border rounded-control focus:outline-none focus:ring-1 focus:ring-imagine-secondary text-imagine-foreground text-xs"
                />
              </div>
            </div>
          </div>

          {/* Target Persona Section */}
          <div className="bg-imagine-surface rounded-panel border border-imagine-border p-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-imagine-border">
              <UserCheck className="w-4 h-4 text-imagine-secondary" />
              <h2 className="font-medium text-sm text-imagine-foreground">
                Target Persona
              </h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-imagine-foreground-muted mb-1">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={persona.role}
                    onChange={(e) =>
                      setPersona({ ...persona, role: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-imagine-background border border-imagine-border rounded-control focus:outline-none focus:ring-1 focus:ring-imagine-secondary text-imagine-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-imagine-foreground-muted mb-1">
                    Seniority
                  </label>
                  <input
                    type="text"
                    value={persona.seniority}
                    onChange={(e) =>
                      setPersona({ ...persona, seniority: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-imagine-background border border-imagine-border rounded-control focus:outline-none focus:ring-1 focus:ring-imagine-secondary text-imagine-foreground text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-imagine-foreground-muted mb-1">
                  Core Pain Points (one per line)
                </label>
                <textarea
                  rows={2}
                  value={persona.painPoints.join("\n")}
                  onChange={(e) =>
                    setPersona({
                      ...persona,
                      painPoints: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-1.5 bg-imagine-background border border-imagine-border rounded-control focus:outline-none focus:ring-1 focus:ring-imagine-secondary text-imagine-foreground text-xs resize-none"
                />
              </div>

              <div>
                <label className="block font-medium text-imagine-foreground-muted mb-1">
                  Primary Goals (one per line)
                </label>
                <textarea
                  rows={2}
                  value={persona.goals.join("\n")}
                  onChange={(e) =>
                    setPersona({
                      ...persona,
                      goals: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-1.5 bg-imagine-background border border-imagine-border rounded-control focus:outline-none focus:ring-1 focus:ring-imagine-secondary text-imagine-foreground text-xs resize-none"
                />
              </div>
            </div>
          </div>

          {/* Requested Outputs & Action */}
          <div className="bg-imagine-surface rounded-panel border border-imagine-border p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-imagine-border">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-imagine-secondary" />
                <h2 className="font-medium text-sm text-imagine-foreground">
                  Channel Outputs
                </h2>
              </div>
              <span className="text-[11px] text-imagine-foreground-muted">
                {selectedOutputs.length} selected
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => toggleOutput("linkedin")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-control text-xs font-medium border transition-all ${
                  selectedOutputs.includes("linkedin")
                    ? "bg-imagine-primary text-imagine-primary-foreground border-imagine-primary shadow-sm"
                    : "bg-imagine-background text-imagine-foreground-muted border-imagine-border hover:bg-imagine-border/40"
                }`}
              >
                <LinkedinIcon className="w-3.5 h-3.5" />
                LinkedIn
              </button>

              <button
                type="button"
                onClick={() => toggleOutput("email")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-control text-xs font-medium border transition-all ${
                  selectedOutputs.includes("email")
                    ? "bg-imagine-primary text-imagine-primary-foreground border-imagine-primary shadow-sm"
                    : "bg-imagine-background text-imagine-foreground-muted border-imagine-border hover:bg-imagine-border/40"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Cold Email
              </button>

              <button
                type="button"
                onClick={() => toggleOutput("x_thread")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-control text-xs font-medium border transition-all ${
                  selectedOutputs.includes("x_thread")
                    ? "bg-imagine-secondary text-imagine-secondary-foreground border-imagine-secondary shadow-sm"
                    : "bg-imagine-background text-imagine-foreground-muted border-imagine-border hover:bg-imagine-border/40"
                }`}
              >
                <TwitterIcon className="w-3.5 h-3.5" />
                X Thread
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-control bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <span className="font-semibold">Pipeline Error: </span>
                  {error}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={loading || selectedOutputs.length === 0}
              onClick={handleGenerate}
              className="w-full py-2.5 px-4 rounded-control bg-imagine-secondary hover:bg-imagine-secondary-strong disabled:opacity-50 text-white font-medium text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Pipeline Outputs...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Content ({selectedOutputs.length} outputs)
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Column: Output Previews & History (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          {/* Tab Navigation Bar */}
          <div className="bg-imagine-surface rounded-panel border border-imagine-border p-1.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("linkedin")}
                className={`px-3 py-1.5 rounded-control text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === "linkedin"
                    ? "bg-imagine-background text-imagine-foreground shadow-xs font-semibold"
                    : "text-imagine-foreground-muted hover:text-imagine-foreground"
                }`}
              >
                <LinkedinIcon className="w-3.5 h-3.5 text-[#0a66c2]" />
                LinkedIn Post
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("email")}
                className={`px-3 py-1.5 rounded-control text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === "email"
                    ? "bg-imagine-background text-imagine-foreground shadow-xs font-semibold"
                    : "text-imagine-foreground-muted hover:text-imagine-foreground"
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-imagine-secondary" />
                Email Draft
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("x_thread")}
                className={`px-3 py-1.5 rounded-control text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === "x_thread"
                    ? "bg-imagine-background text-imagine-foreground shadow-xs font-semibold"
                    : "text-imagine-foreground-muted hover:text-imagine-foreground"
                }`}
              >
                <TwitterIcon className="w-3.5 h-3.5 text-sky-500" />
                X Thread
                <span className="text-[10px] bg-imagine-secondary-soft text-imagine-secondary-strong px-1.5 py-0.2 rounded font-normal">
                  new
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`px-3 py-1.5 rounded-control text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === "history"
                    ? "bg-imagine-background text-imagine-foreground shadow-xs font-semibold"
                    : "text-imagine-foreground-muted hover:text-imagine-foreground"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Runs ({historyRuns.length})
              </button>
            </div>

            <div className="flex items-center gap-2 pr-1.5">
              {durationMs && (
                <span className="text-[11px] text-imagine-foreground-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {durationMs}ms
                </span>
              )}
              <button
                type="button"
                onClick={() => setActiveTab("json")}
                title="View Raw JSON"
                className={`p-1.5 rounded-control transition-colors ${
                  activeTab === "json"
                    ? "bg-imagine-background text-imagine-foreground"
                    : "text-imagine-foreground-faint hover:text-imagine-foreground"
                }`}
              >
                <Code2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TAB 1: LinkedIn Preview Card */}
          {activeTab === "linkedin" && (
            <div className="space-y-4">
              {outputData?.linkedin ? (
                <div className="bg-imagine-surface rounded-panel border border-imagine-border shadow-raised p-6 space-y-4">
                  {/* LinkedIn Header */}
                  <div className="flex items-center justify-between border-b border-imagine-border pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-imagine-primary to-imagine-secondary flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        AR
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-imagine-foreground">
                          Alex Rivera
                        </div>
                        <div className="text-[11px] text-imagine-foreground-muted">
                          VP of Growth at {company.name} • 1st
                        </div>
                        <div className="text-[10px] text-imagine-foreground-faint flex items-center gap-1">
                          Just now • 🌐
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `${outputData.linkedin.hook}\n\n${outputData.linkedin.body}\n\n${outputData.linkedin.callToAction}\n\n${(outputData.linkedin.suggestedHashtags || []).join(" ")}`
                        )
                      }
                      className="text-xs text-imagine-foreground-muted hover:text-imagine-foreground px-2.5 py-1 rounded-control border border-imagine-border flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Post
                        </>
                      )}
                    </button>
                  </div>

                  {/* LinkedIn Post Hook */}
                  <div className="font-semibold text-sm text-imagine-foreground leading-snug">
                    {outputData.linkedin.hook}
                  </div>

                  {/* LinkedIn Post Body */}
                  <div className="text-xs text-imagine-foreground whitespace-pre-line leading-relaxed">
                    {outputData.linkedin.body}
                  </div>

                  {/* Call to Action Box */}
                  {outputData.linkedin.callToAction && (
                    <div className="p-3 rounded-control bg-imagine-background border-l-2 border-imagine-secondary text-xs text-imagine-foreground font-medium">
                      👉 {outputData.linkedin.callToAction}
                    </div>
                  )}

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {outputData.linkedin.suggestedHashtags &&
                    outputData.linkedin.suggestedHashtags.length > 0 ? (
                      outputData.linkedin.suggestedHashtags.map(
                        (tag: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs text-imagine-secondary-strong bg-imagine-secondary-soft px-2 py-0.5 rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        )
                      )
                    ) : (
                      <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-control border border-amber-200">
                        ⚠️ No hashtags rendered (Quiet bug in un-refactored route handler!)
                      </span>
                    )}
                  </div>

                  {/* LinkedIn Engagement Bar */}
                  <div className="border-t border-imagine-border pt-3 mt-4 flex items-center justify-between text-xs text-imagine-foreground-muted">
                    <button className="flex items-center gap-1.5 hover:text-imagine-foreground px-2 py-1 rounded">
                      <ThumbsUp className="w-3.5 h-3.5" /> Like
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-imagine-foreground px-2 py-1 rounded">
                      <MessageSquare className="w-3.5 h-3.5" /> Comment
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-imagine-foreground px-2 py-1 rounded">
                      <Repeat className="w-3.5 h-3.5" /> Repost
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-imagine-foreground px-2 py-1 rounded">
                      <Send className="w-3.5 h-3.5" /> Send
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-imagine-surface rounded-panel border border-imagine-border p-12 text-center text-xs text-imagine-foreground-muted space-y-2">
                  <LinkedinIcon className="w-8 h-8 text-imagine-foreground-faint mx-auto" />
                  <p className="font-medium text-imagine-foreground">
                    No LinkedIn output generated yet
                  </p>
                  <p>Click "Generate Content" to run the pipeline.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Cold Email Preview Card */}
          {activeTab === "email" && (
            <div className="space-y-4">
              {outputData?.email ? (
                <div className="bg-imagine-surface rounded-panel border border-imagine-border shadow-raised p-6 space-y-4">
                  {/* Email Header */}
                  <div className="space-y-2 border-b border-imagine-border pb-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-imagine-foreground-muted w-14">
                          Subject:
                        </span>
                        <span className="font-semibold text-imagine-foreground">
                          {outputData.email.subject}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `Subject: ${outputData.email.subject}\n\n${outputData.email.salutation}\n\n${outputData.email.body}\n\nCTA: ${outputData.email.callToAction}\n\n${outputData.email.signoff}`
                          )
                        }
                        className="text-xs text-imagine-foreground-muted hover:text-imagine-foreground px-2.5 py-1 rounded-control border border-imagine-border flex items-center gap-1"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Draft
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-imagine-foreground-muted w-14">
                        Preview:
                      </span>
                      {outputData.email.previewText ? (
                        <span className="text-imagine-foreground-muted italic">
                          "{outputData.email.previewText}"
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ⚠️ Preview text missing (Quiet bug in un-refactored route handler!)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-imagine-foreground-faint">
                      <span className="w-14 font-medium text-imagine-foreground-muted">
                        To:
                      </span>
                      <span>sarah.growth@enterprise-prospect.com</span>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="space-y-3 text-xs leading-relaxed text-imagine-foreground">
                    <div className="font-medium">{outputData.email.salutation}</div>
                    <div className="whitespace-pre-line">{outputData.email.body}</div>
                  </div>

                  {/* CTA Button */}
                  {outputData.email.callToAction ? (
                    <div className="pt-2">
                      <button className="px-4 py-2 bg-imagine-secondary text-white text-xs font-medium rounded-control shadow-sm flex items-center gap-1.5">
                        {outputData.email.callToAction}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      ⚠️ Call to action was dropped by parser (Quiet bug!)
                    </div>
                  )}

                  {/* Signoff */}
                  <div className="border-t border-imagine-border pt-3 text-xs text-imagine-foreground-muted whitespace-pre-line">
                    {outputData.email.signoff}
                  </div>
                </div>
              ) : (
                <div className="bg-imagine-surface rounded-panel border border-imagine-border p-12 text-center text-xs text-imagine-foreground-muted space-y-2">
                  <Mail className="w-8 h-8 text-imagine-foreground-faint mx-auto" />
                  <p className="font-medium text-imagine-foreground">
                    No Email draft generated yet
                  </p>
                  <p>Select Cold Email and click "Generate Content".</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: X (Twitter) Thread Preview Card */}
          {activeTab === "x_thread" && (
            <div className="space-y-4">
              {outputData?.x_thread ? (
                <div className="space-y-3">
                  {/* Hook Tweet */}
                  <div className="bg-imagine-surface rounded-panel border border-imagine-border p-5 shadow-sm space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold">
                          𝕏
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-imagine-foreground">
                            Alex Rivera
                          </div>
                          <div className="text-[11px] text-imagine-foreground-muted">
                            @alex_growth
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-imagine-secondary font-semibold">
                        Thread Hook
                      </span>
                    </div>

                    <div className="text-xs text-imagine-foreground whitespace-pre-line leading-relaxed font-medium">
                      {outputData.x_thread.hook}
                    </div>
                  </div>

                  {/* Body Tweets */}
                  {outputData.x_thread.tweets &&
                    outputData.x_thread.tweets.map(
                      (tweet: string, idx: number) => (
                        <div
                          key={idx}
                          className="bg-imagine-surface rounded-panel border border-imagine-border p-4 shadow-sm space-y-2 relative ml-4 pl-4 border-l-2 border-l-sky-400"
                        >
                          <div className="text-[11px] font-mono text-imagine-foreground-muted">
                            Tweet {idx + 1} of {outputData.x_thread.tweets.length}
                          </div>
                          <div className="text-xs text-imagine-foreground whitespace-pre-line leading-relaxed">
                            {tweet}
                          </div>
                        </div>
                      )
                    )}

                  {/* Conclusion / CTA Tweet */}
                  {outputData.x_thread.callToAction && (
                    <div className="bg-imagine-surface rounded-panel border border-imagine-border p-4 shadow-sm space-y-2 ml-4 pl-4 border-l-2 border-l-emerald-400">
                      <div className="text-[11px] font-mono text-emerald-600 font-semibold">
                        Conclusion / CTA
                      </div>
                      <div className="text-xs text-imagine-foreground whitespace-pre-line">
                        {outputData.x_thread.callToAction}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-imagine-surface rounded-panel border border-imagine-border p-12 text-center text-xs text-imagine-foreground-muted space-y-3">
                  <TwitterIcon className="w-8 h-8 text-sky-400 mx-auto" />
                  <p className="font-semibold text-sm text-imagine-foreground">
                    X (Twitter) Thread Feature
                  </p>
                  <p className="max-w-md mx-auto leading-relaxed">
                    This output type is not yet implemented in the un-refactored pipeline.
                    In the interview (minute 35-50), the candidate's task is to add X thread generation to the pipeline!
                  </p>
                  <div className="inline-block bg-imagine-background border border-imagine-border px-3 py-1.5 rounded-control font-mono text-[11px] text-imagine-foreground-muted">
                    Fixture ready in <code className="text-imagine-secondary font-bold">src/lib/mock-llm.ts</code>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: History / Past Runs */}
          {activeTab === "history" && (
            <div className="bg-imagine-surface rounded-panel border border-imagine-border p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-imagine-border">
                <h3 className="font-semibold text-xs text-imagine-foreground">
                  Saved Pipeline Runs ({historyRuns.length})
                </h3>
                <button
                  type="button"
                  onClick={fetchHistory}
                  className="text-xs text-imagine-foreground-muted hover:text-imagine-foreground flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                {historyRuns.map((run: any) => (
                  <div
                    key={run.id}
                    onClick={() => {
                      setOutputData(run.outputs);
                      setCompany(run.inputs.companyProfile);
                      setPersona(run.inputs.targetPersona);
                      setDurationMs(run.durationMs);
                      setActiveTab("linkedin");
                    }}
                    className="p-3 rounded-control border border-imagine-border bg-imagine-background hover:bg-imagine-border/30 transition-colors cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-imagine-foreground">
                        {run.companyName || "Untitled Company"}
                      </div>
                      <div className="text-[11px] text-imagine-foreground-muted">
                        {new Date(run.createdAt || run.timestamp).toLocaleString()} • {run.durationMs || 0}ms
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {run.outputs?.linkedin && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                          LinkedIn
                        </span>
                      )}
                      {run.outputs?.email && (
                        <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-medium">
                          Email
                        </span>
                      )}
                      {run.outputs?.x_thread && (
                        <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-medium">
                          X Thread
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Raw JSON Output */}
          {activeTab === "json" && (
            <div className="bg-imagine-surface rounded-panel border border-imagine-border p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-imagine-foreground">
                  Raw Pipeline Result
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(outputData, null, 2))
                  }
                  className="text-xs text-imagine-foreground-muted hover:text-imagine-foreground px-2 py-1 rounded border border-imagine-border flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy JSON
                </button>
              </div>

              <pre className="p-4 bg-imagine-background border border-imagine-border rounded-control font-mono text-[11px] overflow-x-auto max-h-[500px] text-imagine-foreground">
                {JSON.stringify(outputData, null, 2) || "No data generated"}
              </pre>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
