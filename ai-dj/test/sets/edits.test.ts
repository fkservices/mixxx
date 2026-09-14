// Autonomously AI-generated set-edit fixtures; no host or musical evidence.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { SetArchiveInput } from "../../sets/store.ts";
import { editRemainingSet, SetEditError, type EditProtection, type SetEditOperation } from "../../sets/edits.ts";

const o=(i:number)=>({setId:"s",occurrenceId:`o${i}`,generation:0});
function fixture(): SetArchiveInput {
  const snapshot={playlist:{libraryId:"lib",playlistId:"p"},snapshotId:"snap",sourceVersion:{kind:"native-revision" as const,value:"v1"},hostInstanceId:"h",connectionGeneration:1};
  const entries=["a","b","a"].map((trackId,ordinal)=>({ordinal,track:{libraryId:"lib",trackId},nativeRowIdentity:{kind:"unavailable" as const}}));
  return {
    definition:{schemaVersion:1,setId:"s",revision:0,musicPool:"playlist-only",duration:{kind:"ai-selected"},
      admittedSource:{...snapshot,schemaVersion:1,completeness:"complete",entries,totalOccurrences:3,readEvidence:{observationId:"obs",hostInstanceId:"h",connectionGeneration:1,stateRevision:1}},
      occurrences:entries.map((e,i)=>({...o(i),track:e.track,origin:{kind:"source-playlist",row:{snapshot,ordinal:i}}}))},
    plan:{planId:"plan",revision:0,expectedSet:{setId:"s",revision:0},plannedOrder:[o(0),o(1),o(2)],fixedOccurrences:[],sections:[],pins:[],duplicates:[],feasibility:{kind:"unknown",reason:"fixture"}},
    history:{set:{setId:"s",revision:0},revision:0,spans:[],outcomes:[0,1,2].map(i=>({occurrence:o(i),revision:0,outcome:{status:"pending"}})),completeness:"complete"},
  };
}
const protection: EditProtection={revision:1,active:[]};
function apply(current:SetArchiveInput,operation:SetEditOperation,guard=protection,actor:"ai"|"human"="human") {
  return editRemainingSet(current,guard,{requestId:"request",actor,operation,
    expected:{set:current.definition.revision,plan:current.plan.revision,history:current.history.revision,protection:guard.revision}});
}
const isError=(code:SetEditError["code"])=>(e:unknown)=>e instanceof SetEditError&&e.code===code;

