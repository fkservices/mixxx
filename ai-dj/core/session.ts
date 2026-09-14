// Autonomously AI-generated O01 recording contracts; data only, no recorder or authority.
import type { ActionOutcome, Generation, OpaqueId, OccurrenceIdentity, SemanticAction, TrackIdentity } from "./actions.ts";
import type { ModeSnapshot } from "./modes.ts";
import type { CompletePlaylistSnapshot } from "./playlists.ts";
import type { ActualSetHistory, ObservedPlaybackSpan, SetPlan } from "./sets.ts";
import type { ObservedStateMessage, StateSnapshot } from "./state.ts";

export interface CaptureStream { readonly streamId: OpaqueId; readonly epoch: Generation }
export interface ClockStamp { readonly clockId: OpaqueId; readonly epoch: Generation; readonly ms: number }
export interface ClockCalibration {
  readonly calibrationId: OpaqueId;
  readonly from: Pick<ClockStamp, "clockId" | "epoch">;
  readonly to: Pick<ClockStamp, "clockId" | "epoch">;
  readonly anchorFromMs: number;
  readonly offsetMinimumMs: number;
  readonly offsetMaximumMs: number;
  readonly maximumDriftPpm: number;
  readonly validFromMs: number;
  readonly validThroughMs: number;
  readonly evidenceEventIds: readonly [OpaqueId, ...OpaqueId[]];
}
export type RecordedActor =
  | { readonly actor: "unknown" }
  | { readonly actor: "ai" | "human" | "host-automation";
      readonly confidence: "confirmed" | "inferred";
      readonly basis: "captured-endpoint" | "instrumented-dispatch" | "request-link" | "heuristic";
      readonly evidenceEventIds: readonly [OpaqueId, ...OpaqueId[]] };
export interface DecoderProfileReference { readonly profileId: OpaqueId; readonly revision: Generation; readonly sha256: string }
export interface RecordedDecoderProfile {
  readonly reference: DecoderProfileReference;
  readonly deviceModel: string;
  readonly hostBuild: string;
  readonly mappingVersion: string;
  readonly bindings: readonly ({ readonly controlId: OpaqueId; readonly label: string; readonly unit: string } & (
    | { readonly kind: "cc-absolute"; readonly channelZeroBased: number; readonly controller: number;
        readonly minimum: number; readonly maximum: number; readonly inverted: boolean;
        readonly curve?: "linear" | "centered-7bit" }
    | { readonly kind: "cc-boolean"; readonly channelZeroBased: number; readonly controller: number }
    | { readonly kind: "cc-relative"; readonly channelZeroBased: number; readonly controller: number;
        readonly encoding: "twos-complement" | "binary-offset" | "sign-magnitude";
        readonly multiplier: number }
    | { readonly kind: "cc14"; readonly channelZeroBased: number; readonly msbController: number;
        readonly lsbController: number; readonly pairingWindowMs: number;
        readonly minimum: number; readonly maximum: number; readonly inverted: boolean;
        readonly curve?: "linear" | "centered-14bit" }
    | { readonly kind: "note"; readonly channelZeroBased: number; readonly note: number;
        readonly noteOnZero: "release" }
  ))[];
}
export interface SessionEventEnvelope {
  readonly schemaVersion: 1;
  readonly recordingId: OpaqueId;
  readonly eventId: OpaqueId;
  readonly recorderSequence: number;
  readonly stream: CaptureStream;
  readonly producerSequence: number;
  readonly producerId: OpaqueId;
  readonly deviceInstanceId: OpaqueId | null;
  readonly capturedAt: ClockStamp;
  readonly ingestedAt: ClockStamp;
  readonly actor: RecordedActor;
  readonly track: TrackIdentity | null;
  readonly occurrence: OccurrenceIdentity | null;
  readonly hostContext: { readonly hostInstanceId: OpaqueId; readonly connectionGeneration: Generation;
    readonly configurationGeneration: Generation; readonly capabilityRevision: Generation } | null;
  readonly relatedEventIds: readonly OpaqueId[];
}

export type RecordedGesture =
  | { readonly kind: "absolute"; readonly controlId: OpaqueId; readonly value: number; readonly unit: string }
  | { readonly kind: "relative"; readonly controlId: OpaqueId; readonly delta: number; readonly unit: string }
  | { readonly kind: "trigger"; readonly controlId: OpaqueId; readonly edge: "press" | "release" | "pulse" };
