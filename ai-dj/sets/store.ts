// Autonomously AI-generated local archive storage at the user's request.
import { createHash } from "node:crypto";
import { isAbsolute } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ActualSetHistory, SetDefinition, SetPlan } from "../core/sets.ts";

const APPLICATION_ID = 0x4149444a;
const MAX_BYTES = 16 * 1024 * 1024;
export interface SetArchiveInput {
  readonly definition: SetDefinition;
  readonly plan: SetPlan;
  readonly history: ActualSetHistory;
}
export interface RecoveredSetArchive {
  readonly setId: string;
  readonly storageRevision: number;
  readonly recovery: "disarmed-reconciliation-required";
  readonly source: unknown;
  readonly definition: unknown;
  readonly plan: unknown;
  readonly history: unknown;
}
export class SetStoreError extends Error {
  readonly code: "invalid-input" | "capacity-exceeded" | "version-conflict" | "schema-mismatch" | "corrupt-archive";
  constructor(code: SetStoreError["code"], message: string) { super(message); this.code = code; }
}
function invalid(message: string): never { throw new SetStoreError("invalid-input", message); }
function id(value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}(?![\s\S])/.test(value)) invalid("Invalid set ID");
}
function revision(value: unknown): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) invalid("Invalid revision");
}
function encode(value: unknown): string {
  let nodes = 0;
  const visit = (item: unknown, depth: number): unknown => {
    if (++nodes > 1_000_000 || depth > 64) throw new SetStoreError("capacity-exceeded", "Archive structure limit");
    if (typeof item === "string" && Buffer.byteLength(item) > MAX_BYTES) throw new SetStoreError("capacity-exceeded", "Archive string limit");
    if (item === null || typeof item === "string" || typeof item === "boolean") return item;
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (Array.isArray(item)) {
      if (item.length > 1_000_000 || Object.keys(item).length !== item.length) invalid("Dense bounded JSON array required");
      return Array.from(item, v => visit(v, depth + 1));
    }
    if (typeof item !== "object" || Object.getPrototypeOf(item) !== Object.prototype) invalid("Plain JSON data required");
    return Object.fromEntries(Object.keys(item).sort().map(key => [key, visit((item as Record<string, unknown>)[key], depth + 1)]));
  };
  const text = JSON.stringify(visit(value, 0));
  if (Buffer.byteLength(text) > MAX_BYTES) throw new SetStoreError("capacity-exceeded", "Archive byte limit");
  return text;
}
const hash = (text: string) => createHash("sha256").update(text).digest("hex");

