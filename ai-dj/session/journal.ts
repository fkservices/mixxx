// Autonomously AI-generated bounded recorder ingress; caller supplies admitted encoded events.
import {Worker} from "node:worker_threads";
type Packet={kind:"event";line:string;bytes:number}|{kind:"loss";first:number;last:number;reason:string;bytes:0}|{kind:"close";bytes:0};
export interface JournalStatus {state:"starting"|"recording"|"closing"|"closed"|"failed";queuedRecords:number;queuedBytes:number;inFlight:number;omittedOffers:number;reason:string|null;captureCompleteness:"unknown"|"gaps-present"}
export class SessionJournal {
 private readonly worker:Worker;private readonly maxRecords:number;private readonly maxBytes:number;private readonly timeoutMs:number;
 private queue:Packet[]=[];private bytes=0;private flight:{id:number;packet:Packet}|null=null;private nextId=0;private offerSequence=0;
 private loss:Extract<Packet,{kind:"loss"}>|null=null;private omitted=0;private state:JournalStatus["state"]="starting";private reason:string|null=null;
 private timer:ReturnType<typeof setTimeout>|null=null;private readyResolve!:()=>void;private readyReject!:(e:Error)=>void;
 private closeResolve:(()=>void)|null=null;private closeReject:((e:Error)=>void)|null=null;private closing:Promise<void>|null=null;
 readonly ready:Promise<void>;
 constructor(options:{directory:string;recordingId:string;maxRecords?:number;maxBytes?:number;timeoutMs?:number}) {
  this.maxRecords=options.maxRecords??1024;this.maxBytes=options.maxBytes??4*1024*1024;this.timeoutMs=options.timeoutMs??5000;
  if(!Number.isSafeInteger(this.maxRecords)||this.maxRecords<1||this.maxRecords>8192||!Number.isSafeInteger(this.maxBytes)||this.maxBytes<1024||this.maxBytes>16*1024*1024||!Number.isFinite(this.timeoutMs)||this.timeoutMs<100||this.timeoutMs>30000)throw Error("invalid-journal-limits");
  this.ready=new Promise((resolve,reject)=>{this.readyResolve=resolve;this.readyReject=reject;});
  this.worker=new Worker(new URL(import.meta.url.endsWith(".ts")?"./worker.ts":"./worker.js",import.meta.url),{workerData:{directory:options.directory,recordingId:options.recordingId}});
  this.worker.on("error",e=>this.fail(e instanceof Error?e.message:"worker-error"));this.worker.on("exit",()=>{if(this.state!=="closed"&&this.state!=="failed")this.fail("worker-exited");});
  this.worker.on("message",(m:{kind:string;id?:number;reason?:string})=>{
   if(this.state==="failed"||this.state==="closed")return;
   if(m.kind==="failed"){this.fail(m.reason??"worker-failed");return;}
   if(m.kind==="ready"&&this.state==="starting"){this.clearTimer();this.state="recording";this.readyResolve();this.pump();return;}
   if(!this.flight||m.id!==this.flight.id){this.fail("invalid-worker-ack");return;}
   const packet=this.flight.packet;
   if(m.kind!=="ack"&&m.kind!=="closed"||m.kind==="closed"&&packet.kind!=="close"||m.kind==="ack"&&packet.kind==="close"){this.fail("invalid-worker-ack");return;}
   this.clearTimer();this.bytes-=packet.bytes;this.flight=null;
   if(m.kind==="closed"){this.state="closed";this.closeResolve?.();return;}this.pump();
  });this.armTimer();
 }
 private clearTimer(){if(this.timer)clearTimeout(this.timer);this.timer=null;}
 private armTimer(){this.clearTimer();this.timer=setTimeout(()=>this.fail("worker-timeout"),this.timeoutMs);}
 private fail(reason:string){if(this.state==="failed"||this.state==="closed")return;this.clearTimer();this.state="failed";this.reason=reason;this.queue=[];this.flight=null;this.bytes=0;this.readyReject(new Error(reason));this.closeReject?.(new Error(reason));void this.worker.terminate();}
 private pump(){
  if(this.flight||this.state==="starting"||this.state==="failed"||this.state==="closed")return;
  let packet=this.queue.shift();
  if(!packet&&this.loss){packet=this.loss;this.loss=null;}
  if(!packet&&this.state==="closing")packet={kind:"close",bytes:0};
  if(!packet)return;this.flight={id:++this.nextId,packet};this.armTimer();this.worker.postMessage({...packet,id:this.flight.id});
 }
 offer(line:string):"queued"|"omitted"|"unavailable" {
  if(this.state!=="recording")return "unavailable";
  if(this.offerSequence===Number.MAX_SAFE_INTEGER){this.fail("offer-sequence-exhausted");return "unavailable";}
  const n=++this.offerSequence;
  const size=typeof line==="string"&&line.length<=256*1024?Buffer.byteLength(line):Infinity;
  if(this.loss||size+1024>256*1024||this.queue.length+(this.flight?1:0)>=this.maxRecords||this.bytes+size>this.maxBytes){
   this.omitted++;if(this.loss){this.loss.last=n;if(size+1024>256*1024)this.loss.reason="mixed-or-invalid-size";}else this.loss={kind:"loss",first:n,last:n,reason:size+1024>256*1024?"invalid-size":"queue-overflow",bytes:0};this.pump();return "omitted";
  }
  this.queue.push({kind:"event",line,bytes:size});this.bytes+=size;this.pump();return "queued";
 }
 status():JournalStatus{return {state:this.state,queuedRecords:this.queue.length,queuedBytes:this.bytes,inFlight:this.flight?1:0,omittedOffers:this.omitted,reason:this.reason,captureCompleteness:this.omitted||this.state==="failed"?"gaps-present":"unknown"};}
 close():Promise<void>{
  if(this.closing)return this.closing;
  if(this.state==="failed")return Promise.reject(new Error(this.reason??"worker-failed"));
  if(this.state==="starting")return Promise.reject(new Error("journal-not-ready"));
  if(this.state==="closed")return Promise.resolve();
  this.state="closing";this.closing=new Promise((resolve,reject)=>{this.closeResolve=resolve;this.closeReject=reject;});this.pump();return this.closing;
 }
 async abort():Promise<void>{this.fail("worker-aborted");await this.worker.terminate();}
}
// End of autonomously AI-generated bounded recorder ingress.
