// Autonomously AI-generated P01 contracts; no scheduler, persistence, reducer or authorization executor.
import type {
  Generation, MonotonicMs, ObservationReference, OccurrenceIdentity, OpaqueId,
  PerformanceMode, TrackIdentity,
} from "./actions.ts";
import type { CompletePlaylistSnapshot, PlaylistRowReference } from "./playlists.ts";

export interface SetVersion {
  readonly setId: OpaqueId;
  readonly revision: Generation;
}

export interface SetOccurrence extends OccurrenceIdentity {
  readonly track: TrackIdentity;
  readonly origin:
    | { readonly kind: "source-playlist"; readonly row: PlaylistRowReference }
    | { readonly kind: "library-addition"; readonly selectedBy: "ai" | "human";
        readonly admissionEventId: OpaqueId };
}

export type MusicPoolPolicy = "playlist-only" | "free-library";
export type SetDurationPolicy =
  | { readonly kind: "ai-selected" }
  | { readonly kind: "fixed"; readonly durationMs: number }
  | { readonly kind: "range"; readonly minimumMs: number; readonly maximumMs: number };

export interface SetDefinition extends SetVersion {
  readonly schemaVersion: 1;
  readonly admittedSource: CompletePlaylistSnapshot;
  readonly occurrences: readonly SetOccurrence[];
  readonly musicPool: MusicPoolPolicy;
  readonly duration: SetDurationPolicy;
}

export interface TrackSection {
  readonly startMs: number;
  readonly endMs: number;
}

/** Marker positions are verified read inputs; selecting them never edits a native cue. */
export interface NativeCueReference {
  readonly track: TrackIdentity;
  readonly markerId: OpaqueId;
  readonly markerRevision: OpaqueId;
  readonly positionMs: number;
  readonly evidence: ObservationReference;
}

export interface MeaningfulSectionPolicy {
  readonly policyId: OpaqueId;
  readonly revision: Generation;
  readonly selectedBy: "ai" | "human";
  readonly minimumAudibleMs: number;
  readonly minimumSelectedCoverageRatio: number;
}

export interface PlannedSection {
  readonly sectionId: OpaqueId;
  readonly occurrence: OccurrenceIdentity;
  readonly selectedBy: "ai" | "human";
  readonly trackContentVersion: OpaqueId;
  readonly section: TrackSection;
  readonly cueInputs: readonly NativeCueReference[];
  readonly meaningfulPolicy: MeaningfulSectionPolicy;
}

export interface SetPin {
  readonly kind: "opener" | "closer" | "next";
  readonly occurrence: OccurrenceIdentity;
  readonly operatorRequestId: OpaqueId;
}

export interface DuplicateNotice {
  readonly track: TrackIdentity;
  readonly occurrences: readonly [OccurrenceIdentity, OccurrenceIdentity, ...OccurrenceIdentity[]];
  readonly severity: "information";
  readonly policy: "preserve-all-prefer-unplayed-sections";
}

export interface SetPlan {
  readonly planId: OpaqueId;
  readonly revision: Generation;
  readonly expectedSet: SetVersion;
  readonly plannedOrder: readonly OccurrenceIdentity[];
  readonly fixedOccurrences: readonly OccurrenceIdentity[];
  readonly sections: readonly PlannedSection[];
  readonly pins: readonly SetPin[];
  readonly duplicates: readonly DuplicateNotice[];
  readonly feasibility:
    | { readonly kind: "feasible"; readonly evidenceId: OpaqueId }
    | { readonly kind: "operator-choice-required";
        readonly conflicts: readonly ["duration" | "pins" | "sections" | "capacity", ...("duration" | "pins" | "sections" | "capacity")[]] }
    | { readonly kind: "unknown"; readonly reason: string };
}

/** Physical source position can move backward or loop; section coverage uses the union, not elapsed time. */
export interface ObservedPlaybackSpan {
  readonly spanId: OpaqueId;
  readonly track: TrackIdentity;
  readonly occurrence: OccurrenceIdentity | null;
  readonly deckId: OpaqueId;
  readonly trackGeneration: Generation;
  readonly clockId: OpaqueId;
  readonly startAtMs: MonotonicMs;
  readonly endAtMs: MonotonicMs;
  readonly sourceSection: TrackSection;
  readonly direction: "forward" | "reverse";
  readonly output: "main-audible" | "headphones-only" | "silent" | "unknown";
  readonly evidence: readonly [ObservationReference, ...ObservationReference[]];
}