export class SetStore {
  readonly #db: DatabaseSync;
  constructor(path: string) {
    if (!isAbsolute(path)) invalid("Use an absolute companion database path");
    this.#db = new DatabaseSync(path, { timeout: 1_000 });
    try {
      const app = this.#db.prepare("PRAGMA application_id").get()!.application_id;
      const version = this.#db.prepare("PRAGMA user_version").get()!.user_version;
      const tables = this.#db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'").get()!.n;
      if (app === 0 && version === 0 && tables === 0) {
        this.#db.exec(`BEGIN IMMEDIATE;
          CREATE TABLE sources (hash TEXT PRIMARY KEY, json TEXT NOT NULL) STRICT;
          CREATE TABLE revisions (set_id TEXT NOT NULL, revision INTEGER NOT NULL,
            source_hash TEXT NOT NULL REFERENCES sources(hash), payload TEXT NOT NULL,
            payload_hash TEXT NOT NULL, PRIMARY KEY(set_id,revision)) STRICT;
          CREATE TABLE heads (set_id TEXT PRIMARY KEY, revision INTEGER NOT NULL,
            FOREIGN KEY(set_id,revision) REFERENCES revisions(set_id,revision)) STRICT;
          PRAGMA application_id=${APPLICATION_ID}; PRAGMA user_version=1; COMMIT;`);
      } else if (app !== APPLICATION_ID || version !== 1) {
        throw new SetStoreError("schema-mismatch", "Not a supported companion set database");
      }
      this.#db.exec("PRAGMA foreign_keys=ON; PRAGMA synchronous=FULL; PRAGMA journal_mode=WAL;");
    } catch (error) { this.#db.close(); throw error; }
  }

  save(input: SetArchiveInput, expectedStorageRevision: number | null): number {
    const { admittedSource: source, ...definition } = input.definition;
    id(definition.setId);
    revision(definition.revision);
    if (expectedStorageRevision !== null) revision(expectedStorageRevision);
    if (definition.schemaVersion !== 1 || source.schemaVersion !== 1 || source.completeness !== "complete" ||
        input.plan.expectedSet.setId !== definition.setId || input.plan.expectedSet.revision !== definition.revision ||
        input.history.set.setId !== definition.setId || input.history.set.revision !== definition.revision) invalid("Mismatched set context");
    const sourceJson = encode(source);
    const sourceHash = hash(sourceJson);
    const payload = encode({ definition, plan: input.plan, history: input.history });
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const current = this.#db.prepare("SELECT revision FROM heads WHERE set_id=?").get(definition.setId)?.revision ?? null;
      if (current !== expectedStorageRevision) throw new SetStoreError("version-conflict", "Set changed since read");
      const next = current === null ? 1 : Number(current) + 1;
      revision(next);
      this.#db.prepare("INSERT OR IGNORE INTO sources VALUES (?,?)").run(sourceHash, sourceJson);
      if (this.#db.prepare("SELECT json FROM sources WHERE hash=?").get(sourceHash)!.json !== sourceJson) {
        throw new SetStoreError("corrupt-archive", "Source hash collision or modified archive");
      }
      this.#db.prepare("INSERT INTO revisions VALUES (?,?,?,?,?)").run(definition.setId, next, sourceHash, payload, hash(payload));
      this.#db.prepare("INSERT INTO heads VALUES (?,?) ON CONFLICT(set_id) DO UPDATE SET revision=excluded.revision").run(definition.setId, next);
      this.#db.exec("COMMIT");
      return next;
    } catch (error) { this.#db.exec("ROLLBACK"); throw error; }
  }

  load(setId: string, storageRevision?: number): RecoveredSetArchive | null {
    id(setId);
    if (storageRevision !== undefined) revision(storageRevision);
    const row = storageRevision === undefined
      ? this.#db.prepare(`SELECT r.*, s.json AS source FROM heads h
          LEFT JOIN revisions r ON r.set_id=h.set_id AND r.revision=h.revision
          LEFT JOIN sources s ON s.hash=r.source_hash WHERE h.set_id=?`).get(setId)
      : this.#db.prepare(`SELECT r.*, s.json AS source FROM revisions r
          LEFT JOIN sources s ON s.hash=r.source_hash WHERE r.set_id=? AND r.revision=?`).get(setId, storageRevision);
    if (!row) return null;
    if (typeof row.source !== "string" || typeof row.payload !== "string" ||
        Buffer.byteLength(row.source) > MAX_BYTES || Buffer.byteLength(row.payload) > MAX_BYTES ||
        hash(row.source) !== row.source_hash || hash(row.payload) !== row.payload_hash) {
      throw new SetStoreError("corrupt-archive", "Stored content failed integrity check");
    }
    try {
      const payload = JSON.parse(row.payload) as Record<string, unknown>;
      if (!payload || typeof payload !== "object" ||
          Object.keys(payload).sort().join(",") !== "definition,history,plan") throw new Error("Invalid envelope");
      return { setId, storageRevision: Number(row.revision), recovery: "disarmed-reconciliation-required",
        source: JSON.parse(row.source) as unknown, definition: payload.definition, plan: payload.plan, history: payload.history };
    } catch { throw new SetStoreError("corrupt-archive", "Stored JSON is invalid"); }
  }

  close(): void { this.#db.close(); }
}
// End of autonomously AI-generated local archive storage.
