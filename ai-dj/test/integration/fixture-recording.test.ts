// Autonomously AI-generated fixture service recording integration tests.
import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm,readFile,mkdir} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {startLocalService} from "../../main.ts";
import {requestCommand} from "../../local-ui/cli.ts";
import {recoverChunks} from "../../session/chunks.ts";
import type {VirtualPortConnectionOptions} from "../../midi/connection.ts";
const context={sessionId:"test",correlationId:null,host:{hostInstanceId:"unknown",connectionGeneration:0,profileId:"fixture",profileRevision:0,capabilityRevision:0,stateRevision:0}};
async function setup(t:{after:(f:()=>Promise<void>)=>void},capacity=128,failSend=false){
 const root=await mkdtemp(join(tmpdir(),"dj-rec-")),directory=join(root,"recording"),socket=join(root,"s"),capture=join(root,"legacy.jsonl");
 let callback!:VirtualPortConnectionOptions,closed=0;
 const service=await startLocalService({socketPath:socket,capturePath:capture,sessionDirectory:directory,context,clockId:"test-clock",now:()=>100,captureCapacity:capacity,openTransport:async cb=>{callback=cb;return {portName:"fixture",status:"open",send:()=>{if(failSend)throw Error("uncertain");},close:()=>{closed++;}};}});
 t.after(async()=>{await service.close().catch(()=>{});await rm(root,{recursive:true,force:true});});
 return {service,directory,socket,capture,closed:()=>closed,feedback:(bytes:number[])=>callback.onFeedback({bytes,deltaTimeSeconds:0})};
}
async function recovered(directory:string){const rows=[];for await(const row of recoverChunks(directory))rows.push(row);return rows;}
test("fixture service persists separate attempt, submission and feedback without invented host authority",async t=>{
 const h=await setup(t);h.feedback([0xb8,0x70,127]);h.feedback([0xb8,0x20,0]);
 await requestCommand(h.socket,"arm");assert.equal((await requestCommand(h.socket,"set deck-1.play true") as {ok:boolean}).ok,true);
 assert.equal(h.service.status().controls[0]?.value,false);
 await requestCommand(h.socket,"disarm");assert.equal(h.service.status().armed,false);
 await h.service.close();assert.equal(h.closed(),1);assert.equal(h.service.status().sessionRecording?.state,"closed");
 const rows=await recovered(h.directory);assert(!rows.some(r=>r.kind==="gap"));
 const events=rows.filter(r=>r.kind==="record").map(r=>r.event),raw=events.filter(e=>e.kind==="raw-midi");
 assert.equal(raw.length,4);const attempted=raw.find(e=>e.stage==="attempted")!,submitted=raw.find(e=>e.stage==="submitted")!;
 assert.deepEqual(submitted.relatedEventIds,[attempted.eventId]);assert.deepEqual(submitted.bytes,[0xb0,0x20,127]);
 for(const e of raw){assert.equal(e.hostContext,null);assert.deepEqual(e.actor,{actor:"unknown"});}
 const log=(await readFile(h.capture,"utf8")).trim().split("\n").map(l=>JSON.parse(l));
 const batches=log.filter(e=>e.kind==="diagnostics");assert.equal(batches.flatMap(e=>e.events).length,4);
 assert(batches.flatMap(e=>e.sessionProjection.records).some(e=>e.eventId===attempted.eventId&&e.offer==="queued"));
});
test("upstream diagnostic overflow remains visible in persisted session and service status",async t=>{
 const h=await setup(t,1);h.feedback([0xb8,0x20,0]);h.feedback([0xb8,0x20,127]);await h.service.close();
 assert.equal(h.service.status().sessionRecording?.upstreamDropped,1);
 const rows=await recovered(h.directory);assert(rows.some(r=>r.kind==="record"&&r.event.kind==="capture-gap"&&r.event.reason==="queue-overflow"));
});
test("uncertain send remains an attempt with unresolved source ID at close",async t=>{
 const h=await setup(t,128,true);h.feedback([0xb8,0x70,127]);h.feedback([0xb8,0x20,0]);await requestCommand(h.socket,"arm");
 assert.equal((await requestCommand(h.socket,"set deck-1.play true") as {reason:string}).reason,"send-uncertain");await h.service.close();
 const events=(await recovered(h.directory)).filter(r=>r.kind==="record").map(r=>r.event);
 assert(events.some(e=>e.kind==="raw-midi"&&e.stage==="attempted"));assert(!events.some(e=>e.kind==="raw-midi"&&e.stage==="submitted"));
 assert.equal(h.service.status().sessionRecording?.projectionIssues,1);assert.match(await readFile(h.capture,"utf8"),/session-unresolved-attempts/);
});
test("recording startup collision closes diagnostic sink without opening MIDI",async()=>{
 const root=await mkdtemp(join(tmpdir(),"dj-rec-"));let closed=0,opened=0;const directory=join(root,"existing");await mkdir(directory);
 try{await assert.rejects(startLocalService({socketPath:join(root,"s"),capturePath:"unused",sessionDirectory:directory,context,clockId:"c",now:()=>0,openCapture:async()=>({append:async()=>{},sync:async()=>{},close:async()=>{closed++;}}),openTransport:async()=>{opened++;throw Error("should not open");}}));assert.equal(closed,1);assert.equal(opened,0);}finally{await rm(root,{recursive:true,force:true});}
});
// End of autonomously AI-generated fixture service recording integration tests.
