// Autonomously AI-generated receiver conformance tests; fixture packets are not native evidence.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createManualCueReceiver,decodeCueRecordText,encodeCueRecordText,type CueObservation,type CueGap} from '../../diagnostics/manual-cue.ts';
import {encodeSysex} from '../../midi/sysex-encode.ts';
const session='1'.repeat(32);
const observation=(sequence=0,value=0):CueObservation=>({schemaVersion:1,generation:1,sequence,deck:1,controlKey:'cue_point',clockDomainId:'host',observedAtMs:25.25,trigger:'callback',presence:'present',value});
const frame=(payload:string,sequence=1,extra={})=>encodeSysex({direction:1,opcode:113,session,sequence,payload,...extra},true)[0]!;
const receiver=()=>createManualCueReceiver({diagnostic:true,transportGeneration:2,session,observerGeneration:1,hostClockDomainId:'host',now:()=>100});
test('cue text preserves fractional/negative positions and signed zero without MIDI quantization',()=>{
 for(const value of [-1,123456789.125,Number.MAX_VALUE,Number.MIN_VALUE,-0]){
  const h=receiver();const text=encodeCueRecordText(observation(0,value));const result=h.receive(frame(text),2);
  assert.equal(result.errors.length,0);assert.equal(result.events.length,1);
  assert.ok(Object.is((result.events[0]?.record as CueObservation).value,value));
  assert.equal(result.events[0]?.source,'unverified');assert.equal(result.events[0]?.receivedAtMs,100);
  assert.equal((result.events[0]?.record as CueObservation).observedAtMs,25.25);h.close();
 }
});
test('closed canonical record rejects duplicate fields, coercion, invalid presence and numeric corruption',()=>{
 const original=observation();
 for(const bad of [{...original,extra:1},{...original,trigger:['callback']},{...original,presence:['present'],value:null},
  {...original,deck:3},{...original,controlKey:'volume'},{...original,sequence:1.5},{...original,observedAtMs:-1},
  {...original,presence:'unknown',value:0},{...original,presence:'unavailable',value:null},
  {...original,trigger:'unavailable'},{...original,value:Infinity},{...original,generation:0}])assert.throws(()=>decodeCueRecordText(JSON.stringify(bad)));
 const text=encodeCueRecordText(original);assert.throws(()=>decodeCueRecordText(text.replace('"deck":1','"deck":1,"deck":1')));
 assert.throws(()=>decodeCueRecordText(' '+text));assert.throws(()=>decodeCueRecordText('x'.repeat(1025)));
 assert.equal(decodeCueRecordText(encodeCueRecordText({...original,presence:'unknown',value:null})).generation,1);
 assert.equal(decodeCueRecordText(encodeCueRecordText({...original,trigger:'unavailable',presence:'unavailable',value:null})).generation,1);
});
test('wire loss, observer loss and explicit host gaps remain distinct and ordered',()=>{
 const h=receiver();assert.equal(h.receive(frame(encodeCueRecordText(observation())),2).events.length,1);
 const result=h.receive(frame(encodeCueRecordText(observation(3,1)),3),2);
 assert.deepEqual(result.events.map(e=>[e.kind,e.firstSequence,e.lastSequence]),[['wire-gap',2,2],['observer-gap',1,2],['observation',undefined,undefined]]);
 const gap:CueGap={schemaVersion:1,kind:'gap',generation:1,clockDomainId:'host',firstSequence:4,lastSequence:8,count:5};
 const events=h.receive(frame(encodeCueRecordText(gap),4),2).events;
 assert.equal(events[0]?.reason,'host-reported');assert.equal(h.status().nextObserver,9);
 assert.equal(h.receive(frame(encodeCueRecordText(observation(9)),5),2).events.length,1);
 assert.throws(()=>encodeCueRecordText({...gap,count:4}));h.close();
});
test('wrong context, replay and clock regression cannot advance stream state',()=>{
 const h=receiver();const text=encodeCueRecordText(observation());
 assert.deepEqual(h.receive(frame(text),1).errors,['cue-stale-transport']);
 for(const payload of [encodeCueRecordText({...observation(),generation:2}),encodeCueRecordText({...observation(),clockDomainId:'other'})])assert.deepEqual(h.receive(frame(payload),2).errors,['cue-observer-context']);
 assert.deepEqual(h.receive(frame(text,1,{session:'2'.repeat(32)}),2).errors,['cue-wire-context']);
 assert.equal(h.status().wireSequence,-1);h.receive(frame(text),2);
 assert.deepEqual(h.receive(frame(text),2).errors,['cue-reordered-or-duplicate']);
 assert.deepEqual(h.receive(frame(encodeCueRecordText({...observation(1),observedAtMs:24}),2),2).errors,['cue-host-clock-regressed']);
 assert.equal(h.status().nextObserver,1);h.close();
});
test('raw parser integrity, input bounds and receiver lifetime prevent later publication',()=>{
 const h=receiver();const bytes=frame(encodeCueRecordText(observation()));const corrupt=bytes.slice();corrupt[corrupt.length-2]!^=1;
 assert.deepEqual(h.receive(corrupt,2).errors,['checksum-mismatch']);assert.equal(h.status().wireSequence,-1);
 assert.equal(h.receive(bytes,2).events.length,1);h.close();assert.equal(h.receive(bytes,2).events.length,0);
 const large=receiver();assert.equal(large.receive(new Uint8Array(2049),2).closed,true);
 let time=10;const options={diagnostic:true as const,transportGeneration:2,session,observerGeneration:1,hostClockDomainId:'host',now:()=>time};const bound=createManualCueReceiver(options);
 options.session='2'.repeat(32);assert.equal(bound.receive(bytes,2).events.length,1);
 time=9;assert.equal(bound.receive(frame(encodeCueRecordText(observation(1)),2),2).closed,true);bound.close();
});
// End of autonomously AI-generated receiver conformance tests.
