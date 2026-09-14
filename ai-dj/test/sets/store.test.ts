// Autonomously AI-generated durable archive tests at the user's request.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import type { CompletePlaylistSnapshot } from "../../core/playlists.ts";
import { SetStore, SetStoreError, type SetArchiveInput } from "../../sets/store.ts";

function fixture(): SetArchiveInput {
  const source: CompletePlaylistSnapshot = {
    schemaVersion: 1, completeness: "complete", playlist: { libraryId: "lib", playlistId: "list" },
    snapshotId: "snap", sourceVersion: { kind: "native-revision", value: "v1" },
    hostInstanceId: "host", connectionGeneration: 1, totalOccurrences: 3,
    readEvidence: { observationId: "read", hostInstanceId: "host", connectionGeneration: 1, stateRevision: 1 },
    entries: ["a", "b", "a"].map((trackId, ordinal) => ({ ordinal, track: { libraryId: "lib", trackId },
      nativeRowIdentity: { kind: "verified-stable", rowId: `row${ordinal}` } })),
  };
  const set = { setId: "set1", revision: 0 };
  const snapshot = { playlist: source.playlist, snapshotId: source.snapshotId, sourceVersion: source.sourceVersion,
    hostInstanceId: source.hostInstanceId, connectionGeneration: source.connectionGeneration };
  const occurrences = source.entries.map((e, ordinal) => ({ setId: set.setId, occurrenceId: `o${ordinal}`, generation: 0,
    track: e.track, origin: { kind: "source-playlist" as const, row: { snapshot, ordinal } } }));
  const identities = occurrences.map(({ setId, occurrenceId, generation }) => ({ setId, occurrenceId, generation }));
  return {
    definition: { ...set, schemaVersion: 1, admittedSource: source, occurrences, musicPool: "playlist-only", duration: { kind: "ai-selected" } },
    plan: { planId: "plan", revision: 0, expectedSet: set, plannedOrder: [identities[2]!, identities[0]!, identities[1]!],
      fixedOccurrences: [], sections: [], pins: [], duplicates: [], feasibility: { kind: "unknown", reason: "Not analyzed" } },
    history: { set, revision: 0, spans: [], completeness: "reconciliation-required", outcomes: identities.map((occurrence, i) => ({
      occurrence, revision: 0, outcome: i === 0 ? { status: "interrupted", spanIds: [] } : i === 1 ?
        { status: "reconciliation-required", reason: "load-result-unknown", retainedSpanIds: [] } : { status: "pending" },
    })) },
  };
}
function temporary(run: (path: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "ai-dj-set-store-"));
  try { run(join(dir, "sets.sqlite")); } finally { rmSync(dir, { recursive: true, force: true }); }
}
const errorCode = (code: SetStoreError["code"]) => (error: unknown) => error instanceof SetStoreError && error.code === code;

test("reopen reordered A/B/A with interrupted and unknown history; old revisions remain immutable", () => temporary(path => {
  const input = fixture();
  let store = new SetStore(path);
  assert.equal(store.save(input, null), 1);
  const first = store.load("set1")!;
  assert.equal(first.recovery, "disarmed-reconciliation-required");
  assert.deepEqual(first.source, input.definition.admittedSource);
  assert.deepEqual(first.plan, input.plan);
  assert.deepEqual(first.history, input.history);
  const next = { ...input, plan: { ...input.plan, revision: 1, plannedOrder: [...input.plan.plannedOrder].reverse() } };
  assert.equal(store.save(next, 1), 2);
  store.close();
  store = new SetStore(path);
  assert.deepEqual(store.load("set1", 1), first);
  assert.deepEqual(store.load("set1")!.plan, next.plan);
  assert.deepEqual(store.load("set1")!.source, first.source);
  store.close();
}));

