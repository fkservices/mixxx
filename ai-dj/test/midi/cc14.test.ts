// Autonomously AI-generated R20 codec validation; no native hardware claim.
import test from "node:test";
import assert from "node:assert/strict";
import { CC14_PROFILE, createCc14Decoder, createCc14Writer, encodeCc14, expandCc14, quantizeCc14 } from "../../midi/cc14.ts";

test("CC14 profile endpoints, exact tempo center and frozen byte order", () => {
  assert.deepEqual(encodeCc14(1,"gain",0),[[0xB4,16,0],[0xB4,48,0]]);
  assert.deepEqual(encodeCc14(2,"gain",1),[[0xB5,16,127],[0xB5,48,127]]);
  assert.deepEqual(encodeCc14(1,"tempo",0),[[0xB4,17,64],[0xB4,49,0]]);
  for (const raw of [0,1,127,128,8191,8192,16382,16383]) {
    for (const control of ["gain","tempo"] as const) assert.equal(quantizeCc14(control,expandCc14(control,raw)),raw);
  }
  for (const value of [NaN,Infinity,-Infinity,1.001]) assert.throws(()=>encodeCc14(1,"gain",value));
  assert.throws(()=>encodeCc14(1,"gain",-0.1));
  assert.throws(()=>encodeCc14(1,"tempo",-1.01));
  assert.throws(()=>encodeCc14(3 as 1,"tempo",0));
  assert.throws(()=>expandCc14("gain",16384));
});

test("CC14 reconstructs gain and tempo with substantially less error than seven bits", () => {
  for (const control of ["gain","tempo"] as const) {
    let sum14=0,sum7=0,max14=0;
    for (let i=0;i<=10000;i++) {
      const value=control==="gain" ? i/10000 : i/5000-1;
      const actual=expandCc14(control,quantizeCc14(control,value));
      const raw7=control==="gain" ? Math.round(value*127) : 64+Math.round(value*(value<0?64:63));
      const v7=control==="gain" ? raw7/127 : (raw7-64)/(raw7<64?64:63);
      sum14+=Math.abs(actual-value);sum7+=Math.abs(v7-value);max14=Math.max(max14,Math.abs(actual-value));
    }
    assert.ok(sum14<sum7/100);
    assert.ok(max14<=(control==="gain" ? 0.5/16383 : 0.5/8191)+1e-15);
  }
});

test("CC14 writer serializes pairs, rejects reentry, and retires on uncertain send", () => {
  const bytes:number[][]=[];
  const writer=createCc14Writer(message=>{
    bytes.push([...message]);
    assert.throws(()=>writer.write(2,"tempo",0),/Reentrant/);
  });
  assert.equal(writer.write(1,"gain",1).delivery,"unconfirmed");
  writer.write(2,"tempo",-1);
  assert.deepEqual(bytes,[[0xB4,16,127],[0xB4,48,127],[0xB5,17,0],[0xB5,49,0]]);
  let calls=0;
  const bad=createCc14Writer(()=>{if(++calls===2)throw Error("transport");});
  assert.throws(()=>bad.write(1,"gain",0.5),/outcome unknown/);
  assert.throws(()=>bad.write(1,"gain",0.5),/closed/);assert.equal(calls,2);
  assert.throws(()=>createCc14Writer(async()=>{}),/synchronous/);
  const unexpectedPromise=createCc14Writer(()=>Promise.reject(Error("unexpected asynchronous transport")));
  assert.throws(()=>unexpectedPromise.write(1,"gain",1),/outcome unknown/);
  writer.close();assert.throws(()=>writer.write(1,"gain",0),/closed/);
});

test("CC14 only completes adjacent matching halves; reverse and interleaved input discard", () => {
  let now=0;const d=createCc14Decoder({generation:1,now:()=>now,automaticExpiry:false});
  assert.equal(d.push([0xB4,48,2],1).kind,"orphan");
  d.push([0xB4,16,1],1);now=1;
  assert.deepEqual(d.push([0xB4,48,2],1),{kind:"decoded",deck:1,control:"gain",raw:130,value:130/16383,correlation:"adjacent-halves-only"});
  d.push([0xB4,16,1],1);d.push([0xB5,17,64],1);
  assert.equal(d.status().lastDiscard,"superseded");
  assert.equal(d.push([0xB4,48,2],1).kind,"orphan");assert.equal(d.status().pending,false);
  assert.equal(d.push([0xB5,49,0],1).kind,"orphan");
  d.push([0xB4,16,1],1);d.push([0xB0,21,127],1);
  assert.equal(d.push([0xB4,48,2],1).kind,"orphan");
  d.push([0xB4,16,1],1);d.push([0xF8],1);
  assert.equal(d.push([0xB4,48,2],1).kind,"decoded");
  d.close();
});

test("CC14 timeout boundary, idle expiry, generation reset and malformed input stay bounded", () => {
  let now=0;const d=createCc14Decoder({generation:0,now:()=>now,automaticExpiry:false});
  d.push([0xB4,16,1],0);now=CC14_PROFILE.timeoutMs;
  assert.equal(d.push([0xB4,48,2],0).kind,"orphan");assert.equal(d.status().lastDiscard,"timeout");
  d.push([0xB4,16,1],0);d.resetGeneration(1);
  assert.equal(d.status().lastDiscard,"generation");
  assert.equal(d.push([0xB4,48,2],0).kind,"stale-generation");
  assert.equal(d.push([0xB4,48,2],1).kind,"orphan");
  assert.throws(()=>d.resetGeneration(1));
  for (const bad of [[0xB4,16,128],[0xB4,16,NaN],[0xB4,16,,] as number[],Array(4).fill(0),[]]) {
    d.push([0xB4,16,1],1);assert.equal(d.push(bad,1).kind,"ignored");assert.equal(d.status().pending,false);
  }
  d.push([0xB4,16,1],1);now+=20;d.tick();assert.equal(d.status().pending,false);
  d.close();assert.equal(d.push([0xB4,16,1],1).kind,"closed");
});

test("CC14 clock faults and MIDI reset retire the decoder; stale input cannot poison it", () => {
  let now=5;const d=createCc14Decoder({generation:1,now:()=>now,automaticExpiry:false});
  d.push([0xB4,16,1],1);now=0;
  assert.equal(d.push([0xFF],0).kind,"stale-generation");assert.equal(d.status().closed,false);
  d.tick();assert.equal(d.status().fault,"clock");assert.equal(d.status().pending,false);
  assert.throws(()=>d.resetGeneration(2));
  const reset=createCc14Decoder({generation:1,now:()=>0,automaticExpiry:false});
  reset.push([0xB4,16,1],1);reset.push([0xFF],1);assert.equal(reset.status().fault,"midi-reset");
});

test("CC14 automatic expiry clears a missing half without more input", async () => {
  const d=createCc14Decoder({generation:1,now:()=>performance.now()});
  try {
    d.push([0xB4,16,1],1);
    await new Promise(resolve=>setTimeout(resolve,60));
    assert.equal(d.status().pending,false);assert.equal(d.status().lastDiscard,"timeout");
  } finally {d.close();}
});
// End of autonomously AI-generated R20 validation.
