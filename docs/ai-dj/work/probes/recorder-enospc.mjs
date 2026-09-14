// Autonomously AI-generated bounded macOS disk-full probe; no main-drive fill.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,open,rm,writeFile,statfs} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
import {SessionJournal} from '../../../../ai-dj/session/journal.ts';
import {recoverChunks} from '../../../../ai-dj/session/chunks.ts';
const exec=promisify(execFile);
const root=await mkdtemp(join(tmpdir(),'ai-dj-enospc-'));
const mount=join(root,'volume');await mkdir(mount);
let mounted=false,journal=null,timer=null;
const report={disclosure:'Autonomously AI-generated actual disk-full probe.',imageMiB:32,filesystem:'HFS+',scope:'Disposable disk image only; no native MIDI or audio test',startedAt:new Date().toISOString(),passed:false,cleanup:false};
const line=i=>JSON.stringify({schemaVersion:1,recordingId:'diskfull',eventId:`e${i}`,recorderSequence:1,stream:{streamId:'fixture',epoch:0},producerSequence:i,producerId:'fixture',deviceInstanceId:null,capturedAt:{clockId:'fixture',epoch:0,ms:i},ingestedAt:{clockId:'fixture',epoch:0,ms:i},actor:{actor:'unknown'},track:null,occurrence:null,hostContext:null,relatedEventIds:[],kind:'ai-intent',intentId:`i${i}`,planId:'p',planRevision:0,explanation:'x'.repeat(i===1?20:100000),proposedActionIds:[]});
async function until(predicate){const deadline=performance.now()+10000;while(!predicate()){if(performance.now()>deadline)throw Error('probe-deadline');await delay(5);}}
try {
 await exec('/usr/bin/hdiutil',['create','-size','32m','-fs','HFS+','-volname','AI-DJ-ENOSPC','-type','UDIF',join(root,'fixture.dmg')],{timeout:30000});
 await exec('/usr/bin/hdiutil',['attach','-nobrowse','-mountpoint',mount,join(root,'fixture.dmg')],{timeout:30000});mounted=true;
 const fs=await statfs(mount);assert(fs.blocks*fs.bsize<=40*1024*1024,'unexpected volume capacity');report.volumeBytes=fs.blocks*fs.bsize;
 const directory=join(mount,'recording');journal=new SessionJournal({directory,recordingId:'diskfull',timeoutMs:10000});await journal.ready;
 journal.offer(line(1));await until(()=>journal.status().accounting.appendAcknowledgedOffers===1);
 const fill=await open(join(mount,'bounded-filler'),'wx');let written=0,fillCode=null;
 try {const block=Buffer.alloc(4096,97);for(let i=0;i<16384;i++){try{const r=await fill.write(block);written+=r.bytesWritten;}catch(e){fillCode=e.code;break;}}await fill.sync();}finally{await fill.close();}
 assert.equal(fillCode,'ENOSPC');report.fillError=fillCode;report.fillerBytes=written;report.freeBytesAfterFill=(await statfs(mount)).bavail*fs.bsize;
 const intervals=[];let last=performance.now();timer=setInterval(()=>{const now=performance.now();intervals.push(now-last);last=now;},2);
 const started=performance.now();const offerTimes=[];
 for(let i=2;i<=20;i++){const encoded=line(i),t=performance.now();journal.offer(encoded);offerTimes.push(performance.now()-t);}
 await until(()=>journal.status().state==='failed');await delay(25);clearInterval(timer);timer=null;
 report.failureObservedMs=performance.now()-started;report.offerMaximumMs=Math.max(...offerTimes);report.heartbeatSamples=intervals.length;report.heartbeatMaximumIntervalMs=Math.max(...intervals);report.status=journal.status();
 assert.match(report.status.reason,/ENOSPC/);assert.equal(report.status.captureCompleteness,'gaps-present');assert.equal(journal.offer(line(21)),'unavailable');
 const a=report.status.accounting;assert.equal(a.acceptedOffers,a.appendAcknowledgedOffers+a.notSubmittedOnFailure+a.unconfirmedOnFailure+a.queuedOffers+a.inFlightOffers);
 await assert.rejects(journal.close());await journal.abort();journal=null;
 let recovered=0;const gaps=[];let ending=null;for await(const r of recoverChunks(directory)){if(r.kind==='record')recovered++;if(r.kind==='gap')gaps.push(r.reason);if(r.kind==='end')ending=r;}
 report.recoveredRecords=recovered;report.recoveryGaps=gaps;report.recoveryEnd=ending;assert.equal(ending.cleanStorageClose,false);assert(gaps.length>0);report.passed=true;
}catch(e){report.error=e instanceof Error?e.message:String(e);process.exitCode=1;}
finally {
 if(timer)clearInterval(timer);if(journal)await journal.abort();
 if(mounted){try{await exec('/usr/bin/hdiutil',['detach',mount],{timeout:30000});mounted=false;}catch(e){report.cleanupError=String(e);process.exitCode=1;}}
 if(!mounted){await rm(root,{recursive:true,force:true});report.cleanup=true;}
 report.finishedAt=new Date().toISOString();report.disclosureEnd='End of autonomously AI-generated probe.';
 await writeFile(resolve(process.argv[2]??'/tmp/ai-dj-enospc-result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}
// End of autonomously AI-generated bounded disk-full probe.
