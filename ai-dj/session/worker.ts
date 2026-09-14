// Autonomously AI-generated isolated recorder worker; receives admitted event JSON only.
import {parentPort,workerData} from "node:worker_threads";
import {open} from "node:fs/promises";
import {join} from "node:path";
import {randomUUID} from "node:crypto";
import {ChunkWriter} from "./chunks.ts";
const port=parentPort;if(!port)throw Error("recorder-worker-only");
const {directory,recordingId}=workerData as {directory:string;recordingId:string};
let sequence=0,internalSequence=0,busy=false;
let pauseId:string|null=null,pauseCutoff=0,pauseGapId:string|null=null;
const streams=new Map<string,number>();
const writer=await ChunkWriter.create(directory,recordingId);
const clockId=randomUUID();
const stamp=()=>({clockId,epoch:0,ms:performance.now()});
function internal(payload:Record<string,unknown>) {
 return {schemaVersion:1,recordingId,eventId:randomUUID(),recorderSequence:++sequence,stream:{streamId:"recorder-ingress",epoch:0},producerSequence:++internalSequence,producerId:"recorder",deviceInstanceId:null,capturedAt:stamp(),ingestedAt:stamp(),actor:{actor:"unknown"},track:null,occurrence:null,hostContext:null,relatedEventIds:[],...payload};
}
async function writeInternal(payload:Record<string,unknown>){await writer.append(JSON.stringify(internal(payload)));}
await writeInternal({kind:"recording-state",state:"started",reason:"worker-created",musicStopped:"not-implied"});
port.postMessage({kind:"ready"});
port.on("message",async(message:{kind:string;id:number;line?:string;first?:number;last?:number;reason?:string;pauseId?:string;snapshot?:string})=>{
 if(busy){port.postMessage({kind:"failed",reason:"ipc-credit-violation"});port.close();return;}
 busy=true;let hasGap=false;
 try {
  if(message.kind==="event"){
   if(pauseId)throw Error("event-during-pause");
   if(typeof message.line!=="string"||message.line.length>256*1024)throw Error("invalid-event-size");
   const e=JSON.parse(message.line);
   if(e.schemaVersion!==1||e.recordingId!==recordingId||typeof e.eventId!=="string"||!e.stream||e.stream.streamId==="recorder-ingress"||typeof e.stream.streamId!=="string"||e.stream.streamId.length>128||!Number.isSafeInteger(e.stream.epoch)||e.stream.epoch<0||!Number.isSafeInteger(e.producerSequence)||e.producerSequence<1)throw Error("invalid-producer-envelope");
   const key=JSON.stringify([e.producerId,e.stream.streamId,e.stream.epoch]),prior=streams.get(key)??0;
   if(!streams.has(key)&&streams.size>=256)throw Error("stream-capacity-exceeded");
   if(e.producerSequence<=prior)throw Error("producer-sequence-regression");
   if(e.producerSequence!==prior+1){hasGap=true;await writeInternal({kind:"capture-gap",affectedStream:e.stream,missing:{kind:"known",firstSequence:prior+1,lastSequence:e.producerSequence-1},start:null,end:e.capturedAt??null,reason:"sequence-gap"});}
   await writer.append(JSON.stringify({...e,recorderSequence:++sequence,ingestedAt:stamp()}));streams.set(key,e.producerSequence);
  }else if(message.kind==="loss"){
   hasGap=true;
   await writeInternal({kind:"capture-gap",affectedStream:{streamId:"recorder-ingress",epoch:0},missing:{kind:"unknown"},start:null,end:stamp(),reason:message.reason==="queue-overflow"?"queue-overflow":"unknown"});
   await writeInternal({kind:"recording-state",state:"degraded",reason:`ingress offers ${message.first}-${message.last} omitted: ${message.reason}`,musicStopped:"not-implied"});
  }else if(message.kind==="pause"){
   if(pauseId||typeof message.pauseId!=="string")throw Error("invalid-pause");
   pauseId=message.pauseId;hasGap=true;
   const gap=internal({kind:"capture-gap",affectedStream:{streamId:"recorder-ingress",epoch:0},missing:{kind:"unknown"},start:null,end:null,reason:"unknown"});
   pauseGapId=gap.eventId;await writer.append(JSON.stringify(gap));
   await writeInternal({kind:"recording-state",state:"paused",reason:`operator-pause:${pauseId}`,relatedEventIds:[pauseGapId],musicStopped:"not-implied"});pauseCutoff=sequence;
  }else if(message.kind==="resume"){
   if(!pauseId||message.pauseId!==pauseId||typeof message.snapshot!=="string"||Buffer.byteLength(message.snapshot)>1024*1024)throw Error("invalid-resume");
   const snapshot=JSON.parse(message.snapshot);
   if(snapshot.schemaVersion!==1||snapshot.recordingId!==recordingId||snapshot.access!=="visualization-only"||snapshot.throughRecorderSequence!==pauseCutoff||typeof snapshot.snapshotId!=="string"||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(snapshot.snapshotId)||!Array.isArray(snapshot.openGapEventIds)||snapshot.openGapEventIds.length>10000)throw Error("invalid-resume-snapshot");
   snapshot.throughRecorderSequence=sequence;snapshot.openGapEventIds=[...new Set([...snapshot.openGapEventIds,pauseGapId])];
   const h=await open(join(directory,`snapshot-${snapshot.snapshotId}.json`),"wx",0o600);
   try{await h.writeFile(JSON.stringify(snapshot));await h.sync();}finally{await h.close();}
   await writeInternal({kind:"recording-state",state:"resumed",reason:`snapshot:${snapshot.snapshotId};pause:${pauseId}`,relatedEventIds:[pauseGapId],musicStopped:"not-implied"});
   pauseId=null;pauseGapId=null;hasGap=true;
  }else if(message.kind==="close"){
   await writeInternal({kind:"recording-state",state:"ended",reason:"operator-close",musicStopped:"not-implied"});await writer.close();
   port.postMessage({kind:"closed",id:message.id});port.close();return;
  }else throw Error("invalid-worker-command");
  port.postMessage({kind:"ack",id:message.id,hasGap,throughRecorderSequence:sequence});
 }catch(error){try{await writer.abort();}catch{}port.postMessage({kind:"failed",reason:error instanceof Error?error.message:"storage-failure"});port.close();}
 finally{busy=false;}
});
// End of autonomously AI-generated recorder worker.
