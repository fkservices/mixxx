// Autonomously AI-generated bounded sender regression tests.
import assert from "node:assert/strict";
import test from "node:test";
import {createFragmentSender} from "../../midi/fragment-sender.ts";
import {createSysexParser} from "../../midi/sysex-decode.ts";
const message=(size=3500)=>({direction:0 as const,opcode:113,session:"1".repeat(32),sequence:1,payload:"x".repeat(size)});
function fixture(){let time=0;const sent:number[][]=[];const sender=createFragmentSender({generation:1,now:()=>time,send:b=>{sent.push([...b]);},allowDiagnostic:true,automatic:false});return {sender,sent,set:(n:number)=>{time=n;}};}
test("maximum message sends one frame per slot and decodes completely",()=>{
 const h=fixture(),parser=createSysexParser({direction:0,generation:1,now:()=>0,allowDiagnostic:true,automaticExpiry:false});
 h.sender.enqueue("max",message(65536),1000,1);
 for(let i=0;i<128;i++){h.set(i*5);h.sender.pump();h.sender.pump();assert.equal(h.sent.length,i+1);}
 const decoded=h.sent.flatMap(f=>parser.push(Uint8Array.from(f),1).messages);
 assert.equal(decoded.length,1);assert.equal(decoded[0]?.payload,"x".repeat(65536));
 assert.equal(h.sender.drainResults()[0]?.reason,"sent");assert.equal(h.sender.status().retainedBytes,0);parser.close();h.sender.close();
});
test("stalls expire partial sends without a catch-up burst; cancel is immediate",()=>{
 const h=fixture();h.sender.enqueue("first",message(),1000,1);h.sender.pump();h.set(250);h.sender.pump();assert.equal(h.sent.length,1);
 assert.equal(h.sender.drainResults()[0]?.reason,"expired");h.sender.enqueue("next",message(),1000,1);assert.equal(h.sender.cancel("next"),true);h.sender.pump();assert.equal(h.sent.length,1);h.sender.close();
});
test("queue capacity stays bounded; stale generation and expired admission reject",()=>{
 const h=fixture();assert.throws(()=>h.sender.enqueue("bad",message(),0,1));assert.throws(()=>h.sender.enqueue("bad",message(),100,2));
 for(let i=0;i<4;i++)h.sender.enqueue("q"+i,message(),1000,1);
 assert.throws(()=>h.sender.enqueue("excess",message(),1000,1));h.sender.close();assert.equal(h.sender.drainResults().length,4);assert.equal(h.sender.status().retainedBytes,0);
});
test("send failure retires all queued work without retry",()=>{
 let attempts=0;const s=createFragmentSender({generation:1,now:()=>0,send:()=>{attempts++;throw Error("lost");},allowDiagnostic:true,automatic:false});
 s.enqueue("a",message(),1000,1);s.enqueue("b",message(),1000,1);s.pump();s.pump();assert.equal(attempts,1);assert.equal(s.status().closed,true);assert.equal(s.status().retainedBytes,0);assert.equal(s.drainResults().length,2);
});
test("reentrant close during send preserves attempt accounting and stops later frames",()=>{
 const s=createFragmentSender({generation:1,now:()=>0,send:()=>{s.close();},allowDiagnostic:true,automatic:false});s.enqueue("a",message(),1000,1);s.pump();const r=s.drainResults()[0]!;assert.equal(r.reason,"closed");assert.equal(r.attempted,1);assert.equal(r.sent,1);assert.equal(s.status().retainedBytes,0);
});
test("unread results bound admission and clock failure retires pending work",()=>{
 const h=fixture();for(let i=0;i<32;i++){h.sender.enqueue("r"+i,message(1),1000,1);h.sender.cancel("r"+i);}
 assert.equal(h.sender.status().pendingResults,32);assert.throws(()=>h.sender.enqueue("full",message(),1000,1));h.sender.drainResults();
 h.set(10);h.sender.enqueue("clock",message(),1000,1);h.sender.pump();h.set(9);h.sender.pump();assert.equal(h.sender.status().fault,"clock");assert.equal(h.sender.status().retainedBytes,0);assert.equal(h.sender.drainResults()[0]?.reason,"fault");
});
// End of autonomously AI-generated sender tests.
