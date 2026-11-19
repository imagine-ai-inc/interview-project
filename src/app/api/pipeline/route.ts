import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { callMockLlm } from "@/lib/mock-llm";

// ============================================================================
// IMAGINE CONTENT PIPELINE ROUTE HANDLER (V1 PROTOTYPE - VIBE CODED)
// 
// TODO: Clean this up before production!! Hacked together for the internal demo.
// NOTE: Prompts are finely tuned, please do not break the formatting strings.
// ============================================================================

// Helper to sanitize markdown fences if the LLM wraps JSON in ```json ... ```
function stripMarkdownFences(str: any): string {
  if (!str || typeof str !== "string") {
    return "";
  }
  let cleaned: any = str.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

// Another helper someone wrote for extracting JSON substring with regex if parse fails
function extractJsonBlock(rawText: any): any {
  try {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (e: any) {
    console.log("extractJsonBlock error: could not find json object in string", e);
  }
  return null;
}

// Helper to format string arrays or single strings into bullets
function makeBulletList(items: any): string {
  if (!items) return "None specified";
  if (Array.isArray(items)) {
    let out = "";
    for (let i = 0; i < items.length; i++) {
      out += "  - " + String(items[i]) + "\n";
    }
    return out;
  }
  return "  - " + String(items) + "\n";
}

// GET /api/pipeline - Fetches past runs from the json database
export async function GET() {
  const dbPath = path.join(process.cwd(), "data", "pipeline_runs.json");
  try {
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ runs: [] });
    }
    const raw = fs.readFileSync(dbPath, "utf-8");
    const runs: any[] = JSON.parse(raw);
    // Sort descending by timestamp
    runs.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
    return NextResponse.json({ runs });
  } catch (err: any) {
    // Error handling style 1: standard 500 error object
    return NextResponse.json(
      { success: false, error: "Failed to read runs: " + err.message },
      { status: 500 }
    );
  }
}

