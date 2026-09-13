// Autonomously AI-generated R15 contract. No reducer or permission executor here.
import type { Generation, MonotonicMs, OpaqueId, PerformanceMode } from "./actions.ts";

export type MixingMode = Exclude<PerformanceMode, "PlaylistOnly">;

export const MODE_DEFAULTS = {
  firstLaunchSelection: "B2B",
  launchDisarmed: true,
  rememberSelectionOnly: true,
  b2bQuietMs: 3_000,
  reconciliationTimeoutMs: 2_000,
} as const;

/** Declarative policy, never evidence that a particular operation is authorized. */
export const MODE_POLICY = {
  AIOnly: { performance: "current-authority-required", manualPriority: "ai" },
  B2B: { performance: "current-authority-required", manualPriority: "human" },
  PlaylistOnly: { performance: "forbidden", manualPriority: "human" },
} as const satisfies Record<PerformanceMode, {
  readonly performance: "current-authority-required" | "forbidden";
  readonly manualPriority: "ai" | "human";
}>;

export interface ModePreference {
  readonly schemaVersion: 1;
  readonly selectedMode: PerformanceMode;
}

export interface ModeVersion {
  readonly sessionId: OpaqueId;
  readonly revision: Generation;
  readonly modeGeneration: Generation;
  readonly armingGeneration: Generation;
}

export type DisarmReason = "startup" | "operator" | "host-loss" | "protocol-fault"
  | "clock-fault" | "suspend-resume" | "reconciliation-failed";

export interface LatchedDisarm {
  readonly kind: "latched";
  readonly latchId: OpaqueId;
  readonly reason: DisarmReason;
  readonly latchedAtMs: MonotonicMs;
}
export type DisarmLatch = LatchedDisarm | { readonly kind: "clear" };

export type ModeStartIntent =
  | { readonly kind: "continue-armed"; readonly priorArmingGeneration: Generation }
  | { readonly kind: "playlist-to-performance"; readonly operatorRequestId: OpaqueId }
  | { readonly kind: "explicit-rearm"; readonly operatorRequestId: OpaqueId; readonly latchId: OpaqueId };

/** References must resolve in trusted current state; callers cannot certify them. */
export interface ModeReconciliation {
  readonly requestId: OpaqueId;
  readonly hostInstanceId: OpaqueId;
  readonly connectionGeneration: Generation;
  readonly capabilityRevision: Generation;
  readonly snapshotId: OpaqueId;
  readonly stateRevision: Generation;
  readonly observedAtMs: MonotonicMs;
  readonly validUntilMs: MonotonicMs;
}

interface ModeSnapshotBase extends ModeVersion {
  readonly schemaVersion: 1;
  readonly clockId: OpaqueId;
  readonly updatedAtMs: MonotonicMs;
}

export type ModeSnapshot = ModeSnapshotBase & (
  | {
      readonly selectedMode: "PlaylistOnly";
      readonly performance: "disabled";
      readonly disarm: DisarmLatch;
    }
  | {
      readonly selectedMode: MixingMode;
      readonly performance: "disarmed";
      readonly disarm: LatchedDisarm;
    }
  | {
      readonly selectedMode: MixingMode;
      readonly performance: "reconciling";
      readonly disarm: DisarmLatch;
      readonly requestId: OpaqueId;
      readonly intent: ModeStartIntent;
    }
  | {
      readonly selectedMode: MixingMode;
      readonly performance: "armed";
      readonly disarm: { readonly kind: "clear" };
      readonly reconciliation: ModeReconciliation;
    }
);

/** Local operator inputs; wire validation, provenance and reducer are separate work. */
export type ModeCommand =
  | { readonly kind: "select-mode"; readonly operatorRequestId: OpaqueId;
      readonly expected: ModeVersion; readonly selectedMode: PerformanceMode }
  | { readonly kind: "rearm"; readonly operatorRequestId: OpaqueId;
      readonly expected: ModeVersion; readonly latchId: OpaqueId }
  // Disarm is immediate and never rejected merely because a UI version is stale.
  | { readonly kind: "disarm"; readonly operatorRequestId: OpaqueId };

export interface ModeReconciliationResult {
  readonly expected: ModeVersion;
  readonly requestId: OpaqueId;
  readonly result:
    | { readonly kind: "ready"; readonly evidence: ModeReconciliation }
    | { readonly kind: "failed"; readonly reason: "not-ready" | "stale-state"
        | "ownership-unresolved" | "cleanup-unresolved" | "context-changed" };
}

/** Required audit facts; not commands to write controls or grant authority. */
export interface ModeBarrier {
  readonly before: ModeVersion;
  readonly after: ModeVersion;
  readonly reason: "selection-changed" | "disarmed" | "rearmed" | "fault";
  readonly invalidatePriorPerformance: true;
  readonly cancelPendingTransitions: true;
  readonly reconcileFromObservedState: true;
  readonly preserveHumanHolds: true;
  readonly preserveOutstandingReleaseObligations: true;
}
// End of autonomously AI-generated R15 contract.
