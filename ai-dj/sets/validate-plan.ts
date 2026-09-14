// Autonomously AI-generated plan integrity check; no live-state admission or dispatch.
import type { ObservationReference, OccurrenceIdentity, TrackIdentity } from "../core/actions.ts";
import type { MeaningfulSectionPolicy } from "../core/sets.ts";
import type { PlaylistSnapshotIdentity } from "../core/playlists.ts";
import type { SetArchiveInput } from "./store.ts";

export interface PlanValidationFacts {
  readonly operatorRequestIds: readonly string[];
  readonly operatorSkips: readonly { readonly requestId: string; readonly occurrence: OccurrenceIdentity }[];
  readonly operatorPins: readonly { readonly requestId: string; readonly occurrence: OccurrenceIdentity; readonly kind: "opener" | "closer" | "next" }[];
  readonly admissions: readonly { readonly eventId: string; readonly occurrence: OccurrenceIdentity; readonly actor: "ai" | "human"; readonly track: TrackIdentity; readonly allowOutsidePlaylist: boolean }[];
  readonly unavailable: readonly { readonly occurrence: OccurrenceIdentity; readonly recordRevision: number;
    readonly code: "missing" | "unreadable" | "unplayable"; readonly evidence: ObservationReference }[];
  readonly completed: readonly { readonly occurrence: OccurrenceIdentity; readonly recordRevision: number }[];
  readonly tracks: readonly { readonly track: TrackIdentity; readonly contentVersion: string; readonly durationMs: number }[];
  readonly approvedPolicies: readonly MeaningfulSectionPolicy[];
  readonly protectedOrder: readonly { readonly occurrence: OccurrenceIdentity; readonly index: number }[];
  readonly rateBounds: { readonly minimum: number; readonly maximum: number };
  readonly deckCount: number;
  readonly timing: { readonly planId: string; readonly planRevision: number; readonly elapsedMs: number;
    readonly intervals: readonly { readonly sectionId: string; readonly startMs: number; readonly endMs: number; readonly rate: number }[] } | null;
}
export interface PlanIntegrityResult {
  readonly status: "valid" | "invalid" | "needs-resolution";
  readonly issues: readonly string[];
  readonly coverage: { readonly original: number; readonly additions: number; readonly userSkipped: number;
    readonly confirmedUnavailable: number; readonly completed: number; readonly remaining: number };
  readonly plannedDurationMs: number | null;
  readonly grantsPerformanceAuthority: false;
}
const id=(s:unknown)=>typeof s==="string"&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}(?![\s\S])/.test(s);
const generation=(n:number)=>Number.isSafeInteger(n)&&n>=0;
const key=(o:OccurrenceIdentity)=>JSON.stringify([o.setId,o.occurrenceId,o.generation]);
const trackKey=(t:TrackIdentity)=>JSON.stringify([t.libraryId,t.trackId]);
const snapshotKey=(s:PlaylistSnapshotIdentity)=>JSON.stringify([s.playlist.libraryId,s.playlist.playlistId,s.snapshotId,s.sourceVersion.kind,s.sourceVersion.value,s.hostInstanceId,s.connectionGeneration]);
const observationKey=(o:ObservationReference)=>JSON.stringify([o.observationId,o.hostInstanceId,o.connectionGeneration,o.stateRevision]);
const policyKey=(p:MeaningfulSectionPolicy)=>JSON.stringify([p.policyId,p.revision,p.selectedBy,p.minimumAudibleMs,p.minimumSelectedCoverageRatio]);

