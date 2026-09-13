// Autonomously AI-generated tests at the user's request.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHostHarness } from "./harness.ts";
const fragment = readFileSync(new URL("../../hosts/mixxx/fragments/sync.js", import.meta.url), "utf8");
const read = (h: ReturnType<typeof createHostHarness>, deck: number) => JSON.parse(h.evaluate(`JSON.stringify(AIDJ.readSyncState(${deck}))`));

test("sync writes desired booleans for both decks without pulses, cleanup or forced modes", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ", false);
  for (const channel of [0,1]) for (const value of [0,64,127,127,0]) h.mapping.input(channel,0x22,value,0xb0+channel,`[Channel${channel+1}]`);
  assert.deepEqual(h.writes.map(x => x.value), [0,1,1,1,0,0,1,1,1,0]);
  assert.ok(h.writes.every(x => x.api === "setValue" && x.key === "sync_enabled"));
  h.mapping.shutdown(); assert.equal(h.writes.length,10); assert.equal(h.connections.size,0);
  assert.equal(h.timers.size,0); assert.equal(h.packets.length,0);
});

test("host observation is independent of requested state, including rejected enable", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ",false);
  h.evaluate(`var requested = []; engine.setValue = function(g,k,v) { requested.push([g,k,v]); };`);
  h.mapping.input(0,0x22,127,0xb0,"[Channel1]");
  assert.equal(read(h,1).enabled,false);
  h.values.set(JSON.stringify(["[Channel1]","sync_enabled"]),1);
  assert.deepEqual(read(h,1),{kind:"control-value",deck:1,enabled:true,actor:"unknown",correlation:"none"});
  h.mapping.input(0,0x22,0,0xb0,"[Channel1]");
  assert.equal(read(h,1).enabled,true);
  assert.equal(read(h,2).enabled,false);
});

test("rapid explicit on/off produces only requested setter calls and does not claim musical rollback", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ",false);
  h.mapping.input(0,0x22,127,0xb0,"[Channel1]"); h.mapping.input(0,0x22,0,0xb0,"[Channel1]");
  assert.deepEqual(h.writes.map(x=>x.value),[1,0]);
  assert.deepEqual(Object.keys(read(h,1)).sort(),["actor","correlation","deck","enabled","kind"]);
  h.mapping.init("AI DJ",false); h.mapping.shutdown(); assert.equal(h.writes.length,2);
});

test("unavailable, invalid and failed observations stay unknown rather than false", () => {
  const h = createHostHarness([fragment]);
  assert.equal(read(h,1).kind,"unknown"); h.setAvailable("[Channel2]","sync_enabled",false); h.mapping.init("AI DJ",false);
  h.mapping.input(1,0x22,127,0xb1,"[Channel2]"); assert.equal(h.writes.length,0); assert.equal(read(h,2).kind,"unknown");
  for (const value of [0.5,2,-1,NaN,Infinity]) {h.values.set(JSON.stringify(["[Channel1]","sync_enabled"]),value); assert.equal(read(h,1).reason,"invalid-host-value");}
  h.evaluate(`engine.getValue = function() {throw new Error('read failure');};`);
  assert.equal(read(h,1).reason,"host-read-failed");
  assert.equal(read(h,3).reason,"unsupported-deck");
  h.mapping.shutdown(); assert.equal(read(h,1).reason,"connection-unavailable");
});

test("sync rejects clock, note edges, mode addresses, wrong groups and malformed command values", () => {
  const h = createHostHarness([fragment]); h.mapping.init("AI DJ",false);
  for (const status of [0xf8,0x90,0x80,0xb8,0xb1]) h.mapping.input(0,0x22,127,status,"[Channel1]");
  for (const address of [0x20,0x21,0x23,0x73]) h.mapping.input(0,address,127,0xb0,"[Channel1]");
  h.mapping.input(0,0x22,127,0xb0,"[Channel2]");
  for (const value of [-1,128,0.5,NaN,Infinity]) h.mapping.input(0,0x22,value,0xb0,"[Channel1]");
  assert.equal(h.writes.length,0); assert.equal(h.packets.length,0);
});
