// Autonomously AI-generated fixture projection tests; no MIDI dispatch.
import {test} from "node:test";
import assert from "node:assert/strict";
import type {RawRecordedEvent,CommandSentEvent} from "../../diagnostics/events.ts";
import {createFixtureSessionProjection} from "../../diagnostics/fixture-session.ts";
const base={schemaVersion:1 as const,eventId:"raw",context:{sessionId:"fixture",correlationId:null,host:{hostInstanceId:"unverified",connectionGeneration:0,profileId:"p",profileRevision:0,capabilityRevision:0,stateRevision:0}},localClockDomainId:"clock",atMs:1,capturedAtMs:1,sourceTimestamp:null};
const raw:RawRecordedEvent={...base,kind:"raw-recorded",source:"ai-outbound-midi",bytes:[176,7,100],artifact:null};
const sent:CommandSentEvent={...base,eventId:"sent",kind:"command-sent",atMs:2,capturedAtMs:2,actionId:"manual",attemptId:"attempt",transportMessageIds:["raw"]};
test("attempted and submitted bytes remain linked across drain batches without false authorship",()=>{
 const p=createFixtureSessionProjection("r","s"),a=p.project([raw]),b=p.project([sent]);
 const first=a.records[0]!.event,last=b.records[0]!.event;assert.equal(first.kind,"raw-midi");assert.equal(last.kind,"raw-midi");if(first.kind!=="raw-midi"||last.kind!=="raw-midi")throw Error();
 assert.equal(first.stage,"attempted");assert.equal(last.stage,"submitted");assert.deepEqual(last.bytes,raw.bytes);assert.deepEqual(last.relatedEventIds,[first.eventId]);assert.deepEqual(last.actor,{actor:"unknown"});assert.equal(last.hostContext,null);assert.equal(b.pendingCorrelations,0);
});
test("no sent marker means no submitted event; mismatched context cannot invent one",()=>{
 const p=createFixtureSessionProjection("r","s");p.project([raw]);const r=p.project([{...sent,context:{...sent.context,sessionId:"other"}}]);assert.equal(r.records.length,0);assert.equal(r.issues[0]!.reason,"unresolved-submission-link");assert.deepEqual(p.reset(),["raw"]);assert.equal(p.project([sent]).records.length,0);
});
test("pending correlations stay bounded and unknown directions remain explicit",()=>{
 const p=createFixtureSessionProjection("r","s",1),r=p.project([raw,{...raw,eventId:"raw2"},{...raw,eventId:"unknown",source:"unmapped-midi"}]);assert.equal(r.pendingCorrelations,1);assert.equal(r.issues.length,2);assert.equal(p.project([sent]).records.length,0);
 const feedback=p.project([{...raw,eventId:"feedback",source:"host-feedback-midi"}]).records[0]!.event;assert.equal(feedback.kind,"raw-midi");if(feedback.kind==="raw-midi")assert.equal(feedback.stage,"received");
});
// End of autonomously AI-generated fixture projection tests.
