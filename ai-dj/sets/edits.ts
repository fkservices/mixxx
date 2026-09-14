// Autonomously AI-generated remaining-set reducer; no host access or playback authority.
import type { OccurrenceIdentity, TrackIdentity } from "../core/actions.ts";
import type { SetPin } from "../core/sets.ts";
import type { SetArchiveInput } from "./store.ts";

export interface EditVersions { readonly set: number; readonly plan: number; readonly history: number; readonly protection: number }
export interface EditProtection { readonly revision: number; readonly active: readonly OccurrenceIdentity[] }
export type SetEditOperation =
  | { readonly kind: "move"; readonly occurrence: OccurrenceIdentity; readonly before: OccurrenceIdentity | null }
  | { readonly kind: "skip"; readonly occurrence: OccurrenceIdentity }
  | { readonly kind: "pin"; readonly occurrence: OccurrenceIdentity; readonly pin: SetPin["kind"] }
  | { readonly kind: "unpin"; readonly pin: SetPin["kind"] }
  | { readonly kind: "add"; readonly occurrenceId: string; readonly generation: number;
      readonly track: TrackIdentity; readonly allowOutsidePlaylist: boolean };
export interface SetEditRequest {
  readonly requestId: string; readonly actor: "ai" | "human";
  readonly expected: EditVersions; readonly operation: SetEditOperation;
}
export interface SetEditResult {
  readonly archive: SetArchiveInput;
  readonly remaining: readonly OccurrenceIdentity[];
  readonly audit: { readonly request: SetEditRequest; readonly before: EditVersions; readonly after: EditVersions;
    readonly effect: "organization-only"; readonly requiresReplanning: true };
}
export class SetEditError extends Error {
  readonly code: "stale" | "invalid-state" | "protected" | "pin-conflict" | "policy";
  constructor(code: SetEditError["code"], message: string) { super(message); this.code=code; }
}
const key = (o: OccurrenceIdentity) => JSON.stringify([o.setId,o.occurrenceId,o.generation]);
const fail = (code: SetEditError["code"], message: string): never => { throw new SetEditError(code,message); };
const validId = (s: unknown) => typeof s === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}(?![\s\S])/.test(s);
function next(n: number): number {
  if (!Number.isSafeInteger(n) || n < 0 || n === Number.MAX_SAFE_INTEGER) fail("invalid-state","Invalid or exhausted revision");
  return n+1;
}

