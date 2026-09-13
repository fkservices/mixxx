// Autonomously AI-generated tests at the user's request.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { encodeConventionalCommand, encodeConventionalWire, type ConventionalWireControl } from "../../midi/conventional-encode.ts";

function action(deckId = "left") {
  return {
    sessionId: "session1", actionId: "action1", sequence: 1, schemaVersion: 1,
    timing: { clockId: "clock1", requestedAtMs: 100, notBeforeMs: 100, dispatchByMs: 200, observeByMs: 300 },
    preconditions: { hostInstanceId: "host1", connectionGeneration: 1, capabilityRevision: 1, snapshotId: "snapshot1", stateRevision: 1, stateObservedAtMs: 99, maxStateAgeMs: 1000,
      decks: [{ deckId, deckGeneration: 1, trackGeneration: 1, binding: { kind: "loaded", track: { libraryId: "library1", trackId: "track1" }, occurrence: null } }], conditions: [] as unknown[] },
    authority: { kind: "performance", mode: "B2B", modeGeneration: 1, armingGeneration: 1, authorityRevision: 1, planId: "plan1", planRevision: 1, cancellationGroupId: "cancel1", cancellationGeneration: 1, transition: null,
      ownership: [{ resource: { kind: "deck", deckId, control: "transport" }, ownershipGeneration: 1, grantId: "grant1" }] as unknown[] },
    operation: { kind: "desired-state", action: "deck.set_playing", deckId, args: { playing: true } } as Record<string, unknown>,
  };
}

test("encodes all frozen golden vectors with canonical boolean and cue bytes", () => {
  const profile = JSON.parse(readFileSync(new URL("../../hosts/mixxx/conventional-profile.json", import.meta.url), "utf8"));
  assert.equal(profile.schemaVersion, 2);
  assert.equal(profile.controls.length, 9);
  for (const c of profile.controls) for (const e of c.examples) {
    const continuous = c.command.encoding.includes("7bit");
    const result = encodeConventionalWire(c.id, continuous ? e.decodedValue : Boolean(e.decodedValue));
    // Canonical boolean true is 127; cue false is Note Off rather than zero Note On.
    const status = c.command.encoding === "note-gate" && !e.decodedValue ? c.command.releaseStatus : c.command.status;
    assert.deepEqual(result, [status, c.command.address, continuous ? e.data : e.decodedValue ? 127 : 0]);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(c.semantic.schemaVersion, c.id.endsWith(".sync") ? 2 : 1);
    if (c.id.endsWith(".sync") || c.id.endsWith(".cue")) assert.equal(c.semantic.status, "extension-needed");
  }
});

test("preserves every quantized volume and centered crossfader value without clamping", () => {
  for (let v = 0; v < 128; v++) {
    for (const deck of [1, 2]) assert.equal(encodeConventionalWire(`deck-${deck}.volume` as ConventionalWireControl, v / 127)?.[2], v);
    const n = v <= 64 ? v / 128 : (v - 1) / 126;
    assert.equal(encodeConventionalWire("mixer.crossfader", n)?.[2], v);
  }
  assert.deepEqual(encodeConventionalWire("mixer.crossfader", 0.5), [0xb2, 0x24, 64]);
  for (const v of [-0.001, 1.001, NaN, Infinity, -Infinity, true]) assert.equal(encodeConventionalWire("deck-1.volume", v), null);
  for (const control of ["deck-1.play", "deck-1.sync", "deck-1.cue"] as const) assert.equal(encodeConventionalWire(control, 1), null);
  for (const control of ["__proto__", "constructor", "deck-3.play", "deck-1.eq.low"]) assert.equal(encodeConventionalWire(control as ConventionalWireControl, true), null);
});

test("serializes independent cue edges on both decks, including explicit zero Note On", () => {
  for (const deck of [1, 2]) {
    const control = `deck-${deck}.cue` as ConventionalWireControl;
    assert.deepEqual(encodeConventionalWire(control, true), [0x90 + deck - 1, 0x23, 127]);
    assert.deepEqual(encodeConventionalWire(control, false), [0x80 + deck - 1, 0x23, 0]);
    assert.deepEqual(encodeConventionalWire(control, false, "note-on-zero"), [0x90 + deck - 1, 0x23, 0]);
    assert.deepEqual(encodeConventionalWire(control, true), [0x90 + deck - 1, 0x23, 127]);
  }
  assert.equal(encodeConventionalWire("deck-1.play", true, "note-on-zero"), null);
});

