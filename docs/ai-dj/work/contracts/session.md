# Session recording contract v1

> Autonomously AI-generated O01 contract at the user's request. Types and rules only; recorder, validators, export and viewer remain implementation tasks.

`ai-dj/core/session.ts` defines one session event envelope for live readers and saved history. A recording ID identifies the journal, independently of reconnecting MIDI protocol sessions. Each event has an immutable event ID, recorder ingest sequence, producer stream/epoch/sequence, capture and ingest clock stamps, producer/device identity, independent actor attribution, optional observed host/track/occurrence context, and related event IDs. Producer and actor are different: a host hook can produce evidence of a physical user's gesture.

Events distinguish raw MIDI, decoded gestures, AI intent, semantic actions and stages, actual host observations, modes, ownership, source playlists, set plans, track spans/history, clock calibration, capture gaps and recording state. Existing action, state, mode, playlist and set contracts are reused. The recorder never rewrites an earlier event because a later observation agrees or disagrees with it.

The action-outcome variant retains the full F06 outcome, including receipt/correlation and required evidence. Action-stage is a linked display summary, not a substitute for that outcome or an admission token. An accepted or observed summary must link the corresponding outcome and satisfy its evidence requirements; absent evidence remains uncertain. Summary and outcome are not counted as two actions.

## Identity, attribution and counting

IDs follow F06 bounds; sequences/revisions are finite safe nonnegative integers, with positive event sequences. A producer restart/reconnect creates a new stream epoch before counters restart. Event IDs are globally unique within the recording. A repeated transport delivery of the same event is deduplicated by event ID after verifying identical content; a conflicting duplicate is an error. Repeated identical MIDI messages with different event IDs remain separate records.

Raw directions distinguish AI outbound, physical ingress and host feedback. Attempted, submitted and received stages are distinct: calling a send API does not establish a host result. Submitted requires successful transport submission evidence; received requires the declared receiving capture boundary. Raw records preserve exact byte order and message/fragment status, including unknown, ignored and unchanged messages. MIDI bytes are integers 0–255; channel voice data bytes must satisfy their actual framing. Do not interpret arbitrary fragment bytes as complete messages.

Only a decoded gesture with a verified decoder profile may receive a musical label. The profile is embedded as bounded declarative data, with a canonical-content hash, revision, device, host build and mapping version. It specifies zero-based wire channel, controller/note, scaling, polarity, relative encoding or 14-bit pairing rules. UI channels are displayed as 1–16; CC number 110 is never called channel 110. Unknown or ambiguous mappings remain raw with unknown meaning. Profile revisions never mutate old event interpretations. Import does not execute mapping JavaScript.

Profile admission requires channels 0–15, controller/note values 0–127, finite ordered scaling endpoints, nonzero finite relative multipliers and positive bounded pairing windows. Reject contradictory bindings unless an explicit supported fan-out mapping accounts for every effect. O05 must verify each encoding against its declared mapping; naming an encoding alone does not prove a physical controller uses it. The hash covers canonical profile data excluding the reference's own hash field.

O05 adds explicit CC boolean (zero off, nonzero on) and optional centered seven-/fourteen-bit curves to the profile data. Absent curve means linear. The centered seven-bit curve is `raw/128` through 64 and `(raw-1)/126` above it. The centered fourteen-bit curve is `raw/16384` through 8192 and `0.5+(raw-8192)/16382` above it, before inversion and declared range scaling. These preserve the initial crossfader and R20 tempo center exactly. A profile using a new encoding needs its own verified content hash; unknown encodings must be rejected rather than guessed.

`gestureId` groups one logical gesture, including multiple source bytes and multiple mapped controls. Count one distinct gesture ID in gesture summaries. Never add raw packets, semantic fan-out, host feedback and observations to that same gesture count. A held jog can generate multiple gestures; do not collapse them merely because bytes match. Raw event IDs remain linked and inspectable. Pairing loss/timeout stays visible; an incomplete CC14 pair is not a fabricated value.

Actor evidence distinguishes confirmed and inferred authorship. A physical endpoint capture can establish human input at that endpoint, but does not establish a resulting control change without dispatch evidence. An instrumented dispatch/request link may support a causal chain; temporal proximity or matching values support compatibility only. Heuristic attribution must remain inferred. A host observation without source evidence stays unknown, even while B2B conservatively yields. Attribution must not consume or hide simultaneous human events.

## Two worked examples (synthetic)

