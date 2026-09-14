// Autonomously AI-generated recording decoder; no MIDI output or actor attribution.
import { createHash } from "node:crypto";
import type { RecordedDecoderProfile, RecordedGesture } from "../core/session.ts";

type Binding = RecordedDecoderProfile["bindings"][number];
export interface SemanticRawInput {
  readonly eventId: string; readonly sequence: number; readonly atMs: number;
  readonly context: string; readonly bytes: readonly number[];
}
export type SemanticResult =
  | { readonly kind: "unknown" | "pending"; readonly rawEventIds: readonly string[]; readonly reason: string }
  | { readonly kind: "decoded"; readonly rawEventIds: readonly string[]; readonly gestureId: string;
      readonly decoder: RecordedDecoderProfile["reference"]; readonly gesture: RecordedGesture; readonly label: string;
      readonly normalizedValue: number | null };
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(",")}}`;
}
export function semanticProfileHash(profile: RecordedDecoderProfile): string {
  return createHash("sha256").update(canonical({ ...profile,
    reference: { profileId: profile.reference.profileId, revision: profile.reference.revision } })).digest("hex");
}
function validate(profile: RecordedDecoderProfile) {
  const keys = (v: object, allowed: string[]) => {
    if (Object.keys(v).some(k => !allowed.includes(k))) throw new Error("Unknown profile field");
  };
  keys(profile, ["reference", "deviceModel", "hostBuild", "mappingVersion", "bindings"]);
  keys(profile.reference, ["profileId", "revision", "sha256"]);
  if (!Number.isSafeInteger(profile.reference.revision) || profile.reference.revision < 0 ||
      ![profile.reference.profileId, profile.deviceModel, profile.hostBuild, profile.mappingVersion].every(v => typeof v === "string" && v.length > 0 && v.length <= 256) ||
      !Array.isArray(profile.bindings) || profile.bindings.length > 256 || JSON.stringify(profile).length > 131072 ||
      profile.reference.sha256 !== semanticProfileHash(profile)) throw new Error("Invalid or modified decoder profile");
  const addresses = new Set<string>();
  const controls = new Set<string>();
  for (const b of profile.bindings) {
    if (![b.controlId,b.label,b.unit].every(v => typeof v === "string" && v.length > 0 && v.length <= 256) ||
        !Number.isInteger(b.channelZeroBased) || b.channelZeroBased < 0 || b.channelZeroBased > 15 || controls.has(b.controlId)) throw new Error("Invalid or ambiguous binding");
    controls.add(b.controlId);
    const base = ["controlId","label","unit","kind","channelZeroBased"];
    let numbers: number[];
    switch (b.kind) {
      case "note": keys(b,[...base,"note","noteOnZero"]); if (b.noteOnZero !== "release") throw new Error("Invalid note mode"); numbers=[b.note]; break;
      case "cc-boolean": keys(b,[...base,"controller"]); numbers=[b.controller]; break;
      case "cc-relative":
        keys(b,[...base,"controller","encoding","multiplier"]);
        if (!["twos-complement","binary-offset","sign-magnitude"].includes(b.encoding) || !Number.isFinite(b.multiplier) || b.multiplier === 0) throw new Error("Invalid relative mode");
        numbers=[b.controller]; break;
      case "cc-absolute": case "cc14":
        keys(b,[...base,"minimum","maximum","inverted","curve",...(b.kind === "cc14" ? ["msbController","lsbController","pairingWindowMs"] : ["controller"])]);
        if (!Number.isFinite(b.minimum) || !Number.isFinite(b.maximum) || b.minimum >= b.maximum || typeof b.inverted !== "boolean" ||
            (b.curve !== undefined && b.curve !== "linear" && b.curve !== (b.kind === "cc14" ? "centered-14bit" : "centered-7bit"))) throw new Error("Invalid scale");
        if (b.kind === "cc14") {
          if (!Number.isFinite(b.pairingWindowMs) || b.pairingWindowMs <= 0 || b.pairingWindowMs > 1000) throw new Error("Invalid pairing window");
          numbers=[b.msbController,b.lsbController];
        } else numbers=[b.controller];
        break;
      default: throw new Error("Unknown binding kind");
    }
    for (const n of numbers) {
      const key=`${b.kind === "note" ? "note" : "cc"}:${b.channelZeroBased}:${n}`;
      if (!Number.isInteger(n) || n < 0 || n > 127 || addresses.has(key)) throw new Error("Ambiguous MIDI address");
      addresses.add(key);
    }
  }
}

export function createSemanticDecoder(inputProfile: RecordedDecoderProfile) {
  const profile: RecordedDecoderProfile = structuredClone(inputProfile);
  validate(profile);
  let lastSequence = 0, lastTime = -1, context = "", closed = false;
  let pending: { event: SemanticRawInput; binding: Extract<Binding,{kind:"cc14"}> } | null = null;
  const previous = new Map<string,number>();
  const unknown = (event: SemanticRawInput, reason: string): SemanticResult => ({ kind:"unknown",rawEventIds:[event.eventId],reason });
  return {
    push(event: SemanticRawInput): SemanticResult[] {
      if (closed) return [unknown(event,"closed")];
      if (!Number.isSafeInteger(event.sequence) || event.sequence <= lastSequence) return [unknown(event,"duplicate-or-stale-sequence")];
      const results: SemanticResult[]=[];
      const discard = (reason:string) => { if (pending) results.push(unknown(pending.event,reason)); pending=null; };
      if (!Number.isFinite(event.atMs) || event.atMs < 0 || event.atMs < lastTime || typeof event.context !== "string" || !event.context || event.context.length > 1024 ||
          typeof event.eventId !== "string" || !event.eventId || event.eventId.length > 256) {
        discard("invalid-clock-or-context"); closed=true; return [...results,unknown(event,"invalid-clock-or-context")];
      }
      if ((lastSequence && event.sequence !== lastSequence+1) || event.context !== context) { discard("continuity-change"); previous.clear(); }
      lastSequence=event.sequence; lastTime=event.atMs; context=event.context;
      if (pending && event.atMs-pending.event.atMs >= pending.binding.pairingWindowMs) discard("pair-timeout");
      const bytes=event.bytes;
      if (!Array.isArray(bytes) || bytes.length < 1 || bytes.length > 3 || Array.from(bytes).some(v=>!Number.isInteger(v)||v<0||v>255)) {
        discard("invalid-midi"); return [...results,unknown(event,"unsupported-or-invalid-midi")];
      }
      if (bytes.length===1 && bytes[0]!>=0xf8 && bytes[0]!<=0xfe) return [...results,unknown(event,"realtime")];
      if (bytes.length===1 && bytes[0]===0xff) { discard("midi-reset"); closed=true; return [...results,unknown(event,"midi-reset")]; }
      const status=bytes[0]!, address=bytes[1]!, value=bytes[2]!;
      if (bytes.length!==3 || address>127 || value>127) { discard("interleaved"); return [...results,unknown(event,"unsupported-or-invalid-midi")]; }
      const binding=profile.bindings.find(b=>b.channelZeroBased===(status&15) && (b.kind==="note"
        ? (status>>4===8||status>>4===9)&&b.note===address
        : status>>4===11 && (b.kind==="cc14" ? b.msbController===address||b.lsbController===address : b.controller===address)));
      if (!binding) { discard("interleaved"); return [...results,unknown(event,"unmapped")]; }
      let raw=value, ids=[event.eventId];
      if (binding.kind==="cc14") {
        if (address===binding.msbController) { discard("superseded"); pending={event:structuredClone(event),binding}; return [...results,{kind:"pending",rawEventIds:ids,reason:"awaiting-lsb"}]; }
        if (!pending || pending.binding!==binding || pending.event.eventId===event.eventId) { discard("interleaved"); return [...results,unknown(event,"orphan-lsb")]; }
        raw=(pending.event.bytes[2]!<<7)|value; ids=[pending.event.eventId,event.eventId]; pending=null;
      } else discard("interleaved");
      let gesture: RecordedGesture, label:string, normalizedValue: number | null=null;
      if (binding.kind==="note") {
        const edge=status>>4===8||value===0?"release":"press";
        gesture={kind:"trigger",controlId:binding.controlId,edge}; label=`${binding.label} ${edge}`;
      } else if (binding.kind==="cc-relative") {
        const signed=binding.encoding==="twos-complement"?(raw>=64?raw-128:raw):binding.encoding==="binary-offset"?raw-64:(raw&64)?-(raw&63):raw;
        const delta=signed*binding.multiplier;
        if (!Number.isFinite(delta)) return [...results,unknown(event,"scale-overflow")];
        gesture={kind:"relative",controlId:binding.controlId,delta,unit:binding.unit};
        label=`${binding.label} ${delta===0?"unchanged":binding.unit==="jog-ticks"?(delta<0?"backward":"forward"):(delta<0?"down":"up")}`;
      } else {
        let normalized=raw/(binding.kind==="cc14"?16383:127);
        if (binding.kind==="cc-boolean") normalized=raw===0?0:1;
        else {
          if (binding.curve==="centered-7bit") normalized=raw<=64?raw/128:(raw-1)/126;
          if (binding.curve==="centered-14bit") normalized=raw<=8192?raw/16384:0.5+(raw-8192)/16382;
          if (binding.inverted) normalized=1-normalized;
        }
        const value=binding.kind==="cc-boolean"?normalized:binding.minimum+normalized*(binding.maximum-binding.minimum);
        if (!Number.isFinite(value)) return [...results,unknown(event,"scale-overflow")];
        normalizedValue=normalized;
        const prior=previous.get(binding.controlId); previous.set(binding.controlId,value);
        gesture={kind:"absolute",controlId:binding.controlId,value,unit:binding.unit};
        label=`${binding.label} ${binding.kind==="cc-boolean"?(value?"on":"off"):prior===undefined?"set":value===prior?"unchanged":value>prior?"up":"down"}`;
      }
      const gestureId=createHash("sha256").update(canonical([profile.reference,ids])).digest("hex");
      return [...results,{kind:"decoded",rawEventIds:ids,gestureId,decoder:structuredClone(profile.reference),gesture,label,normalizedValue}];
    },
    close(): SemanticResult[] { closed=true; const result=pending?[unknown(pending.event,"closed-before-pair")]:[]; pending=null; previous.clear(); return result; },
  };
}
// End of autonomously AI-generated recording decoder.