test("stale writer loses compare-and-swap without changing source or head", () => temporary(path => {
  const a = new SetStore(path), b = new SetStore(path);
  try {
    a.save(fixture(), null);
    b.save(fixture(), 1);
    assert.throws(() => a.save(fixture(), 1), errorCode("version-conflict"));
    assert.throws(() => a.save(fixture(), null), errorCode("version-conflict"));
    assert.equal(a.load("set1")!.storageRevision, 2);
  } finally { a.close(); b.close(); }
}));

test("failed transaction rolls back newly inserted source and revision", () => temporary(path => {
  const store = new SetStore(path);
  store.save(fixture(), null);
  const before = store.load("set1");
  const db = new DatabaseSync(path);
  db.exec("CREATE TRIGGER reject_head BEFORE UPDATE ON heads BEGIN SELECT RAISE(ABORT,'injected failure'); END");
  const input = fixture();
  const changed = { ...input, definition: { ...input.definition, admittedSource: { ...input.definition.admittedSource, snapshotId: "different" } } };
  assert.throws(() => store.save(changed, 1), /injected failure/);
  assert.deepEqual(store.load("set1"), before);
  assert.equal(db.prepare("SELECT count(*) AS n FROM sources").get()!.n, 1);
  assert.equal(db.prepare("SELECT count(*) AS n FROM revisions").get()!.n, 1);
  db.close(); store.close();
}));

test("killed writer with an uncommitted head update leaves last committed revision recoverable", () => temporary(path => {
  const store = new SetStore(path); store.save(fixture(), null);
  const before = store.load("set1"); store.close();
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import {DatabaseSync} from 'node:sqlite';
    const db=new DatabaseSync(process.argv[1]);
    db.exec("BEGIN IMMEDIATE; INSERT INTO revisions SELECT set_id,999,source_hash,payload,payload_hash FROM revisions WHERE revision=1; UPDATE heads SET revision=999;");
    process.kill(process.pid,'SIGKILL');`, path], { timeout: 5_000 });
  assert.equal(child.signal, "SIGKILL", child.stderr.toString());
  const recovered = new SetStore(path);
  assert.deepEqual(recovered.load("set1"), before);
  recovered.close();
}));

test("unknown database versions and corrupted payloads are explicit errors", () => temporary(path => {
  const store = new SetStore(path); store.save(fixture(), null);
  const db = new DatabaseSync(path);
  db.exec("UPDATE revisions SET payload='{}'");
  assert.throws(() => store.load("set1"), errorCode("corrupt-archive"));
  store.close();
  db.exec("PRAGMA user_version=2"); db.close();
  assert.throws(() => new SetStore(path), errorCode("schema-mismatch"));
}));

test("non-JSON and mismatched revisions cannot overwrite saved data", () => temporary(path => {
  const store = new SetStore(path), input = fixture();
  store.save(input, null);
  assert.throws(() => store.save({ ...input, plan: { ...input.plan, expectedSet: { setId: "other", revision: 0 } } }, 1), errorCode("invalid-input"));
  assert.throws(() => store.save({ ...input, definition: { ...input.definition, duration: { kind: "fixed", durationMs: NaN } } }, 1), errorCode("invalid-input"));
  assert.equal(store.load("set1")!.storageRevision, 1);
  store.close();
}));

test("a broken current-revision pointer is corruption, not a missing set", () => temporary(path => {
  const store = new SetStore(path); store.save(fixture(), null);
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys=OFF; UPDATE heads SET revision=999;");
  assert.throws(() => store.load("set1"), errorCode("corrupt-archive"));
  assert.equal(store.load("absent"), null);
  assert.equal(store.load("set1", 999), null);
  db.close(); store.close();
}));
test("an unrelated database is refused without adding companion tables", () => temporary(path => {
  const db = new DatabaseSync(path);
  db.exec("CREATE TABLE library (id INTEGER); INSERT INTO library VALUES (7)");
  assert.throws(() => new SetStore(path), errorCode("schema-mismatch"));
  assert.equal(db.prepare("SELECT id FROM library").get()!.id, 7);
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table'").get()!.n, 1);
  db.close();
}));
// End of autonomously AI-generated durable archive tests.
