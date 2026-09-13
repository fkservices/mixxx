// Autonomously AI-generated tests at the user's request.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHostHarness } from "./harness.ts";
const fragment = readFileSync(new URL("../../hosts/mixxx/fragments/play-volume.js", import.meta.url), "utf8");

test("play setters are desired booleans on both decks, never toggles or cue presses", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ", true);
  assert.equal(h.connections.size, 4); assert.equal(h.writes.length, 0);
  for (const channel of [0, 1]) for (const value of [0, 1, 64, 127, 127, 0]) h.mapping.input(channel, 0x20, value, 0xb0 + channel, `[Channel${channel + 1}]`);
  assert.deepEqual(h.writes.map(x => x.value), [0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0]);
  assert.ok(h.writes.every(x => x.api === "setValue" && x.key === "play"));
  assert.equal(h.packets.length, 0); assert.equal(h.timers.size, 0);
});

test("every volume byte uses normalized parameter travel for each fixed deck", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ", false);
  for (const channel of [0, 1]) for (let value = 0; value < 128; value++) {
    h.mapping.input(channel, 0x21, value, 0xb0 + channel, `[Channel${channel + 1}]`);
    assert.deepEqual(h.writes.at(-1), { api: "setParameter", group: `[Channel${channel + 1}]`, key: "volume", value: value / 127 });
  }
  assert.equal(h.writes.length, 256);
});

test("zero does not mean absent; unavailable controls cannot write and reconnect needs reinit", () => {
  const h = createHostHarness([fragment]);
  h.setAvailable("[Channel1]", "play", false); h.setAvailable("[Channel2]", "volume", false);
  h.mapping.init("AI DJ", false); assert.equal(h.connections.size, 2);
  h.mapping.input(0, 0x20, 127, 0xb0, "[Channel1]");
  h.mapping.input(1, 0x21, 127, 0xb1, "[Channel2]"); assert.equal(h.writes.length, 0);
  h.mapping.input(0, 0x21, 0, 0xb0, "[Channel1]"); assert.equal(h.writes.length, 1);
  h.setAvailable("[Channel1]", "volume", false);
  h.mapping.input(0, 0x21, 127, 0xb0, "[Channel1]"); assert.equal(h.writes.length, 1);
  h.setAvailable("[Channel1]", "volume", true);
  h.mapping.input(0, 0x21, 127, 0xb0, "[Channel1]"); assert.equal(h.writes.length, 1);
  h.mapping.init("AI DJ", false);
  h.mapping.input(0, 0x21, 127, 0xb0, "[Channel1]"); assert.equal(h.writes.length, 2);
  h.mapping.shutdown(); assert.equal(h.connections.size, 0);
  h.mapping.input(0, 0x21, 0, 0xb0, "[Channel1]"); assert.equal(h.writes.length, 2);
});

test("ignores feedback, wrong routes, mismatched groups/channels and malformed values", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ", true);
  for (const args of [
    [0, 0x20, 127, 0xb8, "[Channel1]"], [0, 0x20, 127, 0xb0, "[Channel2]"],
    [1, 0x20, 127, 0xb0, "[Channel1]"], [0, 0x22, 127, 0xb0, "[Channel1]"],
    [0, 0x23, 127, 0x90, "[Channel1]"], [0, 0x20, -1, 0xb0, "[Channel1]"],
    [0, 0x20, 128, 0xb0, "[Channel1]"], [0, 0x20, 1.5, 0xb0, "[Channel1]"],
    [0, 0x20, NaN, 0xb0, "[Channel1]"], [0, 0x20, Infinity, 0xb0, "[Channel1]"],
  ] as const) h.mapping.input(args[0], args[1], args[2], args[3], args[4]);
  assert.equal(h.writes.length, 0);
});

test("connection exceptions disable only the affected declared route", () => {
  const h = createHostHarness([fragment]);
  h.evaluate(`var originalConnect = engine.makeConnection; engine.makeConnection = function(g, k, cb) { if(g === '[Channel1]' && k === 'play') throw new Error('missing'); return originalConnect(g,k,cb); };`);
  h.mapping.init("AI DJ", false);
  h.mapping.input(0, 0x20, 127, 0xb0, "[Channel1]");
  h.mapping.input(1, 0x20, 127, 0xb1, "[Channel2]");
  assert.equal(h.writes.length, 1); assert.equal(h.writes[0]?.group, "[Channel2]");
  h.mapping.shutdown(); assert.equal(h.connections.size, 0);
});
