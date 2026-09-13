// Autonomously AI-generated communicator tests.
import assert from "node:assert/strict";
import test from "node:test";
import { createCommunicator } from "../../main.ts";
import type { VirtualPortConnectionOptions } from "../../midi/connection.ts";
async function fixture(capacity=128){
 let time=100, callbacks!:VirtualPortConnectionOptions, closed=0;
 const sent:number[][]=[];
 const transport={portName:"AI DJ",status:"open" as const,send:(p:readonly number[])=>{sent.push([...p]);},close:()=>{closed++;}};
 const app=await createCommunicator({context:{sessionId:"fixture-session",correlationId:null,host:{hostInstanceId:"fixture-host",connectionGeneration:1,profileId:"fixture-profile",profileRevision:1,capabilityRevision:1,stateRevision:1}},clockId:"fixture-clock",now:()=>time,captureCapacity:capacity,openTransport:async options=>{callbacks=options;return transport;}});
 return {app,sent,transport,time:(t:number)=>{time=t;},feedback:(bytes:number[])=>callbacks.onFeedback({bytes,deltaTimeSeconds:0}),loss:()=>callbacks.onTransportLoss({reason:"send-failed",error:new Error("loss")}),closed:()=>closed};
}
test("starts disarmed, requires independent fresh feedback and records raw commands without synthetic observation",async()=>{
 const h=await fixture();assert.equal(h.app.status().armed,false);
 h.feedback([0xb8,0x70,127]);h.feedback([0xb8,0x20,0]);
 assert.deepEqual(h.app.execute("set deck-1.play true"),{ok:false,reason:"disarmed"});
 h.app.execute("arm");assert.equal((h.app.execute("set deck-1.play true") as {ok:boolean}).ok,true);
 assert.deepEqual(h.sent,[[0xb0,0x20,127]]);assert.equal(h.app.status().controls[0]?.value,false);
 h.feedback([0xb8,0x20,127]);assert.equal(h.app.status().controls[0]?.value,true);
 const capture=h.app.drain();assert.equal(capture.events.length,5);assert.equal(capture.events[3]?.event.kind,"command-sent");h.app.close();h.app.close();assert.equal(h.closed(),1);
});
test("unknown presence clears previous values and 500ms expiry blocks writes without refresh",async()=>{
 const h=await fixture();h.app.execute("arm");h.feedback([0xb8,0x21,127]);
 assert.equal(h.app.status().controls[1]?.value,null);
 h.feedback([0xb8,0x71,127]);h.feedback([0xb8,0x21,0]);assert.equal(h.app.status().controls[1]?.status,"fresh");
 h.time(600);assert.deepEqual(h.app.execute("set deck-1.volume 0.5"),{ok:false,reason:"feedback-not-fresh"});
 h.feedback([0xb8,0x71,127]);assert.notEqual(h.app.status().controls[1]?.status,"fresh");
 h.feedback([0xb8,0x21,64]);assert.equal(h.app.status().controls[1]?.status,"fresh");
 h.feedback([0xb8,0x71,64]);assert.equal(h.app.status().controls[1]?.value,null);assert.equal(h.sent.length,0);
});
test("loss and send uncertainty disarm and cannot be automatically rearmed",async()=>{
 const h=await fixture();h.app.execute("arm");h.loss();assert.equal(h.app.status().armed,false);assert.deepEqual(h.app.execute("arm"),{ok:false,reason:"not-ready"});
 const b=await fixture();b.feedback([0xba,0x74,127]);b.feedback([0xba,0x24,64]);b.app.execute("arm");b.transport.send=()=>{throw new Error("uncertain");};
 assert.deepEqual(b.app.execute("set mixer.crossfader 0.5"),{ok:false,reason:"send-uncertain"});assert.equal(b.app.status().armed,false);
});
test("bounded capture reports gaps and disarms; invalid or guarded commands never send",async()=>{
 const h=await fixture(2);h.app.execute("arm");h.feedback([0xb8,0x70,127]);h.feedback([0xb8,0x20,0]);h.feedback([0xb8,0x20,127]);
 assert.equal(h.app.status().armed,false);assert.equal(h.app.drain().gaps[0]?.droppedEventCount,1);
 for(const command of ["set deck-1.cue true","set deck-1.sync true","set deck-1.play 1","set mixer.crossfader 1.1","set deck-3.play true","arm\nset deck-1.play true","x".repeat(257)])assert.equal((h.app.execute(command) as {ok:boolean}).ok,false);
 assert.equal(h.sent.length,0);
});
