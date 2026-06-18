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
