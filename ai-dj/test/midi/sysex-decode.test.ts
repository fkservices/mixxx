// Autonomously AI-generated bounded parser tests. No host control callback exists.
import assert from "node:assert/strict";
import test from "node:test";
import { createSysexParser, type DecodedSysex } from "../../midi/sysex-decode.ts";
import { encodeSysex } from "../../midi/sysex-encode.ts";
const session="00000000000000000000000000000001";
const encode=(payload:unknown,sequence=1,opcode=113)=>encodeSysex({direction:0,session,sequence,opcode,payload},true);
function fixture(){let clock=0;const p=createSysexParser({direction:0,generation:1,now:()=>clock,allowDiagnostic:true,automaticExpiry:false});return {p,at:(n:number)=>{clock=n;},push:(bytes:Uint8Array)=>p.push(bytes,1)};}
function crc(frame:Uint8Array){let register=0xffff;for(const byte of frame.slice(1,-4)){register^=byte*256;for(let i=0;i<8;i++){register=register*2^(register>=32768?0x1021:0);register&=65535;}}frame[frame.length-4]=register%128;frame[frame.length-3]=Math.floor(register/128)%128;frame[frame.length-2]=Math.floor(register/16384);return frame;}
function alter(frame:Uint8Array,offset:number,value:number){const result=frame.slice();result[offset]=value;return crc(result);}
// Encode diagnostic text then retag it to exercise malformed incoming JSON/UTF-8.
function rawJson(source:string){return encode(source).map(f=>{const r=f.slice();r[8]=7;r[9]=3;return crc(r);});}
test("golden payloads, split callbacks and realtime bytes decode independently",()=>{
 const h=fixture();
 for(const [payload,opcode] of [[-1.5,112],["é🎧",113]] as const){const frame=encode(payload,1,opcode)[0]!;let result;
  for(let i=0;i<frame.length;i++){result=h.push(Uint8Array.from([frame[i]!,0xf8]));if(i<frame.length-1)assert.equal(result.messages.length,0);assert.deepEqual(result.realtime,[0xf8]);}
  assert.equal(result!.messages[0]!.payload,payload);assert.equal(result!.messages[0]!.session,session);
 }
 assert.deepEqual(h.push(Uint8Array.from([0xb8,0x20,127])).otherMidi,[0xb8,0x20,127]);h.p.close();
});
test("out-of-order fragments and duplicates reconstruct maximum payload once per assembly",()=>{
 const h=fixture(),text="a".repeat(511)+"🎧"+"b".repeat(65021),frames=encode(text);
 assert.equal(Buffer.byteLength(text),65536);assert.equal(frames.length,128);
 assert.equal(h.push(frames[127]!).messages.length,0);assert.equal(h.push(frames[127]!).messages.length,0);
 let messages:DecodedSysex[]=[];
 for(let i=126;i>=0;i--)messages=h.push(frames[i]!).messages;
 assert.equal(messages.length,1);assert.equal(messages[0]!.payload,text);assert.equal(h.p.status().retainedPayloadBytes,0);h.p.close();
});
test("malformed headers, checksums and masks never allocate reassembly",()=>{
 const h=fixture(),f=encode("é🎧")[0]!;
 const mutations=[[6,2],[7,1],[8,99],[9,1],[28,4],[36,16],[37,127],[40,1],[42,0],[44,100],[46,127]];
 for(const [at,value] of mutations){const result=h.push(alter(f,at!,value!));assert.equal(result.messages.length,0);assert.ok(result.errors.length);assert.equal(h.p.status().incompleteMessages,0);}
 const broken=f.slice();broken[47]=0;assert.ok(h.push(broken).errors.includes("checksum-mismatch"));
 const foreign=alter(f,1,0x41);assert.equal(h.push(foreign).messages.length,0);
 const hidden=createSysexParser({direction:0,generation:1,now:()=>0,automaticExpiry:false});assert.ok(hidden.push(f,1).errors.includes("diagnostic-disabled"));hidden.close();h.p.close();
});
test("strict JSON rejects duplicates, malformed syntax, escaped surrogates and resource excess",()=>{
 const h=fixture();
 const decode=(source:string)=>{const messages=[],errors=[];for(const f of rawJson(source)){const result=h.push(f);messages.push(...result.messages);errors.push(...result.errors);}return {messages,errors};};
 for(const source of ['{"a":1,"a":2}','{"a":1,"\\u0061":2}','{"x":-0}','{"x":1e999}','{"x":"\\ud800"}','{"x":01}','{"x":true,}','{"x":[1,]}','{"x":undefined}','[]','null','{} true','\ufeff{}','{"x":"bad\ntext"}']){
  const result=decode(source);assert.equal(result.messages.length,0,source);assert.ok(result.errors.length,source);
 }
 for(const source of ['{"x":'.repeat(33)+'0'+'}'.repeat(33),'{"x":['+Array(4095).fill('null').join(',')+']}']){
  let last;for(const f of rawJson(source))last=h.push(f);assert.equal(last!.messages.length,0);assert.ok(last!.errors.includes("json-resource-limit"));
 }
 const valid='{"__proto__":{"safe":true},"n":0.5,"text":"é🎧","a":[true,null]}';let result;for(const f of rawJson(valid))result=h.push(f);
 assert.deepEqual(JSON.parse(JSON.stringify(result!.messages[0]!.payload)),JSON.parse(valid));assert.equal(Object.getPrototypeOf(result!.messages[0]!.payload),null);h.p.close();
});
test("invalid UTF-8, nonfinite binary values and noncanonical negative zero reject",()=>{
 const h=fixture();const utf=encode("ab")[0]!;utf[47]=0x40;utf[46]=1;utf[48]=0;assert.ok(h.push(crc(utf)).errors.includes("invalid-utf8"));
 for(const n of [NaN,Infinity,-Infinity,-0]){
  const f=encode(0,1,112)[0]!,raw=new Uint8Array(8);new DataView(raw.buffer).setFloat64(0,n,true);
  f[46]=raw.slice(0,7).reduce((mask,b,i)=>mask|((b>>7)<<i),0);for(let i=0;i<7;i++)f[47+i]=raw[i]!&127;f[54]=raw[7]!>>7;f[55]=raw[7]!&127;
  assert.ok(h.push(crc(f)).errors.includes("invalid-number"));
 }h.p.close();
});
test("absolute frame expiry and idle/absolute message expiry cannot be extended by duplicates",()=>{
 const h=fixture(),frames=encode("x".repeat(1536));
 h.push(frames[0]!.slice(0,20));h.at(249);h.push(Uint8Array.from([0xf8]));h.at(250);assert.ok(h.p.tick().errors.includes("frame-timeout"));
 h.at(300);h.push(frames[0]!);h.at(549);h.push(frames[0]!);h.at(550);assert.ok(h.p.tick().errors.includes("message-timeout"));
 const larger=encode("x".repeat(4096));h.at(600);h.push(larger[0]!);for(let i=1;i<5;i++){h.at(600+i*200);h.push(larger[i]!);}
 h.at(1600);assert.ok(h.p.tick().errors.includes("message-timeout"));assert.equal(h.p.status().incompleteMessages,0);h.p.close();
});
test("resource saturation, conflicts, generation changes and invalid clock are bounded",()=>{
 const h=fixture();for(let i=1;i<=4;i++)h.push(encode("x".repeat(65536),i)[0]!);
 assert.equal(h.p.status().retainedPayloadBytes,262144);assert.ok(h.push(encode("z".repeat(600),5)[0]!).errors.includes("reassembly-capacity"));
 const conflict=encode("y".repeat(65536),1)[0]!;assert.ok(h.push(conflict).errors.includes("fragment-conflict"));assert.equal(h.p.status().incompleteMessages,3);
 h.p.resetGeneration(2);assert.equal(h.p.status().retainedPayloadBytes,0);assert.ok(h.push(encode("old")[0]!).errors.includes("stale-generation"));
 assert.equal(h.p.push(encode("new")[0]!,2).messages[0]!.payload,"new");h.at(-1);assert.equal(h.p.tick().failed,true);assert.equal(h.p.push(encode("later")[0]!,2).messages.length,0);h.p.close();h.p.close();
 const overflow=fixture();assert.equal(overflow.push(new Uint8Array(2049)).failed,true);assert.equal(overflow.p.status().partialBytes,0);overflow.p.close();
});
test("garbage, nested starts and MIDI reset do not leave unbounded buffers",()=>{
 const h=fixture();for(let i=0;i<100;i++){const r=h.push(Uint8Array.from([0xf0,...Array(1000).fill(1),0xf7]));assert.equal(r.messages.length,0);assert.ok(h.p.status().partialBytes<=636);assert.ok(h.p.status().pendingDiagnostics<=32);}
 const f=encode("valid")[0]!;assert.equal(h.push(Uint8Array.from([0xf0,1,2,...f])).messages[0]!.payload,"valid");
 h.push(encode("x".repeat(600))[0]!);const reset=h.push(Uint8Array.from([0xff,...f]));assert.deepEqual(reset.realtime,[0xff]);assert.equal(reset.failed,true);assert.equal(reset.messages.length,0);assert.equal(h.p.status().retainedPayloadBytes,0);h.p.close();
});
test("automatic timer expires data even when no new bytes arrive",async()=>{
 let now=0;const p=createSysexParser({direction:0,generation:1,now:()=>now,allowDiagnostic:true});
 try{p.push(encode("x".repeat(600))[0]!,1);now=250;await new Promise(resolve=>setTimeout(resolve,60));assert.equal(p.status().incompleteMessages,0);assert.ok(p.tick().errors.includes("message-timeout"));}finally{p.close();}
});
