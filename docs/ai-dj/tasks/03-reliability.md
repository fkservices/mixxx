# 03-reliability

> Autonomously AI-generated planning cards. No implementation claimed.

[Worker rules](../WORKER-TASKS.md) · [Catalog](README.md)

## R01: Freeze the extended wire framing

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F08, F09. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/contracts/wire.md`

**Scope:** Frame bytes, not full protocol implementation.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Choose development identifier, version/opcodes, session/sequence widths, payload lengths, numeric/string packing and checksum.
2. Bound frame/reassembly size and timeout; publish golden frames and errors.

**Validate:**

1. Manually round-trip one numeric and one UTF-8 frame including high bits.
2. Check malformed, truncated and unknown opcodes have finite rejection paths without eval.

**Evidence:** `docs/ai-dj/work/evidence/R01.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R02: Freeze lifecycle and snapshot semantics

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R01, F07. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/contracts/lifecycle.md`

**Scope:** State machine contract only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Define HELLO/capabilities, snapshot revision/delta ordering, accepted vs observed results and mode/track/ownership epochs.
2. Define already-satisfied requests, duplicate/session reset, cancellation, heartbeat and non-replay rules.

**Validate:**

1. Walk a race where state changes during snapshot, a late result after manual load, and unchanged setter.
2. Ensure ordinary MIDI does not pretend to support request correlation or author identity.

**Evidence:** `docs/ai-dj/work/evidence/R02.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R03: Implement SysEx packing and encoding

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R01, F03. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/midi/sysex-encode.ts`, `ai-dj/test/midi/sysex-encode.test.ts`

**Scope:** Encoder for frozen frame format.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Encode bounded values and UTF-8 using 7-bit-safe framing.
2. Check lengths/checksum and reject invalid numeric ranges before send.

**Validate:**

1. Match all contract golden frames byte-for-byte.
2. Test Unicode boundary, largest frame and payload exceeding limit.

**Evidence:** `docs/ai-dj/work/evidence/R03.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R04: Implement bounded SysEx parsing

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R03. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/midi/sysex-decode.ts`, `ai-dj/test/midi/sysex-decode.test.ts`

**Scope:** Frame parser and fragment reassembly only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Parse frames with bounded buffers and deadlines, resetting incomplete frames.
2. Reject unknown versions, checksum errors and invalid string packing.

**Validate:**

1. Run truncated, interleaved, malformed and over-limit sequences.
2. Verify repeated garbage cannot allocate unbounded memory or execute a command.

**Evidence:** `docs/ai-dj/work/evidence/R04.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R05: Implement the Mixxx wire endpoint

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R04, M05, R02. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/hosts/mixxx/fragments/wire.js`, `ai-dj/test/host/wire.test.ts`

**Scope:** Host decoder/encoder wrapper only; semantic handlers separate.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Apply frozen wire framing to Mixxx script entry and output functions.
2. Dispatch only allowlisted handler IDs with validated payloads.

**Validate:**

1. Run shared golden frames through host and Node codecs.
2. Confirm invalid data never reaches a control setter.

**Evidence:** `docs/ai-dj/work/evidence/R05.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R06: Negotiate session and capabilities

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R05, R02, I23. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/handshake.ts`, `ai-dj/hosts/mixxx/fragments/handshake.js`, `ai-dj/test/integration/handshake.test.ts`

**Scope:** HELLO/capabilities round-trip only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Negotiate profile, active instances, payload bounds and session ID.
2. Reject incompatible versions and stale sessions; keep automation disarmed.

**Validate:**

1. Test missing features, old session and changed instance counts.
2. Require confirmed session before actions; absent capabilities stay unavailable.

**Evidence:** `docs/ai-dj/work/evidence/R06.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R07: Produce host snapshots and deltas

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R06. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/hosts/mixxx/fragments/snapshot.js`, `ai-dj/test/host/snapshot.test.ts`

**Scope:** Revisioned host state output.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Emit begin/items/end and change deltas with a consistent revision rule.
2. Bound each page and subscription set; distinguish unavailable values.

**Validate:**

1. Change a control during a snapshot and verify the contract ordering.
2. Test shutdown and missing controls without fabricated state.

**Evidence:** `docs/ai-dj/work/evidence/R07.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R08: Reconcile observed state snapshots

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R07. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/state-store.ts`, `ai-dj/test/execution/state-store.test.ts`

**Scope:** Snapshot consumer only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Buffer/version deltas until a snapshot completes.
2. Track freshness and unknown values separately from requested state.

**Validate:**

1. Test late snapshot item, duplicate/out-of-order delta and incomplete snapshot timeout.
2. Ensure newest accepted state survives and incomplete state blocks consequential action.

**Evidence:** `docs/ai-dj/work/evidence/R08.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R09: Track accepted and observed outcomes

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R08. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/outcomes.ts`, `ai-dj/hosts/mixxx/fragments/outcomes.js`, `ai-dj/test/integration/outcomes.test.ts`

**Scope:** Request correlation and explicit observations.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Return ACCEPTED separately from RESULT/ERROR and read current state for unchanged setters.
2. Reconcile rejection, timeout and uncertain postconditions without optimistic success.

**Validate:**

1. Test already-satisfied, rejected and delayed setters.
2. A sent frame or accepted request alone must never complete an action.

**Evidence:** `docs/ai-dj/work/evidence/R09.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R10: Bound the queue and enforce deadlines

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R09. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/queue.ts`, `ai-dj/test/execution/queue.test.ts`

**Scope:** Queue priority and expiry only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Use monotonic deadlines; prioritize release/cancel/results over telemetry.
2. Coalesce appropriate continuous intents and discard expired musical actions.

**Validate:**

1. Test saturation with telemetry while cancellation remains timely.
2. Verify pause/resume never produces a burst of expired commands.

**Evidence:** `docs/ai-dj/work/evidence/R10.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R11: Deduplicate and constrain retries

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R10. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/retries.ts`, `ai-dj/hosts/mixxx/fragments/dedupe.js`, `ai-dj/test/integration/retries.test.ts`

**Scope:** Bounded session/sequence dedupe cache.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Reject duplicate trigger execution and expire dedupe state by session.
2. Retry desired-state setters only after context checks; classify ambiguous triggers.

**Validate:**

1. Replay load/cue/relative requests and require single execution.
2. Changed track/ownership/session makes old retry invalid.

**Evidence:** `docs/ai-dj/work/evidence/R11.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R12: Implement transport loss and heartbeat disarm

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R11. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/liveness.ts`, `ai-dj/hosts/mixxx/fragments/liveness.js`, `ai-dj/test/integration/liveness.test.ts`

**Scope:** Heartbeat state and disconnect behavior.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Disarm on missing heartbeat; release AI-owned momentary holds using host watchdog.
2. Reconnect with new handshake/snapshot and discard old actions; no automatic rearm.

**Validate:**

1. Test host loss, feedback loss and service restart.
2. Require proposed <1s lost-heartbeat disarm and no old transition replay; preserve playing audio.

**Evidence:** `docs/ai-dj/work/evidence/R12.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R13: Invalidate track and ownership generations

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R09. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/generations.ts`, `ai-dj/hosts/mixxx/fragments/generations.js`, `ai-dj/test/integration/generations.test.ts`

**Scope:** Generation checks only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Invalidate queued commands on track load or ownership change.
2. Have host reject superseded requests before applying controls.

**Validate:**

1. Race manual load against queued seek and stale result.
2. Confirm old track actions cannot affect new identity; cancellation alone is insufficient.

**Evidence:** `docs/ai-dj/work/evidence/R13.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R14: Implement hazardous-action policies

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R13, R10. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/policies.ts`, `ai-dj/test/execution/policies.test.ts`

**Scope:** Guards for active load, audible stop, gain and recording/broadcast.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Require fresh state and valid authorization/preconditions for consequential operations.
2. Bound gains and prevent simultaneous Mixxx AutoDJ/executor authority.

**Validate:**

1. Test stale state, audible-deck load, unarmed recording and AutoDJ conflict.
2. Normal bass adjustment does not trigger a global transport stop.

**Evidence:** `docs/ai-dj/work/evidence/R14.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R15: Define three modes and switching epochs

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R02. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/core/modes.ts`, `docs/ai-dj/work/contracts/modes.md`

**Scope:** AI Only, B2B, Playlist Only; contract only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Define AI Only, B2B and Playlist Only permissions plus mode epochs and separate explicit-disarm latch.
2. Already-armed AI Only/B2B switches continue after reconciliation; Playlist Only to performance selection requests start but cannot clear explicit disarm. Remember last mode; first launch B2B disarmed.

**Validate:**

1. Walk each mode with bass intervention and queued transition at switch time.
2. Playlist Only permits reads/explicit playlist save, never deck loading or performance writes.

**Evidence:** `docs/ai-dj/work/evidence/R15.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R16: Implement mode enforcement and direct disarm

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R15, R12, R14. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/modes.ts`, `ai-dj/hosts/mixxx/fragments/modes.js`, `ai-dj/test/integration/modes.test.ts`

**Scope:** Enforcement independent of planner/UI.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Enforce mode permissions and reject old-epoch commands at executor and host.
2. Add direct disarm/resume endpoint; persisted preference never restores armed state.

**Validate:**

1. Assert zero performance commands in Playlist Only.
2. Switch modes with pending curves and stalled planner; disarm wins over AI Only and debounce.

**Evidence:** `docs/ai-dj/work/evidence/R16.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R17: Define per-control handover and dependency groups

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R15, R13. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/contracts/handover.md`

**Scope:** B2B authority contract plus AI Only recovery.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Define control-group dependencies, ownership invalidation and touch/intent capability flags.
2. Specify 3-second configurable quiet plus current-transition hold, later-transition eligibility, pinned/paused transport holds and AI Only bounded recovery.

**Validate:**

1. Walk bass-only, fader, scratch and manual track load scenarios.
2. Mark source/touch ambiguity; silence alone cannot prove no physical contact.

**Evidence:** `docs/ai-dj/work/evidence/R17.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R18: Implement B2B scoped holds and debounce

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R17, R16. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/handover.ts`, `ai-dj/test/execution/handover.test.ts`

**Scope:** Hold state machine, no planner integration.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Yield affected controls immediately and reset activity timer on relevant raw intent or observations.
2. Default quiet 3 seconds, configurable; hold through current transition. Reclaim only at a later real transition start after release, quiet and fresh state; never relabel an abandoned curve to bypass the hold.

**Validate:**

1. Quiet expiry during current transition sends no resumed write.
2. If held at next transition start, retain hold through that transition; test explicit touch, inferred inactivity and pinned holds.

**Evidence:** `docs/ai-dj/work/evidence/R18.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R19: Replan smoothly after human intervention

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R18. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/recovery.ts`, `ai-dj/test/execution/recovery.test.ts`

**Scope:** New bounded action from observed value.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Replan from actual user values at the next eligible transition, retaining mode/ownership generations.
2. Keep unaffected controls active; manual load/seek invalidates dependencies and replans from new identity/position. AI Only promptly recovers ordinary knobs through bounded curves.

**Validate:**

1. Ensure old bass target cannot snap back after quiet expiry.
2. Stalled planner leaves human value unchanged; generation/mode mismatches reject new action.

**Evidence:** `docs/ai-dj/work/evidence/R19.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R20: Implement paired 14-bit continuous controls

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R04, F09. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/midi/cc14.ts`, `ai-dj/test/midi/cc14.test.ts`

**Scope:** One explicit pair profile; no NRPN/MIDI2 expansion.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Serialize pair emission and decode pairs with bounded timeout.
2. Freeze scaling and pair interleaving policy for gain/tempo.

**Validate:**

1. Test endpoints, missing half, reverse/interleaved arrivals and timeout reset.
2. Compare reconstruction error against 7-bit behavior without claiming all hardware supports it.

**Evidence:** `docs/ai-dj/work/evidence/R20.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R21: Integrate accepted reliability fragments

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R06, R08, R09, R11, R12, R13, R14, R16, R19, R20, M10, M11. **Leases:** app-entry, mapping-entry. **Status:** planned.

