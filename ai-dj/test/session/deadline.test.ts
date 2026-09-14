// Autonomously AI-generated real-thread fault injection; isolated child processes only.
import {test} from "node:test";
import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const exec=promisify(execFile);
for(const mode of ["startup","in-flight"]){
 test(`a real ${mode} worker stall expires without blocking the caller`,async t=>{
  const root=await mkdtemp(join(tmpdir(),"dj-deadline-"));t.after(()=>rm(root,{recursive:true,force:true}));
  const preload=join(root,"stall.mjs"),runner=join(root,"run.mjs");
  await writeFile(preload,`
import {isMainThread,parentPort} from 'node:worker_threads';
import {writeFileSync} from 'node:fs';
if(!isMainThread){
 const stall=()=>{writeFileSync(process.env.AIDJ_STALL_MARKER,'worker-entered-stall');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);};
 if(process.env.AIDJ_STALL_MODE==='startup')stall();else parentPort.on('message',stall);
}
`);
  await writeFile(runner,`
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {SessionJournal} from ${JSON.stringify(new URL('../../session/journal.ts',import.meta.url).href)};
const j=new SessionJournal({directory:process.env.AIDJ_STALL_DIRECTORY,recordingId:'r',timeoutMs:2000});
let ticks=0;const timer=setInterval(()=>ticks++,5),start=performance.now();
try {
 if(process.env.AIDJ_STALL_MODE==='startup')await assert.rejects(j.ready,/worker-timeout/);
 else {
  await j.ready;
  for(let i=1;i<=3;i++)assert.equal(j.offer(JSON.stringify({schemaVersion:1,recordingId:'r',eventId:'e'+i,recorderSequence:i,stream:{streamId:'s',epoch:0},producerId:'fixture',producerSequence:i})), 'queued');
  await assert.rejects(j.close(),/worker-timeout/);
 }
 assert.equal(await readFile(process.env.AIDJ_STALL_MARKER,'utf8'),'worker-entered-stall');
 assert.equal(j.status().state,'failed');assert.equal(j.status().reason,'worker-timeout');assert.equal(j.status().captureCompleteness,'gaps-present');assert(ticks>0);
 if(process.env.AIDJ_STALL_MODE==='in-flight'){
  assert.equal(j.status().accounting.notSubmittedOnFailure,2);assert.equal(j.status().accounting.unconfirmedOnFailure,1);assert.equal(j.status().accounting.appendAcknowledgedOffers,0);
 }
 console.log(JSON.stringify({mode:process.env.AIDJ_STALL_MODE,deadlineMs:2000,elapsedMs:performance.now()-start,callerTicks:ticks,status:j.status()}));
}finally{clearInterval(timer);await j.abort();}
`);
  const result=await exec(process.execPath,["--import",pathToFileURL(preload).href,runner],{env:{...process.env,AIDJ_STALL_MODE:mode,AIDJ_STALL_MARKER:join(root,"stalled"),AIDJ_STALL_DIRECTORY:join(root,"recording")},timeout:15000,maxBuffer:65536});
  const observation=JSON.parse(result.stdout.trim());assert.equal(observation.mode,mode);assert.equal(observation.status.reason,"worker-timeout");t.diagnostic(JSON.stringify(observation));
 });
}
// End of autonomously AI-generated real-thread deadline tests.
