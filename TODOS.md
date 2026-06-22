# TODOS

Deferred work captured during the CEO plan review of the onboarding + auto-intelligence bundle
(2026-06-14). Each item is self-contained enough to pick up cold.

## P1 — build in this bundle

- [x] **Feature-flag auto-research.** Gate `seedAutoResearch()` behind a single constant/env flag
  so the background AI spend can be killed instantly in production without a redeploy.
- [x] **Split the working tree into focused commits** — cleanup / sidebar / SEO / onboarding,
  then the expansion on top. Clean history + selective revert.

## P2 — follow-up

- [ ] **`setupComplete` Supabase round-trip.** Today `setupComplete` lives in localStorage only,
  so a founder who onboards on a laptop, syncs, then opens on a phone **re-onboards from scratch**
  (and could double-fire the seed scan — the `seededAt` dedup guard mitigates the double-spend but
  not the repeated wizard). Fix: include `setupComplete`/`seededAt` in the `founder_brain` sync
  payload and skip onboarding if the cloud copy is complete. Start in `src/lib/supabase.ts`
  (`dbLoadBrain`) + `page.tsx` gate. Effort: M.

- [ ] **Onboarding funnel analytics.** No visibility into where founders drop off in the wizard.
  Emit a step-view + completion event (Vercel Analytics ID already wired in `env.ts`).
  Effort: S.

## P3 — hygiene

- [ ] **Root-cause the recurring sample-data seeder smell.** Three consecutive change sets have
  *deleted* `SAMPLE_*` / `initializeSample*` seeders. They keep getting re-added when new modules
  are scaffolded. Add a lint rule or a documented convention (empty states, never seeded mock data —
  see the "No Mock Data" principle) so the pattern stops recurring. Effort: S.

## Morning Briefing follow-ups (from eng-review of #29, 2026-06-20)

