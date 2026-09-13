// Autonomously AI-generated shared Node/host decoder conformance fixtures.
import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createContext,runInContext} from "node:vm";
import {spawnSync} from "node:child_process";
import {encodeSysex} from "../../midi/sysex-encode.ts";
import {createSysexParser} from "../../midi/sysex-decode.ts";
const source=readFileSync(new URL("../../hosts/mixxx/fragments/wire-decode.js",import.meta.url),"utf8");
const base={direction:0 as const,session:"fedcba98765432100123456789abcdef",sequence:Number.MAX_SAFE_INTEGER};
const plain=(v:unknown):any=>JSON.parse(JSON.stringify(v,(_key,value)=>ArrayBuffer.isView(value)?Array.from(value as Uint8Array):value));
function pair(auto=false){
  const timers=new Map<number,()=>void>();let timer=0;
  const context=createContext({AIDJ:{},clockNow:0,input:[] as number[],generation:1,engine:{
    beginTimer:(ms:number,callback:()=>void)=>{assert.equal(ms,25);timers.set(++timer,callback);return timer;},stopTimer:(id:number)=>timers.delete(id)}});
  runInContext(source,context);runInContext(`var parser=AIDJ.createWireParser({direction:0,generation:1,now:()=>clockNow,allowDiagnostic:true,automaticExpiry:${auto}})`,context);
  const node=createSysexParser({direction:0,generation:1,now:()=>context.clockNow,allowDiagnostic:true,automaticExpiry:false});
  return {context,timers,node,
    push:(bytes:Uint8Array,generation=1)=>{context.input=Array.from(bytes);context.generation=generation;const h=plain(runInContext("parser.push(new Uint8Array(input),generation)",context));const n=plain(node.push(bytes,generation));assert.deepEqual(h,n);return h;},
    tick:()=>{const h=plain(runInContext("parser.tick()",context));assert.deepEqual(h,plain(node.tick()));return h;},
    status:()=>plain(runInContext("parser.status()",context)),
    reset:(n:number)=>{runInContext(`parser.resetGeneration(${n})`,context);node.resetGeneration(n);},
    close:()=>{runInContext("parser.close()",context);node.close();}};
}
function raw(payload:number[],opcode=113){
  const head=Array.from(encodeSysex({...base,opcode:opcode===113?113:9,payload:opcode===113?"":{}},true)[0]!.slice(0,46));
  head[37]=payload.length%128;head[38]=Math.floor(payload.length/128);head[39]=0;
  head[44]=payload.length%128;head[45]=Math.floor(payload.length/128);
  for(let i=0;i<payload.length;i+=7){let mask=0;const part=payload.slice(i,i+7);part.forEach((b,j)=>mask|=(b>>7)<<j);head.push(mask,...part.map(b=>b&127));}
  let crc=65535;for(const byte of head.slice(1)){crc^=byte<<8;for(let j=0;j<8;j++)crc=((crc<<1)^((crc&32768)?4129:0))&65535;}
  return Uint8Array.from([...head,crc%128,Math.floor(crc/128)%128,Math.floor(crc/16384),247]);
}

test("generated host parser is reproducible from the current Node parser",()=>{
  const result=spawnSync(process.execPath,[new URL("../../scripts/build-host-parser.mjs",import.meta.url).pathname,"--check"],{encoding:"utf8"});
  assert.equal(result.status,0,result.stdout+result.stderr);
});

test("golden payload types, wide identifiers, byte splits and realtime interleaving match",()=>{
  for(const [opcode,payload] of [[112,-1.5],[112,Number.MIN_VALUE],[113,"é🎧\ufeff"],[9,{key:"🎧",n:0.25,list:[null,true]}]] as const){
    const p=pair();const frames=encodeSysex({...base,opcode,payload},true);let result;
    for(const frame of frames)for(const byte of frame){p.push(Uint8Array.of(248));const r=p.push(Uint8Array.of(byte));if(r.messages.length)result=r.messages[0];}
    assert.equal(result.session,base.session);assert.equal(result.sequence,base.sequence);assert.deepEqual(result.payload,plain(payload));p.close();
  }
});

test("full-size out-of-order fragmented payload reconstructs with identical duplicates",()=>{
  const p=pair();const payload="a".repeat(65532)+"🎧";const frames=encodeSysex({...base,opcode:113,payload},true);
  for(let i=frames.length-1;i>0;i--){assert.equal(p.push(frames[i]!).messages.length,0);assert.equal(p.push(frames[i]!).messages.length,0);}
  const result=p.push(frames[0]!);assert.equal(result.messages.length,1);assert.equal(result.messages[0].payload,payload);
  assert.equal(p.status().retainedPayloadBytes,0);p.close();
});

test("strict UTF-8 and JSON failures agree without relying on TextDecoder",()=>{
  for(const bytes of [[0xc0,0x80],[0xed,0xa0,0x80],[0xf4,0x90,0x80,0x80],[0xf0,0x9f,0x98],[0x80]]){
    const p=pair();assert.deepEqual(p.push(raw(bytes)).errors,["invalid-utf8"]);p.close();
  }
  for(const text of ['{"a":1,"a":2}','{"x":"\\ud800"}','{"x":-0}','{"x":1e999}','[]','\ufeff{}']){
    const p=pair();assert.equal(p.push(raw(Array.from(new TextEncoder().encode(text)),9)).messages.length,0);p.close();
  }
  const p=pair();assert.equal(p.push(raw([239,187,191])).messages[0].payload,"\ufeff");p.close();
});

test("malformed frames, capacity, expiry and generation changes retain Node behavior",()=>{
  const frames=encodeSysex({...base,opcode:113,payload:"x".repeat(600)},true);
  const p=pair();p.push(frames[0]!);p.context.clockNow=249;p.push(frames[0]!);p.context.clockNow=250;
  assert.deepEqual(p.tick().errors,["message-timeout"]);assert.equal(p.status().incompleteMessages,0);
  p.context.clockNow=300;p.push(Uint8Array.of(240,125));p.context.clockNow=550;assert.deepEqual(p.tick().errors,["frame-timeout"]);
  for(let sequence=1;sequence<=5;sequence++)p.push(encodeSysex({...base,sequence,opcode:113,payload:"x".repeat(600)},true)[0]!);
  assert.equal(p.status().incompleteMessages,4);p.reset(2);assert.equal(p.status().incompleteMessages,0);
  p.push(frames[0]!,1);const corrupt=frames[0]!.slice();corrupt[50]!^=1;assert.ok(p.push(corrupt,2).errors.includes("checksum-mismatch"));
  assert.equal(p.push(new Uint8Array(2049),2).failed,true);p.close();
});

test("host timer expires idle data and shutdown removes timer; reset and clock faults fail closed",()=>{
  const p=pair(true);assert.equal(p.timers.size,1);p.push(Uint8Array.of(240,125));p.context.clockNow=250;
  for(const tick of p.timers.values())tick();assert.deepEqual(p.tick().errors,["frame-timeout"]);
  p.context.clockNow=249;assert.equal(p.push(Uint8Array.of(1)).failed,true);p.close();assert.equal(p.timers.size,0);
  const reset=pair();assert.equal(reset.push(Uint8Array.of(255)).failed,true);reset.close();
});
// End of autonomously AI-generated file.
