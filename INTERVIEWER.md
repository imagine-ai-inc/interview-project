# Interviewer Guide: "Untangle a Mess" Content Pipeline

This guide is for the interviewer conducting the **60-minute practical refactoring + feature round**.

---

## 1. Interview Overview & Philosophy

Most coding interviews test greenfield algorithmic puzzle-solving. Real product engineering at high-velocity startups looks different: engineers inherit messy prototypes, half-baked vibe-coded features, or legacy endpoints and must **untangle them, identify hidden failure modes, establish clean abstractions, and ship new features on top**.

This interview tests:
1. **System Understanding**: Can they read 450 lines of messy code and immediately spot the architectural flaws and quiet bugs?
2. **Refactoring Instincts**: Do they break down the monster handler into modular, reusable, strongly-typed components?
3. **Product & API Design**: Do they design clean interfaces and predictable error semantics?
4. **Extensibility Test (The Trap)**: We introduce a light feature at minute 35. If their refactor was sound, the feature drops in within 10 minutes. If they didn't refactor cleanly, they end up fighting their own code.

---

## 2. Minute-by-Minute Schedule

### 00:00 – 05:00: Context & Hand-Off
- Tell the candidate:
  > *"Imagine one of our founders or engineers built a prototype of our AI Content Pipeline over the weekend. It takes a company profile and a persona and produces a LinkedIn post and cold email draft. The UI works, but the backend route handler is a 450-line monster. Your job today is to untangle it, fix any subtle bugs you spot, make it clean and maintainable, and then we'll add a quick feature to it."*
- Have candidate run:
  ```bash
  npm install
  npm run dev
  npm test
  ```
- Have candidate share screen.

### 05:00 – 15:00: Code Exploration & Walkthrough
- Ask the candidate:
  > *"Before writing any code, take 5 to 10 minutes to walk me through `src/app/api/pipeline/route.ts`. What is it doing? What smells or red flags do you see?"*
- **What to look for**:
  - Do they notice the repeated prompt construction between LinkedIn and Email?
  - Do they spot the inconsistent error handling (some return 500, some return HTTP 200 with `{ status: "error" }`, some silently swallow errors)?
  - Do they notice the direct filesystem reading/writing in the middle of the route handler?
  - Do they notice `any` types everywhere?
  - Did they run `npm test` and see which tests failed?

### 15:00 – 35:00: The Refactor
- Candidate begins refactoring.
- Let them drive. Don't prescribe an architecture; observe how they naturally structure code.
- **Signals to watch**:
  - Do they extract domain interfaces (`CompanyProfile`, `TargetPersona`, `PipelineRun`, etc.)?
  - Do they create a shared helper for formatting company and persona context?
  - Do they fix the 3 quiet bugs (see Section 4 below)?
  - Do they separate route handling from pipeline orchestration from persistence?
  - Do they run `npm test` to verify their changes? All 6 initial tests should turn green!

### 35:00 – 50:00: The Feature Request
- Interrupt gently around minute 35:
  > *"Our marketing team loves this, but they really need an **X (Twitter) Thread** generator as well. An X thread takes the same company profile and persona, and generates: a hook tweet, an array of 3-5 body tweets, and a CTA tweet. The mock LLM already has a fixture for this. Can you add it as an option to the pipeline?"*
- **The Divergence**:
  - **Candidate with good refactor**: Creates a new generator/stage (e.g. `TwitterThreadGenerator`), reuses `formatContext`, adds the type, and unskips the test in `test/pipeline.test.ts`. Done in 5–10 minutes!
  - **Candidate who didn't refactor**: Copy-pastes another 120 lines of string building, regexes, and file writes into the route handler. They run out of time or introduce new bugs.

### 50:00 – 60:00: Wrap-Up & Discussion
- Ask:
  > *"If you had another full day with this codebase, what would you prioritize next?"*
- Give them 5–7 minutes to ask you questions about the team and company.

---

## 3. Catalog of Intentional Smells Baked In

| Smell / Anti-Pattern | Where It Lives | Impact |
| :--- | :--- | :--- |
| **Pervasive `any` Types** | Lines 80–380 | Zero type safety, no autocompletion, hides schema drift. |
| **Copy-Pasted Prompts** | LinkedIn vs Email prompt blocks | 80% duplicate string concatenation for company & persona details. |
| **Inconsistent Error Handling** | Validation vs LLM calls vs Parsing | 3 different styles: throws 500, returns HTTP 200 with error JSON, and silently swallows errors into `null`. |
| **Direct File I/O in Route** | Lines 320–360 | `fs.readFileSync` and `fs.writeFileSync` in request handler blocks event loop, tightly couples storage to API. |
| **Ad-Hoc JSON Markdown Stripping** | Lines 18–35 | Brittle `stripMarkdownFences` string replacement prone to breaking on edge cases. |
| **Sequential LLM Calls** | Route handler | LinkedIn and Email are awaited sequentially instead of in parallel (`Promise.all`). |

