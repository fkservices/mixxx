// Autonomously AI-generated endpoint fixtures; no real Mixxx control is mutated.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createContext,runInContext} from "node:vm";
import {encodeSysex} from "../../midi/sysex-encode.ts";
import {createSysexParser} from "../../midi/sysex-decode.ts";
const source=["wire-encode.js","wire-decode.js","wire-send.js","wire.js"].map(f=>readFileSync(new URL("../../hosts/mixxx/fragments/"+f,import.meta.url),"utf8")).join("\n");
const base={direction:0 as const,session:"0123456789abcdef0123456789abcdef",sequence:1,opcode:7};
function harness(handler="{opcode:7,validate:(p)=>Object.keys(p).length===1&&p.value===1,handle:(p,h)=>writes.push([p,h])}",diagnostic=false){
  const timers=new Map<number,()=>void>();let next=0;
  const packets:number[][]=[];const faults:string[]=[];let sendsBeforeFailure=Infinity;
  const context=createContext({AIDJ:{},time:0,data:[] as number[],writes:[],faults,
    engine:{beginTimer:(_ms:number,cb:()=>void,once=false)=>{const id=++next;timers.set(id,()=>{if(once)timers.delete(id);cb();});return id;},stopTimer:(id:number)=>timers.delete(id)},
    midi:{sendSysexMsg:(data:number[],length:number)=>{assert.equal(data.length,length);if(packets.length>=sendsBeforeFailure)throw Error("send failure");packets.push(Array.from(data));}}});
  runInContext(source,context);
  runInContext(`var options={generation:1,now:()=>time,allowDiagnostic:${diagnostic},onFault:r=>faults.push(r),handlers:[${handler}]};var endpoint=AIDJ.createWireEndpoint(options);`,context);
  const evaluate=(s:string):any=>runInContext(s,context);
  const receive=(bytes:Uint8Array,generation=1)=>{context.data=Array.from(bytes);return evaluate(`endpoint.receive(data,data.length,${generation})`);};
  return {tick:()=>{context.time+=5;for(const cb of [...timers.values()])cb();},context,packets,faults,timers,receive,evaluate,setFailure:(after:number)=>{sendsBeforeFailure=after;}};
}

test("dispatch requires a registered opcode and explicit validator success",()=>{
  const h=harness();
  for(const payload of [{},{value:0},{value:1,extra:true}])assert.equal(h.receive(encodeSysex({...base,payload})[0]!).rejected,1);
  assert.equal(h.receive(encodeSysex({...base,opcode:9,payload:{}})[0]!).rejected,1);
  assert.equal(h.evaluate("writes.length"),0);
  assert.equal(h.receive(encodeSysex({...base,payload:{value:1}})[0]!).dispatched,1);
  assert.equal(h.evaluate("Object.isFrozen(writes[0][0])&&Object.isFrozen(writes[0][1])"),true);
  assert.equal(h.packets.length,0);h.evaluate("endpoint.close()");assert.equal(h.timers.size,0);
});

test("corrupt, oversized and malformed native input never reaches a handler",()=>{
  const h=harness();const corrupt=encodeSysex({...base,payload:{value:1}})[0]!.slice();corrupt[47]!^=1;
  assert.equal(h.receive(corrupt).dispatched,0);assert.equal(h.evaluate("writes.length"),0);
  assert.equal(h.receive(new Uint8Array(2049)).closed,true);assert.equal(h.timers.size,0);
  assert.equal(h.receive(encodeSysex({...base,payload:{value:1}})[0]!).dispatched,0);
  for(const expression of ["[256]","[NaN]","[-1]","[1.5]","{length:10000000}"]){const bad=harness();bad.evaluate(`endpoint.receive(${expression},1,1)`);assert.equal(bad.evaluate("writes.length"),0);assert.equal(bad.evaluate("endpoint.status().closed"),true);}
});

test("a reset after a valid frame in one callback invalidates the entire dispatch batch",()=>{
  const h=harness();const frame=encodeSysex({...base,payload:{value:1}})[0]!;
  assert.equal(h.receive(Uint8Array.from([...frame,255])).dispatched,0);
  assert.equal(h.evaluate("writes.length"),0);assert.equal(h.faults.length,1);
});

test("stale generations are ignored and handler configuration is snapshotted",()=>{
  const h=harness();assert.equal(h.receive(new Uint8Array(2049),0).staleGeneration,true);
  h.evaluate("options.handlers[0].validate=()=>false;options.handlers[0].handle=()=>{throw Error('changed')}");
  assert.equal(h.receive(encodeSysex({...base,payload:{value:1}})[0]!).dispatched,1);assert.equal(h.faults.length,0);h.evaluate("endpoint.close()");
});

test("validator/handler failures and reentrant input latch failure without later dispatch",()=>{
  for(const handler of ["{opcode:7,validate:()=>{throw Error('bad')},handle:()=>writes.push(1)}",
    "{opcode:7,validate:()=>true,handle:()=>{throw Error('bad')}}",
    "{opcode:7,validate:()=>{endpoint.receive([],0,1);return true},handle:()=>writes.push(1)}"]){
    const h=harness(handler);h.receive(encodeSysex({...base,payload:{}})[0]!);
    assert.equal(h.evaluate("writes.length"),0);assert.equal(h.evaluate("endpoint.status().closed"),true);assert.equal(h.timers.size,0);
  }
});

test("host output decodes through Node and partial send failure never retries",()=>{
  const h=harness("",true);h.evaluate(`var outgoing={opcode:113,session:"${base.session}",sequence:2,payload:"é🎧"};var result=endpoint.send(outgoing)`);
  assert.equal(h.evaluate("result.delivery"),"unconfirmed");assert.equal(h.packets.length,0);h.tick();assert.equal(h.packets.length,1);
  const parser=createSysexParser({direction:1,generation:1,now:()=>0,allowDiagnostic:true,automaticExpiry:false});
  assert.equal(parser.push(Uint8Array.from(h.packets[0]!),1).messages[0]?.payload,"é🎧");parser.close();
  h.setFailure(2);h.evaluate("outgoing.payload='x'.repeat(1200);result=endpoint.send(outgoing)");
  h.tick();h.tick();assert.equal(h.evaluate("endpoint.status().closed"),true);
  assert.equal(h.packets.length,2);assert.throws(()=>h.evaluate("endpoint.send(outgoing)"));assert.equal(h.timers.size,0);
});

test("registration rejects unsupported roles, missing validators and implicit diagnostics",()=>{
  for(const handlers of ["[{opcode:2,validate:()=>true,handle:()=>{}}]","[{opcode:7,handle:()=>{}}]",
    "[options.handlers[0],options.handlers[0]]","[{opcode:113,validate:()=>true,handle:()=>{}}]"]){
    const h=harness();assert.throws(()=>h.evaluate(`AIDJ.createWireEndpoint({...options,handlers:${handlers}})`));h.evaluate("endpoint.close()");
  }
});

test("output checks the current clock even before the periodic timer detects regression",()=>{
  const h=harness("",true);h.context.time=100;
  h.evaluate(`var outgoing={opcode:113,session:"${base.session}",sequence:2,payload:"test"};endpoint.send(outgoing)`);
  h.tick();h.context.time=99;assert.throws(()=>h.evaluate("endpoint.send(outgoing)"),/clock or parser/);
  assert.equal(h.packets.length,1);assert.equal(h.timers.size,0);assert.equal(h.faults.length,1);
});
// End of autonomously AI-generated file.