**Volume up:** profile `demo-volume` revision 1 binds wire channel 0, CC 7 to `deck1.volume`, linear 0–1. Physical raw event r1 contains `[176,7,64]`; r2 contains `[176,7,96]`. They decode to distinct gesture IDs g1/g2 and values 64/127 and 96/127. A UI comparing them may label g2 volume up. An isolated absolute value is volume set, with direction unknown unless the prior comparable value is known. Later host feedback/observation o1 may show volume 96/127; without an instrumented link its actor stays unknown and it is not counted as a third gesture. If AI emits the same bytes, its direction is AI outbound and submission is separate from observation.

**Jog backward:** profile `demo-jog` revision 1 binds wire channel 0, CC 16 to `deck1.jog`, two's-complement with multiplier +1 and unit ticks. Raw event r3 is `[176,16,127]`. Signed 7-bit decoding yields -1; gesture g3 displays jog backward one tick. This is input intent, not proof of a one-frame audio movement. With binary-offset encoding, byte 127 instead means +63; the profile is therefore essential. A resulting transport-position observation is separate and may be affected by playback, scratching or another input. Neither case invents actor attribution for the resulting state.

For Note On velocity zero, the declared note profile produces release. For two CC14 bytes, a completed pair links both raw IDs to one gesture. Raw IDs already assigned to a completed pair cannot be silently reused to fabricate another paired gesture; profile-specific running-value semantics require their own explicit supported version.

## Time and ordering

Clock stamps identify clock ID, clock epoch and finite monotonic milliseconds. Capture time is when the producer observed the event; ingest time is when the recorder received it. Neither is automatically the time an audio effect became audible. Wall UTC is only an anchor for display labels. Clock discontinuity/suspend-resume invalidates mappings and creates a new epoch.

A calibration maps from one exact clock/epoch to another using an offset interval, anchor, proven drift bound and validity window in the source clock. For source time t, widen both offset bounds by `abs(t-anchor) * maximumDriftPpm / 1e6`. Reject inverted intervals, negative drift, expired mappings, unresolved evidence and mismatched epochs. Do not assume symmetric round-trip latency. Without a valid mapping, show the event in its own time domain or with explicit uncertainty. Never subtract unrelated native and Node timestamps directly.

Producer sequence establishes order within its stream. Recorder sequence establishes deterministic ingest/replay order, not musical causality between streams. Calibrated intervals can overlap, so the visualizer must not fabricate an exact ordering from their midpoints. Raw-to-semantic/request links establish only their declared causal relationship. P01 audible-span rules remain separate; elapsed playback or a MIDI value is not proof of listening quality.

## Journal, gaps, snapshots and JSON

Recording uses bounded NDJSON chunks through the separate recorder worker. MIDI handling does not await disk or UI work. Chunk descriptors carry exact byte length, checksum, event count and recorder sequence bounds. A seal is written only after the chunk is complete. O07/O14 must freeze queue/chunk/capacity limits and degradation behavior before recorder acceptance. Existing task O09 owns bounded import/export validation and streaming serialization; this type declaration is not a runtime validator.

Gap records identify the affected producer stream and either an inclusive known missing range or unknown loss. Counts must never be invented from absent telemetry. Open-ended gaps retain unknown start/end where necessary. Queue overflow, disconnect, disk failure and a torn crash tail remain distinguishable. Checksums prove stored bytes, not completeness of physical capture. A complete-within-scope claim requires verified capture boundaries and reconciled counters for every declared endpoint; unknown scope remains unknown.

Visual snapshots include per-stream cursors, an ingest cutoff, observed state, modes, ownership, plan/history and open gaps. Seek chooses a compatible preceding snapshot and applies subsequent events through a visualization reducer. It must neither clear gaps nor reuse historical clock calibration as current live calibration. An armed mode in a historical snapshot describes that past moment; it does not grant current authority.

JSON export is one object with format `ai-dj-session`, schema version 1, history-only access, manifest, embedded decoder profiles, snapshots and events. NDJSON chunks are not mislabeled JSON exports. A streaming writer may serialize the events array without holding it all in memory. Reject unsupported schemas, malformed/boundedness violations, dangling mandatory references and conflicting identities before use. Labels render as text. History must have no output-port, rearm or dispatch dependency; access tags alone are not enforcement.

Recording ending/pausing does not mean music stopped. Spans can remain open/interrupted/unknown, and an ended recording is not a completed set. An AI-only session records human intervention even when overridden; B2B records scoped holds through the current transition and reclaim only after quiet plus a later transition. Manual transport remains a stronger hold. Playlist-only still records manual performance and AI organization without AI deck loads. O01 does not implement those control policies; it preserves the evidence needed to inspect them.

> End of autonomously AI-generated session contract.