export interface RecordedOwnership {
  readonly controlIds: readonly [OpaqueId, ...OpaqueId[]];
  readonly generation: Generation;
  readonly owner: "ai" | "human" | "unowned" | "unknown";
  readonly state: "held" | "eligible" | "reclaimed" | "released" | "unknown";
  readonly reason: "touch" | "manual-transport" | "manual-load" | "quiet-and-later-transition" | "operator" | "disarm" | "unknown";
  readonly transitionId: OpaqueId | null;
  readonly transitionOrdinal: number | null;
  readonly quietSince: ClockStamp | null;
  readonly evidenceEventIds: readonly OpaqueId[];
}
export type SessionEventPayload =
  | { readonly kind: "raw-midi"; readonly endpointInstanceId: OpaqueId;
      readonly direction: "ai-outbound" | "physical-ingress" | "host-feedback";
      readonly stage: "attempted" | "submitted" | "received";
      readonly framing: "complete-message" | "fragment" | "unknown";
      readonly bytes: readonly number[]; readonly decoder: DecoderProfileReference | null }
  | { readonly kind: "decoded-gesture"; readonly gestureId: OpaqueId;
      readonly rawEventIds: readonly [OpaqueId, ...OpaqueId[]]; readonly decoder: DecoderProfileReference;
      readonly gesture: RecordedGesture; readonly label: string }
  | { readonly kind: "ai-intent"; readonly intentId: OpaqueId; readonly planId: OpaqueId;
      readonly planRevision: Generation; readonly explanation: string; readonly proposedActionIds: readonly OpaqueId[] }
  | { readonly kind: "semantic-action"; readonly intentEventId: OpaqueId | null; readonly action: SemanticAction }
  | { readonly kind: "action-outcome"; readonly outcome: ActionOutcome }
  | { readonly kind: "action-stage"; readonly actionId: OpaqueId; readonly attemptId: OpaqueId;
      readonly stage: "requested" | "sent" | "accepted" | "observed" | "rejected" | "uncertain" | "cancelled";
      readonly basis: "host-receipt" | "state-only" | "local" | "unknown";
      readonly evidenceEventIds: readonly OpaqueId[]; readonly reason: string | null }
  | { readonly kind: "host-observation"; readonly message: ObservedStateMessage }
  | { readonly kind: "mode"; readonly snapshot: ModeSnapshot }
  | { readonly kind: "ownership"; readonly ownership: RecordedOwnership }
  | { readonly kind: "source-playlist"; readonly snapshot: CompletePlaylistSnapshot }
  | { readonly kind: "set-plan"; readonly plan: SetPlan }
  | { readonly kind: "track-span"; readonly span: ObservedPlaybackSpan }
  | { readonly kind: "set-history"; readonly history: ActualSetHistory }
  | { readonly kind: "clock-calibration"; readonly calibration: ClockCalibration }
  | { readonly kind: "capture-gap"; readonly affectedStream: CaptureStream;
      readonly missing: { readonly kind: "known"; readonly firstSequence: number; readonly lastSequence: number }
        | { readonly kind: "unknown" };
      readonly start: ClockStamp | null; readonly end: ClockStamp | null;
      readonly reason: "queue-overflow" | "disk-failure" | "disconnect" | "sequence-gap" | "crash-tail" | "unknown" }
  | { readonly kind: "recording-state"; readonly state: "started" | "paused" | "resumed" | "degraded" | "ended";
      readonly reason: string; readonly musicStopped: "not-implied" };
export type SessionEvent = SessionEventEnvelope & SessionEventPayload;

export interface SessionVisualSnapshot {
  readonly schemaVersion: 1;
  readonly snapshotId: OpaqueId;
  readonly recordingId: OpaqueId;
  readonly throughRecorderSequence: number;
  readonly streamCursors: readonly { readonly stream: CaptureStream; readonly throughSequence: number }[];
  readonly observedState: StateSnapshot | null;
  readonly mode: ModeSnapshot | null;
  readonly ownership: readonly RecordedOwnership[];
  readonly setPlan: SetPlan | null;
  readonly setHistory: ActualSetHistory | null;
  readonly openGapEventIds: readonly OpaqueId[];
  readonly access: "visualization-only";
}
export interface SessionChunkDescriptor {
  readonly chunkId: OpaqueId;
  readonly format: "ndjson";
  readonly schemaVersion: 1;
  readonly byteLength: number;
  readonly sha256: string;
  readonly firstRecorderSequence: number;
  readonly lastRecorderSequence: number;
  readonly eventCount: number;
  readonly sealed: boolean;
}
export interface SessionManifest {
  readonly schemaVersion: 1;
  readonly recordingId: OpaqueId;
  readonly wallAnchor: { readonly utc: string; readonly stamp: ClockStamp };
  readonly decoderProfiles: readonly RecordedDecoderProfile[];
  readonly chunks: readonly SessionChunkDescriptor[];
  readonly snapshotIds: readonly OpaqueId[];
  readonly captureCompleteness: "complete-within-declared-scope" | "gaps-present" | "unknown";
  readonly captureScope: readonly { readonly endpointInstanceId: OpaqueId; readonly stream: CaptureStream;
    readonly boundary: string; readonly verificationEvidenceIds: readonly OpaqueId[] }[];
}
export interface SessionJsonExport {
  readonly format: "ai-dj-session";
  readonly schemaVersion: 1;
  readonly access: "history-only";
  readonly manifest: SessionManifest;
  readonly snapshots: readonly SessionVisualSnapshot[];
  readonly events: readonly SessionEvent[];
}
// End of autonomously AI-generated O01 recording contracts.
