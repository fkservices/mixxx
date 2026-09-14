# 04-playlists

> Autonomously AI-generated planning cards. Task specifications with recorded execution status; completion requires acceptance evidence.

[Worker rules](../WORKER-TASKS.md) · [Catalog](README.md)

## P01: Define playlist occurrence and set contracts

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F07, R15. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `ai-dj/core/playlists.ts`, `ai-dj/core/sets.ts`, `docs/ai-dj/work/contracts/sets.md`

**Scope:** Types and invariants, no persistence yet.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Define playlist snapshot/version, distinct occurrence ID, library-scoped track identity, planned vs actual order and terminal outcomes.
2. Specify mode permissions, pins, duplicates, meaningful selected-section policy and source-change reconciliation.

**Validate:**

1. Check reordered A/B/A keeps three occurrences and exact multiset.
2. Loaded/pre-listened is not played; confirmed unavailable entries are skipped with reason and advance, while ambiguity/unknown outcomes require reconciliation.

**Evidence:** `docs/ai-dj/work/evidence/P01.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P02: Specify native ordered playlist read operations

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P01, I13. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/operations/playlist-read.md`

**Scope:** One paginated ordered-playlist service contract; implementation through OP tasks.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Locate ordered occurrence source via graph and exact source checks; avoid DISTINCT getTrackIds as playlist reader.
2. Define browse/read pages with source revision, cursor, identity, duplicate/order preservation and bounded MIDI representation.

**Validate:**

1. Walk renamed, edited, empty and duplicate playlists; reject mixed revisions.
2. Name exact service symbols, owned files and focused host tests for each OP child before dispatch.

**Evidence:** `docs/ai-dj/work/evidence/P02.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P03: Specify stable load and metadata operations

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P01, I12, I14, R14. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/operations/track-load.md`

**Scope:** One load request/result contract; implementation through OP tasks.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Find existing host load service and identity/error observation; define allowlisted MIDI operation.
2. Define stale identity, missing file, load failure and active-deck guard results.

**Validate:**

1. Specify how actual loaded identity is confirmed independently of row focus/title.
2. Record exact source paths and required OP child tasks; no direct live-database writer.

**Evidence:** `docs/ai-dj/work/evidence/P03.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P04: Prepare host extension build recipe

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P02, P03, F01. **Leases:** host-build. **Status:** planned.

**Owns:** `docs/ai-dj/work/jobs/host-build.json`, `docs/ai-dj/work/host-build.md`

**Scope:** Inspect prerequisites and launch one build job; no waiting for full compile.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Use selected host build instructions and isolated build/profile directories.
2. Save exact source revision/configuration, persistent process handle and log; use JOB-OBSERVE/REVIEW for long work.

**Validate:**

1. Verify launched handle is alive or record terminal error.
2. Confirm no production profile overwrite and prerequisites/failing step are explicit.

**Evidence:** `docs/ai-dj/work/evidence/P04.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P05: Define a narrow host bridge integration boundary

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P04, R05. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/operations/bridge.md`

**Scope:** Design the service boundary and allocate OP children, no broad C++ feature.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Define request dispatch on appropriate host thread, bounded responses and control/UI notifications.
2. Allocate exact ownership for bridge registration and playlist/load operations with no audio-thread allocations/locks.

**Validate:**

1. Review lifetime/Qt ownership and shutdown safety with exact source evidence.
2. Split independently testable methods into individual OP-SPEC/BUILD/TEST tasks.

**Evidence:** `docs/ai-dj/work/evidence/P05.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P06: Implement native playlist page client

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P02, R04, P01. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/catalog/playlists.ts`, `ai-dj/test/catalog/playlists.test.ts`

**Scope:** Client consuming frozen paginated contract.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Fetch ordered playlist pages and preserve every occurrence including duplicate tracks.
2. Restart/discard snapshot on version mismatch; bound page and total-session limits visibly.

**Validate:**

1. Test A/B/A order, duplicate names, empty list and changed revision mid-page.
2. Do not infer track identity from title or current table row.

**Evidence:** `docs/ai-dj/work/evidence/P06.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P07: Implement early M3U8 import fallback

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P01, F08. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `ai-dj/catalog/m3u8.ts`, `ai-dj/test/catalog/m3u8.test.ts`

**Scope:** One playlist file format only; not the native integration release gate.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Parse local M3U8 with ordered occurrences, relative paths and bounded input.
2. Preserve duplicates and report missing/unresolvable files without silent filtering.

**Validate:**

1. Test Unicode, relative path, duplicate entry and malformed list.
2. Label imported provenance and require identity resolution before live loading.

**Evidence:** `docs/ai-dj/work/evidence/P07.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P08: Resolve playlist identities and preflight files

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P06, P07, P03. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/catalog/identity.ts`, `ai-dj/test/catalog/identity.test.ts`

**Scope:** Resolve one snapshot to stable host IDs.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Resolve explicit host IDs and file identity without guessing from titles.
2. Distinguish confirmed unavailable/unplayable from ambiguity or unknown load outcome. Automatically skip confirmed unavailable entries and move to next playable; preserve reason and source occurrence.

**Validate:**

1. Test duplicate title/different file and same file repeated occurrence.
2. No guessing, auto-substitution or silently dropping unavailable entries.

**Evidence:** `docs/ai-dj/work/evidence/P08.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P09: Implement durable set storage

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P01, F03. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `ai-dj/sets/store.ts`, `ai-dj/test/sets/store.test.ts`

**Scope:** Local versioned save/load with atomic update.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Persist immutable source snapshot and editable set revision separately.
2. Store planned and actual occurrence outcomes with interrupted/unknown states.

**Validate:**

1. Round-trip a reordered duplicate playlist and interrupted set.
2. Simulate interrupted write/version mismatch; source snapshot remains intact.

**Evidence:** `docs/ai-dj/work/evidence/P09.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P10: Implement remaining-set edits and pins

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P09. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `ai-dj/sets/edits.ts`, `ai-dj/test/sets/edits.test.ts`