**Owns:** `ai-dj/main.ts`, `res/controllers/AI-DJ-scripts.js`

**Scope:** At most two accepted fragments per INTEGRATE child; close when all listed fragments integrated.

**Prerequisites:** All integration children accepted; if more than two fragments remain, split before dispatch.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Use INTEGRATE children to wire fragments to frozen interfaces on one branch.
2. Keep manifest of exact integrated revisions and run focused cross-module tests.

**Validate:**

1. Require parser, session, outcome, mode and handover checks on same revision.
2. No unreviewed contract changes or concurrent entrypoint writers.

**Evidence:** `docs/ai-dj/work/evidence/R21.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R22: Prove failure recovery in actual Mixxx

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R21, M20. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/R22.json`

**Scope:** One five-case runtime script, at most eight minutes.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Exercise unchanged setter, rejected action, cue release/disconnect, stale load and restart.
2. Capture MIDI, actual state/UI and playing audio continuity.

**Validate:**

1. Require no stuck AI cue and no replay after restart.
2. Confirm stale actions remain blocked and disarm meets measured target.

**Evidence:** `docs/ai-dj/work/evidence/R22.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R23: Prove three modes with a physical controller

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R22, O04, R25. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/R23.json`

**Scope:** One physical device profile; mode switch and bass gesture cases.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Actual physical controller available; capture/manual-intent path verified.

