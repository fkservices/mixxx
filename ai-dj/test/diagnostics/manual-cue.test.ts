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

// Autonomously AI-generated host-to-receiver VM checks; hardware and native UI evidence remain separate.
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
const hostSource=['wire-encode.js','wire-decode.js','wire-send.js','wire.js','manual-cue-observer.js','manual-cue-wire.js']
 .map(f=>readFileSync(new URL('../../hosts/mixxx/fragments/'+f,import.meta.url),'utf8')).join('\n');
function streamHarness(){
 let next=0,failSend=false,failStop=false,writes=0;
 const timers=new Map<number,{at:number,interval:number,once:boolean,cb:()=>void}>();
 const packets:number[][]=[];
 const connections:{key:string,isConnected:boolean,callback:(value:number)=>void,disconnect:()=>void}[]=[];
 const context=createContext({AIDJ:{},time:100});
 function timer(interval:number,cb:()=>void,once:boolean){const id=++next;timers.set(id,{at:context.time+interval,interval,once,cb});return id;}
 context.engine={beginMidiSendTimer:(cb:()=>void)=>timer(5,cb,true),
  beginTimer:(ms:number,cb:()=>void,once=false)=>timer(ms,cb,once),
  stopTimer:(id:number)=>{if(failStop)throw Error('cleanup');timers.delete(id);},
  getValue:()=>0,setValue:()=>{writes++;},setParameter:()=>{writes++;},
  makeConnection:(group:string,key:string,callback:(value:number)=>void)=>{
   const c={key:group+key,isConnected:true,callback,disconnect:()=>{c.isConnected=false;}};connections.push(c);return c;}};
 context.midi={sendSysexMsg:(bytes:number[],length:number)=>{if(failSend)throw Error('native output fault');assert.equal(bytes.length,length);packets.push(Array.from(bytes));}};
 runInContext(hostSource,context);
 const evaluate=(code:string):any=>runInContext(code,context);
 evaluate(`var configuration={diagnostic:true,generation:2,session:'${session}',clockDomainId:'host',now:()=>time};var stream=AIDJ.createManualCueWire(configuration);`);
 const receiver=createManualCueReceiver({diagnostic:true,transportGeneration:2,session,observerGeneration:1,hostClockDomainId:'host',now:()=>context.time+1000});
 let read=0;
 function capture(){const events=[];for(;read<packets.length;read++){const result=receiver.receive(Uint8Array.from(packets[read]!),2);assert.deepEqual(result.errors,[]);events.push(...result.events);}return events;}
 function advance(ms:number){for(let i=0;i<ms;i+=5){context.time+=5;for(const [id,t] of [...timers])if(t.at<=context.time&&timers.has(id)){if(t.once)timers.delete(id);else t.at=context.time+t.interval;t.cb();}}}
 return {evaluate,connections,timers,packets,advance,capture,context,receiver,writes:()=>writes,
  failSend:()=>{failSend=true;},failStop:()=>{failStop=true;},close:()=>{evaluate('stream.shutdown()');receiver.close();}};
}
test('host-created cue edges travel through the real JS endpoint into the strict receiver',()=>{
 const h=streamHarness();h.evaluate('stream.start()');
 const cue=h.connections.find(c=>c.key==='[Channel1]cue_point')!;
 cue.callback(1234567.125);cue.callback(-0);cue.callback(-1);
 h.advance(300);const events=h.capture();
 const edges=events.filter(e=>e.kind==='observation'&&'trigger' in e.record!&&e.record.trigger==='callback');
 assert.equal(edges.length,3);assert.deepEqual(edges.map(e=>(e.record as CueObservation).value),[1234567.125,-0,-1]);
 assert.ok(events.every(e=>e.source==='unverified'));assert.equal(h.writes(),0);
 assert.ok(h.evaluate('stream.status().pending')<=257);h.close();assert.equal(h.timers.size,0);
 assert.ok(h.connections.every(c=>!c.isConnected));
});
test('overflow reports come after older queued observations and before newer records',()=>{
 const h=streamHarness();h.evaluate('stream.start()');
 for(let i=0;i<400;i++)h.connections[0]!.callback(i);
 h.advance(5000);const events=h.capture();
 const gaps=events.filter(e=>e.kind==='observer-gap');assert.ok(gaps.some(e=>e.reason==='host-reported'));
 assert.ok(gaps.every(e=>e.reason==='host-reported'));
 let next=0;
 for(const event of events){if(event.kind==='observation'){assert.equal((event.record as CueObservation).sequence,next++);}
  else if(event.kind==='observer-gap'){assert.equal(event.firstSequence,next);next=event.lastSequence!+1;}}
 assert.ok(next>416);assert.equal(h.evaluate('stream.status().fault'),null);h.close();
});
test('shutdown, input loss, reset, and send failure retire all cue output without restart',()=>{
 for(const mode of ['shutdown','loss','reset','send']){
  const h=streamHarness();h.evaluate('stream.start()');h.advance(10);
  if(mode==='shutdown')h.evaluate('stream.shutdown()');
  if(mode==='loss')h.evaluate('stream.invalidate()');
  if(mode==='reset')h.evaluate('stream.receive([255],1,2)');
  if(mode==='send'){h.failSend();h.advance(10);}
  const count=h.packets.length;h.advance(200);assert.equal(h.packets.length,count);
  assert.equal(h.evaluate('stream.status().active'),false);assert.equal(h.timers.size,0);
  assert.ok(h.connections.every(c=>!c.isConnected));assert.throws(()=>h.evaluate('stream.start()'));h.close();
 }
});
test('diagnostic opt-in and immutable context are required; cleanup failure stays visible',()=>{
 const h=streamHarness();
 for(const field of ['diagnostic:false','session:[]','generation:-1','clockDomainId:[]'])assert.throws(()=>h.evaluate(`AIDJ.createManualCueWire(Object.assign({},configuration,{${field}}))`));
 h.evaluate("configuration.session='2'.repeat(32);configuration.clockDomainId='changed';stream.start()");
 h.advance(10);assert.ok(h.capture().length>0);
 h.failStop();assert.equal(h.evaluate('stream.shutdown()'),false);assert.equal(h.evaluate('stream.status().cleanupFailed'),true);
 const count=h.packets.length;h.advance(100);assert.equal(h.packets.length,count);h.receiver.close();
});
// End of autonomously AI-generated integration checks.
