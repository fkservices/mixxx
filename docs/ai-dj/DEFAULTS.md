# Delegated planning defaults

> Autonomously AI-generated defaults chosen under the user's explicit delegation.

These are proposed starting settings, not measurements or individual user answers. They supplement the explicit decisions in [GOALS.md](../../GOALS.md); any later user choice wins. No further questionnaire response is required to complete planning.

## Round 2 defaults

### R2-Q09: In B2B, if you press Pause or Stop on a deck, how should the AI respond?

Treat manual Pause/Stop as a latched transport hold on that deck. Cancel dependent transition actions; do not automatically play, cue-trigger or replace its track. Other independent work can continue. Human playback or explicit release of that deck hold permits fresh reconciliation; the ordinary 3-second timer cannot clear it.

### R2-Q10: What happens to the unplayed song displaced by a manual replacement?

Preserve the displaced occurrence in the remaining set, reorder around the human choice and record the replacement. Never reload it immediately over the chosen song. If it already played partly, preserve its actual spans and interrupted status; completion follows meaningful-playback rules. An explicit user skip resolves it without falsely marking it played.

### R2-Q11: How long can I reserve controls for myself in B2B?

Provide per-control and per-deck manual pins in addition to routine transition holds. Pins remain until explicitly released; global Disarm remains separate. Releasing a pin permits reconciliation and the next eligible transition, not an abrupt value reset.

### R2-Q12: How should AI infer interaction on a controller without touch sensors?

Use raw intent where available, including repeated identical values; otherwise use observed changes with uncertain origin. Show inferred inactivity rather than claiming physical touch detection. Apply the confirmed 3-second quiet and later-transition rules; uncertain manual divergence yields conservatively.

### R2-Q13: How should physical knobs catch up after AI changes their software values?

Preserve existing mapping behavior and verify pickup for each fixture. Offer supported soft takeover configuration with a clear mismatch indicator. Do not assume every controller supports pickup or motor feedback; do not reroute hardware through the AI service.

### R2-Q14: May AI create or change cue points?

Read user cue/hotcue/intro-outro data and preserve it. Store AI entry/exit suggestions in the app; explicit Save cues can write supported markers through a verified host operation with conflict handling. Triggering a hotcue is distinct from editing its stored position.

### R2-Q15: How should B2B handle manual jogging, scratching, seeking and loops?

Cancel stale track/position actions, yield the affected transport and dependent transition steps, and use fresh beat/playhead/loop state afterward. Touch release and later-transition eligibility still apply; no snapback to the abandoned position. Independent work may continue.

### R2-Q16: May I manually introduce a song outside a playlist-restricted set?

Music-pool restrictions constrain AI selection. A human load is respected in B2B and recorded with manual provenance, without silently enabling free AI selection or deleting original required occurrences. Recheck duration and pins after the change.

### R2-Q17: What should AI Only do after a manual track load?

AI remains authoritative in AI Only, but stale commands and active-deck replacement guards still apply. Observe the new identity/state, then choose a bounded recovery from the actual musical situation. Ordinary knobs recover promptly; manual loads never authorize blindly replaying old loads.

### R2-Q18: What should happen when AI planning is late or fails?

A planner timeout can fall back to constrained ordering and a conservative prepared transition if state, analysis, capabilities and authority are fresh. Clearly label fallback. Otherwise preserve current audio, stop starting new transitions and show action needed. Never invent a late plan or blindly loop/replay actions.

### R2-Q19: What should happen if MIDI feedback or the host connection is lost?

Loss of trustworthy host feedback disarms new performance output. Cancel queues, release AI-owned momentary controls through a verified watchdog path, and preserve current playback where possible. Reconnection requires negotiation, fresh snapshots and deliberate rearm. A physical-controller disconnect alone yields/cancels uncertain affected B2B work and alerts; do not automatically grab its held controls.

### R2-Q20: What should the initial mode and controller setup be?

First launch selects B2B disarmed; later launches remember the selected mode but remain disarmed. Use Reloop Buddy as a candidate, not a verified device. Setup must identify the actual attached model, mapping and ports; the unspecified Hercules model remains an evidence prerequisite, not a question blocking this plan.

## Round 3 defaults

### R3-Q01: What should the main live session screen emphasize?

Show deck/track lanes, overlap, playhead, section boundaries, parameter curves and concise AI reasons. Label planned, sent, observed and uncertain states separately. Keep mode and Disarm visible. Raw bytes and causal/device details are available in an inspector.

### R3-Q02: When should MIDI session recording run?

Record raw AI output, physical input, host feedback, semantic events, intentions and outcomes by default whenever the app session is active. Continue across mode changes and disarm. Pausing capture creates an explicit gap; resume begins with a fresh snapshot. Include unknown/unmapped events, never mislabel them as AI or human.

### R3-Q03: Should sessions record audio as well as MIDI data?

Master-output audio capture is opt-in and separate from MIDI history. No microphone capture or broadcasting by default. The UI can attach an existing local recording and disclose alignment uncertainty. Record/broadcast capability exists in the coverage target but requires explicit operator intent.

### R3-Q04: How should track waveforms appear?

Generate or read verified local waveform assets outside MIDI handling; cache by file fingerprint. Show a timeline with duration/position while unavailable. Never present decorative or synthesized bars as measured audio. Audio playback in history, if enabled, remains isolated from performance MIDI.

### R3-Q05: How should long sessions be stored and rendered?