**Scope:** Move/pin/remove/add in the remaining queue.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Apply version-checked edits and explicit skip/add decisions with audit trail.
2. Freeze active transition occurrences; schedule accepted edits into remaining plan.

**Validate:**

1. Test concurrent edit/replan, pinned order and active-deck selection.
2. Preserve original playlist and account for intentionally removed entries as user skips.

**Evidence:** `docs/ai-dj/work/evidence/P10.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P11: Validate complete planned occurrence coverage

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P10, F08. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `ai-dj/sets/validate-plan.ts`, `ai-dj/test/sets/validate-plan.test.ts`

**Scope:** Plan integrity and duration constraints only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Require exact occurrence multiset and valid IDs/pins; reject omissions and extra repeats.
2. Reject duration goals that require silent song drops or unapproved abbreviated snippets.

**Validate:**

1. Validate required original occurrences, explicit skips and confirmed-unavailable exceptions separately; never silently drop a playable song.
2. Allow correctly labeled free-pool or manual additions; impossible duration/all-song constraints require a visible user resolution.

**Evidence:** `docs/ai-dj/work/evidence/P11.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P12: Implement load request client and outcome reconciliation

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P03, R09, P08. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/catalog/load.ts`, `ai-dj/test/catalog/load.test.ts`

**Scope:** Stable-ID load client only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Send guarded load and reconcile completion/error by actual identity and track generation.
2. Discard late outcomes for different deck/track/mode epoch.

**Validate:**

1. Test delayed/missing/wrong-track outcomes and manual load race.
2. Never equate ACCEPTED or matching title with confirmed loaded identity.

**Evidence:** `docs/ai-dj/work/evidence/P12.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P13: Verify native playlist and load in Mixxx

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P05, P06, P08, P12, R24. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/P13.json`

**Scope:** One small A/B/A playlist and one failed file load.

**Prerequisites:** Playlist-read, bridge and load OP children built/tested/integrated; terminal host build accepted via JOB-REVIEW.

**Evidence gates:** Ordered playlist, bridge and load OP children integrated; terminal host build review accepted.

**Perform:**

1. After required OP children integrate, import native ordered occurrences and load by stable ID with changed UI focus.
2. Capture actual loaded track, waveform/UI and returned identity.

**Validate:**

1. Compare native playlist order/duplicates and preflight issues exactly.
2. Require no active-deck replacement and no false success for failed file.

**Evidence:** `docs/ai-dj/work/evidence/P13.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P14: Specify save-new-playlist service operation

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P10, P05, I21. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/operations/playlist-save.md`

**Scope:** New named playlist save; preserve source.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Define host service-backed creation with ordered occurrences, idempotency key and returned playlist identity.
2. Handle naming conflicts/locked source and operation result without arbitrary database edits.

**Validate:**

1. Verify source cannot be overwritten by default.
2. Allocate one OP chain for implementation and round-trip test before declaring ready.

**Evidence:** `docs/ai-dj/work/evidence/P14.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P15: Implement save-new-playlist client

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P14, R09. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/sets/export-mixxx.ts`, `ai-dj/test/sets/export-mixxx.test.ts`

**Scope:** Explicitly requested library save only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Send validated set occurrence order with request identity and revision.
2. Handle confirmed result vs uncertain completion without blindly creating duplicates.

**Validate:**

1. Test lost result, retry reconciliation and name conflict.
2. Check Playlist Only allows explicit save but not deck/performance operations.

**Evidence:** `docs/ai-dj/work/evidence/P15.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P16: Verify saved set and native playlist round-trip

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P15, P13. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/P16.json`

**Scope:** One saved set re-open and host read-back.

**Prerequisites:** Playlist-save OP children and host build result accepted.

**Evidence gates:** Save-new-playlist OP children integrated and host build reviewed.

**Perform:**

1. Save new Mixxx playlist from arranged duplicate-containing set and re-read native contents.
2. Restart local app and restore local saved set while disarmed.

**Validate:**

1. Require exact occurrence order, source unchanged and no duplicate save on retry.
2. Local and native revisions/identity references remain explicit.

**Evidence:** `docs/ai-dj/work/evidence/P16.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P17: Reconcile resumed and manually changed sets

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P09, P12, R19, R25. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/sets/reconcile.ts`, `ai-dj/test/sets/reconcile.test.ts`

**Scope:** Resume and manual-load set accounting.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Reconcile actual identity/playhead and played/interrupted occurrences after manual loads or restart.
2. In B2B respect new music; retain displaced occurrence for later unless explicitly skipped, retaining partial spans. Restart remains disarmed and never replays history.

**Validate:**

1. Crash between load/start/completion and test no replay.
2. Manual external track never silently marks the intended playlist occurrence played.

**Evidence:** `docs/ai-dj/work/evidence/P17.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P18: Accept native playlist and set management

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P11, P13, P16, P17. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/gates/playlist.md`

**Scope:** Evidence review only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Check native access, duplicates, identity/load, edits, save/read-back and recovery.
2. Trace PLAYLIST-SETS requirements to artifact IDs and open small fixes.

**Validate:**

1. Require native Mixxx import, not only M3U8 parser proof.
2. No missing entries or unresolved states disguised as completed performance.

**Evidence:** `docs/ai-dj/work/evidence/P18.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

> End of autonomously AI-generated planning cards.
