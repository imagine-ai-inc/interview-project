/**
 * Mock LLM service with saved fixture responses.
 * Simulates OpenAI / Anthropic chat completion responses without requiring any API keys.
 *
 * It returns realistic model outputs (including markdown code blocks and occasional
 * snake_case field naming) matching real LLM quirks.
 */

export interface MockLlmOptions {
  prompt: string;
  system?: string;
  temperature?: number;
  model?: string;
}

export interface MockLlmResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function callMockLlm(options: MockLlmOptions): Promise<MockLlmResponse> {
  const isTest = process.env.NODE_ENV === "test" || process.env.VITEST;
  if (!isTest) {
    // Realistic API network delay in development
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const promptLower = (options.prompt + " " + (options.system || "")).toLowerCase();

  if (promptLower.includes("simulate_error") || process.env.MOCK_LLM_FAIL === "true") {
    throw new Error("Mock LLM Provider Error: Rate limit exceeded (429)");
  }

  // 1. LinkedIn Post Generation Fixture
  if (promptLower.includes("linkedin")) {
    const rawContent = JSON.stringify(
      {
        hook: "90% of B2B content teams are moving fast in the wrong direction.",
        body: "They spend $15k/month on agencies.\nThey debate tone in 6 Slack channels.\nThey post once every 3 weeks when everyone finally agrees.\n\nThe bottleneck was never 'ideas'. It was the approval loop.\n\nImagine an engine that understands your brand voice so deeply that executive thought leadership publishes on autopilot without a single prompt engineering hack.\n\nThat's not the future. That's what high-velocity growth teams are doing today.",
        callToAction: "Drop a comment below or DM me 'ENGINE' to see our private workflow breakdown.",
        hashtags: ["#B2BGrowth", "#ContentMarketing", "#AIWorkflow", "#SaaSLeadership"],
      },
      null,
      2
    );

    // Realistic LLM output: wrapped in markdown json fence
    return {
      text: "```json\n" + rawContent + "\n```",
      usage: {
        promptTokens: 412,
        completionTokens: 188,
        totalTokens: 600,
      },
    };
  }

  // 2. Cold Email Draft Fixture
  if (promptLower.includes("email") || promptLower.includes("outreach") || promptLower.includes("subject line")) {
    const rawContent = JSON.stringify(
      {
        subject: "quick question re: content bottlenecks at {{companyName}}",
        // Note: Real LLMs often produce snake_case fields like preview_text or cta
        preview_text: "Saw your focus on scaling inbound without burning $15k/mo on agencies...",
        salutation: "Hey {{firstName}},",
        body: "Noticed you're heading up growth and likely balancing ambitious inbound targets against an overwhelmed team.\n\nMost VP of Growths we talk to say the same thing: agencies take 2 weeks for generic drafts, and founder approval cycles slow everything down.\n\nWe built ImagineAI to turn your company profile and target personas into ready-to-publish thought leadership and outbound drafts in 30 seconds—maintaining exact tone without manual prompting.\n\nWorth a 7-minute look this Thursday to see how it unclogs the pipeline?",
        cta: "Grab 7 mins on my calendar here",
        signoff: "Best,\nAlex Rivera\nGrowth Lead @ ImagineAI",
      },
      null,
      2
    );

    return {
      text: "```json\n" + rawContent + "\n```",
      usage: {
        promptTokens: 380,
        completionTokens: 210,
        totalTokens: 590,
      },
    };
  }

  // 3. X (Twitter) Thread Fixture (For the minute 35-50 feature!)
  if (promptLower.includes("thread") || promptLower.includes("twitter") || promptLower.includes("tweet") || promptLower.includes(" x ")) {
    const rawContent = JSON.stringify(
      {
        hook: "We audited 50 B2B SaaS marketing teams.\n\nThe ones winning inbound in 2026 all stopped doing this one thing:\n\n🧵 👇",
        tweets: [
          "1/ They stopped hiring $15k/mo content agencies to write generic top-of-funnel fluff.\n\nFounders think agencies save time. In reality, you spend 10 hours editing drafts that sound like ChatGPT threw up on a brochure.",
          "2/ Instead, they codify their brand voice and target persona once.\n\nEvery piece of content—LinkedIn, outbound, newsletter—pulls from the exact same company context layer.",
          "3/ When your content pipeline is persona-aware, you don't 'prompt' each post from scratch.\n\nYou feed one company profile update, and 5 platform-native assets generate in parallel.",
          "4/ The result? Content approval loops drop from 12 days to 15 minutes. Inbound pipeline triples.",
        ],
        callToAction: "If you want the exact workflow template we used to scale, reply 'PIPELINE' and I'll send the Notion doc.",
      },
      null,
      2
    );

    return {
      text: "```json\n" + rawContent + "\n```",
      usage: {
        promptTokens: 450,
        completionTokens: 280,
        totalTokens: 730,
      },
    };
  }

  // Fallback response
  return {
    text: JSON.stringify({
      message: "Generated content preview",
      rawPrompt: options.prompt.slice(0, 100),
    }),
    usage: {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    },
  };
}