test("validates semantic envelopes and explicit deck routing before returning unproven command bytes", () => {
  for (const [deckId, status] of [["left", 0xb0], ["right", 0xb1]] as const) {
    const a = action(deckId);
    const result = encodeConventionalCommand(a, ["left", "right"]);
    assert.equal(result.ok, true);
    if (result.ok) { assert.deepEqual(result.packet, [status, 0x20, 127]); assert.equal(result.authorization, "unproven"); assert.equal(Object.isFrozen(result), true); }
    a.operation = { kind: "desired-state", action: "deck.set_parameter", deckId, args: { parameter: "volume", normalizedValue: 0.5 } };
    a.authority.ownership = [{ resource: { kind: "deck-parameter", deckId, parameter: "volume" }, ownershipGeneration: 1, grantId: "g1" }];
    const volume = encodeConventionalCommand(a, ["left", "right"]);
    assert.ok(volume.ok); if (volume.ok) assert.deepEqual(volume.packet, [status, 0x21, 64]);
  }
  const a = action(); a.operation = { kind: "desired-state", action: "mixer.set_parameter", args: { parameter: "crossfader", normalizedValue: 0.5 } };
  a.authority.ownership = [{ resource: { kind: "mixer-parameter", parameter: "crossfader" }, ownershipGeneration: 1, grantId: "g1" }];
  const mixer = encodeConventionalCommand(a, ["left", "right"]); assert.ok(mixer.ok); if (mixer.ok) assert.deepEqual(mixer.packet, [0xb2, 0x24, 64]);
  assert.deepEqual(encodeConventionalCommand(action("other"), ["left", "right"]), { ok: false, reason: "unmapped-deck" });
  assert.equal(encodeConventionalCommand({ ...action(), schemaVersion: 99 }, ["left", "right"]).ok, false);
  assert.deepEqual(encodeConventionalCommand(action(), ["left", "left"]), { ok: false, reason: "invalid-deck-bindings" });
  let invoked = false; const routes = ["left", "right"] as [string, string]; Object.defineProperty(routes, "0", { get() { invoked = true; return "left"; } });
  assert.equal(encodeConventionalCommand(action(), routes).ok, false); assert.equal(invoked, false);
});

test("does not encode valid out-of-profile EQ or production cue without its host lease guard", () => {
  const a = action(); a.operation = { kind: "desired-state", action: "deck.set_parameter", deckId: "left", args: { parameter: "eq.low", normalizedValue: 0.5 } };
  a.authority.ownership = [{ resource: { kind: "deck-parameter", deckId: "left", parameter: "eq.low" }, ownershipGeneration: 1, grantId: "g1" }];
  assert.deepEqual(encodeConventionalCommand(a, ["left", "right"]), { ok: false, reason: "unsupported-action" });
  a.operation = { kind: "momentary", action: "deck.cue_press", deckId: "left", args: { marker: "main", lease: { obligationId: "lease1", pressActionId: "action1", pressGeneration: 1 }, releaseByMs: 250 } };
  a.preconditions.conditions = [{ kind: "cue-available", deckId: "left", marker: "main" }];
  a.authority.ownership = ["cue", "jog", "transport"].map(control => ({ resource: { kind: "deck", deckId: "left", control }, ownershipGeneration: 1, grantId: `g-${control}` }));
  assert.deepEqual(encodeConventionalCommand(a, ["left", "right"]), { ok: false, reason: "extension-needed", operationSpecId: "mixxx.cue-lease-guard.v1" });
});

test("valid sync enable and disable remain guarded despite fully specified wire encoding", () => {
  for (const enabled of [true, false]) {
    const a = action(); a.schemaVersion = 2;
    let serial = 0; const expected = (value: unknown) => ({ value, observationId: `obs-${serial++}` });
    a.preconditions.conditions = [{ kind: "sync-context", topologyEvidenceId: "topology1", topologyRevision: 1,
      participants: [{ deckId: "left", syncEnabled: expected(false), syncMode: expected("none"), playing: expected(false), audible: expected(false), passthrough: expected(false), vinylControl: expected(false), quantize: expected(true),
        eligibility: { kind: "loaded", syncEligible: expected(true), beatGridReady: expected(true), fileBpm: expected(120), effectiveBpm: expected(120), rateRatio: expected(1), beatPhase: expected(0) } }],
      leader: { kind: "none" }, leaderObservationId: "leader1", internalClockBpm: expected(120), pendingSyncChange: expected(false), effectPolicy: { policyId: "policy1", maxTempoChangeRatio: 0.06, maxPhaseDisplacementBeats: 0 } }];
    a.authority.ownership = [{ resource: { kind: "deck-sync", deckId: "left" }, ownershipGeneration: 1, grantId: "g1" }, { resource: { kind: "sync-engine" }, ownershipGeneration: 1, grantId: "g2" }];
    a.operation = { kind: "desired-state", action: "deck.set_sync_enabled", deckId: "left", args: { enabled } };
    assert.deepEqual(encodeConventionalCommand(a, ["left", "right"]), { ok: false, reason: "extension-needed", operationSpecId: "mixxx.sync-guard.v1" });
  }
});

test("a valid cue cleanup envelope cannot bypass the host lease guard", () => {
  const a = action(); const lease = { obligationId: "lease1", pressActionId: "press1", pressGeneration: 1 };
  a.operation = { kind: "momentary", action: "deck.cue_release", deckId: "left", args: { marker: "main", lease } };
  const candidate = { ...a, authority: { kind: "release-cleanup", lease } };
  assert.deepEqual(encodeConventionalCommand(candidate, ["left", "right"]), { ok: false, reason: "extension-needed", operationSpecId: "mixxx.cue-lease-guard.v1" });
  const invalid = action(); invalid.operation = { kind: "desired-state", action: "deck.set_parameter", deckId: "left", args: { parameter: "volume", normalizedValue: Infinity } };
  const rejected = encodeConventionalCommand(invalid, ["left", "right"]);
  assert.equal(rejected.ok, false); if (!rejected.ok) assert.equal(rejected.reason, "invalid-action");
});
