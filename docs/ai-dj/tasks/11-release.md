# 11-release

> Autonomously AI-generated planning cards. No implementation claimed.

[Worker rules](../WORKER-TASKS.md) · [Catalog](README.md)

## L01: Implement persistent desktop launcher

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U02, R21. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/desktop/launch.ts`, `ai-dj/test/desktop/launch.test.ts`

**Scope:** One local Mac startup lifecycle.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Start one communicator service and open UI; preserve performance when tab closes.
2. Detect already-running service, explicit shutdown and stale pid without duplicate MIDI clients.

**Validate:**

1. Restart remains disarmed; closing browser leaves service alive.
2. Startup failure is shown and partial resources close.

**Evidence:** `docs/ai-dj/work/evidence/L01.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## L02: Enforce local API access boundary

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U01, L01. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/desktop/access.ts`, `ai-dj/test/desktop/access.test.ts`

**Scope:** Loopback origin/session checks only.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Bind local API to loopback, issue per-run session credential and check allowed origins.
2. Separate read-only history API from live performance authority.

**Validate:**

1. Reject foreign-origin writes, invalid sessions and malformed oversized input.
2. History requests cannot arm or send MIDI.

**Evidence:** `docs/ai-dj/work/evidence/L02.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## L03: Prepare Mac packaging recipe

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** L02, F05. **Leases:** package-manifest. **Status:** planned.

**Owns:** `docs/ai-dj/work/packaging.md`, `ai-dj/desktop/package.ts`

**Scope:** One reproducible local package recipe; installs via JOB workflow.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Package pinned Node/native runtime, service, UI and mapping assets with version manifest.
2. Produce install/uninstall steps and user-owned Mixxx profile setup; no production overwrite.

**Validate:**

1. Verify artifact contents and native binary architecture.
2. Signing/distribution requirements recorded as future evidence if unavailable; do not claim a notarized installer.

**Evidence:** `docs/ai-dj/work/evidence/L03.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## L04: Write operator setup and recovery guide

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** L03, U12, U11. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/OPERATOR.md`

**Scope:** Local setup, three modes, recording and recovery only.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Document launch/ports/mapping, set start, B2B holds, Disarm, replay viewer and export.
2. Include missing tracks, stale state, controller loss, low disk and clean shutdown.

**Validate:**

1. Walk steps against packaged setup and actual UI labels.
2. No undocumented cloud/Pi dependency or unverified device compatibility.

**Evidence:** `docs/ai-dj/work/evidence/L04.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## L05: Verify clean local desktop setup

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** L04, U08, U09, U10, U11, U12, P24. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/L05.json`

**Scope:** One isolated clean profile and short set.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Install/launch from artifact, choose native playlist, edit/save and perform short set.
2. Close/reopen UI, load history and recover from one disconnect.

**Validate:**

1. Actual Mixxx controls/audio and history match; no stale replay.
2. Reproduce guide from clean state and record exact artifact/revision.

**Evidence:** `docs/ai-dj/work/evidence/L05.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## L06: Specify endurance and whole-set test matrix

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** L05, A14, C02, O14, O15. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/contracts/endurance.md`

**Scope:** Test recipe only; long runs are durable jobs.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Define full-set 10-minute experience, >=30-minute uninterrupted soak and 6-hour/250-occurrence envelope tests.
2. Include controller gestures, mode switches, bounded dense raw traffic, real inference, gaps and input failures, with fixed expected outcomes.

**Validate:**

1. No two 15-minute runs replace continuous 30-minute proof.
2. Define actual-output recording, CPU/audio counters, latency distributions and accounting/retention checks.

**Evidence:** `docs/ai-dj/work/evidence/L06.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## L07: Launch uninterrupted controller soak

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** L06. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/jobs/soak.json`

**Scope:** Launch one >=30-minute real Mixxx session; no wait through entire run.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Acquire runtime lease and launch recipe with durable event/audio outputs and job handle.
2. Arrange required human gestures or recorded actual-device fixture and independent stop/disarm access.

**Validate:**

1. Confirm running handle/recorders and exact revision/profile.
2. Record scheduled end and next observer; launch is not a pass.

**Evidence:** `docs/ai-dj/work/evidence/L07.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## L08: Review uninterrupted soak evidence

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** L07. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/gates/soak.md`

**Scope:** One terminal job review, using bounded summary and flagged excerpts.

**Prerequisites:** L07 job terminal with all JOB observer/review children recorded.

**Perform:**

1. Collect same job through JOB observers then compare timing/audio/ownership/accounting to recipe.
2. Expand long evidence review via JOB-REVIEW pages if needed.

**Validate:**

1. Require continuous >=30 minutes, no unexplained raw gaps or added overloads attributable to controller.
2. Failed/interrupted job is not certified and must not be silently substituted.

**Evidence:** `docs/ai-dj/work/evidence/L08.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## L09: Launch six-hour full-set capacity run

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** L08. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/jobs/endurance.json`

**Scope:** One real 6-hour job; maximum 250 occurrences within chosen feasible duration.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Launch frozen recipe on actual Mixxx with bounded journal/UI queries and local analysis/inference load.
2. Keep runtime lease on job and register observers; exercise planned failure/recovery cases without hiding interruptions.

**Validate:**

1. Verify correct job handle, recording and end conditions.
2. Fake-host load test supplements but never replaces actual host/audio full-set proof.

**Evidence:** `docs/ai-dj/work/evidence/L09.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## L10: Review capacity and full-set accounting

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** L09. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/gates/endurance.md`

**Scope:** One terminal endurance summary plus bounded flagged windows.

**Prerequisites:** L09 terminal and all review pages collected; human evaluation is separate.

**Perform:**

1. Reconcile all required occurrences, final audio, memory/disk growth, raw counts/gaps and UI query timing.
2. Compare with DEFAULTS budgets and verify export/history after long run.

**Validate:**

1. No truncation, false completed songs or silent gaps.
2. Record actual tested envelope and any unresolved gate; use review continuations for remaining excerpts.

**Evidence:** `docs/ai-dj/work/evidence/L10.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## L11: Collect final human listening acceptance

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** L10, A14. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/gates/listening.md`

**Scope:** Prepare/review one bounded listening packet, not six hours of listening in 25 minutes.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Link full recordings, representative blind comparisons and timestamped automated flags.
2. Collect explicit human ratings and findings via separate listening sessions; no model self-certification.

**Validate:**

1. Require proposed >=4/5 enjoyment/naturalness and no severe unintended clashes on accepted sets.
2. Missing human response remains pending; expand review packets and defect fixes as needed.

**Evidence:** `docs/ai-dj/work/evidence/L11.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## L12: Audit release evidence and operator handoff

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** L11, C02, L05, O11, R26. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/gates/release.md`

**Scope:** Final evidence index, not rerunning every test.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Check accepted integrated revision, all dynamic manifests and non-stale gate artifacts.
2. Reconcile GOALS/traceability, operator docs and capability denominator; state exact supported profile.

**Validate:**

1. All required tasks and children accepted or explicitly non-triggered with evidence; unresolved feature gaps prevent full release.
2. Distinguish planning completion from runtime release and obtain user direction for any actual publication.

**Evidence:** `docs/ai-dj/work/evidence/L12.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

> End of autonomously AI-generated planning cards.
