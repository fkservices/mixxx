// Autonomously AI-generated bounded fragment scheduler; no performance authority.
import { isAsyncFunction } from "node:util/types";
import { encodeSysex, type SysexMessage } from "./sysex-encode.ts";
export const FRAGMENT_SEND_LIMITS = Object.freeze({ messages:4, bytes:330_000, results:32,
  intervalMs:5, idleMs:200, assemblyMs:900 });
export interface FragmentResult { id:string; reason:"sent"|"cancelled"|"expired"|"closed"|"fault";
  attempted:number; sent:number; delivery:"unconfirmed"; }
interface Job { id:string; frames:readonly Uint8Array[]; bytes:number; deadline:number; attempted:number;
  sent:number; first:number|null; last:number|null; stop:FragmentResult["reason"]|null; }
/** All writes to this MIDI port must share this owner. A send return is not an acknowledgement. */
export function createFragmentSender(options:{ generation:number; now:()=>number;
  send:(bytes:readonly number[])=>void; allowDiagnostic?:boolean; automatic?:boolean }) {
  if (!Number.isSafeInteger(options.generation)||options.generation<0||typeof options.now!=="function"||
      typeof options.send!=="function"||isAsyncFunction(options.send)||
      (options.automatic!==undefined&&typeof options.automatic!=="boolean")||
      (options.allowDiagnostic!==undefined&&typeof options.allowDiagnostic!=="boolean")) throw Error("Invalid fragment sender options");
  const generation=options.generation, diagnostic=options.allowDiagnostic===true;
  const queue:Job[]=[], results:FragmentResult[]=[];
  let closed=false, fault:string|null=null, busy=false, lastClock=-1, nextSend=0, retained=0;
  let timer:ReturnType<typeof setTimeout>|undefined;
  function finish(job:Job,reason:FragmentResult["reason"]) {
    const index=queue.indexOf(job);if(index<0)return;
    queue.splice(index,1);retained-=job.bytes;
    results.push({id:job.id,reason,attempted:job.attempted,sent:job.sent,delivery:"unconfirmed"});
    job.frames=[];
  }
  function retire(reason:"closed"|"fault") {
    closed=true;if(timer)clearTimeout(timer);timer=undefined;
    for(const job of [...queue]){job.stop=reason;if(!busy||job!==queue[0])finish(job,reason);}
  }
  function clock():number|null {
    let now:number;try{now=options.now();}catch{now=NaN;}
    if(!Number.isFinite(now)||now<0||now>Number.MAX_SAFE_INTEGER||now<lastClock){fault="clock";retire("fault");return null;}
    lastClock=now;return now;
  }
  function schedule(){
    if(options.automatic===false||closed||timer||queue.length===0)return;
    timer=setTimeout(()=>{timer=undefined;pump();},FRAGMENT_SEND_LIMITS.intervalMs);timer.unref();
  }
  function pump(){
    if(busy||closed)return;
    const now=clock();if(now===null)return;
    for(const job of [...queue]){
      if(now>=job.deadline||(job.first!==null&&now-job.first>=FRAGMENT_SEND_LIMITS.assemblyMs)||
          (job.last!==null&&now-job.last>=FRAGMENT_SEND_LIMITS.idleMs))finish(job,"expired");
    }
    const job=queue[0];if(!job)return;
    if(now<nextSend){schedule();return;}
    // Never catch up after a stalled event loop: one frame, then a new future slot.
    nextSend=now+FRAGMENT_SEND_LIMITS.intervalMs;busy=true;
    const frame=job.frames[job.sent]!;job.attempted++;
    try{
      const returned:unknown=options.send(Array.from(frame));
      if(returned!==undefined){if(returned instanceof Promise)void returned.catch(()=>{});throw Error("Asynchronous or value-returning MIDI writer");}
      job.sent++;job.first??=now;job.last=now;
    }catch{fault="send-outcome-unknown";retire("fault");}
    finally{busy=false;}
    if(job.stop)finish(job,job.stop);
    else if(job.sent===job.frames.length)finish(job,"sent");
    schedule();
  }
  return {
    enqueue(id:string,message:SysexMessage,deadline:number,inputGeneration:number){
      if(busy)throw Error("Reentrant enqueue");
      if(closed)throw Error("Fragment sender closed");
      if(inputGeneration!==generation)throw Error("Stale generation");
      if(typeof id!=="string"||! /^[A-Za-z0-9_.:-]{1,128}$/.test(id)||queue.some(j=>j.id===id))throw Error("Invalid or pending duplicate id");
      const now=clock();if(now===null)throw Error("Fragment sender clock failed");
      if(!Number.isFinite(deadline)||deadline<=now||deadline>Number.MAX_SAFE_INTEGER)throw Error("Invalid deadline");
      if(queue.length>=FRAGMENT_SEND_LIMITS.messages||queue.length+results.length>=FRAGMENT_SEND_LIMITS.results)throw Error("Fragment sender capacity");
      const frames=encodeSysex(message,diagnostic),bytes=frames.reduce((n,f)=>n+f.length,0);
      if(retained+bytes>FRAGMENT_SEND_LIMITS.bytes)throw Error("Fragment byte capacity");
      queue.push({id,frames,bytes,deadline,attempted:0,sent:0,first:null,last:null,stop:null});retained+=bytes;schedule();
    },
    cancel(id:string){const job=queue.find(j=>j.id===id);if(!job)return false;job.stop="cancelled";if(!busy||job!==queue[0])finish(job,"cancelled");return true;},
    pump,
    close(){retire("closed");},
    drainResults(){return results.splice(0);},
    status(){return {closed,fault,generation,queued:queue.length,retainedBytes:retained,pendingResults:results.length};},
  };
}
// End of autonomously AI-generated fragment scheduler.
