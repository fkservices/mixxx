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
