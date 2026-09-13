// Autonomously AI-generated tests at the user's request.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHostHarness } from "./harness.ts";
const fragment = readFileSync(new URL("../../hosts/mixxx/fragments/fader-cue.js", import.meta.url), "utf8");

test("crossfader uses every centered parameter value without writing raw -1..1", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ", false);
  for (let v = 0; v < 128; v++) {
    h.mapping.input(2, 0x24, v, 0xb2, "[Master]");
    assert.deepEqual(h.writes.at(-1), { api: "setParameter", group: "[Master]", key: "crossfader", value: v <= 64 ? v / 128 : (v - 1) / 126 });
  }
  assert.equal(h.writes[0]?.value, 0); assert.equal(h.writes[64]?.value, 0.5); assert.equal(h.writes[127]?.value, 1);
  h.mapping.shutdown(); assert.equal(h.writes.length, 128); assert.equal(h.connections.size, 0);
});

test("both decks accept every Note On and Note Off velocity with fixed cue_preview edges", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ", false);
  for (const channel of [0, 1]) for (const opcode of [0x90, 0x80]) for (let v = 0; v < 128; v++) {
    h.mapping.input(channel, 0x23, v, opcode + channel, `[Channel${channel + 1}]`);
    assert.deepEqual(h.writes.at(-1), { api: "setValue", group: `[Channel${channel + 1}]`, key: "cue_preview", value: opcode === 0x90 && v > 0 ? 1 : 0 });
  }
  assert.equal(h.writes.length, 512); h.mapping.shutdown(); assert.equal(h.writes.length, 512);
  assert.equal(h.packets.length, 0);
});

test("shutdown releases only locally requested cue presses and repeated shutdown does not repeat writes", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ", false);
  h.mapping.input(0, 0x23, 127, 0x90, "[Channel1]"); h.mapping.input(0, 0x23, 64, 0x90, "[Channel1]");
  h.mapping.input(1, 0x23, 127, 0x91, "[Channel2]");
  h.mapping.input(1, 0x23, 0, 0x91, "[Channel2]");
  h.mapping.shutdown(); assert.deepEqual(h.writes.map(x => x.value), [1, 1, 1, 0, 0]);
  assert.equal(h.writes.at(-1)?.group, "[Channel1]");
  h.mapping.shutdown(); assert.equal(h.writes.length, 5); assert.equal(h.connections.size, 0);
  h.mapping.input(0, 0x23, 127, 0x90, "[Channel1]"); assert.equal(h.writes.length, 5);
});

test("unavailable routes never write and pending disconnected cue makes cleanup explicitly fail", () => {
  const h = createHostHarness([fragment]); h.setAvailable("[Master]", "crossfader", false); h.setAvailable("[Channel2]", "cue_preview", false);
  h.mapping.init("AI DJ", false);
  h.mapping.input(2, 0x24, 64, 0xb2, "[Master]"); h.mapping.input(1, 0x23, 127, 0x91, "[Channel2]"); assert.equal(h.writes.length, 0);
  h.mapping.input(0, 0x23, 127, 0x90, "[Channel1]"); h.setAvailable("[Channel1]", "cue_preview", false);
  assert.equal(h.mapping.shutdown(), false); assert.equal(h.writes.length, 1); assert.equal(h.connections.size, 0);
  assert.throws(() => h.mapping.init("AI DJ", false), /cleanup failed/);
});

test("one cue cleanup exception does not prevent release of the other deck", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ", false);
  for (const ch of [0, 1]) h.mapping.input(ch, 0x23, 127, 0x90 + ch, `[Channel${ch + 1}]`);
  h.evaluate(`var originalSet = engine.setValue; engine.setValue = function(g,k,v) { if(g === '[Channel1]' && v === 0) throw new Error('release failure'); return originalSet(g,k,v); };`);
  assert.equal(h.mapping.shutdown(), false);
  assert.deepEqual(h.writes.at(-1), { api: "setValue", group: "[Channel2]", key: "cue_preview", value: 0 });
  assert.equal(h.connections.size, 0);
});

test("malformed data, feedback and mismatched cue/fader routes are ignored", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ", false);
  const cases = [[0, 0x23, 127, 0xb8, "[Channel1]"], [0, 0x23, 127, 0x90, "[Channel2]"], [1, 0x23, 127, 0x90, "[Channel2]"], [0, 0x24, 64, 0xb2, "[Master]"], [2, 0x24, 64, 0xb2, "[Channel1]"]] as const;
  for (const a of cases) h.mapping.input(a[0],a[1],a[2],a[3],a[4]);
  for (const v of [-1,128,0.5,NaN,Infinity]) h.mapping.input(0,0x23,v,0x90,"[Channel1]");
  assert.equal(h.writes.length, 0); h.mapping.shutdown(); assert.equal(h.writes.length, 0);
});

test("a press that throws after writing still leaves a local shutdown release obligation", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ", false);
  h.evaluate(`var originalSet = engine.setValue; engine.setValue = function(g,k,v) { originalSet(g,k,v); if(v === 1) throw new Error('uncertain press'); };`);
  assert.throws(() => h.mapping.input(0,0x23,127,0x90,"[Channel1]"), /uncertain press/);
  assert.equal(h.mapping.shutdown(), true);
  assert.deepEqual(h.writes.map(x => x.value), [1,0]);
});
