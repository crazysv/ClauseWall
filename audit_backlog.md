# ClauseWall Audit Backlog
> Actionable execution roadmap rigorously extracted from the corrected audit artifacts.
> All paths listed below are verified to exist (or explicitly planned for creation).

## First 5 tasks to execute in order
1. **[T-P0-1] API Surface Lockdown**: Secures the vulnerable API layer to prevent systemic abuse.
2. **[T-P0-2] Secure Destructive Endpoints**: Stops potential data destruction from unauthenticated `DELETE` actions.
3. **[T-P0-3] Remove Service-Role RLS Bypasses**: Properly scopes DB operations to active user sessions.
4. **[T-P0-4] AI output schema validation before DB writes**: Protects the database layer from AI hallucinations.
5. **[T-P1-1] Fix Key Rotation Closures in AI Clients**: Restores reliability and cost recovery for the core text-gen fallback.

---

## The Backlog

### P0: Security Blockers (Day 1 - 3 Priorities)

#### [T-P0-1] API Surface Lockdown
* **Severity:** P0
* **Exact file paths:** `lib/api/with-api-handler.ts` (NEW), `app/api/autopsy/route.ts`, `app/api/analyze/route.ts`, `app/api/explain/route.ts`, `app/api/authority/complaint/draft/route.ts`
* **Problem:** Endpoints parse `req.json()` without Zod validation, rate limiting, or auth checks, assuming the frontend sanitizes data.
* **Exact fix:** Build `lib/api/with-api-handler.ts` integrating `lib/rate-limit.ts` and `lib/supabase/server.ts`, and wrap high-risk routes.
* **Effort:** 10 hours
* **Dependencies:** None
* **Testing needed:** Test with authenticated, unauthenticated, and malformed POST requests against wrapped endpoints.

#### [T-P0-2] Secure Destructive Endpoints
* **Severity:** P0
* **Exact file paths:** `app/api/reanalyze/route.ts`
* **Problem:** Endpoint performs destructive `DELETE` operations on old clauses but lacks native user verification logic.
* **Exact fix:** Add an RLS scope check or explicit user ID comparison before triggering Supabase deletes.
* **Effort:** 30 minutes
* **Dependencies:** [T-P0-1] (optional but recommended)
* **Testing needed:** Attempt API call to delete a target document ID owned by another user.

#### [T-P0-3] Remove Service-Role RLS Bypasses
* **Severity:** P0 
* **Exact file paths:** `app/api/builder/generate/route.ts`, `app/api/negotiate/generate/route.ts`, `app/api/lawchange/pending/route.ts`, `app/api/collab/annotations/route.ts`
* **Problem:** Codebases import `createAdminClient()` bypassing Row Level Security. Anonymous users can mutate/read data belonging to others.
* **Exact fix:** Replace `createAdminClient` with standard server component creation pattern. Let database handle auth.
* **Effort:** 3 hours
* **Dependencies:** RLS policies must exist on target tables.
* **Testing needed:** Verify operations fail if a user tries altering an external `documentId`.

#### [T-P0-4] AI output schema validation before DB writes
* **Severity:** P0
* **Exact file paths:** `lib/ai/clause-extractor.ts`, `lib/core/hybrid-analyzer.ts`
* **Problem:** AI extraction strings are placed in the database without strong bounds. Unsanitized outputs trigger systemic issues inside DB queries or UI parsing.
* **Exact fix:** Employ Zod validations before database insertion loops.
* **Effort:** 2 hours
* **Dependencies:** None
* **Testing needed:** Submit a document guaranteeing malformed output, verify validation trap properly throws instead of committing to DB.

---

### P1: Reliability & Performance Blockers

#### [T-P1-1] Fix Key Rotation Closures in AI Clients
* **Severity:** P1
* **Exact file paths:** `lib/ai/groq-client.ts`, `lib/bot/gemini-client.ts`
* **Problem:** The retry/rotation logic inadvertently closures state. If a key exhausts its quota, it attempts infinite looping or breaks when trying to select the fallback.
* **Exact fix:** Swap internal closures for explicit class-level tracking or passed-in state values to the generator hook.
* **Effort:** 1 hour
* **Dependencies:** None
* **Testing needed:** Exhaust a key limit to trigger a 429; ensure the system rotates keys and recovers the in-flight request.

