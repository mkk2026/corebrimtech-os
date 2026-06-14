# Blueprint — CoreBrimTech OS → Proactive AI Co-Founder + Desktop App

**Objective:** Turn CoreBrimTech OS into a proactive AI co-founder (a persistent "paperclip"
assistant grounded in the founder's data, plus a signal-watching nudge layer) and ship it as a
cross-platform desktop app (Tauri) where the co-founder can reach the founder even when the
window is closed.

**Generated:** 2026-06-14 · Mode: EXPANSION · Branch base: `main`

---

## Context (shared by every step — read this first)

- **Stack:** Next.js 16 (App Router) / React 19 / TypeScript, Tailwind v4, Zod. 44 client
  components, **no server-only features**. State in `localStorage` (write-through to Supabase via
  `src/lib/supabase.ts`). UI is dark, amber-accented; `SyncStatusBar` / `SeedScanBanner` are the
  reference component quality tier.
- **AI layer:** `src/lib/llm.ts#complete()` POSTs to `/api/ai` (proxy at
  `src/app/api/ai/route.ts`). **Important inconsistency:** the client gates on a localStorage BYO
  key (`getStoredAnthropicKey`) but the proxy actually uses **server env** `ANTHROPIC_API_KEY`.
  The desktop native bridge (Step B2) resolves this by calling Anthropic with the founder's stored
  key directly — making BYO real.
- **Module data sources to aggregate** (all `localStorage`, each with `get*` exports):
  `founder-brain`, `burn-rate`, `deal-pipeline`, `decision-journal`, `energy-tracker`,
  `goals`, `weekly-review`, `market-gap-scanner`, `competitor-intelligence`.
- **Reusable patterns:** pub/sub store (`toast.ts`, `seed-scan-store.ts`); DI orchestrator +
  feature flag + status banner (`auto-research.ts`, `feature-flags.ts`); generators stream
  (`runResearch`). Follow these — do not invent new patterns.
- **Constraints (non-negotiable):** No mock data (real data or empty states). TDD. 80% coverage
  on new code (Vitest + RTL already configured in `vitest.config.ts`; add new files to the
  `coverage.include` list). Immutable updates. Structured errors, no silent failures. Every new
  AI codepath gets the full error/rescue treatment (no-key / 401 / 429 / timeout / malformed JSON).
- **Workflow:** each step = its own branch off `main` + PR. New surfaces ship behind a feature
  flag (`coFounder`) like `autoResearch`, so they can be killed without redeploy.

---

## Step 0 — Repo/remote setup + land current work  ·  model: default  ·  deps: none

**Why:** There is **no git remote** today (gh is authed as `mkk2026`). No PR workflow is possible
until a remote exists. The onboarding/auto-intelligence work is already committed on
`feat/onboarding-auto-intelligence` (7 commits) and should land first.

**Tasks:**
- `gh repo create corebrimtech-os --private --source=. --remote=origin` (confirm name/visibility
  with the user first).
- Push `main` and `feat/onboarding-auto-intelligence`; open the PR for the feature branch.
- Dogfood the onboarding + seed scan live with a real key (the Horizon-0 QA the user deferred).

**Verify:** `git remote -v` shows origin; PR open; `npm test` green; manual: onboarding → ready
screen shows a real "found N competitors" count with a valid key.

**Exit:** Remote exists, current work is in review, seed scan confirmed end-to-end.

**Rollback:** N/A (setup only).

---

# EPIC A — Co-Founder Assistant (web-first; works in the browser before desktop)

## Step A1 — Co-founder context aggregator  ·  model: strongest  ·  deps: Step 0

**Why:** Both the chat assistant (A2) and the proactive signals (A4) need one compact,
token-bounded snapshot of "everything about this startup." Build it once.

**Tasks (TDD):**
- `src/lib/cofounder/context.ts` → `buildFounderContext(): FounderContext` and
  `renderContextPrompt(ctx): string` (token-bounded, summarized — not raw dumps).
- Pull from the module `get*` exports listed in Context. Each source is **optional**: missing /
  empty stores degrade to "not set yet" lines, never throw (shadow paths: nil/empty).
- Cap size (e.g. top-N deals, latest review) so the prompt stays bounded as data grows.

**Verify:** unit tests cover full data, empty stores, and partial data; `renderContextPrompt`
output is deterministic and under the token cap. `npm test` green, 80%+ on the new file.

**Exit:** A single tested function returns a real, bounded founder snapshot.

**Rollback:** Pure additive lib; delete file.

## Step A2 — Reactive chat engine  ·  model: strongest  ·  deps: A1

**Why:** The "ask your co-founder anything" core.

**Tasks (TDD):**
- `src/lib/cofounder/engine.ts` → `askCoFounder(question, deps)` using DI (inject `complete`,
  `buildContext`) so it's unit-testable without network (mirror `auto-research.ts`).
- System prompt = co-founder persona + `renderContextPrompt()`. Full error/rescue: no-key,
  401/429/timeout, malformed/empty → typed results, never silent.
- Conversation history kept in a `cofounder-store.ts` pub/sub (mirror `seed-scan-store.ts`).

**Verify:** unit tests for happy path, no-key, each failure mode, empty answer. 80%+.

**Exit:** `askCoFounder` returns grounded answers or typed errors, fully tested.

**Rollback:** Additive lib + flag-gated; remove.

## Step A3 — Co-founder dock UI ("the paperclip")  ·  model: default  ·  deps: A2

**Why:** The persistent, friendly surface — a floating launcher + slide-up chat panel.

**Tasks (TDD with RTL):**
- `src/components/cofounder/CoFounderDock.tsx`: floating button (bottom-right), expandable chat
  panel, message list, input, streaming/typing state, error states from A2. Match the
  amber/dark design language.
- Extend the `FeatureFlag` union in `src/lib/feature-flags.ts` with `"coFounder"` (default on).
- Mount in `page.tsx` behind the `coFounder` feature flag. Respect onboarding (hidden during it).
- a11y: focus trap in panel, Esc to close, `aria-live` for responses.

**Verify:** RTL tests render, send a (mocked) question, show the answer, show an error state.
80%+ on the component.

**Exit:** A founder can open the dock and chat with the co-founder in-browser.

**Rollback:** Feature flag off.

## Step A4 — Proactive signal engine  ·  model: strongest  ·  deps: A1  ·  ∥ parallel with A3

**Why:** The difference between a chatbot and a co-founder — it watches and speaks up.

**Tasks (TDD):**
- `src/lib/cofounder/signals.ts` → `detectSignals(ctx): Nudge[]`. Pure rules over the same
  context: runway < N months (burn-rate), deals stale > N days (pipeline), goal/deadline
  approaching (goals), sustained low energy (energy-tracker), unreviewed week (weekly-review).
- Each `Nudge` = `{ id, severity, message, actionLabel, targetModule }`. No mock data — a rule
  with no real data simply produces no nudge.
- Dedup/snooze state in a store so the same nudge doesn't nag.

**Verify:** unit tests per rule (fires / doesn't fire / boundary), empty data → no nudges. 80%+.

**Exit:** Tested pure function turns real founder data into actionable nudges.

**Rollback:** Additive lib; remove.

## Step A5 — Nudge surfacing in the dock  ·  model: default  ·  deps: A3, A4

**Why:** Deliver the nudges with one-click actions.

**Tasks (TDD with RTL):**
- Dock shows a nudge badge/feed; each nudge has a one-click button → `onNavigate(targetModule)`
  (reuse the existing module-routing prop) + snooze/dismiss.
- Proactively surface highest-severity nudge on dock open.

**Verify:** RTL: nudges render, click navigates, dismiss/snooze persists. 80%+.

**Exit:** In-browser proactive co-founder is complete.

**Rollback:** Feature flag off.

---

# EPIC B — Desktop App (Tauri)

## Step B0 — AI transport abstraction + static-export readiness  ·  model: strongest  ·  deps: Step 0  ·  ∥ parallel with A1

**Why:** Desktop (static export) has no Next API routes. Decouple `llm.ts` from `/api/ai` now,
in the web codebase, so the desktop bridge is a drop-in — and so this lands and is tested
independently of any Rust.

**Tasks (TDD):**
- `src/lib/ai-transport.ts`: `getTransport()` returns `web` (POST `/api/ai`, current behavior) or
  `native` (calls an injected bridge). Detect desktop via a runtime flag (`window.__TAURI__`).
- Refactor `llm.ts#complete()` to call the transport, not `fetch('/api/ai')` directly. **No
  behavior change on web.**
- Validate `next build` still passes; spike static-export compatibility.
  **CRITICAL:** `output: 'export'` is global and disables ALL API routes — it must NOT be set for
  the web build. Make `next.config.ts` conditional: `output: process.env.BUILD_TARGET === 'desktop'
  ? 'export' : undefined`. Web build keeps `/api/*`; only the desktop build target static-exports
  and bypasses the routes via the `native` transport.

**Verify:** existing llm-dependent tests still green; new transport unit tests (web path mocked).
`npm run build` passes. 80%+ on new file.

**Exit:** AI calls flow through a transport seam; web unchanged; desktop has a clean injection point.

**Rollback:** Transport defaults to web; revert is a one-file change.

## Step B1 — Tauri scaffold  ·  model: default  ·  deps: B0

**Why:** The native shell.

**Tasks:**
- `npm i -D @tauri-apps/cli`; `npx tauri init` → `src-tauri/` (Rust). Configure `tauri.conf.json`
  to load the statically-exported Next app (build with `BUILD_TARGET=desktop` → `out/`, per B0's
  conditional config); set dev/build commands.
- Add `tauri:dev` / `tauri:build` npm scripts. Document the Rust toolchain prerequisite in README.

**Verify:** `npm run tauri:dev` opens a window rendering the app; web build still works.

**Exit:** App runs in a native window on the dev machine.

**Rollback:** Delete `src-tauri/`; web untouched.

## Step B2 — Native AI bridge (true BYO key)  ·  model: strongest  ·  deps: B1, B0

**Why:** Replace `/api/ai` on desktop AND fix the env/localStorage key inconsistency — call
Anthropic/Google directly with the **founder's stored key**.

**Tasks (TDD where logic is JS):**
- Tauri HTTP (JS `@tauri-apps/plugin-http`, or a Rust `#[tauri::command]`) that takes
  provider/model/messages/key and calls the provider API, returning the same shape `/api/ai`
  returns (so `llm.ts` is provider-agnostic).
- Implement the `native` branch of `ai-transport.ts` to read the stored key and call the bridge.
- Preserve full error/rescue mapping (401/429/timeout/malformed).

**Verify:** transport `native` path unit-tested with a mocked bridge; manual: a real key in the
desktop app returns a real completion. The seed scan + co-founder work in the desktop build.

**Exit:** Desktop app does real AI with the founder's own key, no server proxy.

**Rollback:** Transport falls back to web path.

## Step B3 — Native check-link / check-env equivalents  ·  model: default  ·  deps: B1

**Why:** The other two API routes (`check-link`, `check-env`) don't exist in static export.

**Tasks:** Replace with native HTTP (link check) and a native env/config read, behind the same
transport-style detection. Web keeps the routes.

**Verify:** features depending on these work in the desktop build; web unchanged.

**Exit:** No feature silently breaks in the desktop build.

**Rollback:** Desktop-only; web untouched.

## Step B4 — Tray, native notifications, global hotkey  ·  model: default  ·  deps: B1

**Why:** The always-on surface that makes a *proactive* co-founder possible.

**Tasks:** System tray icon + menu (show/quit); `@tauri-apps/plugin-notification`; a global
hotkey to summon the co-founder dock. Run the app to tray on close (configurable).

**Verify:** manual on the dev OS: tray present, a test notification fires, hotkey opens the dock.

**Exit:** The shell can reach the founder outside the window.

**Rollback:** Desktop-only feature flags.

## Step B5 — Proactive signals → native notifications  ·  model: default  ·  deps: A4, B4

**Why:** The payoff — the co-founder pings the founder even when the window is closed.

**Tasks:** A lightweight JS interval runs `detectSignals()` periodically; new high-severity nudges
fire a native notification; clicking it opens the dock to that nudge. Respect snooze/quiet-hours;
never duplicate a notification (reuse the dedup store from A4).
**CRITICAL:** a webview JS interval only runs while the webview is alive. This step **depends on
B4's hide-to-tray** (window closes to tray, webview stays running) — do NOT `quit` on close. If a
truly-quit background scan is wanted later, that needs a Rust-side scheduler + a file-mirrored copy
of the signal data (localStorage isn't readable from Rust) → defer to TODOS.md.

**Verify:** manual: seed real data that trips a rule → notification fires once; clicking focuses
the app on the nudge. Unit-test the scheduler's "should-notify" decision logic. 80%+ on new logic.

**Exit:** Closed-window proactive co-founder works.

**Rollback:** Desktop notification flag off.

## Step B6 — Cross-platform build + packaging  ·  model: default  ·  deps: B1–B4

**Why:** Distributable installers for Windows, macOS, Linux.

**Tasks:** Configure the Tauri bundler (`.msi`/`.exe`, `.dmg`/`.app`, `.deb`/`.AppImage`); a CI
workflow (GitHub Actions matrix) that builds all three on tag. Document code-signing as a
follow-up (notarization/cert acquisition is out of scope here → TODOS.md).

**Verify:** CI produces artifacts for all three OSes; the Linux build installs and runs locally.

**Exit:** Tagged releases yield cross-platform installers.

**Rollback:** Release pipeline only; no app behavior risk.

---

# EPIC C — Integration

## Step C1 — End-to-end co-founder + desktop  ·  model: default  ·  deps: A5, B5

**Tasks:** E2E smoke (Playwright on web; manual script for desktop): onboard → seed → ask the
co-founder → trip a signal → receive a nudge (in-app on web, native notification on desktop) →
one-click action lands in the right module. Update README + IMPLEMENTATION_PLAN.

**Verify:** the full journey passes on web; documented manual pass on one desktop OS.

**Exit:** Shippable proactive desktop co-founder.

---

## Dependency graph & parallelism

```
 Step 0 ─┬─▶ A1 ─┬─▶ A2 ─▶ A3 ─┐
         │       └─▶ A4 ───────┼─▶ A5 ─────────────┐
         │                     │                    ├─▶ C1
         └─▶ B0 ─▶ B1 ─┬─▶ B2  │   (A4)──┐          │
                       ├─▶ B3  │         ├─▶ B5 ────┘
                       └─▶ B4 ─┴─────────┘
                       B1–B4 ─▶ B6
```

- **Parallel tracks after Step 0:** EPIC A (A1…) and EPIC B foundation (B0→B1) run in parallel —
  different files, no shared output. A team/multi-session can split here.
- **Join points:** B5 needs A4 (signals) + B4 (notifications). C1 needs A5 + B5.
- **Strongest-model steps:** A1, A2, A4, B0, B2 (design / LLM / architecture). Rest: default.

## Invariants (verify after every step)
1. `npm test` green; coverage ≥ 80% on all new files.
2. `npm run build` (web) passes — desktop work never breaks the web build.
3. No mock data introduced; missing data → empty state, never fabricated.
4. New AI codepaths have full error/rescue (no-key / 401 / 429 / timeout / malformed).
5. New user-facing surfaces are feature-flagged (`coFounder`, desktop flags).

## Out of scope (→ TODOS.md)
Code-signing / notarization, auto-update (Tauri updater), multi-founder/team sync, voice, mobile,
streaming token-by-token chat (can be a later polish), the pre-existing generator `useMock`
fallbacks.

## Risks
- **Tauri + Next static export:** App Router static export has edge cases; B0 de-risks by proving
  export compatibility before any Rust. If a feature can't static-export, that surfaces in B0, not B6.
- **Rust toolchain** is a new prerequisite for desktop builds — document clearly; web devs unaffected.
- **Provider CORS/keys in native context:** validated in B2 with a real key before building further.
- **Context window growth:** A1's bounded prompt prevents the co-founder context from ballooning
  as module data grows.