**Perform:**

1. Run AI Only smooth recovery, B2B hold through current transition and conditional later-transition reclaim, plus Playlist Only zero-output cases.
2. Test global disarm and mode switch with a pending curve.

**Validate:**

1. Require real controller+Mixxx UI+state agree and no MIDI echo.
2. Measure B2B cancellation against DEFAULTS p95 <=20 ms / p99 <=50 ms; label clock and touch-inference limitations.

**Evidence:** `docs/ai-dj/work/evidence/R23.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R24: Accept or hold milestone 2

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R23. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/gates/M2.md`

**Scope:** Bounded reliability evidence review.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Audit lifecycle, physical coexistence, modes and observed-state failure reports.
2. Enumerate any missing HC-01..HC-12 proof as blocking follow-up cards.

**Validate:**

1. Require each reliability module and integration child accepted.
2. Do not substitute fake-controller tests for actual physical-controller evidence.

**Evidence:** `docs/ai-dj/work/evidence/R24.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R25: Implement latched manual transport holds

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R18. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/execution/transport-holds.ts`, `ai-dj/test/execution/transport-holds.test.ts`

**Scope:** One deck Pause/Stop and explicit hold release.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Latch manual Pause/Stop in B2B and cancel play/cue/load dependencies.
2. Human playback or explicit deck release allows fresh reconciliation; independent other-deck work can continue.

**Validate:**

1. Quiet and transition expiry cannot resume stopped deck.
2. Test manual play, pin release, mode change, disarm and stale queued load.

**Evidence:** `docs/ai-dj/work/evidence/R25.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## R26: Verify controller profile and pickup behavior

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** R23. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/R26.json`

**Scope:** One actual device/mapping, at most five controls.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Identify real controller model and mapping; check raw intent, unchanged values and touch support.
2. Exercise knob mismatch and supported soft takeover, assign Disarm button without double-routing.

**Validate:**

1. Record unsupported touch/pickup honestly; no guessed Hercules model.
2. Demonstrate bass hold, controller disconnect and keyboard/MIDI disarm while planner is stalled.

**Evidence:** `docs/ai-dj/work/evidence/R26.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

> End of autonomously AI-generated planning cards.