- [ ] **v2 — autonomous market delta in the brief.** v1 now ships an LLM-NARRATED brief (the
  narrative moved into v1 via `complete()`/`postToAI` after the CEO review — it needs no web search
  and works on all providers). v2 adds the remaining "whoa": a market-watch section ("your competitor
  just raised"). **Where to start:** route the search through `postToAI` (`src/lib/ai-transport.ts`),
  NOT `/api/ai` directly (desktop static export has no API routes); gate the market section to
  provider=Claude + key present (web search is Claude-only via `web_search_20250305` — NVIDIA/Google
  omit it); export a single-query search helper (today `searchWithClaudeOneBatch` in
  `research-engine.ts:263` is private + Claude-only). Add a market-specific no-fabrication eval.
  **Depends on:** v1 narrated brief proving "founder opens the brief twice". Effort: M. P2.

- [ ] **QuickIntake (zero-OS onboarding for the brief).** A 3-5 field form (company, runway, MRR,
  top goal) that writes into the existing `founder-brain` / `burn-rate` / `goals` stores so a
  brand-new user gets a grounded brief without full onboarding. Deferred from v1 (the empty-state
  CTA covers solo dogfooding); needed when distributing to strangers. **Where to start:** reuse the
  existing stores (mirror `Onboarding.tsx` writes), do not fork a new data blob. Effort: S. P3.

> Note: the "Quit-state background signals" item below (Desktop follow-ups) is the same Rust-side
> truly-quit scheduler the brief's "works while you sleep" promise needs for full-quit overnight runs.
> v1 uses JS catch-up-on-wake instead.

## Design follow-ups (from design-review of #29, 2026-06-21)

- [ ] **Author DESIGN.md.** The design system currently lives only in components
  (`HomeCommand.tsx` dark palette, type scale, color semantics, spacing) — no written source
  of truth, so every design review and AI mockup has nothing to calibrate against. **Where to
  start:** run `/design-consultation`; extract tokens from `src/components/home/HomeCommand.tsx`
  + `src/components/ui/*` (neutral-900 surfaces, red/amber/emerald/blue semantics, font-black
  headers, mono uppercase labels, `max-w-4xl` container). Effort: S. P3.

## Security (from /cso audit, 2026-06-21) — fix BEFORE deploying the web build with server-side AI keys

> Desktop app is unaffected (static export strips API routes). These are web/Vercel-only.

- [ ] **[HIGH] SSRF in `/api/check-link`.** `route.ts:7` takes a full `?url=` param, validates only the
  http(s) prefix, then `fetch(url, {redirect:"follow"})` unauthenticated — a blind boolean SSRF oracle
  for internal hosts/ports. **Fix:** resolve the host and reject private/loopback/link-local ranges
  (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, ::1, fc00::/7) before fetch; set `redirect:"manual"`
  and re-validate any redirect target. Effort: S. P1.
- [ ] **[HIGH] Fail-open auth on `/api/ai`.** `route.ts:29` guards only `if (process.env.API_PROXY_SECRET)`
  — unset = open relay to the server's paid AI keys. And `/api/check-env` leaks `proxySecretConfigured`
  unauthenticated (tells an attacker the guard is off). **Fix:** fail CLOSED in production (reject all
  requests, or refuse to boot, when the secret is unset); remove `proxySecretConfigured` from the public
  `check-env` response. Effort: S. P1.
- [ ] **[MEDIUM] Pin third-party CI actions in `release.yml`.** `dtolnay/rust-toolchain@stable`,
  `swatinem/rust-cache@v2`, `tauri-apps/tauri-action@v0` are mutable refs sharing a job with the Apple
  code-signing secrets — a compromised tag could exfiltrate the signing identity. **Fix:** SHA-pin them.
  Effort: S. P2.
- [ ] **[track] Next.js advisories.** `npm audit` shows 2 high / 1 moderate on `next` (no fix available,
  mostly DoS/cache/middleware) + postcss moderate. Bump Next when a patched release ships. P3.

## Contributor DX (from /devex-review, 2026-06-21) — each < 30 min, big onboarding lift

> Run-it DX is solid (~7/10: strong README, clean scripts, ~3-5min to running). Contribute-it DX is thin (~3/10).

- [ ] **Pin the Node version.** No `.nvmrc` / `engines` field — a contributor on Node < 20 gets a cryptic
  Next 16 failure instead of "wrong Node." Add `.nvmrc` (`20`) + `"engines": { "node": ">=20" }` to
  package.json. Effort: S. P2.
- [ ] **Add CHANGELOG.md.** v0.1.0 shipped with installers but there's no record of what's in a release.
  `/ship` is supposed to maintain it — confirm why it's absent. Seed with the v0.1.0 entry. Effort: S. P2.
- [ ] **Add issue + PR templates.** `.github/ISSUE_TEMPLATE/` (bug + feature) and a PR template. README
  invites issues but gives contributors no funnel. Effort: S. P3.
- [ ] **Add CONTRIBUTING.md.** Point at the health stack (`tsc`, `eslint`, `vitest`), the no-mock-data rule,
  and the desktop `cargo tauri` gotcha. Effort: S. P3.
- [ ] **Add TESTING.md.** Test conventions (Vitest, the postToAI mock pattern) live only in test files.
  Effort: S. P3.
- (lint-in-CI is already tracked under the Security/health notes above.)

## Vision (EXPANSION items, deferred)

- [ ] **Resume onboarding where you left off.** Persist the current step so a mid-wizard refresh
  doesn't restart at welcome. Deferred: adds state-persistence that fights the lightweight
  skip-friendly flow; refresh-mid-onboarding is rare. Effort: S.
- [ ] **Confetti micro-celebration on "Launch my OS".** Small dopamine hit at the finish line.
  Effort: S.

## Desktop follow-ups (from Epic B)

- [~] **Code-signing & notarization.** Workflow wiring **done** — macOS signing env passthrough is
  in `release.yml` and activates when the `APPLE_*` secrets are added (see SIGNING.md). Remaining:
  **acquire the certs** (Apple Developer $99/yr; Windows via Azure Trusted Signing or a CA cert) and
  add the repo secrets. Effort: M (cert acquisition + verification). P2.
- [ ] **Auto-update.** Wire the Tauri updater plugin so shipped apps update themselves. Effort: M. P2.
- [ ] **Quit-state background signals.** B5's watcher needs the webview alive (close-to-tray). For a
  truly-quit background scan, move the scheduler Rust-side + mirror signal data to a file. Effort: L. P3.

## Sync gaps (surfaced by the ruthless-cut eng-review)

- [ ] **Cloud sync for Burn Rate + Deal Pipeline.** Both are kept core modules but write only to
  `localStorage` — `founder_brain`, `goals`, and `research_library` sync to Supabase, but
  `cbt_os_deals`, `cbt_os_expenses`, `cbt_os_revenue`, `cbt_os_burn_config` do not. A founder who
  switches devices loses their runway + pipeline data.
  **Where to start:** add these keys to `TABLE_TO_LOCALSTORAGE` in `src/lib/supabase.ts` (+ the
  `TableName` union), create the matching Supabase tables, and add `dbUpsert(...)` calls in
  `burn-rate.ts` / `deal-pipeline.ts` mutations (mirror how `goals.ts` and `research-storage.ts`
  already do it). **Why deferred:** separate concern from de-bloat; needs the DB tables provisioned.
  Effort: M. P2.
