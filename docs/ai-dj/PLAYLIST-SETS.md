# Mixxx playlists and AI sets

> Autonomously AI-generated planning specification at the user's request.

The desktop app accepts a native Mixxx playlist, lets AI arrange its order, and performs every required occurrence with meaningful musical participation. It serves private listening and live sessions. [GOALS.md](../../GOALS.md) governs scope; [discovery](DISCOVERY.md) distinguishes user decisions from [delegated defaults](DEFAULTS.md). This is a specification, not a working integration or listening result.

## PS-01: identity and occurrence accounting

Capture a source snapshot with library identity, playlist identity/revision, ordered occurrence IDs, track IDs and file fingerprints where available. Repeated references to one track remain different occurrences. Display titles are labels, never stable load addresses. Keep source order, planned order and actual history separately.

The native reader must paginate ordered occurrences consistently, retaining duplicates and rejecting mixed revisions. Do not use a distinct track-ID set as a substitute for an ordered occurrence list. The inspected `PlaylistDAO::getTrackIds` query uses `DISTINCT` and does not establish playlist order; a suitable ordered service must be verified or added. See the [pinned source](https://github.com/mixxxdj/mixxx/blob/3e5f59002cdd02040f3b7aeef938ea9af2def001/src/library/dao/playlistdao.cpp#L134-L152) and [research](RESEARCH.md).

An M3U8 import is a useful early fallback, but native Mixxx playlist selection and stable load confirmation remain delivery gates. Narrow host operations must use existing library services and appropriate host threads. Never directly modify Mixxx's live SQLite database.

## PS-02: preparation and unavailable tracks

Typical lists have 10 or more songs; validate smaller edge cases too. The delegated initial capacity target is 250 occurrences and up to 6 hours. Larger inputs need an explicit capacity assessment, never silent truncation or an unlimited-capacity claim.

Reuse valid existing tempo/key/cue analysis. Prepare the first few songs and missing analysis ahead in a separate process; offer prepare-everything-first and per-feature overrides with provenance. Reject stale cache entries after file changes. Read existing cue/hotcue/intro-outro positions and labels where supported, preserve user markers and keep AI suggestions separate until explicitly saved. MIDI cue triggering is distinct from obtaining or changing stored cue metadata.

Automatically skip confirmed missing, unreadable or unplayable entries, including confirmed runtime load failures, then advance to the next playable song. Retain the skipped occurrence and reason; do not call it played or delete it from the source playlist. Ambiguous identity or unknown load outcome is not a confirmed file failure: reconcile before choosing another operation. Preserve current audio where possible. Exhausted playable entries end/report the condition rather than retry forever.

## PS-03: order, sections and musical flow

Support open format across genres, eras and tempos. Score BPM, harmonic compatibility, energy, phrasing, confidence, repetition and optional lyric/vocal signals. AI chooses opener/closer unless pinned, adapts the remaining order, and explains important choices. User constraints win over learned preferences.

AI chooses musically suitable sections, with duration automatic, a user time limit, or a user range. Do not impose full-file playback. Each occurrence must receive an agreed meaningful section, measured by eligible playback spans and reviewed for musical value. Explicit cue/section constraints may set minimum participation; the app must show the proposed section before review-first starts. Brief load/start events do not count as participation.

If meaningful sections of every required occurrence cannot fit the chosen duration, show the conflict and let the user choose before starting. This confirmed policy is not bypassed by automatic-start mode or delegated defaults. During playback, a new manual addition or constraint triggers a feasibility update without interrupting current music; show unresolved tradeoffs and preserve accounting.

Keep duplicates with a soft notice and prefer musically suitable sections not already played. Use current-session history strongly; delegated default permits recent local history (30 days, configurable/off) as a soft preference. It is not a ban on repeated material.

Provide automatic style, selectable styles, energy presets and an editable custom energy curve. Prefer small tempo changes; delegated numeric defaults prefer within 3% and normally cap at 6%, user configurable. When tempo, key or phrase evidence is weak, use an appropriate conservative transition instead of forcing a long beat blend. Local lyrics can support confident hook/phrase handoffs; themes are weaker signals. Missing lyrics never makes a track unplayable.

## PS-04: music pool and source synchronization

Two independent music-pool settings are required: supplied playlist only, or free selection/additions from the local Mixxx library. Default to the supplied playlist. In free selection, show addition provenance and preserve original required occurrence accounting and duration constraints. This setting is independent of the **Playlist Only performance mode**.

Offer source snapshot until manual refresh (default) and live synchronization of future entries. Live sync compares source revisions and preserves the active transition. A source deletion or replacement must remain visible in the set audit, never erase playback history. Manual refresh previews/reconciles changes rather than replaying an old queue.

## PS-05: transition execution

Each transition has a stable ID, track/ownership/mode/set generations, bounded curves, preconditions, deadlines, observed results and a cancellation path:

`observe → select → prepare idle deck → confirm identity → cue/sync → start → blend → confirm outcome → release deck`

Host state drives execution. A parsed MIDI request is not proof of a successful load. Prevent unexpected replacement of audible decks, stale-position actions, unbounded gain and competing Mixxx AutoDJ automation. Use the host's verified sync/quantization; JavaScript timers are not sample-accurate. Expensive analysis and model inference never execute in MIDI handlers.

A late planner can use a validated deterministic fallback with fresh state and valid authority. Essential feedback loss disarms. Unknown state, missing required capabilities or insufficient time prevents starting an unsafe new transition; preserve current playback where possible and show why.

## PS-06: edits and performance modes

The set editor supports remaining-order edits, opener/closer/next pins, explicit skips, additions, styles, duration and section constraints. A new revision invalidates affected prepared actions. An edit cannot silently rewrite the active transition.

| Mode | Behavior |
| --- | --- |
| AI Only | AI controls performance while armed and promptly recovers ordinary knob changes through smooth bounded actions. Reconcile manual loads without blindly restoring the previous song over audible music. |
| B2B | Human changes take priority on affected controls for the current transition. Reclaim only at a later transition start after release, the configurable quiet period (3 seconds default) and reconciliation. |
| Playlist Only | AI arranges and saves sets; the human mixes. No AI load/play/cue/seek/sync/EQ/fader/effect commands. Read operations and explicitly requested playlist saves remain available. |

A human-loaded replacement in B2B becomes the new musical direction. Cancel stale actions and adapt from its actual identity/position. Keep the displaced occurrence for later unless explicitly skipped, retaining any prior playback spans. A manual addition outside the AI's restricted pool is respected and labeled as human-selected; it does not silently change the AI pool setting.

Manual Pause/Stop latches a deck transport hold until human playback or explicit release. Control/deck pins also remain until released. Global Disarm wins in all modes. Mode switches cancel stale work, and an already-armed AI Only/B2B switch continues after reconciliation. Returning from Playlist Only requests AI start, but cannot clear explicit Disarm. See [human control](HUMAN-CONTROL.md) for precise lifecycle rules.

## PS-07: honest playback accounting

Track loaded, started, eligible routed playback, completed, interrupted, skipped and unresolved separately. Record actual playhead spans, loops/seeks, deck overlaps and routing/gain evidence. A prelisten or muted deck is not an audience performance. Host telemetry supports an audibility estimate; actual audio capture/listening is required to validate audible results.

A set is complete only when every required occurrence has a resolved outcome, remaining music finishes appropriately and future automation is cleared. Report played, skipped and unresolved counts separately. A manually replaced track cannot make the old intended occurrence appear played. A recorded excerpt or Playlist Only arrangement is not a completed AI performance.

## PS-08: save and recover

All three requested save behaviors are available: local save with optional new Mixxx playlist (default); automatic local plus new Mixxx playlist; or local-only with manual file export. Preserve the original playlist. Native save has an explicit requested name, conflict policy, correlated outcome and ordered readback. Unknown outcomes are reconciled before retry to avoid duplicate saves.

Use atomic versioned local manifests with source and plan revisions, constraints, occurrences and outcomes. Restart keeps mode preference but starts disarmed, refreshes host identity/state and reconciles pending/interrupted entries. Never replay a saved transition merely because it appears in history.

## PS-09: session explanation and acceptance

The [session interface](SESSION-UI.md) joins intentions, raw MIDI, semantic actions, actual observations, ownership and track spans. Live and historical views share a projection, but history never emits MIDI. Unknown sources and capture gaps remain visible.

Required evidence includes ordered A/B/A native playlist reads, mid-page source edits, missing and ambiguous tracks, successful/failed/unknown load outcomes, source sync settings, all save strategies, energy/section overrides, a B2B replacement and pause, and correct end-of-set accounting. Collect actual Mixxx UI/audio/controller evidence, not only mocked contracts.

Compare representative AI sets with a documented Mixxx AutoDJ baseline, keeping sources and levels comparable. Evaluate rhythm/phrase alignment, loudness continuity, harmonic/vocal clashes, energy flow, meaningful participation and enjoyment. Use timestamps and human ratings; proposed acceptance is at least 4/5 naturalness and enjoyment, with no severe unintended clashes, gaps or clipping. Technical tests cannot certify enjoyment. See [Mixxx's AutoDJ documentation](https://manual.mixxx.org/2.5/en/chapters/djing_with_mixxx.html) for the comparison baseline.

A full-set test, an uninterrupted 30-minute control soak and a 6-hour endurance/capacity run are separate evidence requirements and may share a run only if all criteria are met. Long jobs continue across bounded worker observations. [Worker tasks](WORKER-TASKS.md) define execution and gates.

> End of autonomously AI-generated planning specification.
