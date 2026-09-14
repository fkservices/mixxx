// Autonomously AI-generated import regression tests at the user's request.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { importM3u8, M3U8_LIMITS } from "../../catalog/m3u8.ts";

async function fixture(run: (dir: string, playlist: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), "ai-dj-m3u8-"));
  try { await run(dir, join(dir, "set.m3u8")); }
  finally { await rm(dir, { recursive: true, force: true }); }
}

test("Unicode, BOM, native bare EXTINF, relative paths and repeated occurrences", async () => {
  await fixture(async (dir, playlist) => {
    const song = "café 🎵.mp3";
    await writeFile(join(dir, song), "fixture, not playable audio");
    await writeFile(playlist, `\ufeff#EXTM3U\r\n#EXTINF\r\n${song}\r\n#EXTINF:5,Another title\r\n${song}\r\n`);
    const result = await importM3u8(playlist);
    assert.equal(result.status, "imported");
    if (result.status !== "imported") return;
    assert.equal(result.entries.length, 2);
    assert.deepEqual(result.entries.map(e => e.sourceLine), [3, 5]);
    assert.deepEqual(result.entries.map(e => e.ordinal), [0, 1]);
    assert.equal(result.entries[0]!.file.status, "found");
    assert.deepEqual(result.entries[0]!.file, result.entries[1]!.file);
    assert.notEqual(result.entries[0]!.occurrenceId, result.entries[1]!.occurrenceId);
    assert(result.entries.every(e => e.identity === "unresolved"));
    assert.equal(result.requiresIdentityResolution, true);
    assert.equal(result.provenance.kind, "m3u8-import");
    assert.deepEqual(await importM3u8(playlist), result);
  });
});

test("all unresolved entries remain in order; local file URLs and exact spaces work", async () => {
  await fixture(async (dir, playlist) => {
    const spaced = join(dir, " song %.mp3 ");
    await writeFile(spaced, "fixture");
    await mkdir(join(dir, "folder"));
    await writeFile(playlist, [" song %.mp3 ", pathToFileURL(spaced).href, "missing.mp3", "folder",
      "https://example.invalid/a.mp3", "C:\\Music\\a.mp3", "file://remote/music.mp3", "file:///bad%zz.mp3"].join("\r"));
    const result = await importM3u8(playlist);
    assert.equal(result.status, "imported");
    if (result.status !== "imported") return;
    assert.deepEqual(result.entries.map(e => e.file.status),
      ["found", "found", "missing", "not-file", "unresolvable", "unresolvable", "unresolvable", "unresolvable"]);
    assert.equal(result.entries[0]!.reference, " song %.mp3 ");
    assert.deepEqual(result.entries[0]!.file, result.entries[1]!.file);
    assert.equal(new Set(result.entries.map(e => e.occurrenceId)).size, 8);
  });
});

test("malformed or streaming lists reject atomically rather than return a partial set", async () => {
  await fixture(async (_dir, playlist) => {
    for (const [data, reason] of [
      [Buffer.from([0xc3, 0x28]), "invalid-utf8"],
      [Buffer.from("valid.mp3\nbad\0.mp3"), "malformed-list"],
      [Buffer.from("#EXTM3U\n#EXT-X-TARGETDURATION:10\nsegment.ts"), "streaming-playlist-unsupported"],
    ] as const) {
      await writeFile(playlist, data);
      assert.deepEqual(await importM3u8(playlist), { status: "rejected", reason });
    }
  });
});

test("byte, line, occurrence and comment-count limits reject without truncation", async () => {
  await fixture(async (_dir, playlist) => {
    for (const data of [Buffer.alloc(M3U8_LIMITS.bytes + 1, 32),
      "x".repeat(M3U8_LIMITS.lineBytes + 1), "a.mp3\n".repeat(M3U8_LIMITS.entries + 1),
      "#\n".repeat(M3U8_LIMITS.lines + 1)]) {
      await writeFile(playlist, data);
      assert.deepEqual(await importM3u8(playlist), { status: "rejected", reason: "capacity-exceeded" });
    }
  });
});

test("empty/headerless inputs and source errors remain distinct", async () => {
  await fixture(async (dir, playlist) => {
    assert.deepEqual(await importM3u8("relative.m3u8"), { status: "rejected", reason: "invalid-source-path" });
    assert.deepEqual(await importM3u8(playlist), { status: "rejected", reason: "unreadable-playlist" });
    assert.deepEqual(await importM3u8(dir), { status: "rejected", reason: "not-a-file" });
    await writeFile(playlist, "#EXTM3U\n\n# comment\n");
    const empty = await importM3u8(playlist);
    assert.equal(empty.status, "imported");
    if (empty.status === "imported") assert.equal(empty.entries.length, 0);
    await writeFile(playlist, "missing.mp3");
    const one = await importM3u8(playlist);
    assert.equal(one.status, "imported");
    if (one.status === "imported") assert.equal(one.entries.length, 1);
  });
});
// End of autonomously AI-generated import regression tests.
