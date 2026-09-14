# 07-observability

> Autonomously AI-generated planning cards. Task specifications with recorded execution status; completion requires acceptance evidence.

[Worker rules](../WORKER-TASKS.md) · [Catalog](README.md)

## O01: Freeze session event schema and clock rules

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F12, R15, P01. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `ai-dj/core/session.ts`, `docs/ai-dj/work/contracts/session.md`

**Scope:** Event envelope, causal IDs and snapshots.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Define raw input/output, semantic action, AI intent, actual observation, source/device/epoch, track occurrence and mode/ownership events.
2. Specify clock domains/calibration, gaps, journal chunks and versioned JSON export.

**Validate:**

1. Walk volume-up and relative jog-backward including raw bytes and declared mapping profile.
2. Distinguish input intent from command result and unknown author; no duplicate-action count.

**Evidence:** `docs/ai-dj/work/evidence/O01.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O02: Specify raw physical MIDI capture hook

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O01, M05. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `docs/ai-dj/work/operations/midi-capture.md`

**Scope:** One host dispatch observation design; no presumed OS multi-client tap.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Find input dispatch before mapping/filtering and exact output device context through graph+source.
2. Specify bounded raw capture with device/source and timestamps; allocate OP children for hook and feedback transport.

**Validate:**

1. Verify design includes unmapped input and does not consume or reroute normal controller events.
2. If only mapped events are visible, scope is incomplete; specify required hook rather than claim all signals.

**Evidence:** `docs/ai-dj/work/evidence/O02.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O03: Capture AI outbound intent and wire events

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O01, R10. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/diagnostics/ai-events.ts`, `ai-dj/test/diagnostics/ai-events.test.ts`

**Scope:** Observation taps in the AI process.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Link plan/action IDs to queued, canceled and actually emitted bytes.
2. Capture send errors and outcomes separately; batch logging outside MIDI handler.

**Validate:**

1. Canceled commands have no sent event; failed sends are not applied actions.
2. Confirm raw bytes and correlation are preserved without blocking dispatch.

**Evidence:** `docs/ai-dj/work/evidence/O03.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O04: Verify physical capture and manual-intent channel

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O02, R05. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/O04.json`

**Scope:** One controller, mapped+unmapped events and touch if available.

**Prerequisites:** Raw capture OP children built/integrated, selected physical controller available; no fixture substitute for actual hardware.

**Evidence gates:** Actual device/model/mapping selected; required raw-capture OP children built and integrated.

**Perform:**

1. After OP capture children integrate, capture raw physical events before mapping and returned semantic intent.
2. Compare known emitted sequence/counts to recorder and actual Mixxx changes.

**Validate:**

1. Require no missing/unexplained events, no duplicate routing and device identity.
2. Test unchanged values/touch; report value-only limitations when hardware lacks touch.

**Evidence:** `docs/ai-dj/work/evidence/O04.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O05: Implement versioned semantic MIDI decoding

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O01, F09, R20. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `ai-dj/diagnostics/semantic.ts`, `ai-dj/test/diagnostics/semantic.test.ts`

**Scope:** Five initial controls plus explicit relative jog fixture.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Decode using device mapping/profile into control, direction, normalized value/delta and press/release.
2. Preserve unsupported raw events with unknown label; never infer meaning from channel number alone.

**Validate:**

1. Test bass/treble/volume labels, relative jog directions and 14-bit pairs.
2. Raw event IDs link to one semantic action without counting each representation twice.

**Evidence:** `docs/ai-dj/work/evidence/O05.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O06: Correlate host observations without false attribution

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O05, R09. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/diagnostics/correlation.ts`, `ai-dj/test/diagnostics/correlation.test.ts`

**Scope:** Causal link and source-confidence rules.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Link explicit request IDs and physical input IDs where evidence exists.
2. Keep mouse/keyboard/unknown host origin distinct when not instrumented.

**Validate:**

1. Race identical AI/user values and delayed host feedback.
2. Inferred temporal match cannot become certain user/AI attribution.

**Evidence:** `docs/ai-dj/work/evidence/O06.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O07: Implement bounded recoverable session journal

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O01, F03. **Leases:** Exact path reservation. **Status:** split.

**Owns:** `ai-dj/session/journal.ts`, `ai-dj/test/session/journal.test.ts`

**Scope:** Append-only recording with chunk/rotation manifest.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Persist raw/semantic events without routine coalescing via isolated buffered path with sequence checks and explicit gap counters.
2. Handle disk-full, partial last record and shutdown without blocking communicator.
3. Adopt provisional chunk/snapshot/page budgets in DEFAULTS; bound the queue and IPC independently and expose capture status/pause gaps.

**Validate:**

1. Recover complete records after interrupted append; mark truncated/gap regions.
2. Overload never silently drops records while reporting complete capture; no recorder-induced MIDI stall.

**Evidence:** `docs/ai-dj/work/evidence/O07.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O08: Implement session snapshots and track spans

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O07, D04, R16. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/session/project.ts`, `ai-dj/test/session/project.test.ts`

**Scope:** Deterministic projection from events to timeline state.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Build deck/occurrence spans, overlaps, curves and mode/ownership intervals with periodic snapshots.
2. Track loaded vs started vs actual routed playback and uncertainty across seeks/disconnect.

**Validate:**

1. Rebuild from beginning and from snapshot at same time; results agree.
2. Sum of overlapping track durations is not mislabeled session wall time.

**Evidence:** `docs/ai-dj/work/evidence/O08.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O09: Implement JSON export and historical import

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O08. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/session/exchange.ts`, `ai-dj/test/session/exchange.test.ts`

**Scope:** One versioned JSON exchange format.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Export session header, source playlist, events/snapshots, counts/gaps and artifact references.
2. Validate bounded historical input and reject unsupported versions/corruption safely.

**Validate:**

1. Round-trip example fixture plus truncated/oversized/missing-ref cases.
2. Import is read-only history; it has no route to resend MIDI or arm executor.

**Evidence:** `docs/ai-dj/work/evidence/O09.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O10: Implement indexed history queries

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O09. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/session/query.ts`, `ai-dj/test/session/query.test.ts`

**Scope:** Time/source/device/deck/control filters and bounded pages.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Index chunk/snapshot ranges for live and historical reads.
2. Return ordered filtered events with totals and gap indicators.

**Validate:**

1. Compare filtered results to known fixture without losing simultaneous events.
2. Long session query uses bounded pages and never loads all raw data into UI memory.

**Evidence:** `docs/ai-dj/work/evidence/O10.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O11: Verify end-to-end capture fidelity

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O03, O04, O06, O10, R23. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/O11.json`

**Scope:** Short mixed-source session including unmapped events.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Record AI curve, user bass/jog, mouse change, mode switch and intentional logger pressure.
2. Export JSON and compare emitted/received counts and source labels to fixture evidence.

**Validate:**

1. Require every raw event accounted for or explicit gap; host-only origin ambiguity visible.
2. Verify performance unchanged during logger pressure and history contains correct tracks/durations.

**Evidence:** `docs/ai-dj/work/evidence/O11.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

> End of autonomously AI-generated planning cards.
