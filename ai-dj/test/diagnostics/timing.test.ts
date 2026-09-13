// Autonomously AI-generated timing harness tests; synthetic evidence only.
import assert from "node:assert/strict";
import test from "node:test";
import { createTimingCapture, type TimingMetric, type TimingSample } from "../../diagnostics/timing.ts";

function setup(capacity = 100, initialNow = 1000) {
  let clock = initialNow;
  const capture = createTimingCapture({runId:"run-1",clockDomainId:"monotonic-1",now:()=>clock,capacityPerMetric:capacity,
    budgetsMs:{"dispatch-lateness":5,"loopback-rtt":40,"command-observation":30}});
  return {capture,setClock:(value:number)=>{clock=value;}};
}
function sample(metric: TimingMetric, start: number, end: number, sampleId = "sample-1"): TimingSample {
  return {metric,sampleId,start:{clockDomainId:"monotonic-1",atMs:start},end:{clockDomainId:"monotonic-1",atMs:end}};
}

test("nearest-rank distribution is exact for known 1..100 observation samples",()=>{
  const {capture}=setup();
  for(let i=100;i>=1;i--)capture.record(sample("command-observation",0,i,`sample-${i}`));
  assert.deepEqual(capture.summary().metrics[2],{metric:"command-observation",budgetMs:30,retainedSamples:100,
    capacityDroppedSamples:0,externallyDroppedSamples:0,missedDeadlinesInRetainedSamples:70,p50Ms:50,p95Ms:95,p99Ms:99,maxMs:100});
  assert.equal(capture.summary().sampleLoss,false);
});

test("dispatch lateness, full loopback RTT and observation remain separate",()=>{
  const {capture}=setup();
  capture.record(sample("dispatch-lateness",100,95,"early"));
  capture.record(sample("dispatch-lateness",100,105,"at-deadline"));
  capture.record(sample("dispatch-lateness",100,106,"late"));
  capture.record(sample("loopback-rtt",100,140));
  capture.record(sample("command-observation",100,112));
  const [dispatch,rtt,observed]=capture.summary().metrics;
  assert.equal(dispatch?.missedDeadlinesInRetainedSamples,1);
  assert.equal(dispatch?.p50Ms,5);
  assert.equal(capture.samples("dispatch-lateness")[0]?.valueMs,-5);
  assert.equal(rtt?.p50Ms,40); // Never RTT/2.
  assert.equal(rtt?.missedDeadlinesInRetainedSamples,0);
  assert.equal(observed?.p50Ms,12);
  assert.match(capture.summary().evidenceScope,/no one-way, UI or audio inference/);
});

test("capacity is per metric, keeps first samples, and exposes local and external loss",()=>{
  const {capture}=setup(2);
  capture.record(sample("loopback-rtt",0,10,"a"));
  capture.record(sample("loopback-rtt",0,20,"b"));
  assert.equal(capture.record(sample("loopback-rtt",0,900,"c")),"capacity-dropped");
  capture.noteDropped("loopback-rtt",3);
  capture.record(sample("command-observation",0,7));
  assert.equal(capture.samples("loopback-rtt").length,2);
  const r=capture.summary();
  assert.equal(r.sampleLoss,true);
  assert.equal(r.metrics[1]?.capacityDroppedSamples,1);
  assert.equal(r.metrics[1]?.externallyDroppedSamples,3);
  assert.equal(r.metrics[1]?.maxMs,20); // Explicit retained scope; not the entire run.
  assert.equal(r.metrics[2]?.retainedSamples,1);
  assert.equal(r.statisticsScope,"first retained samples per metric");
  capture.noteDropped("loopback-rtt",Number.MAX_SAFE_INTEGER);
  assert.equal(capture.summary().counterOverflow,true);
  assert.equal(capture.summary().metrics[1]?.externallyDroppedSamples,Number.MAX_SAFE_INTEGER);
});

