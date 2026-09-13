# 05-performance

> Autonomously AI-generated planning cards. No implementation claimed.

[Worker rules](../WORKER-TASKS.md) · [Catalog](README.md)

## D01: Define conservative transition templates

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P01, R14. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/contracts/transitions.md`

**Scope:** Two initial templates: phrase-aligned blend and conservative short fade.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Specify preconditions, musical body preservation, cue/sync actions, curves, deadlines and postconditions.
2. Define low-confidence/variable-tempo fallback and prevent competing AutoDJ ownership.

**Validate:**

1. Walk mismatched BPM/key, short intro, vocal overlap and bad grid scenarios.
2. Identify which inputs are inferred and which host observations confirm success.

**Evidence:** `docs/ai-dj/work/evidence/D01.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## D02: Implement deterministic transition state machine

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** D01, R21, P12. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/transition.ts`, `ai-dj/test/execution/transition.test.ts`

**Scope:** State transitions, not all musical policies.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Implement observe/select/prepare/identity/cue/start/blend/confirm/release with deadlines.
2. Cancel on track/mode/ownership changes and expose progress.

**Validate:**

1. Test failure/cancel at every state and delayed load.
2. No next state advances solely from sent bytes.

**Evidence:** `docs/ai-dj/work/evidence/D02.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## D03: Implement bounded parameter-curve executor

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** D01, R10, R19. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/curves.ts`, `ai-dj/test/execution/curves.test.ts`

**Scope:** One interpolation/scheduling implementation.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Schedule bounded slopes from observed values with monotonic deadlines.
2. Honor per-control holds and cancel old curves rather than catching up.

**Validate:**

1. Test pause, late dispatch, manual bass and mode epoch change.
2. Verify unrelated controls can continue while dependent curve is canceled.

**Evidence:** `docs/ai-dj/work/evidence/D03.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## D04: Implement playback occurrence accounting

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** D02, P17. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/sets/playback.ts`, `ai-dj/test/sets/playback.test.ts`

**Scope:** Track lifecycle and eligible musical exposure.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Distinguish loaded, started, in audible route, completed, interrupted and skipped.
2. Record playhead spans/loops/seeks and deck overlap; define meaningful selected-section eligibility from spec.

**Validate:**

1. Loading or prelistening alone never marks played.
2. Seek-back and duplicate occurrences retain distinct history; overlapping deck durations are not summed as wall time.

**Evidence:** `docs/ai-dj/work/evidence/D04.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## D05: Integrate deterministic full-set loop

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** D02, D03, D04, P18. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/set-runner.ts`, `ai-dj/test/integration/set-runner.test.ts`

**Scope:** Queue progression/end-of-set only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Advance across completed or explicitly resolved occurrences; skip confirmed unplayable entries with reasons and try next playable.
2. End only with correct occurrence accounting and final audio outcome. Unknown load outcome triggers reconciliation, not blind replay or false completion.

**Validate:**

1. Run fake-host three-occurrence A/B/A set and failure at middle occurrence.
2. No endless loop, track outside the selected music pool or manual additions or premature end of final song.

**Evidence:** `docs/ai-dj/work/evidence/D05.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## D06: Record one short real transition

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** D05, R24. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/D06.json`

**Scope:** One prepared pair and one conservative fallback pair; <=10min audio.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Capture MIDI/state/UI/audio for two accepted templates on actual Mixxx.
2. Include bass intervention in B2B and confirm new curve starts at manual value.

**Validate:**

1. Verify correct track IDs, host sync behavior and no level discontinuity.
2. Flag musical problems for human listening rather than treating logs as enjoyment proof.

**Evidence:** `docs/ai-dj/work/evidence/D06.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## D07: Review deterministic transition evidence

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** D06. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/gates/M3.md`

**Scope:** Review one short set plus playlist gate.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Compare actual events against template states and audible timing.
2. Request human review of the short recording and retain its timestamped findings.

**Validate:**

1. Require native playlist gate and actual transition proof.
2. If listening review is pending, gate remains pending rather than self-certified.

**Evidence:** `docs/ai-dj/work/evidence/D07.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

> End of autonomously AI-generated planning cards.