export function editRemainingSet(current: SetArchiveInput, protection: EditProtection, request: SetEditRequest): SetEditResult {
  const before = { set:current.definition.revision,plan:current.plan.revision,history:current.history.revision,protection:protection.revision };
  for (const name of ["set","plan","history","protection"] as const) {
    next(before[name]);
    if (request.expected[name] !== before[name]) fail("stale",`Changed ${name} revision`);
  }
  if (!validId(request.requestId) || !["ai","human"].includes(request.actor)) fail("invalid-state","Invalid edit provenance");
  const setId=current.definition.setId;
  if (current.plan.expectedSet.setId!==setId || current.history.set.setId!==setId ||
      current.plan.expectedSet.revision!==before.set || current.history.set.revision!==before.set) fail("invalid-state","Mismatched set context");
  if (current.definition.occurrences.length>10_000) fail("invalid-state","Set capacity exceeded");
  const identities=current.definition.occurrences.map(({setId,occurrenceId,generation})=>({setId,occurrenceId,generation}));
  const admitted=new Set(identities.map(key));
  if (admitted.size!==identities.length || identities.some(o=>o.setId!==setId||!validId(o.occurrenceId)||!Number.isSafeInteger(o.generation)||o.generation<0)) fail("invalid-state","Invalid occurrence identity");
  const checkCoverage=(rows: readonly OccurrenceIdentity[])=>{
    if(rows.length!==admitted.size || new Set(rows.map(key)).size!==admitted.size || rows.some(o=>!admitted.has(key(o)))) fail("invalid-state","Occurrence coverage mismatch");
  };
  checkCoverage(current.plan.plannedOrder);
  checkCoverage(current.history.outcomes.map(r=>r.occurrence));
  const pinKinds=new Set<string>();
  for(const pin of current.plan.pins) {
    if(!["opener","closer","next"].includes(pin.kind)||pinKinds.has(pin.kind)||!admitted.has(key(pin.occurrence))||!validId(pin.operatorRequestId)) fail("invalid-state","Invalid existing pin");
    pinKinds.add(pin.kind);
  }
  const frozen=new Set([...current.plan.fixedOccurrences,...protection.active].map(key));
  if([...frozen].some(k=>!admitted.has(k))) fail("invalid-state","Unknown protected occurrence");
  for(const r of current.history.outcomes) if(!["pending","interrupted"].includes(r.outcome.status)) frozen.add(key(r.occurrence));
  const editable=(o:OccurrenceIdentity)=>{
    if(!admitted.has(key(o))) fail("invalid-state","Unknown occurrence");
    if(frozen.has(key(o))) fail("protected","Occurrence is active, settled, loaded or unresolved");
  };
  let queue=current.plan.plannedOrder.filter(o=>!frozen.has(key(o)));
  let occurrences=[...current.definition.occurrences],outcomes=[...current.history.outcomes],pins=[...current.plan.pins];
  let setRevision=before.set,historyRevision=before.history;
  const op=request.operation;
  if(request.actor!=="human" && ["skip","pin","unpin"].includes(op.kind)) fail("policy","Explicit operator decision required");
  switch(op.kind) {
    case "move": {
      editable(op.occurrence); if(op.before) editable(op.before);
      if(op.before && key(op.before)===key(op.occurrence)) fail("invalid-state","Cannot move before itself");
      queue=queue.filter(o=>key(o)!==key(op.occurrence));
      const position=op.before?queue.findIndex(o=>key(o)===key(op.before!)):queue.length;
      queue.splice(position,0,op.occurrence); break;
    }
    case "skip": {
      editable(op.occurrence);
      if(pins.some(p=>key(p.occurrence)===key(op.occurrence))) fail("pin-conflict","Unpin explicitly before skipping");
      outcomes=outcomes.map(r=>key(r.occurrence)===key(op.occurrence)?{...r,revision:next(r.revision),outcome:{status:"skipped",advance:"next-playable-or-end",reason:{kind:"operator",operatorRequestId:request.requestId}}}:r);
      frozen.add(key(op.occurrence)); queue=queue.filter(o=>key(o)!==key(op.occurrence)); historyRevision=next(before.history); break;
    }
    case "pin": {
      editable(op.occurrence);
      if(!["opener","closer","next"].includes(op.pin)) fail("invalid-state","Unknown pin");
      if(op.pin==="opener" && (frozen.size>0 || current.history.spans.length>0 || current.history.outcomes.some(r=>r.outcome.status!=="pending"))) fail("protected","The opener cannot change after performance begins");
      pins=pins.filter(p=>p.kind!==op.pin);
      pins.push({kind:op.pin,occurrence:op.occurrence,operatorRequestId:request.requestId});
      queue=queue.filter(o=>key(o)!==key(op.occurrence));
      if(op.pin==="closer") queue.push(op.occurrence); else queue.unshift(op.occurrence);
      break;
    }
    case "unpin":
      if(!["opener","closer","next"].includes(op.pin)) fail("invalid-state","Unknown pin");
      pins=pins.filter(p=>p.kind!==op.pin); break;
    case "add": {
      if(!validId(op.occurrenceId)||!validId(op.track.libraryId)||!validId(op.track.trackId)||!Number.isSafeInteger(op.generation)||op.generation<0||typeof op.allowOutsidePlaylist!=="boolean") fail("invalid-state","Invalid admission");
      if(op.track.libraryId!==current.definition.admittedSource.playlist.libraryId) fail("policy","Track belongs to a different library");
      const occurrence={setId,occurrenceId:op.occurrenceId,generation:op.generation};
      if(occurrences.some(o=>o.occurrenceId===op.occurrenceId)||occurrences.length===10_000) fail("invalid-state","Reused occurrence ID or capacity exceeded");
      const inSource=current.definition.admittedSource.entries.some(e=>e.track.libraryId===op.track.libraryId&&e.track.trackId===op.track.trackId);
      if(current.definition.musicPool==="playlist-only"&&!inSource && !(request.actor==="human"&&op.allowOutsidePlaylist)) fail("policy","Outside playlist pool");
      occurrences.push({...occurrence,track:op.track,origin:{kind:"library-addition",selectedBy:request.actor,admissionEventId:request.requestId}});
      outcomes.push({occurrence,revision:0,outcome:{status:"pending"}});
      admitted.add(key(occurrence));
      const closer=pins.find(p=>p.kind==="closer");
      const closerIndex=closer?queue.findIndex(o=>key(o)===key(closer.occurrence)):-1;
      queue.splice(closerIndex<0?queue.length:closerIndex,0,occurrence);
      setRevision=next(before.set); historyRevision=next(before.history); break;
    }
    default: fail("invalid-state","Unknown operation");
  }
  const activePins=pins.filter(p=>queue.some(o=>key(o)===key(p.occurrence)));
  for(const pin of activePins) {
    const expected=pin.kind==="closer"?queue.at(-1):queue[0];
    if(!expected||key(expected)!==key(pin.occurrence)) fail("pin-conflict","Edit conflicts with a remaining-order pin");
  }
  let cursor=0;
  const order=current.plan.plannedOrder.map(o=>frozen.has(key(o))?o:queue[cursor++]!);
  order.push(...queue.slice(cursor));
  const after={set:setRevision,plan:next(before.plan),history:historyRevision,protection:before.protection};
  const version={setId,revision:setRevision};
  const groups=new Map<string,typeof identities>();
  const tracks=new Map<string,TrackIdentity>();
  for(const o of occurrences) {
    const k=JSON.stringify([o.track.libraryId,o.track.trackId]);
    const group=groups.get(k)??[]; group.push({setId:o.setId,occurrenceId:o.occurrenceId,generation:o.generation}); groups.set(k,group); tracks.set(k,o.track);
  }
  const duplicates=current.plan.duplicates.filter(()=>false);
  for(const [groupKey,group] of groups) if(group.length>1) {
    duplicates.push({track:tracks.get(groupKey)!,
      occurrences:[group[0]!,group[1]!,...group.slice(2)],severity:"information",policy:"preserve-all-prefer-unplayed-sections"});
  }
  const archive: SetArchiveInput={
    definition:{...current.definition,revision:setRevision,occurrences},
    plan:{...current.plan,revision:after.plan,expectedSet:version,plannedOrder:order,pins,duplicates,feasibility:{kind:"unknown",reason:"Set edit requires replanning and admission checks"}},
    history:{...current.history,set:version,revision:historyRevision,outcomes},
  };
  return structuredClone({archive,remaining:queue,audit:{request,before,after,effect:"organization-only",requiresReplanning:true}});
}
// End of autonomously AI-generated remaining-set reducer.
