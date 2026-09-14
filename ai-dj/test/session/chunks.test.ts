// Autonomously AI-generated storage fixtures; no live MIDI or worker-isolation claim.
import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm,readFile,writeFile,readdir,unlink} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {ChunkWriter,recoverChunks} from "../../session/chunks.ts";
const line=(i:number)=>JSON.stringify({schemaVersion:1,recordingId:"r",eventId:`e${i}`,recorderSequence:i,payload:{kind:"raw-midi",bytes:[176,7,64]},padding:"x".repeat(250)});
async function setup(t:{after:(f:()=>Promise<void>)=>void}) {const parent=await mkdtemp(join(tmpdir(),"dj-chunks-"));t.after(()=>rm(parent,{recursive:true,force:true}));return join(parent,"recording");}
const recover=async(path:string)=>{const items=[];for await(const item of recoverChunks(path))items.push(item);return items;};
test("rotates and seals exact repeated raw records with contiguous sequence",async t=>{
 const path=await setup(t),w=await ChunkWriter.create(path,"r",1024);
 for(let i=1;i<=9;i++)await w.append(line(i));await w.close();await w.close();
 const r=await recover(path);assert.equal(r.filter(x=>x.kind==="record").length,9);assert(!r.some(x=>x.kind==="gap"));assert.deepEqual(r.at(-1),{kind:"end",cleanStorageClose:true,lastSequence:9,grantsPerformanceAuthority:false});assert((await readdir(path)).filter(n=>n.endsWith(".seal.json")).length>1);
});
test("rejects concurrent writes, oversized records and sequence jumps without silently queueing",async t=>{
 const path=await setup(t),w=await ChunkWriter.create(path,"r");const pending=w.append(line(1));await assert.rejects(w.append(line(2)),/not-ready/);await pending;
 await assert.rejects(w.append(line(3)),/discontinuity/);await assert.rejects(w.append("x".repeat(300000)),/framing/);await w.append(line(2));await w.close();assert.equal((await recover(path)).filter(x=>x.kind==="record").length,2);
});
test("unsealed crash tail recovers complete lines and explicitly marks truncation",async t=>{
 const path=await setup(t),w=await ChunkWriter.create(path,"r");await w.append(line(1));await w.close();await unlink(join(path,"0.seal.json"));await unlink(join(path,"end.json"));await writeFile(join(path,"0.ndjson"),line(1)+"\n"+line(2).slice(0,30));
 const r=await recover(path);assert.equal(r.filter(x=>x.kind==="record").length,1);assert(r.some(x=>x.kind==="gap"&&x.reason==="truncated-tail"));assert.equal(r.at(-1)?.kind,"end");assert.deepEqual(r.at(-1),{kind:"end",cleanStorageClose:false,lastSequence:1,grantsPerformanceAuthority:false});
});
test("corruption and missing chunks never report clean storage",async t=>{
 const path=await setup(t),w=await ChunkWriter.create(path,"r",1024);for(let i=1;i<=5;i++)await w.append(line(i));await w.close();
 const b=await readFile(join(path,"0.ndjson"));await writeFile(join(path,"0.ndjson"),b.toString().replace('"e1"','"z1"'));
 assert((await recover(path)).some(x=>x.kind==="gap"&&x.reason==="invalid-seal"));
 await unlink(join(path,"0.ndjson"));assert((await recover(path)).some(x=>x.kind==="gap"&&x.reason==="missing-chunk"));
});
test("exclusive creation and seal I/O failure preserve uncertain recovery",async t=>{
 const path=await setup(t),w=await ChunkWriter.create(path,"r");await assert.rejects(ChunkWriter.create(path,"r"));await w.append(line(1));await writeFile(join(path,"0.seal.json"),"blocked");await assert.rejects(w.close());await assert.rejects(w.append(line(2)));assert((await recover(path)).some(x=>x.kind==="gap"&&x.reason==="invalid-seal"));
});
// End of autonomously AI-generated storage fixtures.
