# Playlist occurrence and set contracts

> Autonomously AI-generated P01 contract. Types and normative invariants only; no persistence, runtime parser, playlist access, planner or completion reducer is implemented here.

## Identity and coherent reads

`playlists.ts` reuses the library-scoped `TrackIdentity` and host observation references from F06. A playlist is `(libraryId, playlistId)`. A read is identified by its immutable snapshot ID, host instance, connection generation and source version. A native revision is opaque; an adapter content version is SHA256 of canonical ordered row identities and track identities, including multiplicity. A title, file path, row count or unordered track set is not a version. Snapshot IDs are not substituted for source versions.

A complete snapshot requires one coherent source generation, all pages, exact total count, and zero-based contiguous ordinals. An empty complete playlist is distinct from an unavailable playlist. The track library must equal the snapshot library. An incomplete, changed, unsupported, capacity-limited or ambiguous read cannot be admitted as a complete set. Larger inputs receive an explicit capacity assessment, never truncation.

A native row identity is stable only with verified host semantics; otherwise the snapshot ordinal is local to that snapshot. Neither an ordinal nor the track ID alone can establish which repeated occurrence survived an edit. Connection changes invalidate pending reads/saves even if the playlist name remains the same.

## A/B/A keeps three obligations

`sets.ts` reuses `OccurrenceIdentity` rather than inventing another action binding. Every source row becomes a distinct `(setId, occurrenceId, generation)` with its own origin row. Generations and revisions are finite, safe, nonnegative integers; IDs use the existing bounded opaque-ID rules. An occurrence never changes its track under the same identity. A new admission receives a fresh identity; old generations and old plans cannot bind it.

Example in library L: source rows `[A, B, A]` become `[a1, b1, a2]`. A legal planned order `[a2, a1, b1]` retains exactly those three identities. `[a1, b1]`, `[a1, a1, b1]`, and an A from another library are invalid substitutions. Source ordinals remain 0/1/2 when the plan changes. Completion of `a1` does not complete `a2`.

At a fixed set revision, `plannedOrder` is an exact permutation of all admitted occurrence identities, including their generations. No implicit additions, removals, track substitutions or duplicate identity entries are allowed. `fixedOccurrences` contains every terminal or active occurrence and only admitted identities. A replan cannot move those entries or replace their selected sections; it changes eligible future work only. A new explicit admission changes set revision and requires a new complete plan.

`actual` history is separate: observed start order and overlaps need not equal planned order. Clock IDs must match before times are compared; events on different clocks require explicit alignment. Headphone preview, a successful load, a sent play message or a deck's play flag alone never establishes meaningful main-output participation.

## Sections, duplicates and pins

Each selected section belongs to one exact occurrence and track-content version. Times are finite milliseconds with `0 <= start < end <= verified track duration`. Unknown duration/analysis, stale content, invalid cue bounds or a policy that cannot fit must remain unresolved, not receive an invented section. Existing native cue/hotcue markers are read inputs with provenance; using a cue is distinct from saving or changing that cue. AI suggestions remain local until explicit supported Save cues work occurs later.

AI can choose sections and duration; users can define sections, fixed duration, or duration ranges. Fixed durations are positive; ranges satisfy `0 < minimum <= maximum`. Meaningful participation uses an explicitly versioned policy with `minimumAudibleMs > 0` and `0 < minimumSelectedCoverageRatio <= 1`. These are configurable policy values, not a new hard-coded musical duration. User constraints and pins win over AI choices. An impossible time/all-occurrence/section combination requires operator choice before starting.

Duplicate notices are informational and refer to at least two distinct admitted occurrences of the same library-scoped track. Preserve both; prefer musically useful unplayed sections using actual section history. This is a soft preference, not deletion, a permanent replay ban, or permission to invent heard sections. Current-session history is primary; optional recent history follows the existing defaults.

Opener, closer and next pins bind occurrences, never bare track IDs. Each has explicit operator provenance. References must be admitted/current, pin conflicts must be surfaced, and an infeasible pin cannot be silently dropped. Next means the next eligible future occurrence after active work; a pin does not bypass B2B holds, disarm or loading guards. Plan changes cannot rewrite an active transition.

## Actual participation and terminal accounting

