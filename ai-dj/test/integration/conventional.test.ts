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

import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { startLocalService } from "../../main.ts";
import { requestCommand } from "../../local-ui/cli.ts";
const serviceContext={sessionId:"ipc-session",correlationId:null,host:{hostInstanceId:"ipc-host",connectionGeneration:1,profileId:"ipc-profile",profileRevision:1,capabilityRevision:1,stateRevision:1}};

test("a separate CLI process exits while service remains connected and capture persists",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"dj-"));const socket=join(dir,"s"),capture=join(dir,"capture.jsonl");
 let cb!:VirtualPortConnectionOptions,closed=0,clock=100;
 const service=await startLocalService({socketPath:socket,capturePath:capture,context:serviceContext,clockId:"ipc-clock",now:()=>clock,openTransport:async options=>{cb=options;return {portName:"AI DJ",status:"open",send:()=>{},close:()=>{closed++;}};}});
 try{
  cb.onFeedback({bytes:[0xb8,0x70,127],deltaTimeSeconds:0});cb.onFeedback({bytes:[0xb8,0x20,0],deltaTimeSeconds:0});
  const result=await new Promise<{code:number|null;stdout:string}>((yes,no)=>{const child=spawn(process.execPath,[fileURLToPath(new URL("../../local-ui/cli.ts",import.meta.url)),socket,"status"]);let stdout="";child.stdout.on("data",d=>stdout+=d);child.on("error",no);child.on("exit",code=>yes({code,stdout}));});
  assert.equal(result.code,0);assert.equal(JSON.parse(result.stdout).armed,false);assert.equal(closed,0);
  assert.equal((await requestCommand(socket,"arm") as {ok:boolean}).ok,true);
  assert.equal((await requestCommand(socket,"disarm") as {armed:boolean}).armed,false);
  await service.flush();assert.equal(service.status().transport,"open");
  clock=600;assert.equal((await requestCommand(socket,"status") as {controls:{status:string}[]}).controls[0]?.status,"stale-or-unavailable");
  const records=(await readFile(capture,"utf8")).trim().split("\n").map(x=>JSON.parse(x));
  assert.ok(records.some(x=>x.kind==="diagnostics"&&x.events.length===2));assert.ok(records.some(x=>x.kind==="client-command"&&x.command==="arm"));
  assert.equal((await stat(socket)).mode&0o777,0o600);assert.equal((await stat(capture)).mode&0o777,0o600);
 }finally{await service.close();await service.close();assert.equal(closed,1);await rm(dir,{recursive:true,force:true});}
});

test("capture write failure disarms and refuses arm",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"dj-"));let fail=false,closed=0;
 const service=await startLocalService({socketPath:join(dir,"s"),capturePath:join(dir,"unused"),context:serviceContext,clockId:"ipc-clock",now:()=>performance.now(),openCapture:async()=>({append:async()=>{if(fail)throw new Error("disk failed");},sync:async()=>{},close:async()=>{}}),openTransport:async()=>({portName:"AI DJ",status:"open",send:()=>{},close:()=>{closed++;}})});
 try{
  await requestCommand(join(dir,"s"),"arm");fail=true;
  const result=await requestCommand(join(dir,"s"),"disarm") as {ok:boolean};assert.equal(result.ok,false);
  const status=await requestCommand(join(dir,"s"),"status") as {armed:boolean;captureError:string};assert.equal(status.armed,false);assert.match(status.captureError,/disk failed/);
  assert.deepEqual(await requestCommand(join(dir,"s"),"arm"),{ok:false,reason:"capture-failed"});
 }finally{await service.close().catch(()=>{});assert.equal(closed,1);await rm(dir,{recursive:true,force:true});}
});

// Rejected startup must leave the existing server and its transport intact.
test("socket collision closes only the rejected service transport",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"dj-"));let firstClosed=0,rejectedClosed=0;
 const common={socketPath:join(dir,"s"),context:serviceContext,clockId:"ipc-clock",now:()=>100};
 const first=await startLocalService({...common,capturePath:join(dir,"first.jsonl"),openTransport:async()=>({portName:"AI DJ",status:"open",send:()=>{},close:()=>{firstClosed++;}})});
 try{
  await assert.rejects(startLocalService({...common,capturePath:join(dir,"second.jsonl"),openTransport:async()=>({portName:"AI DJ",status:"open",send:()=>{},close:()=>{rejectedClosed++;}})}),/EADDRINUSE/);
  assert.equal(rejectedClosed,1);assert.equal(firstClosed,0);
  assert.equal((await requestCommand(common.socketPath,"status") as {transport:string}).transport,"open");
 }finally{await first.close();await rm(dir,{recursive:true,force:true});}
});

import { createConnection } from "node:net";
test("oversized and batched socket requests cannot arm the communicator",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"dj-"));const socket=join(dir,"s");let sends=0;
 const service=await startLocalService({socketPath:socket,capturePath:join(dir,"capture.jsonl"),context:serviceContext,clockId:"ipc-clock",now:()=>100,openTransport:async()=>({portName:"AI DJ",status:"open",send:()=>{sends++;},close:()=>{}})});
 const raw=(command:string)=>new Promise<{ok:boolean;reason:string}>((resolve,reject)=>{
  const client=createConnection(socket);let result="";
  client.setTimeout(2000,()=>{client.destroy();reject(new Error("test request timed out"));});
  client.on("error",reject);client.on("connect",()=>client.write(command));
  client.on("data",chunk=>{result+=chunk.toString();});
  client.on("end",()=>{try{resolve(JSON.parse(result));}catch(error){reject(error);}});
 });
 try{
  assert.equal((await raw("x".repeat(258))).reason,"request-too-large");
  assert.equal((await raw("arm\ndisarm\n")).reason,"one-command-per-client");
  assert.equal(service.status().armed,false);assert.equal(sends,0);
  assert.equal((await requestCommand(socket,"status") as {transport:string}).transport,"open");
 }finally{await service.close();await rm(dir,{recursive:true,force:true});}
});