export function validateSetPlan(archive: SetArchiveInput, facts: PlanValidationFacts): PlanIntegrityResult {
  const issues:string[]=[]; let invalid=false,unresolved=false,plannedDurationMs:number|null=null;
  const coverage={original:0,additions:0,userSkipped:0,confirmedUnavailable:0,completed:0,remaining:0};
  const bad=(code:string)=>{invalid=true;if(issues.length<64)issues.push(code);};
  const resolve=(code:string)=>{unresolved=true;if(issues.length<64)issues.push(code);};
  try {
    const {definition:d,plan:p,history:h}=archive,source=d.admittedSource;
    if(d.occurrences.length>10000||p.sections.length>20000||p.plannedOrder.length>10000||h.outcomes.length>10000) throw Error("capacity-exceeded");
    if(!id(d.setId)||!id(p.planId)||![d.revision,p.revision,h.revision].every(generation)||d.schemaVersion!==1||
      p.expectedSet.setId!==d.setId||h.set.setId!==d.setId||p.expectedSet.revision!==d.revision||h.set.revision!==d.revision) bad("set-context");
    if(source.schemaVersion!==1||source.completeness!=="complete"||source.entries.length!==source.totalOccurrences||
      !id(source.playlist.libraryId)||!id(source.playlist.playlistId)||!id(source.snapshotId)||!id(source.hostInstanceId)||!generation(source.connectionGeneration)) bad("source-snapshot");
    const admitted=new Map(d.occurrences.map(o=>[key(o),o]));
    if(admitted.size!==d.occurrences.length) bad("duplicate-occurrence-identity");
    const originalRows=new Set<number>();
    source.entries.forEach((e,i)=>{if(e.ordinal!==i||!id(e.track.trackId)||e.track.libraryId!==source.playlist.libraryId)bad("source-row");});
    for(const o of d.occurrences) {
      if(o.setId!==d.setId||!id(o.occurrenceId)||!generation(o.generation)||!id(o.track.trackId)||o.track.libraryId!==source.playlist.libraryId)bad("occurrence-identity");
      if(o.origin.kind==="source-playlist") {
        const {snapshot,ordinal}=o.origin.row,entry=source.entries[ordinal];
        if(!generation(ordinal)||!entry||snapshotKey(snapshot)!==snapshotKey(source)||trackKey(entry.track)!==trackKey(o.track)||originalRows.has(ordinal))bad("source-occurrence-substitution");
        originalRows.add(ordinal);coverage.original++;
      } else if(o.origin.kind==="library-addition") {
        coverage.additions++;
        const eventId=o.origin.admissionEventId;
        const admission=facts.admissions.find(a=>a.eventId===eventId&&key(a.occurrence)===key(o));
        if(!admission||admission.actor!==o.origin.selectedBy||trackKey(admission.track)!==trackKey(o.track))bad("unproven-addition");
        const inPool=source.entries.some(e=>trackKey(e.track)===trackKey(o.track));
        if(d.musicPool==="playlist-only"&&!inPool&&!(admission?.actor==="human"&&admission.allowOutsidePlaylist))bad("addition-outside-pool");
      } else bad("unknown-origin");
    }
    if(originalRows.size!==source.entries.length)bad("missing-original-occurrence");
    const order=p.plannedOrder.map(key);
    if(order.length!==admitted.size||new Set(order).size!==admitted.size||order.some(k=>!admitted.has(k)))bad("planned-occurrence-multiset");
    const outcomes=new Map(h.outcomes.map(r=>[key(r.occurrence),r]));
    if(outcomes.size!==h.outcomes.length||outcomes.size!==admitted.size||[...outcomes.keys()].some(k=>!admitted.has(k)))bad("outcome-coverage");
    const settled=new Set<string>();
    for(const [k,r] of outcomes) {
      if(!generation(r.revision))bad("outcome-revision");
      if(r.outcome.status==="skipped") {
        if(r.outcome.reason.kind==="operator") {
          const requestId=r.outcome.reason.operatorRequestId;
          if(!facts.operatorRequestIds.includes(requestId)||!facts.operatorSkips.some(s=>s.requestId===requestId&&key(s.occurrence)===k))bad("unproven-user-skip");
          else {coverage.userSkipped++;settled.add(k);}
        } else {
          const reason=r.outcome.reason;
          if(!facts.unavailable.some(u=>key(u.occurrence)===k&&u.recordRevision===r.revision&&u.code===reason.code&&observationKey(u.evidence)===observationKey(reason.evidence)))bad("unproven-unavailable-skip");
          else {coverage.confirmedUnavailable++;settled.add(k);}
        }
      } else if(r.outcome.status==="played") {
        if(!facts.completed.some(c=>key(c.occurrence)===k&&c.recordRevision===r.revision))resolve("completion-reconciliation-required");
        else {coverage.completed++;settled.add(k);}
      } else if(r.outcome.status==="reconciliation-required")resolve("outcome-reconciliation-required");
      else if(!["pending","loaded","pre-listened","playing","interrupted"].includes(r.outcome.status))bad("unknown-outcome");
    }
    coverage.remaining=admitted.size-settled.size;
    const protectedKeys=new Set(facts.protectedOrder.map(f=>key(f.occurrence)));
    for(const f of facts.protectedOrder)if(!generation(f.index)||order[f.index]!==key(f.occurrence)||!admitted.has(key(f.occurrence)))bad("protected-order-changed");
    if(new Set(p.fixedOccurrences.map(key)).size!==p.fixedOccurrences.length||p.fixedOccurrences.some(o=>!admitted.has(key(o))))bad("fixed-occurrence-reference");
    const eligible=order.filter(k=>!settled.has(k)&&!protectedKeys.has(k)&&["pending","interrupted"].includes(outcomes.get(k)?.outcome.status??""));
    const pins=new Set<string>();
    for(const pin of p.pins) {
      const k=key(pin.occurrence);
      if(!["opener","closer","next"].includes(pin.kind)||pins.has(pin.kind)||!admitted.has(k)||!facts.operatorRequestIds.includes(pin.operatorRequestId)||
        !facts.operatorPins.some(f=>f.requestId===pin.operatorRequestId&&f.kind===pin.kind&&key(f.occurrence)===k))bad("invalid-pin");
      pins.add(pin.kind);
      if(eligible.includes(k)&&k!==(pin.kind==="closer"?eligible.at(-1):eligible[0]))bad("pin-order");
    }
    const sectionIds=new Set<string>(),covered=new Set<string>();
    const required=new Map<string,typeof p.sections[number]>();
    for(const s of p.sections) {
      const k=key(s.occurrence),o=admitted.get(k),t=o&&facts.tracks.find(t=>trackKey(t.track)===trackKey(o.track));
      if(!id(s.sectionId)||sectionIds.has(s.sectionId)||!o){bad("section-reference");continue;}
      sectionIds.add(s.sectionId);
      if(settled.has(k))continue;
      const length=s.section.endMs-s.section.startMs;
      if(!Number.isFinite(s.section.startMs)||!Number.isFinite(s.section.endMs)||s.section.startMs<0||length<=0)bad("section-bounds");
      if(!t||!Number.isFinite(t.durationMs)||t.durationMs<=0)resolve("track-duration-unverified");
      else if(s.trackContentVersion!==t.contentVersion||s.section.endMs>t.durationMs)bad("section-content-or-duration");
      const policy=s.meaningfulPolicy;
      if(!id(policy.policyId)||!generation(policy.revision)||!Number.isFinite(policy.minimumAudibleMs)||policy.minimumAudibleMs<=0||
        !Number.isFinite(policy.minimumSelectedCoverageRatio)||policy.minimumSelectedCoverageRatio<=0||policy.minimumSelectedCoverageRatio>1)bad("section-policy");
      if(!facts.approvedPolicies.some(a=>policyKey(a)===policyKey(policy)))resolve("unapproved-section-policy");
      if(!settled.has(k)){required.set(s.sectionId,s);covered.add(k);}
    }
    for(const k of admitted.keys())if(!settled.has(k)&&!covered.has(k))resolve("remaining-occurrence-needs-section");
    const goal=d.duration;
    if(goal.kind==="fixed"&&(!Number.isFinite(goal.durationMs)||goal.durationMs<=0)||goal.kind==="range"&&(!Number.isFinite(goal.minimumMs)||!Number.isFinite(goal.maximumMs)||goal.minimumMs<=0||goal.maximumMs<goal.minimumMs)||!["fixed","range","ai-selected"].includes(goal.kind))bad("duration-policy");
    const timing=facts.timing;
    if(!timing) {
      if(goal.kind!=="ai-selected")resolve("timing-plan-required");
      for(const s of required.values())if((s.section.endMs-s.section.startMs)/facts.rateBounds.maximum<s.meaningfulPolicy.minimumAudibleMs)resolve("section-rate-or-duration-needs-resolution");
    } else {
      if(timing.planId!==p.planId||timing.planRevision!==p.revision||!Number.isFinite(timing.elapsedMs)||timing.elapsedMs<0)bad("timing-context");
      if(timing.intervals.length>20000)throw Error("capacity-exceeded");
      const seen=new Set<string>(),edges:{at:number;delta:number}[]=[];
      let horizon=timing.elapsedMs;
      const starts=new Map<string,number>();
      for(const interval of timing.intervals) {
        const s=required.get(interval.sectionId),duration=interval.endMs-interval.startMs;
        if(!s||seen.has(interval.sectionId)){bad("timing-section-coverage");continue;}
        seen.add(interval.sectionId);
        if(!Number.isFinite(interval.startMs)||!Number.isFinite(interval.endMs)||interval.startMs<timing.elapsedMs||duration<=0||!Number.isFinite(interval.rate)||interval.rate<facts.rateBounds.minimum||interval.rate>facts.rateBounds.maximum)bad("timing-bounds");
        if(Math.abs(duration*interval.rate-(s.section.endMs-s.section.startMs))>1)bad("timing-source-mismatch");
        if(duration<s.meaningfulPolicy.minimumAudibleMs)resolve("section-too-short");
        horizon=Math.max(horizon,interval.endMs);edges.push({at:interval.startMs,delta:1},{at:interval.endMs,delta:-1});
        const k=key(s.occurrence);starts.set(k,Math.min(starts.get(k)??Infinity,interval.startMs));
      }
      if(seen.size!==required.size)resolve("timing-plan-incomplete");
      let active=0,last=timing.elapsedMs;
      for(const e of edges.sort((a,b)=>a.at-b.at||a.delta-b.delta)) {
        if(e.at>last&&active===0)resolve("unplanned-silence");active+=e.delta;last=e.at;
        if(active>facts.deckCount)resolve("insufficient-decks");
      }
      let previous=-Infinity;
      for(const k of order)if(starts.has(k)){if(starts.get(k)!<previous)bad("timing-order");previous=starts.get(k)!;}
      plannedDurationMs=Number.isFinite(horizon)?horizon:null;
      if(goal.kind==="fixed"&&Math.abs(horizon-goal.durationMs)>1||goal.kind==="range"&&(horizon<goal.minimumMs||horizon>goal.maximumMs))resolve("duration-goal-conflict");
    }
    if(!Number.isFinite(facts.rateBounds.minimum)||!Number.isFinite(facts.rateBounds.maximum)||facts.rateBounds.minimum<=0||facts.rateBounds.maximum<facts.rateBounds.minimum||!Number.isInteger(facts.deckCount)||facts.deckCount<1||facts.deckCount>8)bad("invalid-planning-facts");
    if(admitted.size===0)resolve("empty-set");
  } catch { bad("malformed-or-over-capacity-plan"); }
  return {status:invalid?"invalid":unresolved?"needs-resolution":"valid",issues,coverage,plannedDurationMs,grantsPerformanceAuthority:false};
}
// End of autonomously AI-generated plan integrity check.