Each observed span binds a track, optional occurrence, deck/track generation, clock, interval, source section, direction and host evidence. Span IDs are unique. Main audibility must be independently supported; muted, headphone-only and unknown output do not count as heard. Source coverage is the union of qualifying intervals intersected with the selected section, so looping the same second does not multiply section coverage. Audible duration excludes overlaps counted twice within the same occurrence. Uncertain timing, identity, source discontinuities or feedback gaps require reconciliation; thresholds alone cannot cure missing evidence.

`played` requires a current matching selected section and policy, nonempty verified span IDs, sufficient audible duration and coverage, and a traceable decision. All spans must resolve to that same occurrence and track; another occurrence's playback cannot satisfy it. `loaded`, `pre-listened`, `playing` and `interrupted` are not terminal outcomes. Partial audible spans survive interruption. A displaced B2B occurrence remains pending/interrupted for later, without immediately reloading over the human's new track.

`skipped` requires either explicit operator intent or conclusive missing/unreadable/unplayable evidence. It preserves the occurrence and reason and advances the logical selection to the next playable occurrence, or ends/reports when none remain. Advancing a logical cursor is not permission to load or play: performance mode/authority checks remain mandatory. A timeout, unknown load result, ambiguous identity, source-row deletion or lost feedback is not confirmed unavailability; retain it as reconciliation-required and do not blindly retry or skip.

All admitted occurrences require exactly one current outcome record. A complete assessment requires exactly one terminal record per admitted identity and no outstanding ambiguity, active span, unknown outcome or relevant capture gap. The terminal-record multiset must equal the admitted multiset. Historical outcome revisions remain history; they do not create duplicate current outcomes. `ActualSetHistory.completeness` describes evidence coverage, not whether the set has finished. Empty sources receive an explicit no-playable result; they are not a successful musical set.

## Mode and music-pool boundaries

AI Only and B2B may organize plans, but load/mixing operations still require current R15/F06 authority, generations, fresh state, capability support and guards. AI Only may recover from observed manual changes; it cannot replay stale loads. B2B respects a human replacement and associated holds and replans eligible future work. These contracts do not grant authority. Imported history and plan records are read-only data and cannot arm or dispatch actions.

Playlist Only allows read/organization and explicit version-checked native playlist saves. AI deck loads, cue triggers and performance writes remain forbidden. Disarm does not prevent safe organization. Saving requires explicit current operator intent, expected source version and exact ordered read-back including duplicates; sent or timed-out writes are not successful saves and cannot be retried without reconciliation. No direct Mixxx database writes are introduced.

Music pool is independent of performance mode. Playlist-only limits AI admission to the supplied pool; free-library permits explicitly recorded additional admissions. Human external tracks can appear in actual history with `occurrence: null`, without enabling free AI selection or satisfying/deleting original obligations. A user may explicitly admit one later. Any addition rechecks duration and pins and increments set revision.

## Source edits and reconciliation

An admitted source snapshot is immutable. A later read produces a separate reconciliation proposal, even when a track multiset happens to match. Compare the same library/playlist with current host context. Verified native row-and-track identity or a track occurring exactly once in each coherent snapshot can support a match; repeated tracks without stable row IDs remain ambiguous. Track retargeting under a reused row ID is not a match. Matches must be injective; every old/new row is classified exactly once as matched, removed/added, or ambiguous.

The operator can keep the admitted set or adopt explicit changes against the current set revision. Adoption partitions affected existing obligations into retained or explicitly skipped entries and separately admits selected new rows with fresh occurrence identities. It never deletes played history or silently cancels original obligations. Already-terminal outcomes remain immutable; active changes require the normal transition barrier. Stale decisions or another concurrent source edit require another reconciliation. Source edits alone never mutate an active deck, prove a song unavailable, save a playlist or arm the application.

## Validation boundary

These are erased TypeScript declarations. They constrain shapes and distinguish complete/incomplete reads, terminal/nonterminal outcomes and mode permissions. Cross-field rules above require later runtime validators and reducers. P02 and subsequent playlist cards own those implementations, native read/load/save operations and host tests. Compile fixtures can show that missing evidence and forbidden union variants are rejected; they cannot prove MIDI, persistence, audible completion or hostile JSON admission.

> End of autonomously AI-generated P01 contract.
