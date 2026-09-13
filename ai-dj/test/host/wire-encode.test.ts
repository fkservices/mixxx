// Autonomously AI-generated shared-vector checks for the host encoder.
import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createContext,runInContext} from "node:vm";
import {encodeSysex,type SysexMessage} from "../../midi/sysex-encode.ts";
const source=readFileSync(new URL("../../hosts/mixxx/fragments/wire-encode.js",import.meta.url),"utf8");
function host() {
  const context=createContext({AIDJ:{},inputJson:"",diagnostic:false});runInContext(source,context);
  return {evaluate:(code:string)=>runInContext(code,context),encode:(input:SysexMessage,diagnostic=false):number[][]=>{
    context.inputJson=JSON.stringify(input);context.diagnostic=diagnostic;
    return JSON.parse(runInContext("JSON.stringify(AIDJ.encodeWire(JSON.parse(inputJson),diagnostic))",context));
  }};
}
const base={direction:0 as const,session:"00000000000000000000000000000001",sequence:1};
function same(input:SysexMessage,diagnostic=false) {
  assert.deepEqual(host().encode(input,diagnostic),encodeSysex(input,diagnostic).map(f=>Array.from(f)));
}

test("host encoder exactly matches both frozen numeric and Unicode golden vectors",()=>{
  const h=host();
  const hex=(bytes:number[])=>bytes.map(b=>b.toString(16).toUpperCase().padStart(2,"0")).join(" ");
  assert.equal(hex(h.encode({...base,opcode:112,payload:-1.5},true)[0]!),"F0 7D 41 49 44 4A 01 00 70 01 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 00 00 00 00 08 00 00 00 00 01 00 08 00 40 00 00 00 00 00 00 78 01 3F 27 22 03 F7");
  assert.equal(hex(h.encode({...base,opcode:113,payload:"é🎧"},true)[0]!),"F0 7D 41 49 44 4A 01 00 71 02 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 00 00 00 00 06 00 00 00 00 01 00 06 00 3F 43 29 70 1F 0E 27 30 11 00 F7");
});

test("fragment boundaries, full session width and safe sequence width match Node",()=>{
  for(const n of [0,1,7,8,511,512,513,65536])same({...base,opcode:113,payload:"a".repeat(n),session:"f".repeat(32),sequence:Number.MAX_SAFE_INTEGER},true);
  for(const session of ["0123456789abcdef0123456789abcdef","80000000000000000000000000000000","00000000000000000000000000000000"]){
    for(const sequence of [0,127,128,16383,16384,2**32,2**52+1])same({...base,session,sequence,opcode:113,payload:"a".repeat(511)+"🎧"},true);
  }
});

test("all standard allowed roles and full numeric payload range match Node",()=>{
  const roles:Record<number,number[]>={1:[0],2:[1],3:[1],4:[0],5:[1],6:[1],7:[0],8:[1],9:[0,1],10:[0],11:[1],12:[0,1]};
  for(const [op,dirs] of Object.entries(roles))for(const direction of dirs)same({...base,direction:direction as 0|1,opcode:Number(op),payload:{title:"é🎧",nested:{"__safe":true},values:[null,false,0,0.125]}});
  for(const payload of [0,1,-1,Number.MIN_VALUE,Number.MAX_VALUE,Math.PI])same({...base,direction:1,opcode:112,payload},true);
});

test("invalid headers, routes, Unicode and oversized text reject",()=>{
  const h=host();
  for(const patch of [{direction:2},{opcode:255},{opcode:2},{session:"F".repeat(32)},{sequence:-1},{sequence:2**53},{extra:true}]){
    assert.throws(()=>h.encode({...base,opcode:113,payload:"x",...patch} as SysexMessage,true));
  }
  assert.throws(()=>h.encode({...base,opcode:113,payload:"x"}));
  for(const payload of ["\ud800","\udfff","\ud800x","é".repeat(32769),"a".repeat(65537)])assert.throws(()=>h.encode({...base,opcode:113,payload},true));
  h.evaluate(`var base={direction:0,opcode:112,session:"${base.session}",sequence:1,payload:0};`);
  for(const expression of ["NaN","Infinity","-Infinity","-0"]){
    assert.throws(()=>h.evaluate(`base.payload=${expression};AIDJ.encodeWire(base,true)`));
  }
});

test("plain JSON rejects hooks, cycles, sparse arrays and resource excess",()=>{
  const h=host();h.evaluate(`var calls=0;var base={direction:0,opcode:7,session:"${base.session}",sequence:1,payload:{}};`);
  for(const expression of [
    "({get x(){calls++;return 1;}})","({toJSON:function(){calls++;return {};}})",
    "Object.defineProperty({},'x',{value:1,enumerable:false})","({a:[,1]})",
    "(function(){var x={};x.self=x;return x;}())","({x:Infinity})","({x:-0})"
  ])assert.throws(()=>h.evaluate(`base.payload=${expression};AIDJ.encodeWire(base)`));
  assert.equal(h.evaluate("calls"),0);
  assert.throws(()=>h.evaluate("base.payload={a:[]}; for(var i=0;i<4096;i++)base.payload.a.push(null); AIDJ.encodeWire(base)"));
  assert.throws(()=>h.evaluate("base.payload={};var x=base.payload;for(var j=0;j<32;j++){x.a={};x=x.a;}AIDJ.encodeWire(base)"));
});

test("exact JSON byte and nesting limits preserve full payload and reject one beyond",()=>{
  same({...base,opcode:7,payload:{s:"a".repeat(65528)}});
  assert.throws(()=>host().encode({...base,opcode:7,payload:{s:"a".repeat(65529)}}));
  let payload:Record<string,unknown>={};let cursor=payload;
  for(let i=0;i<30;i++){const next={};cursor.a=next;cursor=next;}cursor.x=1;
  same({...base,opcode:7,payload});
});
// End of autonomously AI-generated file.
