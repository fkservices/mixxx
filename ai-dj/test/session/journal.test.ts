// Autonomously AI-generated real worker tests; no live MIDI timing claim.
import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {setTimeout as delay} from "node:timers/promises";
import {SessionJournal} from "../../session/journal.ts";
import {recoverChunks} from "../../session/chunks.ts";
const line=(i:number)=>JSON.stringify({schemaVersion:1,recordingId:"r",eventId:`e${i}`,recorderSequence:999,stream:{streamId:"midi",epoch:0},producerSequence:i,producerId:"host",deviceInstanceId:"deck",capturedAt:{clockId:"c",epoch:0,ms:i},ingestedAt:{clockId:"c",epoch:0,ms:i},actor:{actor:"unknown"},track:null,occurrence:null,hostContext:null,relatedEventIds:[],kind:"raw-midi",endpointInstanceId:"port",direction:"physical-ingress",stage:"received",framing:"complete-message",bytes:[176,7,64],decoder:null});
async function fixture(t:{after:(f:()=>Promise<void>)=>void},maxRecords=1024){const root=await mkdtemp(join(tmpdir(),"dj-worker-"));const directory=join(root,"session");const j=new SessionJournal({directory,recordingId:"r",maxRecords});t.after(async()=>{await j.abort();await rm(root,{recursive:true,force:true});});await j.ready;return {j,directory};}
async function records(directory:string){const out=[];for await(const e of recoverChunks(directory))out.push(e);return out;}
async function until(f:()=>boolean){for(let i=0;i<500;i++){if(f())return;await delay(10);}throw Error("test-timeout");}
test("real worker records distinct events and seals on acknowledged shutdown",async t=>{
 const {j,directory}=await fixture(t);for(let i=1;i<=20;i++)assert.equal(j.offer(line(i)),"queued");await j.close();assert.equal(j.status().state,"closed");
 const r=await records(directory),events=r.filter(e=>e.kind==="record").map(e=>e.event);assert.equal(events.filter(e=>e.kind==="raw-midi").length,20);assert.deepEqual(events.map(e=>e.recorderSequence),Array.from({length:22},(_,i)=>i+1));assert(!r.some(e=>e.kind==="gap"));assert.equal(j.status().captureCompleteness,"unknown");
});
test("overflow has bounded ingress/IPC and durable explicit omitted-offer metadata",async t=>{
 const {j,directory}=await fixture(t,1);assert.equal(j.offer(line(1)),"queued");for(let i=2;i<=1000;i++)assert.equal(j.offer(line(i)),"omitted");assert.equal(j.status().inFlight,1);assert.equal(j.status().queuedRecords,0);assert.equal(j.status().omittedOffers,999);await j.close();
 const r=await records(directory);assert(r.some(e=>e.kind==="record"&&e.event.kind==="capture-gap"));assert(r.some(e=>e.kind==="record"&&String(e.event.reason).includes("2-1000")));assert.equal(j.status().captureCompleteness,"gaps-present");
});
test("producer discontinuity is recorded and regression fails visibly",async t=>{
 const {j,directory}=await fixture(t);j.offer(line(3));await until(()=>j.status().inFlight===0);j.offer(line(2));await until(()=>j.status().state==="failed");assert.match(j.status().reason??"",/regression/);await assert.rejects(j.close());
 const r=await records(directory);assert(r.some(e=>e.kind==="record"&&e.event.kind==="capture-gap"));assert(r.some(e=>e.kind==="gap"&&e.reason==="missing-or-invalid-end"));
});
test("worker shutdown filesystem failure is surfaced and does not report closed",async t=>{
 const {j,directory}=await fixture(t);j.offer(line(1));await until(()=>j.status().inFlight===0);await writeFile(join(directory,"0.seal.json"),"conflict");await assert.rejects(j.close());assert.equal(j.status().state,"failed");assert.equal(j.offer(line(2)),"unavailable");assert((await records(directory)).some(e=>e.kind==="gap"));
});
test("terminating the actual worker preserves an uncertain recoverable recording",async t=>{
 const {j,directory}=await fixture(t);j.offer(line(1));await until(()=>j.status().inFlight===0);await j.abort();assert.equal(j.status().state,"failed");const r=await records(directory);assert(r.some(e=>e.kind==="record"&&e.event.kind==="raw-midi"));assert(r.some(e=>e.kind==="gap"));
});
// End of autonomously AI-generated worker tests.
