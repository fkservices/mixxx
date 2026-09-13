// Autonomously AI-generated P01 contracts; data only, not runtime validation or host access.
import type { Generation, ObservationReference, OpaqueId, TrackIdentity } from "./actions.ts";

export interface PlaylistIdentity {
  readonly libraryId: OpaqueId;
  readonly playlistId: OpaqueId;
}

export type PlaylistSourceVersion =
  | { readonly kind: "native-revision"; readonly value: OpaqueId }
  | { readonly kind: "ordered-content-sha256"; readonly value: string };

export interface PlaylistSnapshotIdentity {
  readonly playlist: PlaylistIdentity;
  readonly snapshotId: OpaqueId;
  readonly sourceVersion: PlaylistSourceVersion;
  readonly hostInstanceId: OpaqueId;
  readonly connectionGeneration: Generation;
}

/** Ordinal identifies a row only inside its immutable snapshot, never across edits. */
export interface PlaylistEntry {
  readonly ordinal: number;
  readonly track: TrackIdentity;
  readonly nativeRowIdentity:
    | { readonly kind: "verified-stable"; readonly rowId: OpaqueId }
    | { readonly kind: "unavailable" };
}

export interface CompletePlaylistSnapshot extends PlaylistSnapshotIdentity {
  readonly schemaVersion: 1;
  readonly completeness: "complete";
  readonly entries: readonly PlaylistEntry[];
  readonly totalOccurrences: number;
  readonly readEvidence: ObservationReference;
}

export type PlaylistReadResult =
  | CompletePlaylistSnapshot
  | (PlaylistSnapshotIdentity & {
      readonly schemaVersion: 1;
      readonly completeness: "incomplete";
      readonly entries: readonly PlaylistEntry[];
      readonly reason: "page-missing" | "source-changed" | "capacity-exceeded" | "identity-ambiguous";
    })
  | { readonly completeness: "unavailable"; readonly playlist: PlaylistIdentity;
      readonly reason: "not-found" | "unsupported" | "disconnected" | "unknown" };

export interface PlaylistRowReference {
  readonly snapshot: PlaylistSnapshotIdentity;
  readonly ordinal: number;
}

/** An explicit save request is not proof of permission, successful write or current source. */
export interface PlaylistSaveRequest {
  readonly requestId: OpaqueId;
  readonly operatorIntentId: OpaqueId;
  readonly expected: PlaylistSnapshotIdentity;
  readonly orderedTracks: readonly TrackIdentity[];
}

export type PlaylistSaveOutcome =
  | { readonly status: "observed"; readonly requestId: OpaqueId;
      readonly snapshot: CompletePlaylistSnapshot }
  | { readonly status: "conflict"; readonly requestId: OpaqueId;
      readonly current: CompletePlaylistSnapshot }
  | { readonly status: "reconciliation-required"; readonly requestId: OpaqueId;
      readonly reason: "write-result-unknown" | "read-back-incomplete" | "identity-changed" }
  | { readonly status: "rejected"; readonly requestId: OpaqueId; readonly reason: string };
// End of autonomously AI-generated P01 playlist contracts.
