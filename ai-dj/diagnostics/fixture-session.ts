// Autonomously AI-generated legacy fixture projection; no production AI or host authority.
import {randomUUID} from "node:crypto";
import type {DiagnosticEvent,RawRecordedEvent} from "./events.ts";
import type {SessionEvent} from "../core/session.ts";
export function createFixtureSessionProjection(recordingId:string,streamId:string,capacity=1024){
 if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(recordingId)||!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(streamId)||!Number.isSafeInteger(capacity)||capacity<1||capacity>4096)throw Error("invalid-projection-options");
 let sequence=0;
 const pending=new Map<string,{raw:RawRecordedEvent;publishedId:string}>();
 const context=(e:DiagnosticEvent)=>JSON.stringify([e.context,e.localClockDomainId]);
 return {
  project(input:readonly DiagnosticEvent[]){
   if(input.length>4096)throw Error("projection-batch-too-large");
   const records:{sourceEventId:string;event:SessionEvent}[]=[],issues:{sourceEventId:string;reason:string}[]=[];
   const rawEvent=(source:DiagnosticEvent,raw:RawRecordedEvent,stage:"attempted"|"submitted"|"received",relatedEventIds:string[])=>{
    const eventId=randomUUID();sequence++;
    if(!Number.isSafeInteger(sequence))throw Error("projection-sequence-exhausted");
    records.push({sourceEventId:source.eventId,event:{schemaVersion:1,recordingId,eventId,recorderSequence:sequence,stream:{streamId,epoch:0},producerSequence:sequence,producerId:"manual-fixture-projection",deviceInstanceId:null,capturedAt:{clockId:source.localClockDomainId,epoch:0,ms:source.atMs},ingestedAt:{clockId:source.localClockDomainId,epoch:0,ms:source.capturedAtMs},actor:{actor:"unknown"},track:null,occurrence:null,hostContext:null,relatedEventIds,kind:"raw-midi",endpointInstanceId:streamId,direction:raw.source==="ai-outbound-midi"?"ai-outbound":raw.source==="physical-controller-midi"?"physical-ingress":"host-feedback",stage,framing:"unknown",bytes:[...raw.bytes],decoder:null}});return eventId;
   };
   for(const e of input){
    if(e.kind==="raw-recorded"){
     if(e.source==="unmapped-midi"){issues.push({sourceEventId:e.eventId,reason:"unknown-direction-retain-original"});continue;}
     const copy:RawRecordedEvent=structuredClone(e);
     if(e.source==="ai-outbound-midi"){
      if(pending.has(e.eventId)){issues.push({sourceEventId:e.eventId,reason:"duplicate-pending-raw-id"});continue;}
      const publishedId=rawEvent(e,copy,"attempted",[]);
      if(pending.size===capacity){const oldest=pending.keys().next().value!;pending.delete(oldest);issues.push({sourceEventId:oldest,reason:"pending-correlation-evicted"});}
      pending.set(e.eventId,{raw:copy,publishedId});
     }else rawEvent(e,copy,"received",[]);
    }else if(e.kind==="command-sent"){
     for(const id of e.transportMessageIds){
      const match=pending.get(id);
      if(!match||context(e)!==context(match.raw)||e.atMs<match.raw.atMs){issues.push({sourceEventId:e.eventId,reason:"unresolved-submission-link"});continue;}
      rawEvent(e,match.raw,"submitted",[match.publishedId]);pending.delete(id);
     }
    }else issues.push({sourceEventId:e.eventId,reason:"not-a-session-host-observation-retain-original"});
   }
   return {records,issues,pendingCorrelations:pending.size};
  },
  reset(){const unresolved=[...pending.keys()];pending.clear();return unresolved;}
 };
}
// End of autonomously AI-generated fixture projection.
