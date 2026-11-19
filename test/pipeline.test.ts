import { describe, it, expect, beforeEach } from "vitest";
import { POST, GET } from "@/app/api/pipeline/route";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "pipeline_runs.json");

const validPayload = {
  companyProfile: {
    name: "ImagineAI",
    industry: "B2B SaaS / Content Workflow",
    valueProp: "Self-driving content engine for marketing teams",
    tone: "Bold, authoritative, practitioner-first",
    targetAudience: "CMOs, VPs of Growth, Content Leads",
    keyDifferentiators: [
      "Deep brand voice modeling",
      "One-click multi-platform output",
      "Eliminates agency back-and-forth",
    ],
    website: "https://imagine.ai",
  },
  targetPersona: {
    role: "VP of Growth",
    seniority: "Executive",
    industry: "B2B Tech",
    painPoints: [
      "Content team is bottlenecked on approvals",
      "Agencies cost $15k/mo with generic output",
    ],
    goals: [
      "Scale inbound pipeline by 3x",
      "Build founder thought leadership",
    ],
  },
  outputs: ["linkedin", "email"],
};

function createPostRequest(body: any): NextRequest {
  return new NextRequest("http://localhost:3000/api/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Content Pipeline API", () => {
  beforeEach(() => {
    // Keep seed data intact or ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  it("GET /api/pipeline returns list of saved runs", async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data.runs)).toBe(true);
  });

  it("POST /api/pipeline rejects payload missing companyProfile with 400", async () => {
    const req = createPostRequest({ targetPersona: validPayload.targetPersona });
    const res = await POST(req);
    const data = await res.json();
    
    // NOTE FOR CANDIDATE: Check HTTP status vs payload status
    // A clean API should return HTTP 400 status code
    expect(res.status === 400 || data.code === 400 || data.status === "error").toBe(true);
  });

  it("POST /api/pipeline generates content and saves to storage", async () => {
    const req = createPostRequest(validPayload);
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.linkedin).toBeDefined();
    expect(data.data.linkedin.hook).toBeTruthy();
    expect(data.data.linkedin.body).toBeTruthy();

    expect(data.data.email).toBeDefined();
    expect(data.data.email.subject).toBeTruthy();
    expect(data.data.email.body).toBeTruthy();

    // Verification of database persistence
    const getRes = await GET();
    const allRuns = await getRes.json();
    const saved = allRuns.runs.find((r: any) => r.id === data.runId);
    expect(saved).toBeDefined();
  });

  // QUIET BUG TEST 1: Hashtags dropping
  // In the vibe-coded code, this test will reveal that suggestedHashtags is empty!
  it("retains hashtags in LinkedIn output (fails in un-refactored code)", async () => {
    const req = createPostRequest(validPayload);
    const res = await POST(req);
    const data = await res.json();

    expect(data.data.linkedin).toBeDefined();
    expect(Array.isArray(data.data.linkedin.suggestedHashtags)).toBe(true);
    expect(data.data.linkedin.suggestedHashtags.length).toBeGreaterThan(0);
  });

  // QUIET BUG TEST 2: Email preview text dropping
  // In the vibe-coded code, previewText is empty string because of snake_case mismatch!
  it("retains previewText and callToAction in email output (fails in un-refactored code)", async () => {
    const req = createPostRequest(validPayload);
    const res = await POST(req);
    const data = await res.json();

    expect(data.data.email).toBeDefined();
    expect(data.data.email.previewText).toBeTruthy();
    expect(data.data.email.callToAction).toBeTruthy();
  });

  // QUIET BUG TEST 3: Empty painPoints crash
  // In the vibe-coded code, painPoints[0].trim() throws TypeError and causes HTTP 500!
  it("handles empty persona pain points gracefully without 500 error (fails in un-refactored code)", async () => {
    const payloadWithEmptyPainPoints = {
      ...validPayload,
      targetPersona: {
        ...validPayload.targetPersona,
        painPoints: [],
      },
    };

    const req = createPostRequest(payloadWithEmptyPainPoints);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).not.toBe(500);
    expect(data.success).toBe(true);
  });

  // ==========================================================================
  // CANDIDATE FEATURE TEST (MINUTE 35-50): X (Twitter) Thread
  // Unskip this test when you add the X Thread generation feature!
  // ==========================================================================
  it.skip("generates an X (Twitter) thread when requested in outputs", async () => {
    const payloadWithTwitter = {
      ...validPayload,
      outputs: ["linkedin", "email", "x_thread"],
    };

    const req = createPostRequest(payloadWithTwitter);
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.x_thread).toBeDefined();
    expect(data.data.x_thread.hook).toBeTruthy();
    expect(Array.isArray(data.data.x_thread.tweets)).toBe(true);
    expect(data.data.x_thread.tweets.length).toBeGreaterThanOrEqual(3);
    expect(data.data.x_thread.callToAction).toBeTruthy();
  });
});
