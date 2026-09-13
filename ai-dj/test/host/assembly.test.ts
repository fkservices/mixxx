// Autonomously AI-generated assembly integration tests.
import assert from "node:assert/strict";
import test from "node:test";
import { buildMapping, renderMapping, FRAGMENT_ORDER } from "../../tools/build-mapping.ts";
import { createHostHarness } from "./harness.ts";
import { encodeSysex } from "../../midi/sysex-encode.ts";
import { createSysexParser } from "../../midi/sysex-decode.ts";
import { readFileSync } from "node:fs";

test("checked-in bundle is reproducible and assembly preserves bootstrap boundaries",async()=>{
  await buildMapping(true);
  const base="prefix\n// AI-DJ-FRAGMENTS-BEGIN\nold\n// AI-DJ-FRAGMENTS-END\nsuffix\n";
  const parts=FRAGMENT_ORDER.map(name=>`source-${name}`);
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

test("assembled SysEx route requires explicit configuration and survives alongside conventional controls",()=>{
  const h=createHostHarness([],true);
  assert.equal(h.evaluate("AIDJ.wireStatus().enabled"),false);
  h.evaluate(`var wirePackets=[];midi.sendSysexMsg=(data,length)=>{if(data.length!==length)throw Error('length');wirePackets.push(data);};
    AIDJ.configureWire({clockKind:'diagnostic-wall',clockDomainId:'fixture-clock',now:()=>100,allowDiagnostic:true,onFault:()=>{},
      handlers:[{opcode:113,validate:p=>typeof p==='string'&&p.length<=512,handle:(p,h)=>AIDJ.sendWire({opcode:113,session:h.session,sequence:h.sequence,payload:p})}]});`);
  h.mapping.init("AI DJ",false);
  assert.equal(h.timers.size,2);assert.equal(h.evaluate("AIDJ.wireStatus().enabled"),true);
  const frame=encodeSysex({direction:0,opcode:113,session:"1".repeat(32),sequence:1,payload:"é🎧"},true)[0]!;
  const result=h.evaluate(`AIDJ.incomingData(new Uint8Array(${JSON.stringify(Array.from(frame))}),${frame.length})`);
  assert.equal(result.dispatched,1);assert.equal(h.writes.length,0);
  h.tick();
  const packets=JSON.parse(h.evaluate("JSON.stringify(wirePackets)")) as number[][];
  const parser=createSysexParser({direction:1,generation:1,now:()=>0,allowDiagnostic:true,automaticExpiry:false});
  assert.equal(parser.push(Uint8Array.from(packets[0]!),1).messages[0]?.payload,"é🎧");parser.close();
  h.mapping.input(0,0x21,64,0xb0,"[Channel1]");assert.equal(h.writes.at(-1)?.key,"volume");
  assert.throws(()=>h.evaluate("AIDJ.configureWire({})"),/before initialization/);
  h.evaluate("var retiredIncoming=AIDJ.incomingData;");h.mapping.shutdown();
  assert.equal(h.timers.size,0);assert.equal(h.evaluate("AIDJ.wireStatus().enabled"),false);
  h.mapping.init("AI DJ",false);assert.equal(h.timers.size,1);assert.equal(h.evaluate("AIDJ.wireStatus().enabled"),false);
  h.evaluate(`retiredIncoming(new Uint8Array(${JSON.stringify(Array.from(frame))}),${frame.length})`);
  assert.equal(h.evaluate("wirePackets.length"),1);h.mapping.shutdown();
});

test("diagnostic wall-clock mode cannot register or send semantic messages",()=>{
  const h=createHostHarness([],true);
  h.evaluate("var options={clockKind:'diagnostic-wall',clockDomainId:'fixture-clock',now:()=>100,allowDiagnostic:true,onFault:()=>{},handlers:[]}");
  assert.throws(()=>h.evaluate("AIDJ.configureWire({...options,handlers:[{opcode:7,validate:()=>true,handle:()=>{}}]})"),/semantic handlers/);
  assert.throws(()=>h.evaluate("AIDJ.configureWire({...options,allowDiagnostic:false})"),/diagnostic-only/);
  h.evaluate("AIDJ.configureWire(options)");h.mapping.init("AI DJ",false);
  h.evaluate("AIDJ.wireStatus().clock.kind='monotonic'");
  assert.equal(h.evaluate("AIDJ.wireStatus().clock.kind"),"diagnostic-wall");
  assert.throws(()=>h.evaluate("AIDJ.sendWire({opcode:9})"),/semantic messages/);
  h.mapping.shutdown();assert.equal(h.timers.size,0);
});

test("XML adds one scripted SysEx route without changing conventional registrations",()=>{
  const xml=readFileSync(new URL("../../../res/controllers/AI-DJ.midi.xml",import.meta.url),"utf8");
  const controls=[...xml.matchAll(/<control>([\s\S]*?)<\/control>/g)].map(m=>m[1]!);
  const sysex=controls.filter(c=>c.includes("<status>0xF0</status>"));
  assert.equal(sysex.length,1);assert.match(sysex[0]!,/<key>AIDJ.incomingData<\/key>/);
  assert.match(sysex[0]!,/<script-binding\/>/);
  assert.equal(controls.filter(c=>c.includes("<key>AIDJ.input</key>")).length,11);
});

// Autonomously AI-generated activation failure and clock retirement regression.
test("failed wire activation rolls back conventional resources and consumes configuration",()=>{
  const h=createHostHarness([],true);
  h.evaluate(`AIDJ.configureWire({clockKind:'monotonic',clockDomainId:'fixture',now:()=>0,onFault:()=>{},
    handlers:[{opcode:7,validate:()=>true,handle:()=>{}},{opcode:7,validate:()=>true,handle:()=>{}}]});`);
  assert.throws(()=>h.mapping.init("AI DJ",false),/duplicate handler/);
  assert.equal(h.connections.size,0);assert.equal(h.timers.size,0);
  assert.equal(h.writes.length,0);assert.equal(h.evaluate("AIDJ.wireStatus().enabled"),false);
  h.mapping.init("AI DJ",false);
  assert.equal(h.connections.size,18);assert.equal(h.timers.size,1);
  assert.equal(h.evaluate("AIDJ.wireStatus().enabled"),false);
  assert.equal(h.mapping.shutdown(),true);
  assert.equal(h.connections.size,0);assert.equal(h.timers.size,0);
});

test("clock regression retires assembled wire input before any handler can run",()=>{
  const h=createHostHarness([],true);
  h.evaluate(`var clock=10, handled=0, faults=[];
    AIDJ.configureWire({clockKind:'monotonic',clockDomainId:'fixture',now:()=>clock,
      allowDiagnostic:true,onFault:r=>faults.push(r),
      handlers:[{opcode:113,validate:()=>true,handle:()=>handled++}]});`);
  h.mapping.init("AI DJ",false);
  const frame=encodeSysex({direction:0,opcode:113,session:"1".repeat(32),sequence:1,payload:"probe"},true)[0]!;
  h.evaluate("AIDJ.incomingData(new Uint8Array([]),0)");
  h.evaluate("clock=9");
  h.evaluate(`AIDJ.incomingData(new Uint8Array(${JSON.stringify(Array.from(frame))}),${frame.length})`);
  assert.equal(h.evaluate("handled"),0);assert.equal(h.writes.length,0);
  assert.equal(h.evaluate("AIDJ.wireStatus().enabled"),false);
  assert.equal(h.evaluate("faults.length"),1);
  h.evaluate("clock=11");
  h.evaluate(`AIDJ.incomingData(new Uint8Array(${JSON.stringify(Array.from(frame))}),${frame.length})`);
  assert.equal(h.evaluate("handled"),0);assert.equal(h.evaluate("faults.length"),1);
  assert.equal(h.mapping.shutdown(),true);assert.equal(h.timers.size,0);assert.equal(h.connections.size,0);
});
// End of autonomously AI-generated activation regressions.

// Autonomously AI-generated system reset regression.
test("native short reset route retires endpoint without performance writes",()=>{
  const h=createHostHarness([],true);
  h.evaluate(`var faults=[];AIDJ.configureWire({clockKind:'monotonic',clockDomainId:'fixture',now:()=>0,onFault:r=>faults.push(r),handlers:[]});`);
  h.mapping.init("AI DJ",false);
  h.evaluate("AIDJ.resetInput(15,0,0,254,'[Master]')");
  assert.equal(h.evaluate("AIDJ.wireStatus().enabled"),true);
  h.evaluate("AIDJ.resetInput(15,0,0,255,'[Master]')");
  assert.equal(h.evaluate("AIDJ.wireStatus().enabled"),false);
  assert.equal(h.evaluate("faults.length"),1);assert.equal(h.writes.length,0);
  h.mapping.shutdown();assert.equal(h.timers.size,0);assert.equal(h.connections.size,0);
  const xml=readFileSync(new URL("../../../res/controllers/AI-DJ.midi.xml",import.meta.url),"utf8");
  assert.match(xml,/<key>AIDJ.resetInput<\/key>.*<status>0xFF<\/status><midino>0x00<\/midino>/);
});
// End of autonomously AI-generated system reset regression.

// Autonomously AI-generated native input-loss callback regression.
test("native input error closes endpoint and does not revive on later input",()=>{
  const h=createHostHarness([],true);
  h.evaluate(`var faults=[];AIDJ.configureWire({clockKind:'monotonic',clockDomainId:'fixture',now:()=>0,onFault:r=>faults.push(r),handlers:[]});`);
  h.mapping.init("AI DJ",false);
  h.evaluate("AIDJ.inputError('unrecognized')");
  assert.equal(h.evaluate("AIDJ.wireStatus().enabled"),true);
  h.evaluate("AIDJ.inputError('portmidi-overflow')");
  assert.equal(h.evaluate("AIDJ.wireStatus().enabled"),false);
  assert.equal(h.evaluate("faults[0]"),"native-input-loss");
  assert.equal(h.evaluate("AIDJ.incomingData(new Uint8Array([]),0).closed"),true);
  assert.equal(h.writes.length,0);h.mapping.shutdown();
  assert.equal(h.connections.size,0);assert.equal(h.timers.size,0);
});
// End of autonomously AI-generated native input-loss regression.

// Autonomously AI-generated queued reply lifecycle integration regression.
test("queued native replies stop on cancellation, reset, input loss and shutdown",()=>{
  for(const action of ["AIDJ.cancelWireSend(reply.id)","AIDJ.resetInput(15,0,0,255,'[Master]')","AIDJ.inputError('portmidi-overflow')","AIDJ.shutdown()"]){
    const h=createHostHarness([],true);
    h.evaluate(`var clock=0, output=[];midi.sendSysexMsg=(d,n)=>output.push(d);
      AIDJ.configureWire({clockKind:'monotonic',clockDomainId:'fixture',now:()=>clock,allowDiagnostic:true,onFault:()=>{},handlers:[]});`);
    h.mapping.init("AI DJ",false);
    h.evaluate(`var reply=AIDJ.sendWire({opcode:113,session:'${'1'.repeat(32)}',sequence:1,payload:'x'.repeat(1200)});`);
    assert.equal(h.evaluate('reply.queued'),true);assert.equal(h.evaluate('output.length'),0);
    h.tick();assert.equal(h.evaluate('output.length'),1);
    const retired=[...h.timers.values()];h.evaluate(action);h.evaluate('clock=10');
    for(const cb of retired)cb();assert.equal(h.evaluate('output.length'),1);
    h.mapping.shutdown();assert.equal(h.timers.size,0);assert.equal(h.connections.size,0);
  }
});
// End of autonomously AI-generated queued lifecycle regression.

// Autonomously AI-generated failed native timer cleanup latch regression.
test("failed reply timer cleanup prevents reinitialization even after an earlier wire fault",()=>{
  for(const priorFault of [false,true]){
    const h=createHostHarness([],true);
    h.evaluate(`var clock=0, output=[];midi.sendSysexMsg=(d,n)=>output.push(d);
      AIDJ.configureWire({clockKind:'monotonic',clockDomainId:'fixture',now:()=>clock,allowDiagnostic:true,onFault:()=>{},handlers:[]});`);
    h.mapping.init("AI DJ",false);
    h.evaluate(`AIDJ.sendWire({opcode:113,session:'${'1'.repeat(32)}',sequence:1,payload:'x'.repeat(1200)});`);
    const timer=[...h.timers.keys()].at(-1)!;
    const stale=h.timers.get(timer)!;
    h.evaluate(`var realStop=engine.stopTimer;engine.stopTimer=id=>{if(id===${timer})throw Error('cleanup failed');realStop(id);};`);
    if(priorFault)h.evaluate("AIDJ.inputError('portmidi-overflow')");
    assert.equal(h.mapping.shutdown(),false);
    h.evaluate('clock=10');stale();assert.equal(h.evaluate('output.length'),0);
    assert.throws(()=>h.mapping.init("AI DJ",false),/cleanup failed/);
  }
});
// End of autonomously AI-generated cleanup latch regression.
