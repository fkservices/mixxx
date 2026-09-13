// Autonomously AI-generated independent R01 encoder checks.
import test from "node:test";
import assert from "node:assert/strict";
import { encodeSysex, type SysexMessage } from "../../midi/sysex-encode.ts";
const base={direction:0 as const,session:"00000000000000000000000000000001",sequence:1};
const hex=(s:string)=>Uint8Array.from(s.split(" ").map(x=>parseInt(x,16)));
function unpack(frame:Uint8Array):number[]{
 const size=frame[44]!+128*frame[45]!;const out:number[]=[];let cursor=46;
 while(out.length<size){const mask=frame[cursor++]!;const count=Math.min(7,size-out.length);assert.ok(mask<2**count);for(let i=0;i<count;i++)out.push(frame[cursor++]!+((Math.floor(mask/2**i)%2)*128));}
 assert.equal(cursor,frame.length-4);return out;
}
test("numeric and Unicode frames match frozen golden octets",()=>{
 assert.deepEqual(encodeSysex({...base,opcode:112,payload:-1.5},true)[0],hex("F0 7D 41 49 44 4A 01 00 70 01 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 00 00 00 00 08 00 00 00 00 01 00 08 00 40 00 00 00 00 00 00 78 01 3F 27 22 03 F7"));
 assert.deepEqual(encodeSysex({...base,opcode:113,payload:"é🎧"},true)[0],hex("F0 7D 41 49 44 4A 01 00 71 02 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 00 00 00 00 06 00 00 00 00 01 00 06 00 3F 43 29 70 1F 0E 27 30 11 00 F7"));
});
test("exact fragmentation limits and maximum wide integers preserve payload",()=>{
 for(const n of [0,1,7,8,511,512,513,65536]){
  const frames=encodeSysex({...base,opcode:113,payload:"a".repeat(n),session:"f".repeat(32),sequence:Number.MAX_SAFE_INTEGER},true);
  assert.equal(frames.length,Math.max(1,Math.ceil(n/512)));const decoded:number[]=[];
  frames.forEach((frame,i)=>{
   assert.ok(frame.length<=636);assert.equal(frame[28],3);assert.equal(frame[36],15);assert.equal(frame[40]!+128*frame[41]!,i);
   assert.equal(frame[42]!+128*frame[43]!,frames.length);assert.equal(frame[37]!+128*frame[38]!+16384*frame[39]!,n);
   assert.ok([...frame.slice(1,-1)].every(b=>b<128));decoded.push(...unpack(frame));
  });assert.equal(new TextDecoder().decode(Uint8Array.from(decoded)),"a".repeat(n));
 }
 assert.throws(()=>encodeSysex({...base,opcode:113,payload:"a".repeat(65537)},true),/oversized|exceeds/);
 const unicode="a".repeat(511)+"🎧";assert.equal(new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(encodeSysex({...base,opcode:113,payload:unicode},true).flatMap(f=>unpack(f)))),unicode);
});
test("JSON data is exact, bounded and never invokes hooks",()=>{
 const payload={title:"é🎧",values:[null,true,0,0.5],nested:{name:"x"}};
 const frames=encodeSysex({...base,opcode:7,payload});assert.equal(frames[0]![9],3);
 assert.deepEqual(JSON.parse(new TextDecoder().decode(Uint8Array.from(frames.flatMap(f=>unpack(f))))),payload);
 let invoked=0;
 const accessor=Object.defineProperty({},"x",{enumerable:true,get:()=>{invoked++;return 1;}});
 const proxy=new Proxy({},{ownKeys:()=>{invoked++;return [];}});
 const cycle:Record<string,unknown>={};cycle.self=cycle;
 for(const invalid of [accessor,proxy,cycle,{toJSON(){invoked++;return {};}},{x:undefined},{x:NaN},{x:-0},{x:Infinity},{x:1n},{x:Symbol()},[1],null,"{}",{x:new Date()},{x:new Array(3)},{x:"\ud800"}])assert.throws(()=>encodeSysex({...base,opcode:7,payload:invalid}));
 assert.equal(invoked,0);
 assert.throws(()=>encodeSysex({...base,opcode:7,payload:{x:"🎧".repeat(16384)}}),/exceeds/);
 const exact={x:"a".repeat(65528)};assert.equal(encodeSysex({...base,opcode:7,payload:exact}).length,128);
 assert.throws(()=>encodeSysex({...base,opcode:7,payload:{x:"a".repeat(65529)}}),/exceeds/);
 let nested:Record<string,unknown>={};for(let i=0;i<31;i++)nested={x:nested};assert.ok(encodeSysex({...base,opcode:7,payload:nested}).length);nested={x:nested};assert.throws(()=>encodeSysex({...base,opcode:7,payload:nested}),/depth/);
 assert.ok(encodeSysex({...base,opcode:7,payload:{x:Array(4094).fill(null)}}).length);
 assert.throws(()=>encodeSysex({...base,opcode:7,payload:{x:Array(4095).fill(null)}}),/node/);
});
test("invalid header, unsupported direction and diagnostic defaults fail closed",()=>{
 const message:SysexMessage={...base,opcode:7,payload:{}};
 for(const patch of [{opcode:0},{opcode:13},{opcode:2},{direction:2},{sequence:-1},{sequence:-0},{sequence:1.1},{sequence:2**53},{session:"F".repeat(32)},{session:"0".repeat(31)},{session:"0".repeat(32)+"\n"},{extra:true}])assert.throws(()=>encodeSysex({...message,...patch} as SysexMessage));
 for(const number of [NaN,Infinity,-Infinity,-0])assert.throws(()=>encodeSysex({...base,opcode:112,payload:number},true));
 assert.throws(()=>encodeSysex({...base,opcode:112,payload:1}),/disabled/);
 assert.throws(()=>encodeSysex({...base,opcode:113,payload:"\udfff"},true),/Unicode/);
 for(const opcode of [2,3,5,6,8,11])assert.equal(encodeSysex({...base,direction:1,opcode,payload:{}})[0]![8],opcode);
});
