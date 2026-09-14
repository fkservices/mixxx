// Autonomously AI-generated planning fixtures; not audible or native-host evidence.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { SetArchiveInput } from "../../sets/store.ts";
import { validateSetPlan, type PlanValidationFacts } from "../../sets/validate-plan.ts";
const o=(i:number)=>({setId:"s",occurrenceId:`o${i}`,generation:0});
function fixture(): {archive:SetArchiveInput;facts:PlanValidationFacts} {
  const snapshot={playlist:{libraryId:"lib",playlistId:"p"},snapshotId:"snap",sourceVersion:{kind:"native-revision" as const,value:"v1"},hostInstanceId:"h",connectionGeneration:1};
  const entries=["a","b","a"].map((trackId,ordinal)=>({ordinal,track:{libraryId:"lib",trackId},nativeRowIdentity:{kind:"unavailable" as const}}));
  const policy={policyId:"approved",revision:1,selectedBy:"human" as const,minimumAudibleMs:10000,minimumSelectedCoverageRatio:0.8};
  const archive:SetArchiveInput={
    definition:{schemaVersion:1,setId:"s",revision:0,musicPool:"playlist-only",duration:{kind:"ai-selected"},admittedSource:{...snapshot,schemaVersion:1,completeness:"complete",entries,totalOccurrences:3,readEvidence:{observationId:"read",hostInstanceId:"h",connectionGeneration:1,stateRevision:1}},occurrences:entries.map((e,i)=>({...o(i),track:e.track,origin:{kind:"source-playlist",row:{snapshot,ordinal:i}}}))},
    plan:{planId:"plan",revision:0,expectedSet:{setId:"s",revision:0},plannedOrder:[o(2),o(0),o(1)],fixedOccurrences:[],pins:[],duplicates:[],feasibility:{kind:"unknown",reason:"fixture"},sections:[0,1,2].map(i=>({sectionId:`section${i}`,occurrence:o(i),selectedBy:"ai",trackContentVersion:"audio-v1",section:{startMs:0,endMs:40000},cueInputs:[],meaningfulPolicy:policy}))},
    history:{set:{setId:"s",revision:0},revision:0,spans:[],outcomes:[0,1,2].map(i=>({occurrence:o(i),revision:0,outcome:{status:"pending"}})),completeness:"complete"},
  };
  const facts:PlanValidationFacts={operatorRequestIds:[],operatorSkips:[],operatorPins:[],admissions:[],unavailable:[],completed:[],tracks:["a","b"].map(trackId=>({track:{libraryId:"lib",trackId},contentVersion:"audio-v1",durationMs:240000})),approvedPolicies:[policy],protectedOrder:[],rateBounds:{minimum:1,maximum:1},deckCount:2,timing:null};
  return {archive,facts};
}
test("a reordered A/B/A keeps three separate original obligations",()=>{
  const {archive,facts}=fixture(),r=validateSetPlan(archive,facts);
  assert.equal(r.status,"valid",r.issues.join(","));assert.equal(r.coverage.original,3);assert.equal(r.coverage.remaining,3);assert.equal(r.grantsPerformanceAuthority,false);
});
test("omission, extra repetition, wrong library and source-row substitution fail",()=>{
  const {archive,facts}=fixture();
  for(const order of [[o(0),o(1)],[o(0),o(1),o(1)],[o(0),o(1),o(2),o(2)]])assert.equal(validateSetPlan({...archive,plan:{...archive.plan,plannedOrder:order}},facts).status,"invalid");
  const occurrences=archive.definition.occurrences.map((entry,i)=>i===2?{...entry,track:{libraryId:"other",trackId:"a"}}:entry);
  assert.equal(validateSetPlan({...archive,definition:{...archive.definition,occurrences}},facts).status,"invalid");
  const dropped={...archive,definition:{...archive.definition,occurrences:archive.definition.occurrences.slice(1)},plan:{...archive.plan,plannedOrder:[o(1),o(2)],sections:archive.plan.sections.slice(1)},history:{...archive.history,outcomes:archive.history.outcomes.slice(1)}};
  assert(validateSetPlan(dropped,facts).issues.includes("missing-original-occurrence"));
});
test("user skips are scoped to the requested occurrence and never remove it",()=>{
  const {archive,facts}=fixture();
  const skipped={...archive,history:{...archive.history,outcomes:archive.history.outcomes.map((r,i)=>i===0?{...r,outcome:{status:"skipped" as const,advance:"next-playable-or-end" as const,reason:{kind:"operator" as const,operatorRequestId:"skip"}}}:r)}};
  assert.equal(validateSetPlan(skipped,{...facts,operatorRequestIds:["skip"]}).status,"invalid");
  const allowed=validateSetPlan(skipped,{...facts,operatorRequestIds:["skip"],operatorSkips:[{requestId:"skip",occurrence:o(0)}]});
  assert.equal(allowed.status,"valid");assert.equal(allowed.coverage.userSkipped,1);assert.equal(allowed.coverage.original,3);
});
test("confirmed unavailability needs exact observation, revision and occurrence",()=>{
  const {archive,facts}=fixture(),evidence=archive.definition.admittedSource.readEvidence;
  const changed={...archive,history:{...archive.history,outcomes:archive.history.outcomes.map((r,i)=>i===0?{...r,outcome:{status:"skipped" as const,advance:"next-playable-or-end" as const,reason:{kind:"confirmed-unavailable" as const,code:"missing" as const,evidence}}}:r)}};
  assert.equal(validateSetPlan(changed,facts).status,"invalid");
  assert.equal(validateSetPlan(changed,{...facts,unavailable:[{occurrence:o(0),recordRevision:0,code:"missing",evidence}]}).coverage.confirmedUnavailable,1);
  assert.equal(validateSetPlan(changed,{...facts,unavailable:[{occurrence:o(2),recordRevision:0,code:"missing",evidence}]}).status,"invalid");
});
test("impossible duration and shortened unapproved sections require visible resolution",()=>{
  const {archive,facts}=fixture();
  const goal={...archive,definition:{...archive.definition,duration:{kind:"fixed" as const,durationMs:10000}}};
  assert(validateSetPlan(goal,facts).issues.includes("timing-plan-required"));
  const snippets={...archive,plan:{...archive.plan,sections:archive.plan.sections.map(s=>({...s,section:{startMs:0,endMs:1000},meaningfulPolicy:{...s.meaningfulPolicy,minimumAudibleMs:100}}))}};
  const r=validateSetPlan(snippets,facts);assert.equal(r.status,"needs-resolution");assert(r.issues.includes("unapproved-section-policy"));
});
test("explicit overlap timing checks duration, track order and available decks",()=>{
  const {archive,facts}=fixture();
  const fixed={...archive,definition:{...archive.definition,duration:{kind:"fixed" as const,durationMs:100000}}};
  const timing={planId:"plan",planRevision:0,elapsedMs:0,intervals:[{sectionId:"section2",startMs:0,endMs:40000,rate:1},{sectionId:"section0",startMs:30000,endMs:70000,rate:1},{sectionId:"section1",startMs:60000,endMs:100000,rate:1}]};
  assert.equal(validateSetPlan(fixed,{...facts,timing}).status,"valid");
  assert(validateSetPlan(fixed,{...facts,timing,deckCount:1}).issues.includes("insufficient-decks"));
  const tooShort={...fixed,definition:{...fixed.definition,duration:{kind:"fixed" as const,durationMs:10000}}};
  assert(validateSetPlan(tooShort,{...facts,timing}).issues.includes("duration-goal-conflict"));
  assert.equal(validateSetPlan(fixed,{...facts,timing:{...timing,intervals:timing.intervals.map(i=>({...i,rate:2}))}}).status,"invalid");
});
test("pins and protected positions cannot be evaded by a replan",()=>{
  const {archive,facts}=fixture();
  const pinned={...archive,plan:{...archive.plan,pins:[{kind:"next" as const,occurrence:o(0),operatorRequestId:"pin"}]}};
  const proof={...facts,operatorRequestIds:["pin"],operatorPins:[{requestId:"pin",occurrence:o(0),kind:"next" as const}]};
  assert(validateSetPlan(pinned,proof).issues.includes("pin-order"));
  assert(validateSetPlan(archive,{...facts,protectedOrder:[{occurrence:o(0),index:0}]}).issues.includes("protected-order-changed"));
});
test("manual/free-pool additions need occurrence-specific admission proof",()=>{
  const {archive,facts}=fixture(),added={...o(3),track:{libraryId:"lib",trackId:"outside"},origin:{kind:"library-addition" as const,selectedBy:"human" as const,admissionEventId:"add"}};
  const changed={...archive,definition:{...archive.definition,occurrences:[...archive.definition.occurrences,added]},plan:{...archive.plan,plannedOrder:[...archive.plan.plannedOrder,o(3)],sections:[...archive.plan.sections,{...archive.plan.sections[0]!,sectionId:"extra",occurrence:o(3)}]},history:{...archive.history,outcomes:[...archive.history.outcomes,{occurrence:o(3),revision:0,outcome:{status:"pending" as const}}]}};
  const proof={...facts,tracks:[...facts.tracks,{track:added.track,contentVersion:"audio-v1",durationMs:240000}],admissions:[{eventId:"add",occurrence:o(3),actor:"human" as const,track:added.track,allowOutsidePlaylist:true}]};
  assert.equal(validateSetPlan(changed,proof).status,"valid");
  assert.equal(validateSetPlan(changed,{...proof,admissions:[]}).status,"invalid");
  const ai={...changed,definition:{...changed.definition,musicPool:"free-library" as const,occurrences:changed.definition.occurrences.map(e=>e.origin.kind==="library-addition"?{...e,origin:{...e.origin,selectedBy:"ai" as const}}:e)}};
  assert.equal(validateSetPlan(ai,{...proof,admissions:[{...proof.admissions[0]!,actor:"ai",allowOutsidePlaylist:false}]}).status,"valid");
});
// End of autonomously AI-generated validation fixtures.
