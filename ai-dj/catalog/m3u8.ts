// Autonomously AI-generated local playlist importer at the user's request.
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, open, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const M3U8_LIMITS = Object.freeze({ bytes: 8 * 1024 * 1024, entries: 10_000, lines: 100_000, lineBytes: 16_384 });
export type ImportFailure = "invalid-source-path" | "unreadable-playlist" | "not-a-file" |
  "capacity-exceeded" | "invalid-utf8" | "malformed-list" | "streaming-playlist-unsupported";
export interface ImportedOccurrence {
  readonly occurrenceId: string;
  readonly ordinal: number;
  readonly sourceLine: number;
  readonly reference: string;
  readonly identity: "unresolved";
  readonly file:
    | { readonly status: "found"; readonly path: string; readonly canonicalPath: string }
    | { readonly status: "missing" | "not-file" | "unreadable"; readonly path: string }
    | { readonly status: "unresolvable"; readonly reason: "unsupported-url" | "foreign-path" | "invalid-file-url" };
}
export type M3u8ImportResult =
  | { readonly status: "rejected"; readonly reason: ImportFailure }
  | { readonly status: "imported"; readonly provenance: {
      readonly kind: "m3u8-import"; readonly sourcePath: string; readonly contentSha256: string;
      readonly importId: string;
    }; readonly entries: readonly ImportedOccurrence[]; readonly requiresIdentityResolution: true };

type Reference = { reference: string; sourceLine: number };
type ParseResult = { references: Reference[] } | { reason: ImportFailure };
function parse(bytes: Uint8Array): ParseResult {
  if (bytes.byteLength > M3U8_LIMITS.bytes) return { reason: "capacity-exceeded" };
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { return { reason: "invalid-utf8" }; }
  const references: Reference[] = [];
  let sourceLine = 0;
  for (const match of text.matchAll(/([^\r\n]*)(?:\r\n|\r|\n|$)/gu)) {
    if (match[0] === "") break;
    const line = match[1]!;
    sourceLine++;
    if (sourceLine > M3U8_LIMITS.lines) return { reason: "capacity-exceeded" };
    if (Buffer.byteLength(line, "utf8") > M3U8_LIMITS.lineBytes) return { reason: "capacity-exceeded" };
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(line)) return { reason: "malformed-list" };
    if (line.startsWith("#EXT-X-")) return { reason: "streaming-playlist-unsupported" };
    if (!line.trim() || line.startsWith("#")) continue;
    if (references.length === M3U8_LIMITS.entries) return { reason: "capacity-exceeded" };
    references.push({ reference: line, sourceLine });
  }
  return { references };
}

async function inspect(reference: string, sourcePath: string): Promise<ImportedOccurrence["file"]> {
  if (/^[a-z]:[\\/]/iu.test(reference) || reference.startsWith("\\\\")) {
    return { status: "unresolvable", reason: "foreign-path" };
  }
  let path: string;
  if (/^[a-z][a-z\d+.-]*:/iu.test(reference)) {
    if (!/^file:/iu.test(reference)) return { status: "unresolvable", reason: "unsupported-url" };
    try {
      const url = new URL(reference);
      if (url.search || url.hash) throw new Error("Not a plain file URL");
      path = fileURLToPath(url);
      if (path.includes("\0")) throw new Error("Invalid file path");
    } catch { return { status: "unresolvable", reason: "invalid-file-url" }; }
  } else path = resolve(dirname(sourcePath), reference);
  try {
    if (!(await stat(path)).isFile()) return { status: "not-file", path };
    await access(path, constants.R_OK);
    return { status: "found", path, canonicalPath: await realpath(path) };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return { status: code === "ENOENT" || code === "ENOTDIR" ? "missing" : "unreadable", path };
  }
}

export async function importM3u8(sourcePath: string): Promise<M3u8ImportResult> {
  if (typeof sourcePath !== "string" || !isAbsolute(sourcePath) || sourcePath.includes("\0")) {
    return { status: "rejected", reason: "invalid-source-path" };
  }
  let bytes: Buffer;
  try {
    const file = await open(sourcePath, constants.O_RDONLY | constants.O_NONBLOCK);
    try {
      if (!(await file.stat()).isFile()) return { status: "rejected", reason: "not-a-file" };
      bytes = Buffer.alloc(M3U8_LIMITS.bytes + 1);
      let length = 0;
      while (length < bytes.length) {
        const read = await file.read(bytes, length, bytes.length - length, null);
        if (read.bytesRead === 0) break;
        length += read.bytesRead;
      }
      bytes = bytes.subarray(0, length);
    } finally { await file.close(); }
  } catch { return { status: "rejected", reason: "unreadable-playlist" }; }
  const parsed = parse(bytes);
  if ("reason" in parsed) return { status: "rejected", reason: parsed.reason };
  const contentSha256 = createHash("sha256").update(bytes).digest("hex");
  const importId = createHash("sha256").update(sourcePath).update("\0").update(bytes).digest("hex");
  const entries: ImportedOccurrence[] = [];
  for (const row of parsed.references) {
    const ordinal = entries.length;
    entries.push({ ...row, ordinal, occurrenceId: `${importId}:${ordinal}`, identity: "unresolved",
      file: await inspect(row.reference, sourcePath) });
  }
  return { status: "imported", provenance: { kind: "m3u8-import", sourcePath, contentSha256, importId },
    entries, requiresIdentityResolution: true };
}
// End of autonomously AI-generated local playlist importer.
