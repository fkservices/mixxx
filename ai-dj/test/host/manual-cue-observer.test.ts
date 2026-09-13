// Autonomously AI-generated synthetic host observer tests.
import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const source=readFileSync(new URL("../../hosts/mixxx/fragments/manual-cue-observer.js",import.meta.url),"utf8");
function harness() {
  let time=100, writes=0, timerId=0;
  const values=new Map<string,number>();
  const unavailable=new Set<string>();
  const connections:{key:string,isConnected:boolean,callback:(v:unknown)=>void,disconnect:()=>void}[]=[];
  const timers=new Map<number,()=>void>();
  const engine={
    makeUnbufferedConnection:()=>{throw Error("Coalescing connection must not be used");},
    makeConnection:(group:string,key:string,callback:(v:unknown)=>void)=>{
      const name=group+key;
      if(unavailable.has(name))throw Error("unavailable");
      const c={key:name,isConnected:true,callback,disconnect:()=>{c.isConnected=false;}};connections.push(c);return c;
    },
    getValue:(group:string,key:string)=>values.get(group+key)??0,
    beginTimer:(ms:number,callback:()=>void)=>{assert.equal(ms,100);timers.set(++timerId,callback);return timerId;},
    stopTimer:(id:number)=>{timers.delete(id);},
    setValue:()=>{writes++;},setParameter:()=>{writes++;}
  };
  const context={AIDJ:{} as {createManualCueObserver:(o:unknown)=>any},engine};
  runInNewContext(source,context);
  const observer=context.AIDJ.createManualCueObserver({clockDomainId:"host-clock",now:()=>time});
  const drain=(n=256)=>JSON.parse(JSON.stringify(observer.drain(n)));
  return {observer,drain,engine,connections,timers,values,unavailable,setTime:(t:number)=>{time=t;},writes:()=>writes};
}

test("subscribes only to 16 fixed controls, keeps raw cue precision and never writes",()=>{
  const h=harness();h.values.set("[Channel1]cue_point",1234567.125);h.observer.start();
  const {records,gap}=h.drain();assert.equal(records.length,16);assert.equal(gap,null);
  assert.equal(h.connections.length,16);assert.equal(h.timers.size,1);
  assert.equal(records.find((r:any)=>r.deck===1&&r.controlKey==="cue_point").value,1234567.125);
  assert.ok(records.every((r:any)=>r.trigger==="initial"&&r.presence==="present"&&r.generation===1&&r.clockDomainId==="host-clock"));
  assert.deepEqual(records.map((r:any)=>r.sequence),Array.from({length:16},(_,i)=>i));
  for(const tick of h.timers.values())tick();
  assert.ok(h.drain().records.every((r:any)=>r.trigger==="refresh"));
  h.observer.shutdown();assert.equal(h.writes(),0);assert.equal(h.timers.size,0);
  assert.ok(h.connections.every(c=>!c.isConnected));
});

test("callback preserves transient CUE edges even when the current control is already zero",()=>{
  const h=harness();h.observer.start();h.drain();
  const c=h.connections.find(c=>c.key==="[Channel1]cue_default")!;
  c.callback(1);c.callback(0);
  const records=h.drain().records;
  assert.deepEqual(records.map((r:any)=>[r.controlKey,r.value,r.trigger]),[["cue_default",1,"callback"],["cue_default",0,"callback"]]);
  assert.equal(h.writes(),0);
});

test("missing connections and invalid reads remain distinct from numeric zero",()=>{
  const h=harness();h.unavailable.add("[Channel2]cue_point");h.values.set("[Channel1]cue_point",NaN);h.observer.start();
  const records=h.drain().records;
  assert.equal(records.find((r:any)=>r.deck===2&&r.controlKey==="cue_point").presence,"unavailable");
  assert.equal(records.find((r:any)=>r.deck===1&&r.controlKey==="cue_point").presence,"unknown");
  assert.equal(records.find((r:any)=>r.controlKey==="play").value,0);
  h.connections[0]!.callback(Infinity);assert.equal(h.drain().records[0].value,null);
  h.engine.getValue=()=>{throw Error("read failure");};for(const tick of h.timers.values())tick();
  assert.ok(h.drain().records.every((r:any)=>r.presence!=="present"));
});

