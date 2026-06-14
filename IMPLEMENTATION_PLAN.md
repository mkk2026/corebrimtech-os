# Implementation Plan — Onboarding + Auto-Intelligence

Branch: `feat/onboarding-auto-intelligence` · Mode: EXPANSION · Reviewed 2026-06-14

## Goal

Turn first-run onboarding from a data-collection form into the moment the OS proves it has a
brain: capture identity, connect the AI key, and fire a background market/competitor scan so the
Command Center is already alive with **real** signal (no mock data) when the founder lands.

## Locked decisions (from review)

1. **Full auto-intelligence** — onboarding gains a "Connect your AI brain" step; on finish, an
   un-awaited `seedAutoResearch(brain)` reuses the existing `runCompetitorIntelligence` /
   `runResearch` generators to populate real reports.
2. **Command Center banner** is the single status/failure surface for the background scan
   (idle / researching / found N / failed+retry / needs-key).
3. **Fully optional onboarding** + an explicit "Skip for now" on the welcome step.
4. **Full 80% tests** on touched files (Vitest + React Testing Library).
5. **Feature flag** for auto-research + **4 focused commits** for the existing tree.
6. **Delights:** live "found N" count on the ready screen + streaming reveal in the banner +
   gentle nudge (via `FounderBrainNudge`) after Skip.

## Architecture

```
 page.tsx (mounted hydration gate → showOnboarding gate)
   ├─ Onboarding  → saveBrain() + saveStoredKey() → seedAutoResearch() [fire-and-forget]
   └─ Command Center + banner (subscribes to seed-scan store)

 lib/auto-research.ts  seedAutoResearch(brain)
   guard: no key → emit needs-key, return
   guard: seededAt set → no-op (dedup)
   guard: feature flag off → return
   guard: no company name → return
   drive runCompetitorIntelligence / runResearch generators
   → saveReport / addMarketGap (real data)
   → emit status events to banner store
```

## Error/rescue contract (all surfaced in the banner, 0 silent failures)

| Failure | Action | User sees |
|---|---|---|
| no API key | skip scan, set needs-key | "Add your AI key to unlock auto-research" |
| 401 / 429 / timeout / malformed JSON | catch, set failed(reason) | banner + Retry |
| empty / refusal | set found(0) | "No results yet" |
| `saveBrain` quota (DOMException) | catch in handleFinish | error toast |
| double-fire | `seededAt` dedup | transparent |

## Locked smaller fixes

- SSR flash → `mounted` hydration gate in `page.tsx`.
- Sidebar drawer → close `mobileOpen` on `lg` breakpoint resize.
- "Launch my OS" → disable button after first click.
- API key field → `type="password"`, `autoComplete="off"`, never logged.
- Batch localStorage writes from the streaming generators (not per-token).
- `auto-research.ts` ships with the data-flow ASCII diagram in its header comment.

## Build order

1. 4-commit split of existing tree (cleanup → sidebar → SEO → onboarding base).
2. Vitest + RTL harness.
3. `auto-research.ts` + feature flag (TDD).
4. Seed-scan banner store + UI (TDD).
5. AI-connect step + optional/skip + locked fixes.
6. Delights (live count, streaming reveal, nudge-after-skip).
7. 80% coverage on touched files; final verify.

## Out of scope (see TODOS.md)

`setupComplete` cloud round-trip, funnel analytics, seeder lint rule, resume-onboarding, confetti,
retroactive tests for the 40 legacy modules, multi-provider seed fallback.