test("move keeps repeated occurrences, original source and input objects intact",()=>{
  const current=fixture(),before=structuredClone(current);
  const result=apply(current,{kind:"move",occurrence:o(2),before:o(0)});
  assert.deepEqual(result.archive.plan.plannedOrder,[o(2),o(0),o(1)]);
  assert.deepEqual(result.archive.definition.admittedSource,before.definition.admittedSource);
  assert.deepEqual(result.archive.history,before.history);
  assert.deepEqual(current,before);
  assert.equal(result.archive.plan.duplicates[0]!.occurrences.length,2);
  assert.equal(result.audit.effect,"organization-only");
  assert.equal(result.archive.plan.feasibility.kind,"unknown");
});
test("stale replan or changed protection epoch cannot overwrite newer work",()=>{
  const current=fixture(),operation={kind:"move" as const,occurrence:o(2),before:o(0)};
  const changed=apply(current,operation).archive;
  assert.throws(()=>editRemainingSet(changed,protection,{requestId:"stale",actor:"ai",operation,expected:{set:0,plan:0,history:0,protection:1}}),isError("stale"));
  assert.throws(()=>editRemainingSet(current,{revision:2,active:[o(0)]},{requestId:"stale",actor:"human",operation,expected:{set:0,plan:0,history:0,protection:1}}),isError("stale"));
});
test("active transitions and loaded decks stay frozen while remaining slots move",()=>{
  const current=fixture(),guard={revision:1,active:[o(1)]};
  const result=apply(current,{kind:"move",occurrence:o(2),before:o(0)},guard);
  assert.deepEqual(result.archive.plan.plannedOrder,[o(2),o(1),o(0)]);
  assert.throws(()=>apply(current,{kind:"skip",occurrence:o(1)},guard),isError("protected"));
  const loaded={...current,history:{...current.history,outcomes:current.history.outcomes.map((r,i)=>i===0?{...r,outcome:{status:"loaded" as const,evidence:current.definition.admittedSource.readEvidence}}:r)}};
  assert.throws(()=>apply(loaded,{kind:"move",occurrence:o(0),before:null}),isError("protected"));
});
test("remove is an explicit operator skip, preserving all original obligations",()=>{
  const current=fixture(),result=apply(current,{kind:"skip",occurrence:o(0)});
  assert.deepEqual(result.remaining,[o(1),o(2)]);
  assert.equal(result.archive.definition.occurrences.length,3);
  assert.equal(result.archive.plan.plannedOrder.length,3);
  assert.deepEqual(result.archive.history.outcomes[0]!.outcome,{status:"skipped",advance:"next-playable-or-end",reason:{kind:"operator",operatorRequestId:"request"}});
  assert.throws(()=>apply(current,{kind:"skip",occurrence:o(0)},protection,"ai"),isError("policy"));
  assert.throws(()=>apply(result.archive,{kind:"skip",occurrence:o(0)}),isError("protected"));
});
test("pins constrain AI order and additions preserve the closer",()=>{
  const pinned=apply(fixture(),{kind:"pin",pin:"next",occurrence:o(2)}).archive;
  assert.throws(()=>apply(pinned,{kind:"move",occurrence:o(0),before:o(2)},protection,"ai"),isError("pin-conflict"));
  assert.throws(()=>apply(pinned,{kind:"skip",occurrence:o(2)}),isError("pin-conflict"));
  const unpinned=apply(pinned,{kind:"unpin",pin:"next"}).archive;
  assert.equal(unpinned.plan.pins.length,0);
  const closer=apply(fixture(),{kind:"pin",pin:"closer",occurrence:o(2)}).archive;
  const added=apply(closer,{kind:"add",occurrenceId:"new",generation:0,track:{libraryId:"lib",trackId:"a"},allowOutsidePlaylist:false}).archive;
  assert.deepEqual(added.plan.plannedOrder.at(-1),o(2));
  assert.equal(added.definition.occurrences.length,4);
  assert.equal(added.plan.duplicates[0]!.occurrences.length,3);
  assert.equal(added.definition.revision,1);
  assert.equal(added.history.outcomes.length,4);
});
test("outside-pool admission requires an explicit human override or free-library policy",()=>{
  const operation={kind:"add" as const,occurrenceId:"new",generation:0,track:{libraryId:"lib",trackId:"outside"},allowOutsidePlaylist:false};
  assert.throws(()=>apply(fixture(),operation),isError("policy"));
  assert.throws(()=>apply(fixture(),{...operation,allowOutsidePlaylist:true},protection,"ai"),isError("policy"));
  const result=apply(fixture(),{...operation,allowOutsidePlaylist:true});
  assert.equal(result.archive.definition.musicPool,"playlist-only");
  assert.equal(result.audit.request.operation.kind,"add");
  assert.throws(()=>apply(result.archive,{...operation,allowOutsidePlaylist:true}),isError("invalid-state"));
});
test("opener cannot change after interruption; ambiguous history is not editable",()=>{
  const current=fixture();
  const interrupted={...current,history:{...current.history,outcomes:current.history.outcomes.map((r,i)=>i===0?{...r,outcome:{status:"interrupted" as const,spanIds:[]}}:r)}};
  assert.throws(()=>apply(interrupted,{kind:"pin",pin:"opener",occurrence:o(2)}),isError("protected"));
  const unknown={...current,history:{...current.history,outcomes:current.history.outcomes.map((r,i)=>i===0?{...r,outcome:{status:"reconciliation-required" as const,reason:"load-result-unknown" as const,retainedSpanIds:[]}}:r)}};
  assert.throws(()=>apply(unknown,{kind:"skip",occurrence:o(0)}),isError("protected"));
});
test("malformed coverage cannot silently lose or duplicate an obligation",()=>{
  const current=fixture();
  const bad={...current,plan:{...current.plan,plannedOrder:[o(0),o(0),o(2)]}};
  assert.throws(()=>apply(bad,{kind:"move",occurrence:o(2),before:o(0)}),isError("invalid-state"));
});
test("interrupted span evidence survives an explicit skip and library identity cannot be overridden",()=>{
  const current=fixture();
  const span={spanId:"partial",track:{libraryId:"lib",trackId:"a"},occurrence:o(0),deckId:"deck1",trackGeneration:1,clockId:"clock",startAtMs:0,endAtMs:200,
    sourceSection:{startMs:0,endMs:200},direction:"forward" as const,output:"unknown" as const,evidence:[current.definition.admittedSource.readEvidence] as const};
  const interrupted={...current,history:{...current.history,spans:[span],outcomes:current.history.outcomes.map((r,i)=>i===0?{...r,outcome:{status:"interrupted" as const,spanIds:["partial"]}}:r)}};
  const skipped=apply(interrupted,{kind:"skip",occurrence:o(0)});
  assert.deepEqual(skipped.archive.history.spans,[span]);
  assert.equal(interrupted.history.outcomes[0]!.outcome.status,"interrupted");
  assert.throws(()=>apply(current,{kind:"add",occurrenceId:"new",generation:0,track:{libraryId:"other",trackId:"a"},allowOutsidePlaylist:true}),isError("policy"));
});
// End of autonomously AI-generated edit fixtures.
