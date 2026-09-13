# 08-desktop-ui

> Autonomously AI-generated planning cards. Task specifications with recorded execution status; completion requires acceptance evidence.

[Worker rules](../WORKER-TASKS.md) · [Catalog](README.md)

## U01: Freeze desktop screens and local service API

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P01, O01, R15. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/contracts/ui.md`

**Scope:** Screen/API contract; keep framework decision bounded.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Choose minimal TS/HTML UI framework and define playlist, set, live session, history and mode controls.
2. Define loopback event subscription, commands, origin checks and disconnect/stale-state display.

**Validate:**

1. Walk playlist import->arrange->review->arm->perform->history in each mode.
2. Disarm bypasses planner and historical views cannot issue MIDI.

**Evidence:** `docs/ai-dj/work/evidence/U01.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## U02: Scaffold the local UI and service connection

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U01, F03. **Leases:** ui-entry. **Status:** planned.

**Owns:** `ai-dj/local-ui/app.ts`, `ai-dj/local-ui/index.html`, `ai-dj/local-ui/styles.css`, `ai-dj/local-ui/service.ts`

**Scope:** Shell/navigation and reconnect/stale indicator only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Build accessible local app shell and connect bounded event/API client.
2. Show service disconnected/stale state and avoid optimistic control-success displays.

**Validate:**

1. Open built UI on loopback and exercise reconnect/error state.
2. Browser close leaves service alive; keyboard navigation has visible focus.

**Evidence:** `docs/ai-dj/work/evidence/U02.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## U03: Implement playlist and set editor screen

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U02, P10, P15. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/local-ui/playlist.ts`, `ai-dj/local-ui/playlist.css`

**Scope:** Select/arrange/reorder/pin/save remaining set.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Show native playlist issues and every occurrence, then AI order with reasons.
2. Wire edits, pins, explicit skips and save-new playlist with revision conflict handling.

**Validate:**

1. Use duplicate/missing file fixtures and test keyboard reorder/pin.
2. Current transition entries cannot be silently rewritten by a stale edit.

**Evidence:** `docs/ai-dj/work/evidence/U03.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## U04: Implement modes disarm and ownership UI

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U02, R16, R18, R25. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/local-ui/controls.ts`, `ai-dj/local-ui/controls.css`

**Scope:** Mode/arm/disarm/per-control hold display.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Expose three modes and latched disarm plus per-control human hold/pin/quiet state.
2. Display actual value separately from AI target and inferred vs explicit touch.

**Validate:**

1. Exercise all mode switches in live service harness with queued actions.
2. Disarm is keyboard reachable and never waits for model; timer expiry cannot clear pinned hold.
3. Bass quiet expiry does not reclaim during current transition; manually paused deck and pinned holds remain latched.

**Evidence:** `docs/ai-dj/work/evidence/U04.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## U05: Implement layered track timeline

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U02, O08. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/local-ui/timeline.ts`, `ai-dj/local-ui/timeline.css`

**Scope:** Deck lanes, track spans, overlap and playhead only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Render actual occurrence spans over common session clock with zoom and live-follow.
2. Show cue/seek/loop markers and unloaded/uncertain spans distinctly.

**Validate:**

1. Render simultaneous tracks and backward seek fixture correctly.
2. Keyboard/time navigation and text duration alternative work; no waveform invented from MIDI.

**Evidence:** `docs/ai-dj/work/evidence/U05.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## U06: Implement semantic action overlays and filters

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U05, O05, O10. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/local-ui/events.ts`, `ai-dj/local-ui/events.css`

**Scope:** Curves/markers and bounded event inspector.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Overlay semantic actions and AI intent vs actual observations with raw-byte drilldown.
2. Filter AI, physical user, manual-host, unknown, device, track/deck, control and time.

**Validate:**

1. Verify filtered counts against known JSON fixture and retain gaps.
2. Labels say volume up/treble down/jog backward with units; source is not color-only.

**Evidence:** `docs/ai-dj/work/evidence/U06.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## U07: Implement saved session viewer

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U06, O09. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/local-ui/history.ts`, `ai-dj/local-ui/history.css`

**Scope:** Session list/load/scrub and visual playback only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Load exported JSON/session index and restore timeline from nearest snapshot.
2. Show planned vs actual order, track durations, interventions, completion and capture gaps.

**Validate:**

1. Scrub to same timestamp via two paths; state agrees.
2. Assert zero MIDI sends while importing, scrubbing or playing history.

**Evidence:** `docs/ai-dj/work/evidence/U07.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## U08: Verify live/history UI against a real session

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U03, U04, U07, O11, A11, L02. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runs/U08.json`

**Scope:** One <=10min mixed-mode session; focused UI validation.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Observe live tracks/actions from actual Mixxx, then load its exported history.
2. Exercise source filters, raw inspector, modes and physical bass override.

**Validate:**

1. Require live and saved projections agree on order/durations/curves/ownership.
2. Check keyboard controls, narrow-window readability and history zero-output property.
3. Measure host observation to actual app display against p95 <=100 ms, with clock uncertainty; this closes the app-display measurement deferred by M19.

**Evidence:** `docs/ai-dj/work/evidence/U08.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

> End of autonomously AI-generated planning cards.