#### [T-P1-2] Eliminate In-Memory Map Stateful Bugs 
* **Severity:** P1
* **Exact file paths:** `lib/voice-aid/telegram-voice-handler.ts`
* **Problem:** A native JavaScript `Map` tracks multi-step Telegram states. Serverless cold starts delete the Map arbitrarily, breaking voice/bot UX mid-sentence.
* **Exact fix:** Swap `Map` to Upstash Redis Key-Value store.
* **Effort:** 1.5 hours
* **Dependencies:** Upstash setup.
* **Testing needed:** Wait > 5 min between telegram message replies to force cold start. Validate persistence.

#### [T-P1-3] Core Engine Deep Optimization
* **Severity:** P1 
* **Exact file paths:** `lib/core/analyzer.ts`
* **Problem:** Orchestration layer triggers too many concurrent parallel promises per document without a hard cap, resulting in duplicate LLM consumption and Vercel timeouts.
* **Exact fix:** Introduce concurrency limits inside the main mapping functions for AI enrichment tasks.
* **Effort:** 4 hours
* **Dependencies:** None
* **Testing needed:** Push a large 100-page simulated contract through. Measure concurrency and monitor execution spans.

#### [T-P1-4] Extraction Zero-Value Casting Bug
* **Severity:** P1
* **Exact file paths:** `lib/ai/value-extractor.ts`
* **Problem:** Implicit `(!val)` falsy checks drop explicit numeric `0` values extracted by the AI, transforming accurate zeros to `null`. Blinds rule engine.
* **Exact fix:** Enforce strict equality (`val === null || val === undefined`).
* **Effort:** 15 minutes
* **Dependencies:** None
* **Testing needed:** Provide dummy test string "$0 liability", confirm zero propagates in the AST.

---

### P2: Architecture & Maintainability Refactors

#### [T-P2-1] Severity Definition Unification
* **Severity:** P2
* **Exact file paths:** `lib/core/scorer.ts`, `lib/core/hybrid-analyzer.ts`, `types/index.ts`
* **Problem:** Multiple separate definitions of risk mapping and traffic light colors. Weight scalings drift between analyzer usage and scoring definitions.
* **Exact fix:** Declare one single `SeverityWeightMap` and `RiskLevelEnum` and replace existing duplicates.
* **Effort:** 2 hours
* **Dependencies:** None
* **Testing needed:** Visual assurance and backend score assertion.

#### [T-P2-2] Refactor Frontend "God Components"
* **Severity:** P2
* **Exact file paths:** `components/results/score-card-modal.tsx`, `components/statemachine/state-graph.tsx`, `components/upload/quick-scan-result.tsx`
* **Problem:** Components exceed 800–2300 lines. `score-card-modal.tsx` renders four invisible 1080x1920 SVG templates into the DOM purely for later capture.
* **Exact fix:** Break down inner components into granular parts (e.g. `CarouselVariant`, `InstagramVariant`) and only render the active view using lazy loading.
* **Effort:** 5 hours
* **Dependencies:** None
* **Testing needed:** Print and save multiple types from the UI.

#### [T-P2-3] Destroy Types Monolith and Synchronize DB
* **Severity:** P2
* **Exact file paths:** `types/index.ts`, `types/authority.ts`, `types/evidence.ts`
* **Problem:** `types/index.ts` is 2,841 lines. Duplicate definitions exist across multiple files. No generated Supabase types.
* **Exact fix:** Deduplicate the triply-defined unions, split `index.ts` by domain, and introduce `supabase gen types` workflow into local dev.
* **Effort:** 6 hours
* **Dependencies:** Supabase CLI.
* **Testing needed:** Full `tsc --noEmit` pass.
