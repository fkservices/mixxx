// Autonomously AI-generated bounded recorder ingress; caller supplies admitted encoded events.
import type {SessionVisualSnapshot} from "../core/session.ts";
import {randomUUID} from "node:crypto";
import {Worker} from "node:worker_threads";
type Packet={kind:"event";line:string;bytes:number}|{kind:"loss";first:number;last:number;reason:string;bytes:0}|{kind:"close";bytes:0}|{kind:"pause";pauseId:string;bytes:0}|{kind:"resume";pauseId:string;snapshot:string;bytes:number};
export interface JournalStatus {state:"starting"|"recording"|"pausing"|"paused"|"resuming"|"closing"|"closed"|"failed";queuedRecords:number;queuedBytes:number;inFlight:number;omittedOffers:number;reason:string|null;captureCompleteness:"unknown"|"gaps-present"; accounting:{acceptedOffers:number;appendAcknowledgedOffers:number;queuedOffers:number;inFlightOffers:number;notSubmittedOnFailure:number;unconfirmedOnFailure:number;reportedOmissions:number;unreportedOmissions:number;synchronizedAtCloseOffers:number|null}}
export class SessionJournal {
 private readonly worker:Worker;private readonly maxRecords:number;private readonly maxBytes:number;private readonly timeoutMs:number;
 private queue:Packet[]=[];private bytes=0;private flight:{id:number;packet:Packet}|null=null;private nextId=0;private offerSequence=0;
 private loss:Extract<Packet,{kind:"loss"}>|null=null;private omitted=0;private state:JournalStatus["state"]="starting";private reason:string|null=null;
 private accepted=0;private appended=0;private notSubmitted=0;private unconfirmed=0;private reportedOmissions=0;private observedGap=false;
 private timer:ReturnType<typeof setTimeout>|null=null;private readyResolve!:()=>void;private readyReject!:(e:Error)=>void;
 private closeResolve:(()=>void)|null=null;private closeReject:((e:Error)=>void)|null=null;private closing:Promise<void>|null=null;
 private pauseId:string|null=null;private pauseCutoff=0;private pausePromise:Promise<{pauseId:string;throughRecorderSequence:number}>|null=null;
 private pauseResolve:((v:{pauseId:string;throughRecorderSequence:number})=>void)|null=null;private pauseReject:((e:Error)=>void)|null=null;
 private resumePacket:Extract<Packet,{kind:"resume"}>|null=null;private resumeResolve:(()=>void)|null=null;private resumeReject:((e:Error)=>void)|null=null;
 readonly ready:Promise<void>;
 constructor(options:{directory:string;recordingId:string;maxRecords?:number;maxBytes?:number;timeoutMs?:number}) {
  this.maxRecords=options.maxRecords??1024;this.maxBytes=options.maxBytes??4*1024*1024;this.timeoutMs=options.timeoutMs??5000;
  if(!Number.isSafeInteger(this.maxRecords)||this.maxRecords<1||this.maxRecords>8192||!Number.isSafeInteger(this.maxBytes)||this.maxBytes<1024||this.maxBytes>16*1024*1024||!Number.isFinite(this.timeoutMs)||this.timeoutMs<100||this.timeoutMs>30000)throw Error("invalid-journal-limits");
  this.ready=new Promise((resolve,reject)=>{this.readyResolve=resolve;this.readyReject=reject;});
  this.worker=new Worker(new URL(import.meta.url.endsWith(".ts")?"./worker.ts":"./worker.js",import.meta.url),{workerData:{directory:options.directory,recordingId:options.recordingId}});
  this.worker.on("error",e=>this.fail(e instanceof Error?e.message:"worker-error"));this.worker.on("exit",()=>{if(this.state!=="closed"&&this.state!=="failed")this.fail("worker-exited");});
  this.worker.on("message",(m:{kind:string;id?:number;reason?:string;hasGap?:boolean;throughRecorderSequence?:number})=>{
   if(this.state==="failed"||this.state==="closed")return;
   if(m.kind==="failed"){this.fail(m.reason??"worker-failed");return;}
   if(m.kind==="ready"&&this.state==="starting"){this.clearTimer();this.state="recording";this.readyResolve();this.pump();return;}
   if(!this.flight||m.id!==this.flight.id){this.fail("invalid-worker-ack");return;}
   const packet=this.flight.packet;
   if(m.kind!=="ack"&&m.kind!=="closed"||m.kind==="closed"&&packet.kind!=="close"||m.kind==="ack"&&packet.kind==="close"){this.fail("invalid-worker-ack");return;}
   if(m.kind==="ack"&&typeof m.hasGap!=="boolean"){this.fail("invalid-worker-gap-status");return;}
   if(packet.kind==="event")this.appended++;
   if(packet.kind==="loss")this.reportedOmissions+=packet.last-packet.first+1;
   this.observedGap ||= m.hasGap===true;
   this.clearTimer();this.bytes-=packet.bytes;this.flight=null;
   if(m.kind==="closed"){this.state="closed";this.closeResolve?.();return;}
   if(packet.kind==="pause"){
    if(!Number.isSafeInteger(m.throughRecorderSequence)||Number(m.throughRecorderSequence)<1){this.fail("invalid-pause-cutoff");return;}
    this.pauseCutoff=Number(m.throughRecorderSequence);this.state="paused";this.pauseResolve?.({pauseId:packet.pauseId,throughRecorderSequence:this.pauseCutoff});return;
   }
   if(packet.kind==="resume"){this.state="recording";this.pausePromise=null;this.pauseId=null;this.resumeResolve?.();}
   this.pump();
  });this.armTimer();
 }
 private clearTimer(){if(this.timer)clearTimeout(this.timer);this.timer=null;}
 private armTimer(){this.clearTimer();this.timer=setTimeout(()=>this.fail("worker-timeout"),this.timeoutMs);}
 private fail(reason:string){if(this.state==="failed"||this.state==="closed")return;this.clearTimer();this.state="failed";this.reason=reason;this.notSubmitted=this.queue.filter(p=>p.kind==="event").length;this.unconfirmed=this.flight?.packet.kind==="event"?1:0;this.queue=[];this.flight=null;this.bytes=0;this.readyReject(new Error(reason));this.closeReject?.(new Error(reason));this.pauseReject?.(new Error(reason));this.resumeReject?.(new Error(reason));this.resumePacket=null;void this.worker.terminate();}
 private pump(){
  if(this.flight||this.state==="starting"||this.state==="failed"||this.state==="closed"||this.state==="paused"||this.state==="resuming"&&!this.resumePacket)return;
  let packet=this.queue.shift();
  if(!packet&&this.state==="pausing")packet={kind:"pause",pauseId:this.pauseId!,bytes:0};
  if(!packet&&this.state==="resuming"&&this.resumePacket){packet=this.resumePacket;this.resumePacket=null;}
  if(!packet&&this.loss){packet=this.loss;this.loss=null;}
  if(!packet&&this.state==="closing")packet={kind:"close",bytes:0};
  if(!packet)return;this.flight={id:++this.nextId,packet};this.armTimer();this.worker.postMessage({...packet,id:this.flight.id});
 }
 offer(line:string):"queued"|"omitted"|"unavailable" {
  if(!["recording","pausing","paused","resuming"].includes(this.state))return "unavailable";
  if(this.offerSequence===Number.MAX_SAFE_INTEGER){this.fail("offer-sequence-exhausted");return "unavailable";}
  const n=++this.offerSequence;
  const size=typeof line==="string"&&line.length<=256*1024?Buffer.byteLength(line):Infinity;
  if(this.state!=="recording"||this.loss||size+1024>256*1024||this.queue.length+(this.flight?1:0)>=this.maxRecords||this.bytes+size>this.maxBytes){
   this.omitted++;if(this.loss){this.loss.last=n;if(size+1024>256*1024)this.loss.reason="mixed-or-invalid-size";}else this.loss={kind:"loss",first:n,last:n,reason:this.state!=="recording"?"capture-paused":size+1024>256*1024?"invalid-size":"queue-overflow",bytes:0};this.pump();return "omitted";
  }
  this.accepted++;this.queue.push({kind:"event",line,bytes:size});this.bytes+=size;this.pump();return "queued";
 }
 status():JournalStatus{return {state:this.state,queuedRecords:this.queue.length,queuedBytes:this.bytes,inFlight:this.flight?1:0,omittedOffers:this.omitted,reason:this.reason,captureCompleteness:this.omitted||this.observedGap||this.state==="failed"?"gaps-present":"unknown",accounting:{acceptedOffers:this.accepted,appendAcknowledgedOffers:this.appended,queuedOffers:this.queue.filter(p=>p.kind==="event").length,inFlightOffers:this.flight?.packet.kind==="event"?1:0,notSubmittedOnFailure:this.notSubmitted,unconfirmedOnFailure:this.unconfirmed,reportedOmissions:this.reportedOmissions,unreportedOmissions:this.omitted-this.reportedOmissions,synchronizedAtCloseOffers:this.state==="closed"?this.appended:null}};}
 pause():Promise<{pauseId:string;throughRecorderSequence:number}>{
  if(this.pausePromise&&["pausing","paused"].includes(this.state))return this.pausePromise;
  if(this.state!=="recording")return Promise.reject(new Error("journal-not-recording"));
  this.state="pausing";this.observedGap=true;this.pauseId=randomUUID();
  this.pausePromise=new Promise((resolve,reject)=>{this.pauseResolve=resolve;this.pauseReject=reject;});this.pump();return this.pausePromise;
 }
 async resume(prepare:(context:{pauseId:string;throughRecorderSequence:number})=>Promise<SessionVisualSnapshot>):Promise<void>{
  if(this.state!=="paused"||!this.pauseId)throw Error("journal-not-paused");
  const pauseId=this.pauseId,cutoff=this.pauseCutoff;this.state="resuming";
  try {
   const started=performance.now();let expiry:ReturnType<typeof setTimeout>|undefined;
   const snapshot=await Promise.race([Promise.resolve().then(()=>prepare({pauseId,throughRecorderSequence:cutoff})),new Promise<never>((_,reject)=>{expiry=setTimeout(()=>reject(new Error("snapshot-preparation-timeout")),1000);})]).finally(()=>{if(expiry)clearTimeout(expiry);});
   if(this.state!=="resuming"||this.pauseId!==pauseId)throw Error("resume-retired");
   if(performance.now()-started>1000||snapshot.throughRecorderSequence!==cutoff)throw Error("stale-resume-snapshot");
   const encoded=JSON.stringify(snapshot),bytes=Buffer.byteLength(encoded);
   if(bytes>1024*1024)throw Error("snapshot-too-large");
   const completed=new Promise<void>((resolve,reject)=>{this.resumeResolve=resolve;this.resumeReject=reject;});
   if(this.loss){this.queue.push(this.loss);this.loss=null;}
   this.resumePacket={kind:"resume",pauseId,snapshot:encoded,bytes};this.bytes+=bytes;this.pump();await completed;
  }catch(error){if(this.state==="resuming"&&!this.flight&&!this.resumePacket)this.state="paused";throw error;}
 }
 close():Promise<void>{
  if(this.closing)return this.closing;
  if(this.state==="failed")return Promise.reject(new Error(this.reason??"worker-failed"));
  if(["pausing","resuming"].includes(this.state))return Promise.reject(new Error("lifecycle-operation-pending"));
  if(this.state==="starting")return Promise.reject(new Error("journal-not-ready"));
  if(this.state==="closed")return Promise.resolve();
  this.state="closing";this.closing=new Promise((resolve,reject)=>{this.closeResolve=resolve;this.closeReject=reject;});this.pump();return this.closing;
 }
 async abort():Promise<void>{this.fail("worker-aborted");await this.worker.terminate();}
}
// End of autonomously AI-generated bounded recorder ingress.
