// Autonomously AI-generated assembly integration tests.
import assert from "node:assert/strict";
import test from "node:test";
import { buildMapping, renderMapping } from "../../tools/build-mapping.ts";
import { createHostHarness } from "./harness.ts";

test("checked-in bundle is reproducible and assembly preserves bootstrap boundaries",async()=>{
  await buildMapping(true);
  const base="prefix\n// AI-DJ-FRAGMENTS-BEGIN\nold\n// AI-DJ-FRAGMENTS-END\nsuffix\n";
  const parts=["a","b","c","d"];
  const output=renderMapping(base,parts);
  assert.equal(renderMapping(output,parts),output);
  assert.ok(output.startsWith("prefix\n"));assert.ok(output.endsWith("suffix\n"));
  assert.throws(()=>renderMapping(base,["a"]));
  assert.throws(()=>renderMapping("no markers",parts));
  assert.throws(()=>renderMapping(base+"// AI-DJ-FRAGMENTS-END",parts));
  assert.throws(()=>renderMapping("// AI-DJ-FRAGMENTS-END\n// AI-DJ-FRAGMENTS-BEGIN",parts));
});

test("assembled mapping initializes all modules and routes each family to host and feedback",()=>{
  const h=createHostHarness([],true);h.mapping.init("AI DJ",false);
  assert.equal(h.connections.size,18);assert.equal(h.timers.size,1);assert.equal(h.packets.length,18);
  assert.ok(h.logs.some(x=>x.includes("initialized; fragments=4")));
  const vectors = [[0,0x20,127,0xb0,"[Channel1]",0xb8,0x20,127], [1,0x21,64,0xb1,"[Channel2]",0xb9,0x21,64], [2,0x24,64,0xb2,"[Master]",0xba,0x24,64], [0,0x23,127,0x90,"[Channel1]",0xb8,0x23,127], [1,0x22,127,0xb1,"[Channel2]",0xb9,0x22,127]] as const;
  for(const v of vectors){h.packets.length=0;const before=h.writes.length;h.mapping.input(v[0],v[1],v[2],v[3],v[4]);assert.equal(h.writes.length,before+1);assert.deepEqual(h.packets.at(-1),[v[5],v[6],v[7]]);}
  const count=h.writes.length;for(const p of h.packets)h.mapping.input(p[0]!&15,p[1]!,p[2]!,p[0]!,"[Channel2]");assert.equal(h.writes.length,count);
  h.packets.length=0;assert.equal(h.mapping.shutdown(),true);assert.equal(h.connections.size,0);assert.equal(h.timers.size,0);
  assert.equal(h.packets.length,0);assert.equal(h.writes.at(-1)?.key,"cue_preview");assert.equal(h.writes.at(-1)?.value,0);
  h.mapping.init("AI DJ",false);assert.equal(h.connections.size,18);assert.equal(h.timers.size,1);h.mapping.shutdown();
});
