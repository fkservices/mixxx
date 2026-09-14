// Autonomously AI-generated manual fixture communicator. Not the production AI executor.
import { BoundedEventBuffer, type DiagnosticEventContext } from "./diagnostics/events.ts";
import { encodeConventionalWire, type ConventionalWireControl } from "./midi/conventional-encode.ts";
import { decodeConventionalFeedback, type ConventionalPresence } from "./midi/conventional-decode.ts";
import type { VirtualMidiConnection, VirtualPortConnectionOptions } from "./midi/connection.ts";

const IDS = ["deck-1.play","deck-1.volume","deck-1.cue","deck-1.sync","deck-2.play","deck-2.volume","deck-2.cue","deck-2.sync","mixer.crossfader"] as const;
interface Reading { presence: ConventionalPresence; presenceAt: number | null; value: boolean | number | null; valueAt: number | null }
export interface CommunicatorOptions {
  /** Caller labels capture provenance; this does not verify host context or grant authority. */
  readonly context: DiagnosticEventContext;
  readonly clockId: string;
  readonly now: () => number;
  readonly openTransport: (options: VirtualPortConnectionOptions) => Promise<VirtualMidiConnection>;
  readonly captureCapacity?: number;
}
export async function createCommunicator(options: CommunicatorOptions) {
  const context = structuredClone(options.context);
  const clockId = options.clockId;
  const clock = options.now;
  const diagnostics = new BoundedEventBuffer(options.captureCapacity ?? 8192);
  const readings = new Map<string,Reading>(IDS.map(id => [id,{presence:"unknown",presenceAt:null,value:null,valueAt:null}]));
  let armed = false, closed = false, lost = false;
  let lastTime = 0, eventSequence = 0;
  let disarmReason = "startup";
  let transport: VirtualMidiConnection | undefined;
  const disarm = (reason: string) => { armed=false;disarmReason=reason; };
  const now = () => {
    const t=clock();
    if(!Number.isFinite(t)||t<lastTime||t<0||t>Number.MAX_SAFE_INTEGER){lost=true;disarm("clock-invalid");throw new Error("Invalid monotonic clock");}
    lastTime=t;return t;
  };
  const record = (bytes: readonly number[], source: "host-feedback-midi" | "ai-outbound-midi", at: number) => {
    const eventId=`midi-${eventSequence++}`;
    const result=diagnostics.offer({schemaVersion:1,eventId,context,localClockDomainId:clockId,atMs:at,capturedAtMs:at,sourceTimestamp:null,kind:"raw-recorded",source,bytes,artifact:null});
    if(result.status==="dropped")disarm("capture-overflow");
    return result.status==="accepted" ? eventId : null;
  };
  // Validate supplied diagnostic context before opening a native resource, without inventing host facts.
  const validationBuffer = new BoundedEventBuffer(1);
  const at = now();
  validationBuffer.offer({schemaVersion:1,eventId:"context-validation",context,localClockDomainId:clockId,atMs:at,capturedAtMs:at,sourceTimestamp:null,kind:"raw-recorded",source:"unmapped-midi",bytes:[0xf8],artifact:null});
  transport = await options.openTransport({portName:"AI DJ",onTransportLoss:()=>{lost=true;disarm("transport-loss");},onFeedback:message=>{
    if(closed)return;
    const at=now();record(message.bytes,"host-feedback-midi",at);
    const decoded=decodeConventionalFeedback(message.bytes,at);if(!decoded)return;
    const reading=readings.get(decoded.controlId)!;
    if(decoded.kind==="presence"){
      reading.presence=decoded.presence;reading.presenceAt=at;
      if(decoded.presence!=="present"){reading.value=null;reading.valueAt=null;}
    }else if(reading.presence==="present"&&reading.presenceAt!==null&&at-reading.presenceAt<500){reading.value=decoded.value;reading.valueAt=at;}
  }});
  const state = () => {
    const at=now();
    return IDS.map(controlId=>{
      const r=readings.get(controlId)!;
      const fresh=!closed&&!lost&&r.presenceAt!==null&&at-r.presenceAt<500&&r.valueAt!==null&&at-r.valueAt<500&&r.presence==="present";
      return {controlId,presence:r.presence,presenceAtMs:r.presenceAt,value:r.value,valueAtMs:r.valueAt,status:fresh?"fresh":r.presenceAt===null?"unknown":"stale-or-unavailable",provenance:"raw-midi-unverified"};
    });
  };
  return {
    status:()=>({armed,disarmReason,transport:closed?"closed":lost?"lost":transport!.status,contextProvenance:"caller-supplied-unverified",controls:state(),capture:diagnostics.status()}),
    drain:(maximum=1024)=>diagnostics.drain(maximum),
    execute(line: string): object {
      if(typeof line!=="string"||line.length>256||/[\r\n]/.test(line))return {ok:false,reason:"invalid-command"};
      if(line==="disarm"){disarm("operator");return {ok:true,armed:false};}
      if(line==="status")return this.status();
      if(line==="arm"){
        if(closed||lost||transport!.status!=="open"||diagnostics.status().pendingGap)return {ok:false,reason:"not-ready"};
        armed=true;disarmReason="none";return {ok:true,armed:true};
      }
      const match=/^set ([a-z0-9.-]+) (true|false|(?:0|1)(?:\.[0-9]+)?)$/.exec(line);
      if(!match||!IDS.includes(match[1] as ConventionalWireControl))return {ok:false,reason:"invalid-command"};
      const id=match[1] as ConventionalWireControl;
      if(id.endsWith(".cue")||id.endsWith(".sync"))return {ok:false,reason:"host-guard-required"};
      const value=match[2]==="true"?true:match[2]==="false"?false:Number(match[2]);
      const packet=encodeConventionalWire(id,value);if(!packet)return {ok:false,reason:"invalid-value"};
      if(!armed||closed||lost||transport!.status!=="open")return {ok:false,reason:"disarmed"};
      if(state().find(x=>x.controlId===id)?.status!=="fresh")return {ok:false,reason:"feedback-not-fresh"};
      const rawId=record(packet,"ai-outbound-midi",now());
      if(!rawId)return {ok:false,reason:"capture-overflow"};
      try {
        transport!.send(packet);
        const at=now();
        const captured=diagnostics.offer({schemaVersion:1,eventId:`sent-${eventSequence++}`,context,localClockDomainId:clockId,atMs:at,capturedAtMs:at,sourceTimestamp:null,kind:"command-sent",actionId:`manual-${rawId}`,attemptId:`attempt-${rawId}`,transportMessageIds:[rawId]});
        if(captured.status==="dropped")disarm("capture-overflow");
        return {ok:true,status:"sent",controlId:id,packet,observation:"not-confirmed",scope:"manual-fixture"};
      }
      catch {lost=true;disarm("send-uncertain");return {ok:false,reason:"send-uncertain"};}
    },
    close(){if(closed)return;closed=true;disarm("closed");transport!.close();},
  };
}