// POST /api/pipeline - The monster route handler
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // ------------------------------------------------------------------------
    // 1. EXTRACT & VALIDATE REQUEST BODY (Loose, untyped, inconsistent errors)
    // ------------------------------------------------------------------------
    let body: any = null;
    try {
      body = await req.json();
    } catch (parseError: any) {
      // Error handling style 1: throw Error that gets caught at bottom
      throw new Error("Invalid request JSON body: " + parseError.message);
    }

    if (!body) {
      // Error handling style 1: throw Error
      throw new Error("Request body is empty");
    }

    // Error handling style 2: Return 200 HTTP with { status: "error", code: 400 } inside!
    if (!body.companyProfile) {
      return NextResponse.json({
        status: "error",
        code: 400,
        message: "companyProfile is required",
      });
    }

    if (!body.companyProfile.name || typeof body.companyProfile.name !== "string") {
      return NextResponse.json({
        status: "error",
        code: 400,
        message: "companyProfile.name must be a non-empty string",
      });
    }

    // Error handling style 2 variation: returning { ok: false, error_code: ... } with 422
    if (!body.targetPersona || typeof body.targetPersona !== "object") {
      return NextResponse.json(
        {
          ok: false,
          error_code: "INVALID_PERSONA",
          msg: "targetPersona must be provided as an object",
        },
        { status: 422 }
      );
    }

    const company: any = body.companyProfile;
    const persona: any = body.targetPersona;
    const requestedOutputs: any = body.outputs || ["linkedin", "email"];

    const finalOutputData: any = {};

    // ------------------------------------------------------------------------
    // 2. LINKEDIN POST GENERATION BRANCH
    // ------------------------------------------------------------------------
    if (requestedOutputs.includes("linkedin")) {
      console.log("[Pipeline] Starting LinkedIn post generation for:", company.name);

      // --- BUILD LINKEDIN SYSTEM PROMPT ---
      let linkedinSystemPrompt: any = "";
      linkedinSystemPrompt += "You are ImagineAI's senior B2B LinkedIn ghostwriter and social strategist.\n";
      linkedinSystemPrompt += "Your objective is to craft high-engagement, scroll-stopping LinkedIn posts for founders and executives.\n";
      linkedinSystemPrompt += "You speak with deep practitioner credibility, never sound like generic corporate PR, and use crisp spacing.\n";
      linkedinSystemPrompt += "Output must strictly be valid JSON with no conversational preamble or markdown commentary outside the JSON.\n";

      // --- BUILD LINKEDIN USER PROMPT (Notice massive manual string concatenation) ---
      let linkedinPrompt: any = "";
      linkedinPrompt += "Please generate a high-performing B2B LinkedIn post based on the following brand context:\n\n";

      linkedinPrompt += "=== COMPANY CONTEXT ===\n";
      linkedinPrompt += "Company Name: " + company.name.trim() + "\n";
      linkedinPrompt += "Industry Vertical: " + (company.industry || "B2B SaaS / Technology") + "\n";
      linkedinPrompt += "Core Value Proposition: " + (company.valueProp || "Automated intelligence workflow") + "\n";
      linkedinPrompt += "Brand Tone of Voice: " + (company.tone ? company.tone.toLowerCase() : "bold, authoritative, authentic") + "\n";
      linkedinPrompt += "Target Audience: " + (company.targetAudience || "Founders, CMOs, Growth Leaders") + "\n";
      linkedinPrompt += "Website URL: " + (company.website || "https://imagine.ai") + "\n";
      linkedinPrompt += "Key Differentiators:\n";
      if (company.keyDifferentiators && Array.isArray(company.keyDifferentiators)) {
        for (let i = 0; i < company.keyDifferentiators.length; i++) {
          linkedinPrompt += "  * " + company.keyDifferentiators[i] + "\n";
        }
      } else if (typeof company.keyDifferentiators === "string") {
        linkedinPrompt += "  * " + company.keyDifferentiators + "\n";
      } else {
        linkedinPrompt += "  * Proprietary domain model\n";
      }

      linkedinPrompt += "\n=== TARGET AUDIENCE PERSONA ===\n";
      linkedinPrompt += "Role / Title: " + (persona.role || "VP of Growth") + "\n";
      linkedinPrompt += "Seniority: " + (persona.seniority || "Executive") + "\n";
      linkedinPrompt += "Industry: " + (persona.industry || company.industry || "B2B Tech") + "\n";
      linkedinPrompt += "Pain Points:\n";

      // Quiet Bug 3: Directly indexing persona.painPoints[0] throws TypeError if painPoints is empty or undefined!
      linkedinPrompt += "  * Top Priority Pain: " + persona.painPoints[0].trim() + "\n";
      if (persona.painPoints && Array.isArray(persona.painPoints) && persona.painPoints.length > 1) {
        for (let idx = 1; idx < persona.painPoints.length; idx++) {
          linkedinPrompt += "  * " + persona.painPoints[idx] + "\n";
        }
      }

      linkedinPrompt += "Primary Goals:\n";
      if (persona.goals && Array.isArray(persona.goals)) {
        for (let g = 0; g < persona.goals.length; g++) {
          linkedinPrompt += "  - " + persona.goals[g] + "\n";
        }
      } else if (typeof persona.goals === "string") {
        linkedinPrompt += "  - " + persona.goals + "\n";
      }

      linkedinPrompt += "\n=== FORMATTING AND COPYWRITING GUIDELINES ===\n";
      linkedinPrompt += "1. Hook: Write a punchy 1-2 line opening that challenges conventional wisdom.\n";
      linkedinPrompt += "2. Body: Use 1-2 sentence short paragraphs, bullet points, and clean line breaks for mobile readability.\n";
      linkedinPrompt += "3. Length: Keep total post between 600 and 1200 characters.\n";
      linkedinPrompt += "4. Call to Action: A frictionless prompt inviting conversation (comment keyword, DM, or insight query).\n";
      linkedinPrompt += "5. Hashtags: 3 to 5 targeted B2B hashtags.\n\n";
      linkedinPrompt += "Respond ONLY with a JSON object in this exact schema:\n";
      linkedinPrompt += "{\n";
      linkedinPrompt += '  "hook": "The opening 1-2 lines",\n';
      linkedinPrompt += '  "body": "The core post narrative with linebreaks",\n';
      linkedinPrompt += '  "callToAction": "The concluding engagement ask",\n';
      linkedinPrompt += '  "hashtags": ["#Tag1", "#Tag2", "#Tag3"]\n';
      linkedinPrompt += "}\n";

      // --- CALL MOCK LLM FOR LINKEDIN ---
      let rawLinkedinRes: any = null;
      try {
        rawLinkedinRes = await callMockLlm({
          prompt: linkedinPrompt,
          system: linkedinSystemPrompt,
          temperature: 0.7,
        });
      } catch (llmErr: any) {
        console.error("LLM call failed for LinkedIn post:", llmErr);
        // Error style 1: rethrow
        throw new Error("LLM generation failed for LinkedIn: " + llmErr.message);
      }

      // --- PARSE LINKEDIN OUTPUT ---
      let parsedLinkedin: any = null;
      const strippedLinkedin = stripMarkdownFences(rawLinkedinRes.text);
      try {
        parsedLinkedin = JSON.parse(strippedLinkedin);
      } catch (parseErr: any) {
        console.warn("Direct JSON.parse failed on LinkedIn, trying regex fallback...", parseErr);
        parsedLinkedin = extractJsonBlock(rawLinkedinRes.text);
        if (!parsedLinkedin) {
          // Error handling style 3: silent fallback / mock object instead of failing
          console.error("Critical: Could not parse LinkedIn JSON, using fallback data");
          parsedLinkedin = {
            hook: "Unlocking growth with " + company.name,
            body: strippedLinkedin || "Check out how we scale content with AI.",
            callToAction: "Reach out to learn more.",
            hashtags: ["#Growth", "#B2B"],
          };
        }
      }

      // ----------------------------------------------------------------------
      // Quiet Bug 1: The Hashtag Drop Bug
      // The LLM returns hashtags as an array of strings e.g. ["#B2BGrowth", "#AIWorkflow"].
      // The vibe-coder wrote code assuming tags would be an array of objects ({ tag: string }),
      // so mapping `t?.tag || t?.name` returns `[undefined, undefined]`.
      // Filtering out undefined results in an EMPTY array, dropping all hashtags!
      // ----------------------------------------------------------------------
      let formattedTags: any[] = [];
      const rawTags: any = parsedLinkedin.hashtags || parsedLinkedin.suggestedHashtags || parsedLinkedin.tags;
      if (Array.isArray(rawTags)) {
        formattedTags = rawTags
          .map((t: any) => t?.tag || t?.name)
          .filter((t: any) => typeof t === "string" && t.length > 0);
      } else if (typeof rawTags === "string") {
        formattedTags = rawTags
          .split(" ")
          .map((s: any) => s.trim())
          .filter((s: any) => s.startsWith("#"));
      }

      finalOutputData.linkedin = {
        hook: parsedLinkedin.hook || "Growth breakdown:",
        body: parsedLinkedin.body || "",
        callToAction: parsedLinkedin.callToAction || parsedLinkedin.cta || "",
        suggestedHashtags: formattedTags, // <--- Quietly empty because of the mapping bug above!
      };
    }

    // ------------------------------------------------------------------------
    // 3. COLD EMAIL DRAFT GENERATION BRANCH
    // ------------------------------------------------------------------------
    if (requestedOutputs.includes("email")) {
      console.log("[Pipeline] Starting Cold Email draft generation for:", company.name);

      // --- BUILD EMAIL SYSTEM PROMPT ---
      let emailSystemPrompt: any = "";
      emailSystemPrompt += "You are ImagineAI's lead outbound B2B copywriter specializing in cold outreach.\n";
      emailSystemPrompt += "Your emails get 45%+ open rates and 18%+ reply rates because they are relevant, concise, and low-friction.\n";
      emailSystemPrompt += "You write like a busy peer, not an SDR spammer. Zero fake flattery. Zero buzzwords.\n";
      emailSystemPrompt += "Output must strictly be valid JSON with no conversational commentary.\n";

      // --- BUILD EMAIL USER PROMPT (Notice: 80% copy-pasted from LinkedIn prompt above!) ---
      let emailPrompt: any = "";
      emailPrompt += "Please generate a high-converting cold outreach email draft based on the following brand context:\n\n";

      emailPrompt += "=== COMPANY CONTEXT ===\n";
      emailPrompt += "Company Name: " + company.name.trim() + "\n";
      emailPrompt += "Industry Vertical: " + (company.industry || "B2B SaaS / Technology") + "\n";
      emailPrompt += "Core Value Proposition: " + (company.valueProp || "Automated intelligence workflow") + "\n";
      emailPrompt += "Brand Tone of Voice: " + (company.tone ? company.tone.toLowerCase() : "bold, authoritative, authentic") + "\n";
      emailPrompt += "Target Audience: " + (company.targetAudience || "Founders, CMOs, Growth Leaders") + "\n";
      emailPrompt += "Website URL: " + (company.website || "https://imagine.ai") + "\n";
      emailPrompt += "Key Differentiators:\n";
      if (company.keyDifferentiators && Array.isArray(company.keyDifferentiators)) {
        for (let i = 0; i < company.keyDifferentiators.length; i++) {
          emailPrompt += "  * " + company.keyDifferentiators[i] + "\n";
        }
      } else if (typeof company.keyDifferentiators === "string") {
        emailPrompt += "  * " + company.keyDifferentiators + "\n";
      } else {
        emailPrompt += "  * Proprietary domain model\n";
      }

      emailPrompt += "\n=== TARGET AUDIENCE PERSONA ===\n";
      emailPrompt += "Role / Title: " + (persona.role || "VP of Growth") + "\n";
      emailPrompt += "Seniority: " + (persona.seniority || "Executive") + "\n";
      emailPrompt += "Industry: " + (persona.industry || company.industry || "B2B Tech") + "\n";
      emailPrompt += "Pain Points:\n";

      // Quiet Bug 3 again: copy-pasted indexing
      emailPrompt += "  * Top Priority Pain: " + persona.painPoints[0].trim() + "\n";
      if (persona.painPoints && Array.isArray(persona.painPoints) && persona.painPoints.length > 1) {
        for (let idx = 1; idx < persona.painPoints.length; idx++) {
          emailPrompt += "  * " + persona.painPoints[idx] + "\n";
        }
      }

      emailPrompt += "Primary Goals:\n";
      if (persona.goals && Array.isArray(persona.goals)) {
        for (let g = 0; g < persona.goals.length; g++) {
          emailPrompt += "  - " + persona.goals[g] + "\n";
        }
      } else if (typeof persona.goals === "string") {
        emailPrompt += "  - " + persona.goals + "\n";
      }

      emailPrompt += "\n=== EMAIL COPYWRITING GUIDELINES ===\n";
      emailPrompt += "1. Subject: Lowercase, under 6 words, sounds internal/curious.\n";
      emailPrompt += "2. Preview Text: Complements subject line, under 60 characters.\n";
      emailPrompt += "3. Salutation: Personalized greeting e.g. 'Hey {{firstName}},'.\n";
      emailPrompt += "4. Body: 75 to 130 words maximum. Focus entirely on their bottleneck and our differentiator.\n";
      emailPrompt += "5. Call to Action: Low-commitment interest ask (e.g. 'Worth a 5-min look?').\n";
      emailPrompt += "6. Signoff: Clean and professional.\n\n";
      emailPrompt += "Respond ONLY with a JSON object in this exact schema:\n";
      emailPrompt += "{\n";
      emailPrompt += '  "subject": "quick question re: content bottlenecks",\n';
      emailPrompt += '  "previewText": "Saw your focus on scaling inbound...",\n';
      emailPrompt += '  "salutation": "Hey {{firstName}},",\n';
      emailPrompt += '  "body": "The email body text with paragraph breaks",\n';
      emailPrompt += '  "callToAction": "Open to a brief look?",\n';
      emailPrompt += '  "signoff": "Best,\\nAlex Rivera"\n';
      emailPrompt += "}\n";

      // --- CALL MOCK LLM FOR EMAIL ---
      let rawEmailRes: any = null;
      try {
        rawEmailRes = await callMockLlm({
          prompt: emailPrompt,
          system: emailSystemPrompt,
          temperature: 0.6,
        });
      } catch (llmErr: any) {
        console.error("LLM call failed for Email draft:", llmErr);
        // Error handling style 3: Swallow error and set null instead of propagating!
        finalOutputData.email = null;
      }

      if (rawEmailRes) {
        // --- PARSE EMAIL OUTPUT ---
        let parsedEmail: any = null;
        const strippedEmail = stripMarkdownFences(rawEmailRes.text);
        try {
          parsedEmail = JSON.parse(strippedEmail);
        } catch (parseErr: any) {
          console.warn("Direct JSON.parse failed on Email, trying regex fallback...", parseErr);
          parsedEmail = extractJsonBlock(rawEmailRes.text);
          if (!parsedEmail) {
            console.error("Critical: Could not parse Email JSON, setting error object");
            // Error handling style 3: silent fallback
            parsedEmail = {
              subject: "quick question re: " + company.name,
              previewText: "",
              salutation: "Hi {{firstName}},",
              body: strippedEmail,
              callToAction: "Let me know if you are open to chatting.",
              signoff: "Best,\nAlex",
            };
          }
        }

        // ----------------------------------------------------------------------
        // Quiet Bug 2: Missing previewText and CTA
        // The mock LLM returns `preview_text` and `cta`.
        // But the vibe-coder's code only checks `parsedEmail.previewText` or `parsedEmail.preview`,
        // and only checks `parsedEmail.callToAction` or `parsedEmail.ctaButton`.
        // Because `preview_text` and `cta` are not checked, previewText is silently empty string,
        // and callToAction is silently empty string!
        // ----------------------------------------------------------------------
        finalOutputData.email = {
          subject: parsedEmail.subject || parsedEmail.subjectLine || "Quick question",
          previewText: parsedEmail.previewText || parsedEmail.preview || "", // <--- Quiet bug: misses preview_text!
          salutation: parsedEmail.salutation || "Hey {{firstName}},",
          body: parsedEmail.body || parsedEmail.content || "",
          callToAction: parsedEmail.callToAction || parsedEmail.ctaButton || "", // <--- Quiet bug: misses cta!
          signoff: parsedEmail.signoff || "Best regards,\nAlex Rivera",
        };
      }
    }

    // ------------------------------------------------------------------------
    // 4. STORAGE / DATABASE PERSISTENCE (Direct filesystem mutation in route)
    // ------------------------------------------------------------------------
    const durationMs = Date.now() - startTime;
    const dbPath = path.join(process.cwd(), "data", "pipeline_runs.json");
    let existingRuns: any[] = [];

    try {
      if (fs.existsSync(dbPath)) {
        const fileContent = fs.readFileSync(dbPath, "utf-8");
        existingRuns = JSON.parse(fileContent);
      }
    } catch (fsErr: any) {
      console.warn("Could not read pipeline_runs.json, starting with empty array", fsErr);
      existingRuns = [];
    }

    // Ad-hoc ID generation
    const runId = "run_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    const newRunRecord: any = {
      id: runId,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
      companyName: company.name,
      inputs: {
        companyProfile: company,
        targetPersona: persona,
        requestedOutputs,
      },
      outputs: finalOutputData,
      status: "completed",
      durationMs,
    };

    existingRuns.unshift(newRunRecord);

    try {
      // Ensure data directory exists
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(existingRuns, null, 2), "utf-8");
      console.log("[Pipeline] Saved run to JSON database with ID:", runId);
    } catch (writeErr: any) {
      // Error handling style 3: log and ignore write failures, returning success anyway!
      console.error("CRITICAL: Failed to write run to database file!", writeErr);
    }

    // ------------------------------------------------------------------------
    // 5. RETURN SUCCESS RESPONSE
    // ------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      runId,
      data: finalOutputData,
      durationMs,
    });
  } catch (globalErr: any) {
    // Error handling style 1: Global catch returning status 500
    console.error("[Pipeline] Uncaught global error in POST handler:", globalErr);
    return NextResponse.json(
      {
        success: false,
        error: globalErr?.message || "An unexpected error occurred in content pipeline",
      },
      { status: 500 }
    );
  }
}
