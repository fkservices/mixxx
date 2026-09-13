# 01-local-midi

> Autonomously AI-generated planning cards. Task specifications with recorded execution status; completion requires acceptance evidence.

[Worker rules](../WORKER-TASKS.md) · [Catalog](README.md)

## M01: Implement transport port discovery

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F05, F07. **Leases:** midi-enumeration. **Status:** planned.

**Owns:** `ai-dj/midi/ports.ts`, `ai-dj/test/midi/ports.test.ts`

**Scope:** Enumerate and select exact endpoints.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Wrap binding enumeration behind a transport interface.
2. Resolve explicit configured names; reject missing or ambiguous selections.

**Validate:**

1. Test zero, duplicate and reordered ports with fake binding.
2. Enumerate real local ports once and record selected names without opening them.

**Evidence:** `docs/ai-dj/work/evidence/M01.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M02: Implement bidirectional port lifecycle

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M01, F11. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `ai-dj/midi/connection.ts`, `ai-dj/test/midi/connection.test.ts`

**Scope:** Open/close two routes with explicit filter configuration.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Open command output and feedback input; configure SysEx filter deliberately.
2. Close partially opened resources on errors and expose transport loss to caller.

**Validate:**

1. Test second-port failure and repeated close without leaked listeners.
2. Check a real two-port open/close and filtered SysEx reception using a tiny test frame.

**Evidence:** `docs/ai-dj/work/evidence/M02.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M03: Encode conventional command bytes

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F09, F08. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/midi/conventional-encode.ts`, `ai-dj/test/midi/conventional-encode.test.ts`

**Scope:** Only the five initial controls.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Convert validated actions to frozen profile bytes with explicit scaling.
2. Serialize momentary press/release and note-on-zero equivalents.

**Validate:**

1. Compare against contract golden vectors for both decks and range endpoints.
2. Reject unsupported controls and nonfinite values before any send.

**Evidence:** `docs/ai-dj/work/evidence/M03.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M04: Decode conventional feedback

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F09, F08. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/midi/conventional-decode.ts`, `ai-dj/test/midi/conventional-decode.test.ts`

**Scope:** Only feedback for five initial controls.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Parse only expected channel/address/value combinations into observations.
2. Attach monotonic receive times and uncertainty where conventional MIDI lacks correlation.

**Validate:**

1. Test irrelevant messages, wrong lengths, boundaries and release forms.
2. Verify feedback does not produce an outbound command or infer a request ID.

**Evidence:** `docs/ai-dj/work/evidence/M04.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M05: Create Mixxx mapping entry and test harness

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F09, F03, F11. **Leases:** mapping-entry, mixxx-runtime. **Status:** planned.

**Owns:** `res/controllers/AI-DJ.midi.xml`, `res/controllers/AI-DJ-scripts.js`, `ai-dj/test/host/harness.ts`

**Scope:** Initialization, shutdown and module loading only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Add mapping registration for the frozen conventional profile and a single deterministic script namespace.
2. Provide host API stubs to test later mapping fragments; define fragment assembly without competing entrypoint edits.

**Validate:**

1. Load mapping in isolated fixture and inspect script errors.
2. Initialize/shutdown twice with no lingering connections or timer handles.

**Evidence:** `docs/ai-dj/work/evidence/M05.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M06: Map play and deck volume

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M05. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/hosts/mixxx/fragments/play-volume.js`, `ai-dj/test/host/play-volume.test.ts`

**Scope:** Two simple controls on two decks.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Implement desired play state and normalized volume setters in the owned mapping fragment.
2. Handle unavailable controls through profile declarations, not a zero-valued read.

**Validate:**

1. Test both decks and volume endpoints against host stubs.
2. Verify duplicate play-set does not toggle or press cue; integrated live proof follows M12.

**Evidence:** `docs/ai-dj/work/evidence/M06.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M07: Map crossfader and momentary cue

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M05. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/hosts/mixxx/fragments/fader-cue.js`, `ai-dj/test/host/fader-cue.test.ts`

**Scope:** Crossfader and one cue action per deck.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Normalize crossfader without confusing raw -1..1 and parameter 0..1.
2. Implement paired cue press/release including Note On zero.