---

## 4. The 3 Quiet Bugs (And Where They Are)

### Bug 1: Dropped LinkedIn Hashtags
- **Location**: `src/app/api/pipeline/route.ts` around line 210:
  ```ts
  if (Array.isArray(rawTags)) {
    formattedTags = rawTags
      .map((t: any) => t?.tag || t?.name) // <-- Bug: rawTags is string[], so t.tag is undefined!
      .filter((t: any) => typeof t === "string" && t.length > 0);
  }
  ```
- **Symptom**: Hashtags array is always empty `[]` on LinkedIn post cards.
- **Caught by test**: `retains hashtags in LinkedIn output`.

### Bug 2: Missing Email `previewText` and `callToAction`
- **Location**: `src/app/api/pipeline/route.ts` around line 305:
  ```ts
  previewText: parsedEmail.previewText || parsedEmail.preview || "", // Mock returns preview_text
  callToAction: parsedEmail.callToAction || parsedEmail.ctaButton || "", // Mock returns cta
  ```
- **Symptom**: Cold email draft is rendered without preview text and without CTA.
- **Caught by test**: `retains previewText and callToAction in email output`.

### Bug 3: Crash on Empty Persona `painPoints`
- **Location**: `src/app/api/pipeline/route.ts` lines 175 and 270:
  ```ts
  linkedinPrompt += "  * Top Priority Pain: " + persona.painPoints[0].trim() + "\n";
  ```
- **Symptom**: If `painPoints` is empty or undefined, crashes with `TypeError: Cannot read properties of undefined (reading 'trim')` and returns HTTP 500.
- **Caught by test**: `handles empty persona pain points gracefully without 500 error`.

---

## 5. Candidate Evaluation Rubric

### 🔴 Junior / Below Bar
- Dives into editing code immediately without reading or planning.
- Leaves `any` types or adds `as any` casts to suppress compiler errors.
- Fixes bugs with quick one-line hacks without improving file structure.
- When asked to add the X thread feature, copy-pastes another 120 lines into the route handler.
- Doesn't run or update the test suite.

### 🟡 Mid-Level
- Understands the code after 10 minutes and points out major duplication.
- Moves prompt building into helper functions.
- Defines basic TypeScript interfaces for inputs and outputs.
- Fixes the 3 quiet bugs.
- Adds the X thread feature, but might still leave file storage inside the route handler.

### 🟢 Senior (Strong Hire)
- Quickly articulates architectural issues: mixed concerns, error handling inconsistencies, and duplicated prompt logic.
- Creates a clean, decoupled structure:
  - `types/pipeline.ts`: Strong domain types.
  - `lib/prompt-builder.ts`: DRY context formatting function.
  - `lib/generators/*`: Modular generator modules or pipeline stages.
  - `lib/storage.ts`: Clean repository abstraction for database persistence.
- Normalizes errors with proper HTTP status codes (400 for validation, 500 for provider failures).
- Uses `Promise.all` for parallel generation.
- Drops the X thread feature in cleanly in under 10 minutes.
- All tests pass (`npm test`).

### 🟣 Staff / Exceptional
- All Senior behaviors plus:
  - Mentions schema validation (Zod / Valibot) for both incoming user inputs and LLM JSON parsing.
  - Considers partial failure modes: if LinkedIn succeeds but Email fails, what should the API return? (e.g. `207 Multi-Status` or partial results with status flags).
  - Discusses prompt versioning, token budget estimation, and streaming/background jobs for production scale.

---

## 6. Reference Solution Sketch

A clean refactor typically settles into this structure:

```
src/
├── types/
│   └── pipeline.ts        # CompanyProfile, TargetPersona, Output types, PipelineRun
├── lib/
│   ├── mock-llm.ts        # Untouched mock LLM provider
│   ├── storage.ts         # getRuns(), saveRun(run)
│   └── pipeline/
│       ├── context.ts     # formatContext(company, persona)
│       ├── parse.ts       # safeJsonParse<T>() helper
│       └── generators/
│           ├── linkedin.ts
│           ├── email.ts
│           └── x-thread.ts
└── app/
    └── api/
        └── pipeline/
            └── route.ts   # ~30 lines: validate -> execute pipeline -> save -> respond
```
