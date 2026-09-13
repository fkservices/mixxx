// Autonomously AI-generated feedback tests at the user's request.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHostHarness } from "./harness.ts";
const fragment = readFileSync(new URL("../../hosts/mixxx/fragments/conventional-feedback.js",import.meta.url),"utf8");
const profile = JSON.parse(readFileSync(new URL("../../hosts/mixxx/conventional-profile.json",import.meta.url),"utf8"));

test("initial burst samples all nine controls with presence before values and a 100ms timer", () => {
  const h=createHostHarness([fragment]); const intervals:number[]=[];
  const timer=h.engine.beginTimer; h.engine.beginTimer=(ms,cb)=>{intervals.push(ms);return timer(ms,cb);};
  for(const c of profile.controls) (c.host.readApi==="getParameter"?h.parameters:h.values).set(JSON.stringify([c.host.group,c.host.readKey]),c.host.readKey==="crossfader"?0.5:0);
  h.mapping.init("AI DJ",false);
  assert.equal(h.connections.size,9);assert.equal(h.timers.size,1);assert.deepEqual(intervals,[100]);assert.equal(h.packets.length,18);
  for(const c of profile.controls){
    const i=h.packets.findIndex(p=>p[0]===c.presence.status&&p[1]===c.presence.address);
    assert.ok(i>=0);assert.deepEqual(h.packets[i],[c.presence.status,c.presence.address,127]);
    assert.deepEqual(h.packets[i+1],[c.feedback.status,c.feedback.address,c.host.readKey==="crossfader"?64:0]);
  }
  assert.equal(h.writes.length,0);
});

test("change callbacks re-read the correct API and match every profile feedback vector", () => {
  const h=createHostHarness([fragment]);h.mapping.init("AI DJ",false);
  for(const c of profile.controls) for(const e of c.examples){
    h.packets.length=0;
    const value=c.host.readApi==="getParameter"?e.decodedValue:(e.decodedValue?1:0);
    if(c.host.readApi==="getParameter") h.engine.setParameter(c.host.group,c.host.readKey,value); else h.engine.setValue(c.host.group,c.host.readKey,value);
    assert.deepEqual(h.packets,[[c.presence.status,c.presence.address,127],e.feedbackBytes]);
  }
  // Raw callback gain differs from normalized parameter travel; callback payload is not serialized.
  h.parameters.set(JSON.stringify(["[Channel1]","volume"]),0.5);h.packets.length=0;
  h.engine.setValue("[Channel1]","volume",0.02);
  assert.deepEqual(h.packets,[[0xb8,0x71,127],[0xb8,0x21,64]]);
});

test("failed subscription, invalid readings and disconnects emit unknown without synthetic zero", () => {
  const h=createHostHarness([fragment]);h.setAvailable("[Channel1]","play",false);
  h.mapping.init("AI DJ",false);
  assert.deepEqual(h.packets[0],[0xb8,0x70,64]);assert.ok(!h.packets.some(p=>p[0]===0xb8&&p[1]===0x20));
  for(const value of [NaN,Infinity,-0.1,1.1]){
    h.packets.length=0;h.engine.setParameter("[Channel1]","volume",value);
    assert.deepEqual(h.packets,[[0xb8,0x71,64]]);
  }
  h.packets.length=0;h.engine.setValue("[Channel2]","sync_enabled",0.5);
  assert.deepEqual(h.packets,[[0xb9,0x73,64]]);
  h.setAvailable("[Channel2]","play",false);h.packets.length=0;h.tick();
  assert.ok(h.packets.some(p=>p[0]===0xb9&&p[1]===0x70&&p[2]===64));
  assert.ok(!h.packets.some(p=>p[0]===0xb9&&p[1]===0x20));
});

test("refresh samples current state without callbacks, no commands echo, shutdown disposes everything", () => {
  const h=createHostHarness([fragment]);h.mapping.init("AI DJ",false);h.packets.length=0;
  h.mapping.input(0,0x20,127,0xb0,"[Channel1]");assert.equal(h.packets.length,0);assert.equal(h.writes.length,0);
  h.values.set(JSON.stringify(["[Channel1]","play"]),1);h.tick();
  assert.deepEqual(h.packets.slice(0,2),[[0xb8,0x70,127],[0xb8,0x20,127]]);
  assert.ok(h.packets.every(p=>[0xb8,0xb9,0xba].includes(p[0]!)));
  const callbacks=[...h.connections].map(c=>c.callback);const timerCallbacks=[...h.timers.values()];
  h.mapping.shutdown();h.packets.length=0;h.tick();for(const cb of [...callbacks,...timerCallbacks])cb(1);
  assert.equal(h.packets.length,0);assert.equal(h.connections.size,0);assert.equal(h.timers.size,0);
  h.mapping.init("AI DJ",false);assert.equal(h.packets.length,18);assert.equal(h.connections.size,9);assert.equal(h.timers.size,1);
  h.packets.length=0;for(const cb of [...callbacks,...timerCallbacks])cb(1);assert.equal(h.packets.length,0);
});

test("host read exceptions remain unknown and failed initial output cleans up subscriptions", () => {
  const h=createHostHarness([fragment]);h.evaluate(`engine.getValue=function(){throw new Error('read failed');};`);h.mapping.init("AI DJ",false);
  assert.deepEqual(h.packets[0],[0xb8,0x70,64]);assert.ok(!h.packets.some(p=>p[0]===0xb8&&p[1]===0x20));
  const bad=createHostHarness([fragment]);bad.evaluate(`midi.sendShortMsg=function(){throw new Error('send failed');};`);
  assert.throws(()=>bad.mapping.init("AI DJ",false),/send failed/);assert.equal(bad.connections.size,0);assert.equal(bad.timers.size,0);
});