**Validate:**

1. Verify endpoints and midpoint against frozen contract.
2. Test both release forms and shutdown release in the harness; disconnect watchdog follows reliability tasks.

**Evidence:** `docs/ai-dj/work/evidence/M07.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M08: Map the chosen sync operation

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M05. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/hosts/mixxx/fragments/sync.js`, `ai-dj/test/host/sync.test.ts`

**Scope:** One explicit sync semantic from F09.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Implement chosen host sync operation and actual sync state observation.
2. Reject unsupported modes and avoid sending 0xF8 clock as a synchronization mechanism.

**Validate:**

1. Test command and observed mode semantics for both decks.
2. Check repeated requests and unavailable controls; retain timing uncertainty until live capture.

**Evidence:** `docs/ai-dj/work/evidence/M08.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M09: Subscribe and emit initial control feedback

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M05. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/hosts/mixxx/fragments/conventional-feedback.js`, `ai-dj/test/host/conventional-feedback.test.ts`

**Scope:** Five initial controls only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Subscribe to actual host changes and encode feedback on separate route.
2. Send an initial read for existing controls and dispose subscriptions at shutdown.

**Validate:**

1. Change controls in host harness and compare exact bytes to F09.
2. Verify no echo into command handler and no synthetic success from requested values.

**Evidence:** `docs/ai-dj/work/evidence/M09.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M10: Assemble the initial mapping fragments

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M06, M07, M08, M09. **Leases:** mapping-entry, mixxx-runtime. **Status:** planned.

**Owns:** `ai-dj/tools/build-mapping.ts`, `res/controllers/AI-DJ-scripts.js`

**Scope:** One deterministic bundle; fragments are already accepted.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Implement fixed-order fragment assembly into mapping script; preserve Mixxx-compatible JavaScript.
2. Register the compiled functions in existing mapping entry without changing their contracts.

**Validate:**

1. Compare reproducible bundle output and run host harness.
2. Load the bundle in fixture and require no script errors.

**Evidence:** `docs/ai-dj/work/evidence/M10.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M11: Wire a minimal local communicator CLI

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M02, M03, M04, F12, M10. **Leases:** app-entry. **Status:** planned.

**Owns:** `ai-dj/main.ts`, `ai-dj/local-ui/cli.ts`, `ai-dj/test/integration/conventional.test.ts`

**Scope:** CLI accepts only initial explicit controls; no AI.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Connect transport, codecs, observed store and diagnostics; default disarmed.
2. Provide explicit arm/disarm/status and bounded manual command dispatch independent of browser.

**Validate:**

1. Use fake transport to verify input->bytes->observation and disarmed rejection.
2. Close CLI client while service remains connected; verify state output marks stale feedback.

**Evidence:** `docs/ai-dj/work/evidence/M11.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M12: Prove play, volume and fader in actual Mixxx

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M10, M11, F11. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/M12.json`

**Scope:** Three simple controls, two decks, fixed small test sequence.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Capture MIDI, returned state and native UI while sending explicit play/volume/fader changes.
2. Record exact revision, profile and routes with observed before/after values.

**Validate:**

1. Require actual Mixxx widgets match host observations; sent-byte logs alone fail.
2. Set an already-satisfied play state and confirm no toggle; note correlation limitations.

**Evidence:** `docs/ai-dj/work/evidence/M12.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M13: Prove cue, sync and manual feedback

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M12. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/M13.json`

**Scope:** Cue/sync plus mouse changes for initial five controls.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Exercise cue press/release and selected sync behavior in actual host.
2. Change five controls using the mouse and capture feedback without sending new commands.

**Validate:**

1. Require no stuck cue, state/UI agreement and zero feedback echo loop.
2. Confirm sync uses host behavior and record any skin/version gaps.

**Evidence:** `docs/ai-dj/work/evidence/M13.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M14: Build a bounded timing capture harness

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M11, F12. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/diagnostics/timing.ts`, `ai-dj/test/diagnostics/timing.test.ts`