test("rejects cross-clock and invalid intervals without adding misleading samples",()=>{
  const {capture}=setup();const baseline=capture.summary();
  assert.throws(()=>capture.record({...sample("loopback-rtt",0,10),end:{clockDomainId:"wall-clock",atMs:10}}),/Cross-clock/);
  assert.throws(()=>capture.record({...sample("dispatch-lateness",0,10),start:{clockDomainId:"other",atMs:0}}),/Cross-clock/);
  for(const [start,end] of [[10,9],[0,Infinity],[NaN,1],[-1,0],[0,1001]] as const){
    assert.throws(()=>capture.record(sample("command-observation",start,end)));
  }
  assert.throws(()=>capture.noteDropped("command-observation",0));
  assert.throws(()=>capture.record(sample("ui" as TimingMetric,0,1)));
  assert.deepEqual(capture.summary(),baseline);
});

test("monotonic capture permits delayed sample arrival, but clock regression latches a fault",()=>{
  const {capture,setClock}=setup(10,100);
  capture.record(sample("loopback-rtt",50,90,"first"));
  setClock(101);capture.record(sample("loopback-rtt",1,10,"arrived-late"));
  setClock(100);assert.throws(()=>capture.record(sample("loopback-rtt",1,20,"regressed")),/monotonic/);
  setClock(102);assert.throws(()=>capture.record(sample("loopback-rtt",1,20,"recovered")),/latched/);
  assert.equal(capture.summary().clockFault,true);
  assert.equal(capture.samples("loopback-rtt").length,2);
});

test("invalid clocks fail closed and empty statistics are null",()=>{
  for(const value of [NaN,Infinity,-1]){
    const {capture}=setup(1,value);
    assert.throws(()=>capture.record(sample("loopback-rtt",0,0)),/monotonic/);
    assert.equal(capture.summary().clockFault,true);
    assert.equal(capture.summary().metrics[1]?.p99Ms,null);
  }
  const capture=createTimingCapture({runId:"r",clockDomainId:"c",now:()=>{throw Error("clock unavailable");},capacityPerMetric:1,
    budgetsMs:{"dispatch-lateness":0,"loopback-rtt":0,"command-observation":0}});
  assert.throws(()=>capture.record({metric:"loopback-rtt",sampleId:"s",start:{clockDomainId:"c",atMs:0},end:{clockDomainId:"c",atMs:0}}),/clock failed/);
  assert.equal(capture.summary().clockFault,true);
});

test("retained samples are immutable copies and duplicate retained IDs do not bias statistics",()=>{
  const {capture}=setup();const input=sample("loopback-rtt",0,10);
  capture.record(input);
  (input.end as {atMs:number}).atMs=99;
  assert.equal(capture.samples("loopback-rtt")[0]?.end.atMs,10);
  assert.throws(()=>capture.record(input),/Duplicate/);
  const snapshot=capture.samples("loopback-rtt");
  assert.equal(Object.isFrozen(snapshot),true);
  assert.equal(Object.isFrozen(snapshot[0]?.end),true);
  capture.record(sample("loopback-rtt",0,20,"another"));
  assert.equal(snapshot.length,1);
  assert.equal(capture.summary().metrics[1]?.retainedSamples,2);
});

test("configuration bounds allocation and snapshots deadline budgets",()=>{
  const budgets={"dispatch-lateness":0,"loopback-rtt":10,"command-observation":30};
  const options={runId:"r",clockDomainId:"monotonic-1",now:()=>100,capacityPerMetric:1,budgetsMs:budgets};
  for(const capacityPerMetric of [0,-1,1.5,100001,Infinity])assert.throws(()=>createTimingCapture({...options,capacityPerMetric}));
  assert.throws(()=>createTimingCapture({...options,clockDomainId:""}));
  assert.throws(()=>createTimingCapture({...options,budgetsMs:{...budgets,"loopback-rtt":NaN}}));
  const capture=createTimingCapture(options);budgets["loopback-rtt"]=100;
  capture.record(sample("loopback-rtt",0,11));
  assert.equal(capture.summary().metrics[1]?.missedDeadlinesInRetainedSamples,1);
});
// End of autonomously AI-generated file.