test("bounded queue reports exact lost sequences and permits small drains",()=>{
  const h=harness();h.observer.start();h.drain();
  for(let i=0;i<300;i++)h.connections[0]!.callback(i%2);
  assert.equal(h.observer.status().queued,256);
  const first=h.drain(1);assert.equal(first.records[0].sequence,16);
  assert.deepEqual(first.gap,{generation:1,firstSequence:272,lastSequence:315,count:44});
  assert.equal(h.drain().records.length,255);assert.equal(h.observer.status().gapPending,false);
  for(const n of [0,257,1.1,NaN])assert.throws(()=>h.drain(n));
});

test("restart requires draining prior records; old timer and connection callbacks stay retired",()=>{
  const h=harness();h.observer.start();const oldCallback=h.connections[0]!.callback;const oldTimer=[...h.timers.values()][0]!;
  assert.throws(()=>h.observer.start(),/already started/);h.observer.shutdown();
  assert.throws(()=>h.observer.start(),/Drain prior/);h.drain();h.observer.start();h.drain();
  oldCallback(1);oldTimer();assert.equal(h.observer.status().queued,0);
  h.connections[16]!.callback(1);const record=h.drain().records[0];assert.equal(record.generation,2);assert.equal(record.sequence,16);
  h.observer.shutdown();assert.equal(h.observer.shutdown(),true);assert.equal(h.timers.size,0);
});

test("clock regression latches a fault and cleanup failure prevents unsafe restart",()=>{
  const h=harness();h.observer.start();h.drain();h.setTime(99);h.connections[0]!.callback(1);
  assert.equal(h.observer.status().active,false);assert.match(h.observer.status().fault,/regressed/);
  h.observer.shutdown();assert.equal(h.timers.size,0);assert.throws(()=>h.observer.start(),/fault/);
  const bad=harness();bad.observer.start();bad.drain();bad.connections[0]!.disconnect=()=>{throw Error("cleanup");};
  assert.equal(bad.observer.shutdown(),false);assert.equal(bad.timers.size,0);
  assert.ok(bad.connections.slice(1).every(c=>!c.isConnected));assert.throws(()=>bad.observer.start(),/fault/);
});

test("timer creation failure disposes subscriptions and surfaces initialization failure",()=>{
  const h=harness();h.engine.beginTimer=()=>{throw Error("timer creation failed");};
  assert.throws(()=>h.observer.start(),/timer creation failed/);
  assert.equal(h.observer.status().active,false);assert.ok(h.connections.every(c=>!c.isConnected));
  assert.equal(h.writes(),0);
});

test("non-disposable connection handles fail initialization rather than claim clean lifecycle",()=>{
  const h=harness();
  h.engine.makeConnection=()=>({isConnected:true} as any);
  assert.throws(()=>h.observer.start());
  assert.equal(h.observer.status().fault,"invalid-connection-handle");
  assert.equal(h.observer.status().cleanupFailed,true);
  assert.equal(h.observer.status().queued,0);
  assert.equal(h.timers.size,0);
});

test("missing FIFO API reports unavailable instead of using a coalescing fallback",()=>{
  const h=harness();
  delete (h.engine as Partial<typeof h.engine>).makeConnection;
  h.observer.start();
  const records=h.drain().records;
  assert.equal(records.length,16);
  assert.ok(records.every((r:any)=>r.presence==="unavailable"&&r.value===null));
  assert.equal(h.connections.length,0);
  h.observer.shutdown();
});
// End of autonomously AI-generated file.