Use recoverable journal chunks and indexed snapshots; stream versioned JSON export. Propose 16 MiB chunks, snapshots at most 5 seconds apart, 1,000-event query pages and a separately bounded recorder queue. These are tunable design budgets, to be validated under dense jog/14-bit traffic. Raw capture is retained; only visual curves are downsampled.

### R3-Q06: What initial session size should we validate?

Initial acceptance envelope: 1 to 250 occurrences, roughly 10 minutes through 6 hours, including duplicates and open-format material. These are proposed test targets, not measured capacity or permanent product limits. Larger inputs must receive a visible capacity/preparation assessment without silent truncation. Full-feature inventory is not limited to two decks just because the first proof is.

### R3-Q07: How should history retention work?

Keep local history until deletion by default. Offer opt-in age/size cleanup, pinned sessions excluded. Show usage and low-disk warnings; propose warning at 5 GiB free and stop optional audio before data becomes endangered. Disk-full must preserve MIDI responsiveness and mark capture gaps, never silently erase sessions.

### R3-Q08: How should sharing and export handle local files?

Default local export includes event/schema/profile versions and stable track/occurrence references. Sharing mode removes unnecessary absolute paths and device identifiers; audio/waveform assets are opt-in with explicit relative references. Import validates sizes, versions and path traversal, remains read-only, and never sends MIDI.

### R3-Q09: How can I correct what AI learns?

Support optional timestamped notes and transition/set ratings, inspectable learned preferences with evidence, edit/delete/reset and a disable-learning switch. Never treat every B2B gesture as a permanent preference. Learning is local and contextual; user-specified settings and pins win.

### R3-Q10: How far back should repetition and preference learning look?

Default repetition checks prioritize the current session, with recent local history (30 days, configurable/off) as a soft signal. Prefer unplayed sections where musically useful; do not ban repeated material. Display/reset evidence and keep event archives separate from the preference model.

### R3-Q11: What should matching lyrics mean musically?

Use confident repeated hooks, words or phrases for potential handoffs; themes and language are weaker optional selection signals. Respect phrase timing, BPM, harmony and vocal density. Never force a lyrical match that creates clashes; allow user emphasis, language and disable controls.

### R3-Q12: Where should lyrical information come from initially?

Use available local tags/sidecar timed lyrics and optional local transcription in a separate analysis process. Preserve source, confidence and timing; no mandatory cloud service or automatic online lyric collection. Missing lyrics reduces that score, never makes a track unplayable. Select/benchmark actual tools during implementation, not by invented capability.

### R3-Q13: What initial tempo-change limits should AI use?

Propose absolute tempo offsets within 3% as preferred and 6% as the normal cap, configurable per set/track and distinguishable from half/double-time analysis. Use a different transition when limits conflict; evaluate pitch/key-lock effects by listening. Numeric values are assistant defaults, not user-specified musical laws.

### R3-Q14: Which defaults should apply to a newly created set?

Default to supplied-playlist pool, source snapshot until refresh, review-first start and local autosave with optional new Mixxx playlist. Retain all requested alternatives: free library selection, live source sync, automatic start for an explicitly initiated set, automatic dual save or local-only/manual export. Keep these independent of performance mode.

### R3-Q15: How much musical planning can I override?

Expose AI-selected defaults and user editing for style, energy presets/custom curve, opener/closer and next-track pins, duration/range, tempo limits, section/cue boundaries and transition intensity. Changes validate feasibility and invalidate only affected future plans. Preserve active transitions and flag impossible duration/all-song combinations.

### R3-Q16: How should the local desktop app launch?

Deliver a local Mac launcher and TypeScript/HTML browser UI with a separate persistent Node service. Closing the tab does not kill performance. Bind to loopback, validate origin/session credentials and avoid exposing control APIs on the LAN. Desktop packaging must be tested on a clean local setup; an Electron wrapper is not required for this build.

### R3-Q17: What responsiveness targets should we test first?

Propose command-send to host-observation p95 <=30 ms and p99 <=75 ms; recognized human-input to AI cancellation p95 <=20 ms, p99 <=50 ms; observed state to app UI p95 <=100 ms. Report native Mixxx UI and audible onset separately, plus clock uncertainty, worst case and misses. No hard-real-time guarantee. Freeze a musically relevant host-quantized scheduling gate and measured onset budget in F01/M19 before claiming beat-critical support; failing budgets trigger focused optimization/native-scheduler work.

### R3-Q18: What should validate musical quality?

Use repeatable Mixxx AutoDJ baseline and level-matched blind excerpts where feasible, covering open format, tempo/key differences, duplicate sections and manual interventions. Propose human ratings >=4/5 for naturalness and enjoyment on representative accepted sets, with no severe unintentional clashes, gaps or clipping. Keep subjective results and technical failures visible; human feedback is required before a runtime release.

### R3-Q19: What happens when analysis, recording or UI is overloaded?

Prioritize cancellation/releases and host state over telemetry, analysis, export and rendering. Bounded queues, process isolation and backpressure apply. Pause optional analysis/audio capture and downsample visual rendering before losing control responsiveness. Record gaps honestly; stale essential feedback disarms. Never drop already captured raw events silently while reporting lossless history.

### R3-Q20: What should count as completion of this phase?

Complete discovery with explicitly delegated defaults, aligned goals/specs, an updated HTML direction page, bounded worker cards and traceability/validation, then commit/push planning artifacts to the existing fork. Runtime implementation starts only on a later user instruction. Unverified device/tool/performance facts remain future evidence requirements, not silently answered facts.

> End of autonomously AI-generated defaults.