// Local IPC and capture are separate from the MIDI callbacks; browser/client lifetime is irrelevant.
import { createServer, type Socket } from "node:net";
import { open, chmod } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SessionJournal } from "./session/journal.ts";
import { createFixtureSessionProjection } from "./diagnostics/fixture-session.ts";
import type { SessionEventPayload, SessionEvent } from "./core/session.ts";
import { openNativeVirtualMidiConnection } from "./midi/connection.ts";
interface CaptureSink { append(line: string): Promise<void>; sync(): Promise<void>; close(): Promise<void> }
export interface LocalServiceOptions extends CommunicatorOptions {
  readonly socketPath: string;
  readonly capturePath: string;
  readonly sessionDirectory?: string;
  readonly openCapture?: () => Promise<CaptureSink>;
}
export async function startLocalService(options: LocalServiceOptions) {
  const sink = options.openCapture ? await options.openCapture() : await (async()=>{
    const file=await open(options.capturePath,"wx",0o600);
    return {append:async(line:string)=>{await file.writeFile(line);},sync:()=>file.sync(),close:()=>file.close()};
  })();
  const recordingId=randomUUID();
  let journal:SessionJournal|undefined;
  const projection=createFixtureSessionProjection(recordingId,"manual-fixture-midi");
  let projectionIssues=0, upstreamDropped=0, metadataSequence=0;
  const metadata=(payload:SessionEventPayload)=>{
    const stamp={clockId:options.clockId,epoch:0,ms:options.now()};
    const n=++metadataSequence;
    const event:SessionEvent={schemaVersion:1,recordingId,eventId:randomUUID(),recorderSequence:n,stream:{streamId:"fixture-capture-metadata",epoch:0},producerSequence:n,producerId:"manual-fixture-service",deviceInstanceId:null,capturedAt:stamp,ingestedAt:stamp,actor:{actor:"unknown"},track:null,occurrence:null,hostContext:null,relatedEventIds:[],...payload};
    return journal!.offer(JSON.stringify(event));
  };
  let app: Awaited<ReturnType<typeof createCommunicator>>;
  try {
    if(options.sessionDirectory){journal=new SessionJournal({directory:options.sessionDirectory,recordingId});await journal.ready;}
    app=await createCommunicator(options);
  }catch(error){await journal?.abort();await sink.close();throw error;}
  let captureError: string|null=null, stopping=false, generation=0;
  let queue=Promise.resolve();
  const write=(record:object)=>{
    const line=JSON.stringify(record)+"\n";
    queue=queue.then(async()=>{await sink.append(line);await sink.sync();}).catch(error=>{captureError=String(error);app.execute("disarm");throw error;});
    return queue;
  };
  let flushing:Promise<void>|null=null;
  const flush=():Promise<void>=>{
    if(journal?.status().state==="failed"){captureError=journal.status().reason??"session-recorder-failed";app.execute("disarm");}
    if(flushing)return flushing;
    const batch=app.drain(4096);
    if(!batch.events.length&&!batch.gaps.length)return Promise.resolve();
    let sessionProjection:object|null=null;
    if(journal){
      const projected=projection.project(batch.events.map(entry=>entry.event));
      projectionIssues+=projected.issues.length;
      upstreamDropped+=batch.gaps.reduce((n,g)=>n+g.droppedEventCount,0);
      const records=projected.records.map(({sourceEventId,event})=>({sourceEventId,eventId:event.eventId,offer:journal!.offer(JSON.stringify(event))}));
      for(const gap of batch.gaps)metadata({kind:"capture-gap",affectedStream:{streamId:"fixture-diagnostic-buffer",epoch:0},missing:gap.contiguous?{kind:"known",firstSequence:gap.firstDroppedCaptureSequence,lastSequence:gap.lastDroppedCaptureSequence}:{kind:"unknown"},start:null,end:null,reason:"queue-overflow"});
      if(projected.issues.length)metadata({kind:"recording-state",state:"degraded",reason:"Projection issues retained in original diagnostic log",musicStopped:"not-implied"});
      sessionProjection={recordingId,records,issues:projected.issues,pendingCorrelations:projected.pendingCorrelations};
    }
    flushing=write({kind:"diagnostics",...batch,sessionProjection}).finally(()=>{flushing=null;});return flushing;
  };
  const clients=new Set<Socket>();
  let inFlight=0;
  const checkRecorder=()=>{if(journal?.status().state==="failed"){captureError=journal.status().reason??"session-recorder-failed";app.execute("disarm");}};
  const serviceStatus=()=>{checkRecorder();return {...app.status(),captureError,sessionRecording:journal?{recordingId,...journal.status(),captureCompleteness:projectionIssues||upstreamDropped||captureError?"gaps-present":journal.status().captureCompleteness,projectionIssues,upstreamDropped}:null,scope:"manual-fixture",pid:process.pid};};
  const server=createServer(socket=>{
    if(stopping||clients.size>=8){socket.destroy();return;}
    clients.add(socket);socket.setTimeout(2000,()=>socket.destroy());
    socket.on("error",()=>{});socket.on("close",()=>clients.delete(socket));
    let data=Buffer.alloc(0),handled=false;
    socket.on("data",chunk=>{
      if(handled){socket.destroy();return;}
      if(data.length+chunk.length>257){socket.end(JSON.stringify({ok:false,reason:"request-too-large"})+"\n");handled=true;return;}
      data=Buffer.concat([data,typeof chunk === "string" ? Buffer.from(chunk) : chunk]);const newline=data.indexOf(10);if(newline<0)return;
      handled=true;
      if(newline!==data.length-1){socket.end(JSON.stringify({ok:false,reason:"one-command-per-client"})+"\n");return;}
      const command=data.subarray(0,newline).toString("utf8");
      if(command==="disarm"){generation++;app.execute("disarm");}
      if(inFlight>=8){socket.end(JSON.stringify({ok:command==="disarm",reason:"service-busy",armed:app.status().armed})+"\n");return;}
      inFlight++;
      const epoch=generation;
      void (async()=>{
        checkRecorder();
        let response:object;
        if(command==="status")response=serviceStatus();
        else if(captureError||journal?.status().state==="failed")response=command==="disarm"?{ok:true,armed:false,captureError}:{ok:false,reason:"capture-failed"};
        else {
          await write({kind:"client-command",command,atMs:options.now(),source:"local-cli"});
          checkRecorder();
          response=captureError?{ok:false,reason:"capture-failed"}:stopping||epoch!==generation?{ok:false,reason:"cancelled"}:app.execute(command);
          await write({kind:"client-result",command,response,atMs:options.now()});
        }
        if(!socket.destroyed)socket.end(JSON.stringify(response)+"\n");
      })().catch(error=>{if(!socket.destroyed)socket.end(JSON.stringify({ok:false,reason:"capture-or-service-failed",detail:String(error)})+"\n");}).finally(()=>{inFlight--;});
    });
  });
  let interval: ReturnType<typeof setInterval>|undefined;
  let closePromise:Promise<void>|undefined;
  const close=()=>closePromise??=(async()=>{
    stopping=true;generation++;app.execute("disarm");if(interval)clearInterval(interval);
    for(const socket of clients)socket.destroy();
    await new Promise<void>(r=>server.close(()=>r()));
    let error:unknown;
    try {app.close();}catch(e){error=e;}
    try {while(app.status().capture.queuedEventCount||app.status().capture.pendingGap)await flush();await queue;await write({kind:"service-closed",atMs:options.now()});}catch(e){error??=e;}
    try {
      if(journal){
        if(captureError)metadata({kind:"recording-state",state:"degraded",reason:"Original diagnostic capture failed; inspect service failure",musicStopped:"not-implied"});
        const unresolved=projection.reset();
        if(unresolved.length){projectionIssues+=unresolved.length;metadata({kind:"recording-state",state:"degraded",reason:`${unresolved.length} attempts lack linked transport submission; original IDs in diagnostic log`,musicStopped:"not-implied"});await write({kind:"session-unresolved-attempts",recordingId,sourceEventIds:unresolved});}
        await journal.close();
      }
    }catch(e){error??=e;await journal?.abort();}
    try{await sink.close();}catch(e){error??=e;}if(error)throw error;
  })();
  try {
    await write({kind:"service-started",schemaVersion:1,scope:"manual-fixture",contextProvenance:"caller-supplied-unverified",context:options.context,clockId:options.clockId,atMs:options.now()});
    await new Promise<void>((yes,no)=>{server.once("error",no);server.listen(options.socketPath,()=>{server.removeListener("error",no);yes();});});
    await chmod(options.socketPath,0o600);
    server.on("error",()=>{app.execute("disarm");});
    interval=setInterval(()=>{void flush().catch(()=>{});},100);
  }catch(error){await close().catch(()=>{});throw error;}
  return {status:serviceStatus,flush,close,socketPath:options.socketPath};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [command,socketPath,capturePath,sessionDirectory,...extra]=process.argv.slice(2);
  if(command!=="serve-fixture"||!socketPath||!capturePath||extra.length)throw new Error("Usage: main.ts serve-fixture SOCKET CAPTURE.jsonl [SESSION_DIRECTORY]");
  const id=randomUUID();
  const service=await startLocalService({socketPath,capturePath,...(sessionDirectory?{sessionDirectory}:{}),clockId:`local-${id}`,now:()=>performance.now(),context:{sessionId:`fixture-${id}`,correlationId:null,host:{hostInstanceId:`unverified-${id}`,connectionGeneration:0,profileId:"mixxx-2.5.6-latenight-conventional-v1",profileRevision:2,capabilityRevision:0,stateRevision:0}},openTransport:openNativeVirtualMidiConnection});
  console.log(JSON.stringify({ready:true,pid:process.pid,socketPath,capturePath,scope:"manual-fixture",armed:false}));
  let closing=false;
  const stop=()=>{if(closing)return;closing=true;void service.close().then(()=>process.exit(0),error=>{console.error(String(error));process.exit(1);});};
  process.on("SIGTERM",stop);process.on("SIGINT",stop);
  setTimeout(stop,2*60*60*1000);
}
