// Autonomously AI-generated semantic decoder fixtures; no physical-controller claim.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { RecordedDecoderProfile } from "../../core/session.ts";
import { createSemanticDecoder, semanticProfileHash } from "../../diagnostics/semantic.ts";
import { encodeCc14 } from "../../midi/cc14.ts";

function profile(): RecordedDecoderProfile {
  const p: RecordedDecoderProfile = { reference:{profileId:"fixture",revision:1,sha256:""},deviceModel:"synthetic",hostBuild:"fixture",mappingVersion:"1",bindings:[
    {kind:"cc-boolean",channelZeroBased:0,controller:32,controlId:"deck1.play",label:"Play",unit:"boolean"},
    {kind:"cc-absolute",channelZeroBased:0,controller:33,controlId:"deck1.volume",label:"Volume",unit:"normalized",minimum:0,maximum:1,inverted:false},
    {kind:"note",channelZeroBased:0,note:35,controlId:"deck1.cue",label:"Cue",unit:"gate",noteOnZero:"release"},
    {kind:"cc-boolean",channelZeroBased:0,controller:34,controlId:"deck1.sync",label:"Sync",unit:"boolean"},
    {kind:"cc-absolute",channelZeroBased:2,controller:36,controlId:"mixer.crossfader",label:"Crossfader",unit:"normalized",minimum:0,maximum:1,inverted:false,curve:"centered-7bit"},
    {kind:"cc-absolute",channelZeroBased:0,controller:40,controlId:"deck1.bass",label:"Bass",unit:"normalized",minimum:0,maximum:1,inverted:false},
    {kind:"cc-absolute",channelZeroBased:0,controller:41,controlId:"deck1.treble",label:"Treble",unit:"normalized",minimum:0,maximum:1,inverted:true},
    {kind:"cc-relative",channelZeroBased:0,controller:16,controlId:"deck1.jog",label:"Jog",unit:"jog-ticks",encoding:"twos-complement",multiplier:1},
    {kind:"cc14",channelZeroBased:4,msbController:16,lsbController:48,pairingWindowMs:20,controlId:"deck1.gain",label:"Gain",unit:"normalized",minimum:0,maximum:1,inverted:false},
    {kind:"cc14",channelZeroBased:4,msbController:17,lsbController:49,pairingWindowMs:20,controlId:"deck1.tempo",label:"Tempo",unit:"offset",minimum:-1,maximum:1,inverted:false,curve:"centered-14bit"},
  ] };
  return {...p,reference:{...p.reference,sha256:semanticProfileHash(p)}};
}
function stream(p=profile()) {
  const decoder=createSemanticDecoder(p); let seq=0;
  return {decoder,push:(bytes:readonly number[],atMs=++seq,context="stream1:epoch1:track1")=>decoder.push({eventId:`raw${seq}`,sequence:seq,atMs,context,bytes})};
}
test("volume, bass and inverted treble directions compare only continuous values",()=>{
  const s=stream();
  assert.equal(s.push([176,33,64])[0]!.kind,"decoded");
  const up=s.push([176,33,96])[0]!;
  assert.equal(up.kind,"decoded"); if(up.kind==="decoded") assert.equal(up.label,"Volume up");
  s.push([176,40,127]); const down=s.push([176,40,0])[0]!;
  if(down.kind!=="decoded") assert.fail(); assert.equal(down.label,"Bass down");
  s.push([176,41,0]); const treble=s.push([176,41,127])[0]!;
  if(treble.kind!=="decoded") assert.fail(); assert.equal(treble.label,"Treble down");
});
test("five conventional controls preserve booleans, center curve and cue release",()=>{
  const s=stream();
  for(const [bytes,label] of [[[176,32,1],"Play on"],[[176,34,0],"Sync off"],[[144,35,127],"Cue press"],[[144,35,0],"Cue release"],[[128,35,127],"Cue release"]] as const){
    const r=s.push(bytes).at(-1)!; if(r.kind!=="decoded") assert.fail(); assert.equal(r.label,label);
  }
  const r=s.push([178,36,64])[0]!; if(r.kind!=="decoded"||r.gesture.kind!=="absolute") assert.fail(); assert.equal(r.gesture.value,0.5);
});
test("relative jog interpretation comes from the profile",()=>{
  for(const [encoding,raw,delta] of [["twos-complement",127,-1],["binary-offset",127,63],["sign-magnitude",65,-1]] as const){
    const p=profile(),changed={...p,bindings:p.bindings.map(b=>b.kind==="cc-relative"?{...b,encoding}:b)};
    const s=stream({...changed,reference:{...p.reference,sha256:semanticProfileHash(changed)}});
    const r=s.push([176,16,raw])[0]!; if(r.kind!=="decoded"||r.gesture.kind!=="relative") assert.fail();
    assert.equal(r.gesture.delta,delta); assert.equal(r.label,delta<0?"Jog backward":"Jog forward");
  }
});
test("R20 pairs produce one linked gesture and exact centered tempo",()=>{
  for(const control of ["gain","tempo"] as const){
    const s=stream(),packets=encodeCc14(1,control,control==="gain"?1:0);
    assert.equal(s.push(packets[0]!)[0]!.kind,"pending");
    const r=s.push(packets[1]!)[0]!; if(r.kind!=="decoded"||r.gesture.kind!=="absolute") assert.fail();
    assert.deepEqual(r.rawEventIds,["raw1","raw2"]); assert.equal(r.gesture.value,control==="gain"?1:0);
    assert.equal(s.push(packets[1]!)[0]!.kind,"unknown");
  }
});
test("timeout, interleaving and close retain unresolved raw IDs",()=>{
  const d=createSemanticDecoder(profile());
  d.push({eventId:"a",sequence:1,atMs:0,context:"x",bytes:[180,16,2]});
  const late=d.push({eventId:"b",sequence:2,atMs:20,context:"x",bytes:[180,48,2]});
  assert.deepEqual(late.map(r=>r.kind),["unknown","unknown"]); assert.deepEqual(late.flatMap(r=>r.rawEventIds),["a","b"]);
  d.push({eventId:"c",sequence:3,atMs:21,context:"x",bytes:[180,16,2]});
  const other=d.push({eventId:"d",sequence:4,atMs:22,context:"x",bytes:[176,33,3]});
  assert.equal(other[0]!.kind,"unknown"); assert.equal(other[1]!.kind,"decoded");
  d.push({eventId:"e",sequence:5,atMs:23,context:"x",bytes:[180,16,2]});
  assert.deepEqual(d.close()[0]!.rawEventIds,["e"]);
});
test("gaps clear direction history; stale messages and resets cannot revive it",()=>{
  const d=createSemanticDecoder(profile());
  const event={eventId:"a",sequence:1,atMs:1,context:"x",bytes:[176,33,64]};
  d.push(event); assert.equal(d.push(event)[0]!.kind,"unknown");
  const gap=d.push({...event,eventId:"c",sequence:3,atMs:3,bytes:[176,33,96]})[0]!;
  if(gap.kind!=="decoded") assert.fail(); assert.equal(gap.label,"Volume set");
  d.push({...event,eventId:"d",sequence:4,atMs:4,bytes:[255]});
  assert.equal(d.push({...event,eventId:"e",sequence:5,atMs:5})[0]!.kind,"unknown");
});
test("unmapped, malformed and fragment bytes receive no invented musical labels",()=>{
  const s=stream(); for(const bytes of [[177,33,127],[176,110,1],[176,33,128],[240,1,2,247]]) {
    const r=s.push(bytes).at(-1)!; assert.equal(r.kind,"unknown"); assert(!("label" in r));
  }
});
test("modified and conflicting profiles fail; caller mutation cannot change an active decoder",()=>{
  const p=profile();assert.throws(()=>createSemanticDecoder({...p,mappingVersion:"changed"}));
  const conflict={...p,bindings:[...p.bindings,p.bindings[0]!]};
  assert.throws(()=>createSemanticDecoder({...conflict,reference:{...p.reference,sha256:semanticProfileHash(conflict)}}));
  const s=stream(p); (p.bindings[1] as {label:string}).label="Wrong";
  const r=s.push([176,33,127])[0]!; if(r.kind!=="decoded") assert.fail(); assert.equal(r.label,"Volume set");
});
test("realtime bytes may separate a pair but a context change cannot",()=>{
  const d=createSemanticDecoder(profile());
  const push=(sequence:number,bytes:number[],context="x")=>d.push({eventId:`r${sequence}`,sequence,atMs:sequence,context,bytes});
  push(1,[180,16,64]); push(2,[248]);
  const pair=push(3,[180,48,0]).at(-1)!;
  if(pair.kind!=="decoded") assert.fail(); assert.deepEqual(pair.rawEventIds,["r1","r3"]);
  assert.equal(pair.normalizedValue,8192/16383);
  push(4,[180,16,64]); const changed=push(5,[180,48,0],"new-track");
  assert(changed.every(r=>r.kind==="unknown"));
});
test("clock reversal retires the decoder and invalid channel profiles cannot start",()=>{
  const d=createSemanticDecoder(profile()),event={eventId:"a",sequence:1,atMs:5,context:"x",bytes:[176,33,0]};
  d.push(event);
  assert.equal(d.push({...event,eventId:"b",sequence:2,atMs:4})[0]!.kind,"unknown");
  assert.equal(d.push({...event,eventId:"c",sequence:3,atMs:6})[0]!.kind,"unknown");
  const p=profile(),bad={...p,bindings:p.bindings.map(b=>({...b,channelZeroBased:16}))};
  assert.throws(()=>createSemanticDecoder({...bad,reference:{...p.reference,sha256:semanticProfileHash(bad)}}));
});
// End of autonomously AI-generated semantic fixtures.