export interface MeaningfulParticipation {
  readonly selectedSection: PlannedSection;
  readonly spanIds: readonly [OpaqueId, ...OpaqueId[]];
  readonly audibleMs: number;
  readonly selectedCoverageRatio: number;
  readonly decisionEvidenceId: OpaqueId;
}

export type OccurrenceOutcome =
  | { readonly status: "pending" }
  | { readonly status: "loaded" | "pre-listened"; readonly evidence: ObservationReference }
  | { readonly status: "playing" | "interrupted"; readonly spanIds: readonly OpaqueId[] }
  | { readonly status: "played"; readonly participation: MeaningfulParticipation }
  | { readonly status: "skipped"; readonly advance: "next-playable-or-end";
      readonly reason:
        | { readonly kind: "operator"; readonly operatorRequestId: OpaqueId }
        | { readonly kind: "confirmed-unavailable";
            readonly code: "missing" | "unreadable" | "unplayable";
            readonly evidence: ObservationReference } }
  | { readonly status: "reconciliation-required";
      readonly reason: "load-result-unknown" | "track-identity-ambiguous" | "playback-gap"
        | "source-changed" | "manual-replacement-unresolved";
      readonly retainedSpanIds: readonly OpaqueId[] };

export interface OccurrenceRecord {
  readonly occurrence: OccurrenceIdentity;
  readonly revision: Generation;
  readonly outcome: OccurrenceOutcome;
}

/** Ordered by observed start, allowing overlaps; manual external tracks may have no set occurrence. */
export interface ActualSetHistory {
  readonly set: SetVersion;
  readonly revision: Generation;
  readonly spans: readonly ObservedPlaybackSpan[];
  readonly outcomes: readonly OccurrenceRecord[];
  readonly completeness: "complete" | "reconciliation-required";
}

export interface SourceChangeReconciliation {
  readonly reconciliationId: OpaqueId;
  readonly expectedSet: SetVersion;
  readonly previous: CompletePlaylistSnapshot;
  readonly current: CompletePlaylistSnapshot;
  readonly status: "operator-choice-required";
  readonly matches: readonly {
    readonly occurrence: OccurrenceIdentity;
    readonly currentRow: PlaylistRowReference;
    readonly proof: "same-verified-native-row-and-track" | "unique-track-in-both-snapshots";
  }[];
  readonly removedFromSource: readonly OccurrenceIdentity[];
  readonly addedRows: readonly PlaylistRowReference[];
  readonly ambiguousOccurrences: readonly OccurrenceIdentity[];
  readonly ambiguousRows: readonly PlaylistRowReference[];
}

export type SourceChangeDecision =
  | { readonly kind: "keep-admitted-set"; readonly reconciliationId: OpaqueId;
      readonly expectedSet: SetVersion; readonly operatorRequestId: OpaqueId }
  | { readonly kind: "adopt-explicit-changes"; readonly reconciliationId: OpaqueId;
      readonly expectedSet: SetVersion; readonly operatorRequestId: OpaqueId;
      readonly retainOccurrences: readonly OccurrenceIdentity[];
      readonly explicitSkipOccurrences: readonly OccurrenceIdentity[];
      readonly admitRows: readonly PlaylistRowReference[] };

/** Declarative permission requirements only; mode/generation/freshness checks remain mandatory. */
export type SetModePermission =
  | { readonly mode: Exclude<PerformanceMode, "PlaylistOnly">;
      readonly organize: "allowed"; readonly savePlaylist: "explicit-versioned-operator-request";
      readonly loadOrMix: "current-performance-authority-required" }
  | { readonly mode: "PlaylistOnly"; readonly organize: "allowed";
      readonly savePlaylist: "explicit-versioned-operator-request"; readonly loadOrMix: "forbidden" };
// End of autonomously AI-generated P01 set contracts.

// Autonomously AI-generated P01 completion assessment; cross-record invariants require validation.
export type TerminalOccurrenceOutcome = Extract<OccurrenceOutcome, { readonly status: "played" | "skipped" }>;
export type SetCompletionAssessment =
  | { readonly kind: "in-progress"; readonly remaining: readonly OccurrenceIdentity[] }
  | { readonly kind: "reconciliation-required";
      readonly unresolved: readonly [OccurrenceIdentity, ...OccurrenceIdentity[]] }
  | { readonly kind: "complete";
      readonly terminalRecords: readonly {
        readonly occurrence: OccurrenceIdentity;
        readonly outcome: TerminalOccurrenceOutcome;
      }[];
      readonly endedBecause: "all-accounted-for" | "no-playable-occurrences-remain" };
// End of autonomously AI-generated P01 completion assessment.
