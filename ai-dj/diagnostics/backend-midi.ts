// Autonomously AI-generated backend packet conversion; observation only, no dispatch.
import {randomUUID} from "node:crypto";
import type {BackendMidiPacket, SessionEvent, SessionEventEnvelope} from "../core/session.ts";

const id = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v);
const integer = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
/** Closed payload admission only. Session envelope/import admission is a separate boundary. */
export function admitBackendMidiPacket(input: unknown): BackendMidiPacket {
 if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("invalid-backend-packet");
 const v = input as Record<string, unknown>;
 const fields = ["kind", "backend", "endpointInstanceId", "packedWord", "backendTimestamp", "effectiveFilterMask", "deliveryOrder"];
 if (Object.keys(v).length !== fields.length || fields.some(k => !Object.hasOwn(v, k)) ||
     v.kind !== "backend-midi-packet" || v.backend !== "portmidi" || v.deliveryOrder !== "backend" ||
     !id(v.endpointInstanceId) || !integer(v.packedWord, 0, 0xffffffff) ||
     !integer(v.backendTimestamp, -0x80000000, 0x7fffffff) || !integer(v.effectiveFilterMask, 0, 0xffffffff)) throw Error("invalid-backend-packet");
 return Object.freeze({kind: "backend-midi-packet", backend: "portmidi", endpointInstanceId: v.endpointInstanceId,
  packedWord: v.packedWord, backendTimestamp: v.backendTimestamp, effectiveFilterMask: v.effectiveFilterMask, deliveryOrder: "backend"});
}

type PacketEvent = SessionEventEnvelope & BackendMidiPacket;
type RawEvent = Extract<SessionEvent, {kind: "raw-midi"}>;
export interface PacketConversion {
 readonly packet: PacketEvent;
 readonly raw: readonly RawEvent[];
 readonly issues: readonly string[];
 /** Downstream gesture pairing must retire its partial state before processing these bytes. */
 readonly resetPairing: boolean;
}
/** One converter per receiving route. Constant parsing state; never assembles SysEx. */
export function createBackendMidiConverter(recordingId: string, direction: "physical-ingress" | "host-feedback") {
 if (!id(recordingId) || !["physical-ingress", "host-feedback"].includes(direction)) throw Error("invalid-converter-options");
 const streamId = randomUUID();
 let sequence = 0, context: string | null = null, lastSequence = 0, sysex = false;
 return {
  reset() {context = null; lastSequence = 0; sysex = false;},
  convert(source: PacketEvent): PacketConversion {
   if (source.recordingId !== recordingId || !Number.isSafeInteger(source.producerSequence) || source.producerSequence < 1) throw Error("invalid-packet-envelope");
   const payload = admitBackendMidiPacket({kind: source.kind, backend: source.backend, endpointInstanceId: source.endpointInstanceId,
    packedWord: source.packedWord, backendTimestamp: source.backendTimestamp, effectiveFilterMask: source.effectiveFilterMask, deliveryOrder: source.deliveryOrder});
   // Caller supplies an already-admitted envelope. Clone so later caller mutation cannot rewrite evidence.
   const packet: PacketEvent = structuredClone({...source, ...payload});
   const nextContext = JSON.stringify([source.producerId, source.stream, source.endpointInstanceId, source.effectiveFilterMask, source.capturedAt.clockId, source.capturedAt.epoch]);
   const issues: string[] = [], raw: RawEvent[] = [];
   let resetPairing = context !== nextContext || source.producerSequence !== lastSequence + 1;
   if (context === nextContext && source.producerSequence <= lastSequence) {
    sysex = false;
    return {packet, raw, issues: ["duplicate-or-regressed-sequence"], resetPairing: true};
   }
   if (resetPairing) {sysex = false; issues.push(context === nextContext ? "sequence-gap" : "capture-context-reset");}
   context = nextContext; lastSequence = source.producerSequence;
   const bytes = Array.from({length: 4}, (_, i) => (payload.packedWord >>> (8 * i)) & 255);
   const status = bytes[0]!;
   const emit = (value: number[], framing: RawEvent["framing"]) => {
    if (!Number.isSafeInteger(sequence + 1)) throw Error("converter-sequence-exhausted");
    sequence++;
    raw.push({schemaVersion: 1, recordingId, deviceInstanceId: source.deviceInstanceId,
     capturedAt: structuredClone(source.capturedAt), ingestedAt: structuredClone(source.ingestedAt), kind: "raw-midi", eventId: randomUUID(), producerId: "portmidi-converter",
     stream: {streamId, epoch: 0}, producerSequence: sequence, recorderSequence: sequence,
     actor: {actor: "unknown"}, track: null, occurrence: null, hostContext: null,
     relatedEventIds: [source.eventId], endpointInstanceId: payload.endpointInstanceId,
     direction, stage: "received", framing, bytes: value, decoder: null});
   };
   const malformed = (reason: string) => {issues.push(reason); sysex = false; resetPairing = true;};
   const realtime = (b: number) => [0xf8, 0xfa, 0xfb, 0xfc, 0xfe, 0xff].includes(b);
   if (status >= 0xf8) {
    if (realtime(status)) emit([status], "complete-message");
    else malformed("undefined-realtime-status");
   } else if (status === 0xf0 || (sysex && (status < 0x80 || status === 0xf7))) {
    if (status === 0xf0 && sysex) {issues.push("sysex-restarted-before-eox"); resetPairing = true;}
    sysex = true;
    const end = bytes.indexOf(0xf7), fragment = end < 0 ? bytes : bytes.slice(0, end + 1);
    if (fragment.some((b, i) => b >= 0x80 && !(i === 0 && b === 0xf0) && b !== 0xf7 && !realtime(b))) malformed("malformed-sysex-fragment");
    else {
     // Embedded realtime stays in its fragment: never assert original wire ordering.
     emit(fragment, "fragment");
     if (end >= 0) sysex = false;
    }
   } else {
    if (sysex) {issues.push("sysex-truncated-by-status"); sysex = false; resetPairing = true;}
    const length = status >= 0x80 && status < 0xf0 ? ([0xc0, 0xd0].includes(status & 0xf0) ? 2 : 3)
     : status === 0xf1 || status === 0xf3 ? 2 : status === 0xf2 ? 3 : status === 0xf6 ? 1 : 0;
    if (!length) malformed("unframed-or-unsupported-status");
    else if (bytes.slice(1, length).some(b => b >= 0x80)) malformed("invalid-short-message-data");
    else emit(bytes.slice(0, length), "complete-message");
   }
   return {packet, raw, issues, resetPairing};
  }
 };
}
// End of autonomously AI-generated backend packet conversion.
