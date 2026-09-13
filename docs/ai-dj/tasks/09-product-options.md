# 09-product-options

> Autonomously AI-generated planning cards. No implementation claimed.

[Worker rules](../WORKER-TASKS.md) · [Catalog](README.md)

## P19: Implement duration and section constraints

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P11, A01. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/sets/duration.ts`, `ai-dj/test/sets/duration.test.ts`

**Scope:** Automatic/time-limit/range feasibility over proposed sections.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Compute duration including overlaps and minimum meaningful section constraints.
2. Flag impossible all-occurrence/time combinations and preserve active playback on live edits.

**Validate:**

1. Test 10-minute set, range, duplicate occurrence and manual addition.
2. No silent song drop, full-file mandate or automatic relaxation of hard user constraints.

**Evidence:** `docs/ai-dj/work/evidence/P19.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P20: Implement source synchronization policies

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P06, P10. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/sets/source-sync.ts`, `ai-dj/test/sets/source-sync.test.ts`

**Scope:** Snapshot/manual refresh and future-entry live sync.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Default to source snapshot; offer versioned live source updates.
2. Reconcile adds/removes/reorders into future set without changing active transition or losing history.

**Validate:**

1. Test source change during pagination and conflicting pinned entry.
2. Stale update cannot overwrite newer user edit; removals stay auditable.

**Evidence:** `docs/ai-dj/work/evidence/P20.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P21: Implement music-pool policy

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P11, P08. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/sets/music-pool.ts`, `ai-dj/test/sets/music-pool.test.ts`

**Scope:** Supplied playlist versus free local library selection.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Default restricted AI pool; permit verified local additions in free mode.
2. Respect manual additions in B2B without silently switching AI pool.

**Validate:**

1. Test additions/provenance and preservation of required originals.
2. Pool restriction never rejects human musical choice or invents track identity.

**Evidence:** `docs/ai-dj/work/evidence/P21.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P22: Implement set save strategies

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P15, P09. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/sets/save-policy.ts`, `ai-dj/test/sets/save-policy.test.ts`

**Scope:** Three selected persistence strategies.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Default local autosave with optional native new playlist; add automatic dual save and local-only/manual export.
2. Reconcile unknown native save before retry; preserve original playlist.

**Validate:**

1. Test restart, conflicting name and partial native save failure.
2. Local success cannot falsely imply native save succeeded.

**Evidence:** `docs/ai-dj/work/evidence/P22.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P23: Implement existing cue metadata client

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P03, A01. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/catalog/cues.ts`, `ai-dj/test/catalog/cues.test.ts`

**Scope:** Read verified cue positions/types/labels and provenance.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Consume the versioned host metadata operation; preserve user markers.
2. Link suggested sections and explicit MIDI cue triggers to correct track generation.

**Validate:**

1. Test missing labels, changed markers, duplicates and stale track.
2. Require host OP children if access is absent; MIDI note number is not stored cue metadata.

**Evidence:** `docs/ai-dj/work/evidence/P23.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## P24: Specify explicit save-cue operation

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** P23, P05. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/operations/save-cues.md`

**Scope:** One opt-in host marker mutation contract.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Specify expected track/cue revision, conflict result and explicit user invocation.
2. Allocate OP-SPEC/BUILD/TEST children with exact host ownership; keep AI suggestions in local storage by default.

**Validate:**

1. No automatic overwrite of user cue.
2. Gate delivery on runtime save/readback of an explicitly selected marker, or retain an unresolved coverage gap.

**Evidence:** `docs/ai-dj/work/evidence/P24.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## A15: Implement energy and style constraints

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** A06, P19. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/planner/energy.ts`, `ai-dj/test/planner/energy.test.ts`

**Scope:** Presets and sampled custom energy curve.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Combine AI-selected style with user presets, intensity and custom curve.
2. Recompute future targets only; apply configurable tempo preference/cap separately from half-time interpretation.

**Validate:**

1. Test curve edits, sparse control points, conflicting pins and 3%/6% defaults.
2. Invalid or impossible constraints remain visible rather than quietly ignored.

**Evidence:** `docs/ai-dj/work/evidence/A15.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## A16: Define local lyric matching inputs and scoring

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** A01, A06. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/planner/lyrics.ts`, `docs/ai-dj/work/contracts/lyrics.md`, `ai-dj/test/planner/lyrics.test.ts`

**Scope:** Confidence-aware hook/phrase scoring over prepared timed text.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Use local supplied lyrics/tags; specify optional transcription through ANALYSIS children.
2. Weight exact hook/phrase matches above themes; apply language/user controls and vocal-clash constraints.

**Validate:**

1. Missing/uncertain lyrics cannot make a playable song unavailable.
2. Test matching words with incompatible timing/harmony; lexical match never overrides musical limits.

**Evidence:** `docs/ai-dj/work/evidence/A16.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## A17: Implement contextual local taste inference

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** A06, O06. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/planner/preferences.ts`, `ai-dj/test/planner/preferences.test.ts`

**Scope:** Derive explainable preference proposals, not silent authority changes.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Use ratings, saved settings, set edits and contextual manual actions.
2. Default recent-history window 30 days configurable/off; explicit user constraints win.

**Validate:**

1. One bass cut is not a permanent global bass preference.
2. Test confidence/source evidence, repetition sections, disabled learning and contradictory ratings.

**Evidence:** `docs/ai-dj/work/evidence/A17.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## A18: Implement preference review and reset storage

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** A17, P09. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/sets/preferences.ts`, `ai-dj/test/sets/preferences.test.ts`

**Scope:** Preference versioning and user correction.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Store inspectable evidence and explicit overrides locally.
2. Support edit/delete/reset/learning-off without deleting independent session archives.

**Validate:**

1. Reset removes learned influence from next plan.
2. Source event retention/deletion policy remains visible and never silently reimports a rejected preference.

**Evidence:** `docs/ai-dj/work/evidence/A18.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O12: Define waveform cache and asset boundary

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** A03, O09. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/contracts/waveforms.md`

**Scope:** One local asset format and bounded generation contract.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Specify fingerprinted peaks/overview, time scale and source.
2. Allocate one ANALYSIS child per missing generator/provider, outside MIDI handling.

**Validate:**

1. No decorative waveform can be labeled measured.
2. Missing/stale asset yields placeholder and preserves timeline usability.

**Evidence:** `docs/ai-dj/work/evidence/O12.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O13: Implement opt-in recording state and asset references

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O09, R14. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/session/audio-assets.ts`, `ai-dj/test/session/audio-assets.test.ts`

**Scope:** Local references and explicit recording intent, not an audio engine.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Connect explicit master-recording request to verified host capability; no mic or broadcast default.
2. Record alignment evidence and absent/partial assets without embedding music in MIDI.

**Validate:**

1. Without explicit start, no recording/broadcast command is sent.
2. Missing recording is distinct from missing MIDI history; capability runtime is CAP-RUNTIME work.

**Evidence:** `docs/ai-dj/work/evidence/O13.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O14: Implement retention and recorder degradation policy

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O10. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/session/retention.ts`, `ai-dj/test/session/retention.test.ts`

**Scope:** Local cleanup and low-disk policy.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Keep until delete by default; opt-in age/size cleanup respects pinned sessions.
2. Show usage/warning and pause optional capture before exhausting disk; explicit gaps on failure.

**Validate:**

1. Pinned sessions survive cleanup; interrupted delete is recoverable.
2. Disk failure never blocks MIDI nor produces a false complete-capture flag.

**Evidence:** `docs/ai-dj/work/evidence/O14.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## O15: Implement redacted session sharing

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** O09, O13. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/session/share.ts`, `ai-dj/test/session/share.test.ts`

**Scope:** One JSON sharing/export profile.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Strip unnecessary absolute paths/device identifiers while preserving causal IDs.
2. Package optional selected assets with safe relative paths and bounded stream export.

**Validate:**

1. Reject path traversal/oversized import; validate references.
2. Redaction preserves occurrence/action accounting; import has zero MIDI access.

**Evidence:** `docs/ai-dj/work/evidence/O15.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## U09: Implement musical planning settings

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U03, P19, P20, P21, P22, A15, P23. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/local-ui/planning.ts`, `ai-dj/local-ui/planning.css`

**Scope:** Two bounded panels for pool/sync/save and musical constraints; split if needed.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Expose automatic/user duration, style, tempo and section settings.
2. Wire energy curve/presets, pins, pool, sync and save strategy with clear defaults.

**Validate:**

1. Test infeasible duration and active-transition edit rejection.
2. Offer all user-requested alternatives without confusing pool with performance mode.

**Evidence:** `docs/ai-dj/work/evidence/U09.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## U10: Implement notes ratings and preference review

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U07, A18. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/local-ui/preferences.ts`, `ai-dj/local-ui/preferences.css`

**Scope:** Local notes/ratings and preference controls.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Add timestamped notes and optional ratings to session views.
2. Expose preference evidence/edit/reset and learning-off.

**Validate:**

1. Corrections affect subsequent plan input.
2. History review never issues MIDI; filters retain unknown-origin events.

**Evidence:** `docs/ai-dj/work/evidence/U10.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## U11: Implement asset and history settings

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U07, O12, O13, O14, O15. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/local-ui/assets.ts`, `ai-dj/local-ui/assets.css`

**Scope:** Waveform placeholders, optional audio and export controls.

**Prerequisites:** Waveform ANALYSIS children accepted or missing assets explicitly represented; generation coverage still required at full delivery.

**Perform:**

1. Display verified cached waveforms through bounded asset API; add explicit recording/share settings.
2. Show recording status, gaps, usage, deletion and optional cleanup.

**Validate:**

1. Default no audio/mic/broadcast; history audio playback isolated.
2. Missing asset and low disk remain visible and do not interrupt controls.

**Evidence:** `docs/ai-dj/work/evidence/U11.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## U12: Implement local setup and controller configuration

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** U02, R26. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `ai-dj/local-ui/setup.ts`, `ai-dj/local-ui/setup.css`

**Scope:** One Mac profile/port/device setup screen.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Perform:**

1. Show exact versions/ports and hardware mapping identity, test route and Disarm assignment.
2. Show soft takeover/touch limitations and confirmed versus unknown capabilities.

**Validate:**

1. Reject ambiguous endpoint selection and command-feedback echo route.
2. Setup begins disarmed and does not guess the Hercules model.

**Evidence:** `docs/ai-dj/work/evidence/U12.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

> End of autonomously AI-generated planning cards.
