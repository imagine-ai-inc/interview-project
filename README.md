# ImagineAI Content Pipeline — Engineering Interview

Welcome to the **"Untangle a Mess"** engineering interview round!

## Context

You've just inherited an internal prototype for **ImagineAI's Content Pipeline**. 

The application takes a **Company Profile** (name, industry, value proposition, tone, differentiators) and a **Target Persona** (role, seniority, pain points, goals), and generates multi-channel marketing assets:
- **LinkedIn Post**: Scroll-stopping hook, body narrative, call to action, and hashtags.
- **Cold Email Draft**: Subject line, preview text, salutation, body paragraphs, CTA, and signoff.

A teammate "vibe-coded" this prototype over a weekend to validate the concept. It works and the UI looks great, but under the hood, the backend pipeline was hacked together in a single monster route handler.

Your mission in this session is to **untangle, refactor, and make sense of this pipeline**, and then **extend it with a new feature**.

---

## Quickstart (Under 2 Minutes)

Clone or open the repository, install dependencies, and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You can click **"Generate Content"** or **"Reset Sample Data"** to see the pipeline run.

### Running Tests

We have included a small test suite to act as your safety net while you refactor:

```bash
npm test
```

*(You will notice 3 tests currently fail — these point directly to quiet bugs in the prototype's parsing and error handling!)*

---

## Setup Details & Constraints

- **Mocked LLM (No API Keys needed)**: All LLM completions are simulated with realistic fixtures in `src/lib/mock-llm.ts`. There are zero external API keys or cloud dependencies.
- **Local Storage**: Runs are persisted to `data/pipeline_runs.json`.
- **Primary file to investigate**: `src/app/api/pipeline/route.ts`

---

## Session Flow (~60 Minutes)

1. **0 – 5 min**: Context & orientation. Share your screen and verify the app runs.
2. **5 – 15 min**: Code walkthrough. Read `src/app/api/pipeline/route.ts` and talk through what you see before changing anything.
3. **15 – 35 min**: **Refactor**. Untangle the pipeline:
   - Extract domain types (no more `any` types).
   - DRY up prompt construction and formatting.
   - Unify error handling and validation into one consistent pattern.
   - Separate concerns (prompt building, LLM orchestration, parsing, and storage).
   - Fix the quiet bugs.
4. **35 – 50 min**: **Light Feature**. The interviewer will ask you to add a third content output type (e.g. an X / Twitter thread).
   - *Note: If your refactor is modular, this drops in cleanly in ~10 minutes. If not, you'll be fighting the monster file!*
5. **50 – 60 min**: Wrap-up, "What would you do with another day?", and your questions.

---

## What We're Looking For

- **Readability & Maintainability**: Clear abstractions, meaningful names, modular design.
- **Strong Typing**: Clean TypeScript interfaces/types without relying on `any`.
- **DRY Principle**: Avoiding copy-pasting prompt boilerplate.
- **Consistent Error Handling**: Robust status codes and failure modes that don't silently swallow data.
- **Product Engineer Mindset**: Building an API that someone else on the team will love using.
