// Autonomously AI-generated PortMidi conversion tests; synthetic packets, no hardware claim.
import {test} from "node:test";
import assert from "node:assert/strict";
import {admitBackendMidiPacket, createBackendMidiConverter} from "../../diagnostics/backend-midi.ts";
import type {BackendMidiPacket, SessionEventEnvelope} from "../../core/session.ts";
const word = (...bytes: number[]) => bytes.reduce((v,b,i) => (v | (b << (8*i))) >>> 0,0);
function packet(n: number, ...bytes: number[]): BackendMidiPacket & SessionEventEnvelope {
 return {kind:"backend-midi-packet", backend:"portmidi", endpointInstanceId:"endpoint-1", packedWord:word(...bytes), backendTimestamp:0,
  effectiveFilterMask:0, deliveryOrder:"backend",schemaVersion:1, recordingId:"r",eventId:`packet-${n}`,recorderSequence:n,
  producerSequence:n,producerId:"native",stream:{streamId:"native-1",epoch:0},deviceInstanceId:null,
  capturedAt:{clockId:"native-clock",epoch:0,ms:n},ingestedAt:{clockId:"node-clock",epoch:0,ms:n},actor:{actor:"unknown"},
  track:null,occurrence:null,hostContext:null,relatedEventIds:[]};
}
test("short lengths strip padding without rewriting note-on zero; evidence and IDs stay separate",()=>{
 const c=createBackendMidiConverter("r","physical-ingress");
 const cases=[[0x80,60,64],[0x90,60,0],[0xa0,60,64],[0xb0,7,127],[0xe0,127,127],[0xc0,12],[0xd0,9],[0xf1,1],[0xf2,1,2],[0xf3,5],[0xf6],[0xf8],[0xfa],[0xfb],[0xfc],[0xfe],[0xff]];
 for(const [i,bytes] of cases.entries()) {
  const padded=[...bytes];while(padded.length<4)padded.push(255);
  const p=packet(i+1,...padded),r=c.convert(p);assert.deepEqual(r.packet,p);assert.deepEqual(r.raw[0]!.bytes,bytes);
  assert.notEqual(r.raw[0]!.eventId,p.eventId);assert.deepEqual(r.raw[0]!.relatedEventIds,[p.eventId]);
  assert.equal(r.raw[0]!.framing,"complete-message");assert.deepEqual(r.raw[0]!.actor,{actor:"unknown"});
  assert.equal(Object.hasOwn(r.raw[0]!,"packedWord"),false);
 }
});
test("SysEx is bounded fragments, supports real-time interruptions and removes only EOX padding",()=>{
 const c=createBackendMidiConverter("r","physical-ingress");
 assert.deepEqual(c.convert(packet(1,0xf0,1,2,3)).raw[0]!.bytes,[0xf0,1,2,3]);
 assert.equal(c.convert(packet(2,0xf8)).raw[0]!.framing,"complete-message");
 assert.deepEqual(c.convert(packet(3,4,0xf8,5,6)).raw[0]!.bytes,[4,0xf8,5,6]);
 for(let n=4;n<20004;n++)assert.equal(c.convert(packet(n,1,2,3,4)).raw[0]!.bytes.length,4);
 assert.deepEqual(c.convert(packet(20004,5,0xf7,0xff,0xff)).raw[0]!.bytes,[5,0xf7]);
 assert.equal(c.convert(packet(20005,1,2,3,4)).raw.length,0);
});
test("loss, endpoint generation, clock epoch and explicit reset retire partial parsing",()=>{
 for(const mode of ["gap","endpoint","epoch","clock","filter","reset"]){
  const c=createBackendMidiConverter("r","physical-ingress");c.convert(packet(1,0xf0,1,2,3));
  let p=packet(2,4,5,6,0xf7);
  if(mode==="gap")p={...p,producerSequence:3};
  if(mode==="endpoint")p={...p,endpointInstanceId:"endpoint-2"};
  if(mode==="epoch")p={...p,stream:{...p.stream,epoch:1}};
  if(mode==="clock")p={...p,capturedAt:{...p.capturedAt,epoch:1}};
  if(mode==="filter")p={...p,effectiveFilterMask:1};
  if(mode==="reset")c.reset();
  const r=c.convert(p);assert.equal(r.raw.length,0);assert.equal(r.resetPairing,true);assert.deepEqual(r.packet,p);
 }
});
test("malformed packets remain backend evidence, regressions do not produce gestures",()=>{
 for(const bytes of [[0xf4],[0xf5],[0xf9],[0xfd],[0xf7],[0x90,128,1],[0xf0,1,0x90,1]]){
  const c=createBackendMidiConverter("r","physical-ingress"),p=packet(1,...bytes),r=c.convert(p);
  assert.deepEqual(r.packet,p);assert.equal(r.raw.length,0);assert.ok(r.issues.length);assert.equal(r.resetPairing,true);
 }
 const c=createBackendMidiConverter("r","physical-ingress");c.convert(packet(1,0xf0,1,2,3));
 assert.equal(c.convert(packet(1,1,2,3,4)).raw.length,0);
 assert.equal(c.convert(packet(2,1,2,3,0xf7)).raw.length,0);
});
test("interrupted SysEx reports truncation but preserves the new short message",()=>{
 const c=createBackendMidiConverter("r","physical-ingress");c.convert(packet(1,0xf0,1,2,3));
 const r=c.convert(packet(2,0xb0,7,64));assert.deepEqual(r.raw[0]!.bytes,[0xb0,7,64]);assert.equal(r.resetPairing,true);
 assert.ok(r.issues.includes("sysex-truncated-by-status"));
});
test("signed timestamp wrap is preserved independently of monotonic captured time",()=>{
 const c=createBackendMidiConverter("r","host-feedback");
 for(const [i,t] of [2147483647,-2147483648,-1,0].entries()){
  const p={...packet(i+1,0x90,1,2),backendTimestamp:t},r=c.convert(p);
  assert.equal(r.packet.backendTimestamp,t);assert.deepEqual(r.raw[0]!.capturedAt,p.capturedAt);assert.equal(r.raw[0]!.direction,"host-feedback");
 }
});
test("closed packet admission rejects invalid numeric words, fields and backend kinds",()=>{
 const valid={kind:"backend-midi-packet",backend:"portmidi",endpointInstanceId:"e",packedWord:0xffffffff,backendTimestamp:-2147483648,effectiveFilterMask:0,deliveryOrder:"backend"};
 assert.deepEqual(admitBackendMidiPacket(valid),valid);
 for(const packedWord of [-1,4294967296,1.5,NaN,Infinity,"12"])assert.throws(()=>admitBackendMidiPacket({...valid,packedWord}));
 for(const change of [{backend:"other"},{backendTimestamp:2147483648},{effectiveFilterMask:-1},{extra:true},{deliveryOrder:"wire"},{kind:"raw-midi"}])assert.throws(()=>admitBackendMidiPacket({...valid,...change}));
});
// End of autonomously AI-generated PortMidi conversion tests.