**Scope:** Capture and summaries, no live benchmark yet.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Record scheduled/actual dispatch, loopback RTT and command-to-observation samples separately.
2. Calculate p50/p95/p99/max, missed deadlines and dropped samples with named clock domains.

**Validate:**

1. Check known synthetic samples and monotonic-clock handling.
2. Confirm no RTT/2 one-way claim and no UI/audio latency inferred from MIDI data.

**Evidence:** `docs/ai-dj/work/evidence/M14.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M15: Capture idle MIDI timing

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M14, M13. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/M15.json`

**Scope:** At most eight minutes of fixed-rate idle sampling.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Run loopback calibration, then simple-control host confirmation sampling as distinct phases.
2. Record counts, route details, host profile, buffer sizes and dispatch variation.

**Validate:**

1. Check expected sample counts and classify missing feedback rather than discard it.
2. Preserve raw data and separate loopback RTT from command-to-observed-state.

**Evidence:** `docs/ai-dj/work/evidence/M15.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M16: Capture loaded MIDI timing

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M15. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/M16.json`

**Scope:** Same at-most-eight-minute sequence with controlled separate-process CPU load.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Run the identical stimulus while a documented local synthetic analysis load executes separately.
2. Record process CPU/memory, event-loop delay and overload counters; stop the owned load afterward.

**Validate:**

1. Compare sample counts/configuration with idle run.
2. Require no silent deadline catch-up burst and retain worst-case/missing observations.

**Evidence:** `docs/ai-dj/work/evidence/M16.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M17: Capture native UI response timing

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M13, M14. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/M17.json`

**Scope:** Twenty simple-control changes in one visible skin.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Record actual host UI with timestamped stimulus and a documented clock/frame calibration.
2. Measure each visible update and report frame-rate uncertainty.

**Validate:**

1. Check UI changes correspond to returned host state, not local dashboard intent.
2. Compare visible delays to proposed 150 ms target, flag any measurement too coarse.

**Evidence:** `docs/ai-dj/work/evidence/M17.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M18: Capture audible response timing

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M13, M14. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/M18.json`

**Scope:** One short recorded cue/play/sync test using known local fixture audio.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Record loopback/output audio and command markers with clock alignment.
2. Locate audible onsets and sync behavior separately from UI and state timestamps.

**Validate:**

1. Verify audio capture is usable and quantify timing/calibration uncertainty.
2. Report timing results without claiming sample accuracy; create human-listening evidence gate.

**Evidence:** `docs/ai-dj/work/evidence/M18.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M19: Review the local latency decision

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M15, M16, M17, M18. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/reviews/local-timing.md`

**Scope:** Review four terminal reports; do not implement a scheduler.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** All timing runs use the same frozen profile; any measured corrections stay in a tracked child chain.

**Perform:**

1. Compare command-to-observation p95 <=30 ms / p99 <=75 ms with observed native UI, audio, jitter and clock uncertainty.
2. Decide Node executor sufficient for the tested controls, further measurement needed, or a narrow scheduler correction required.
3. Keep the app-display p95 <=100 ms budget explicitly unmeasured until U08/L05; do not treat log timestamps as a measurement of an unbuilt app UI.

**Validate:**

1. Require real command/state/native-UI/audio evidence for the tested initial profile, with limits and missed deadlines.
2. Instantiate SCHED children for failed timing gates; U08/L05 owns later app-display measurement, so neither pretend it passed nor silently require unbuilt UI for M1.

**Evidence:** `docs/ai-dj/work/evidence/M19.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## M20: Accept or hold milestone 1

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** M19, I23. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/gates/M1.md`

**Scope:** Evidence audit only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Any timing-correction children required by M19 accepted; inventory closure accepted.

**Perform:**

1. Review initial five-control send/receive/UI proof, full inventory closure and binding/profile records.
2. List accepted evidence, gaps and bounded follow-up IDs; freeze runtime profile for reliability work.

**Validate:**

1. Require every F/M task and inventory continuation accepted, with no omitted families.
2. Mark M1 passed only with actual runtime evidence; synthetic tests alone cannot pass.

**Evidence:** `docs/ai-dj/work/evidence/M20.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

> End of autonomously AI-generated planning cards.
