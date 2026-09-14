// Autonomously AI-generated private native MIDI/recorder coexistence probe.
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
import {SessionJournal} from '../../../../ai-dj/session/journal.ts';
import {recoverChunks} from '../../../../ai-dj/session/chunks.ts';
const require=createRequire(new URL('../../../../ai-dj/package.json',import.meta.url));
const midi=require('@julusian/midi');
const root=await mkdtemp(join(tmpdir(),'ai-dj-midi-load-'));
const input=new midi.Input(),output=new midi.Output(),name=`AI-DJ-Probe-${randomUUID()}`;
let journal=null,loadTimer=null,loadError=null;
const report={disclosure:'Autonomously AI-generated native virtual MIDI load probe.',scope:'Private CoreMIDI destination to callback; not Mixxx, hardware, audio or host-state latency',countPerPhase:1000,periodMs:10,phases:[],passed:false,cleanup:false};
const quantiles=values=>{const a=[...values].sort((a,b)=>a-b);return {count:a.length,p50:a[Math.ceil(a.length*.50)-1]??null,p95:a[Math.ceil(a.length*.95)-1]??null,p99:a[Math.ceil(a.length*.99)-1]??null,max:a.at(-1)??null};};
let active=null;
input.on('message',(_,bytes)=>{
 if(!active||bytes.length!==3||bytes[0]!==176){if(active)active.invalid++;return;}
 const id=bytes[1]*128+bytes[2],sent=active.pending.get(id);
 if(sent===undefined){active.unmatched++;return;}
 active.pending.delete(id);active.samples.push({id,sentMs:sent,receivedMs:performance.now()});
});
function event(i){return JSON.stringify({schemaVersion:1,recordingId:'load',eventId:`e${i}`,recorderSequence:i,stream:{streamId:'fixture',epoch:0},producerSequence:i,producerId:'fixture',deviceInstanceId:null,capturedAt:{clockId:'fixture',epoch:0,ms:i},ingestedAt:{clockId:'fixture',epoch:0,ms:i},actor:{actor:'unknown'},track:null,occurrence:null,hostContext:null,relatedEventIds:[],kind:'raw-midi',endpointInstanceId:'synthetic',direction:'physical-ingress',stage:'received',framing:'unknown',bytes:Array(128).fill(127),decoder:null});}
try {
 input.ignoreTypes(false,false,false);input.openVirtualPort(name);
 let matches=[];for(let tries=0;tries<50;tries++){matches=[];for(let i=0;i<output.getPortCount();i++)if(output.getPortName(i)===name)matches.push(i);if(matches.length)break;await delay(20);}
 assert.equal(matches.length,1,'exact private MIDI destination required');output.openPort(matches[0]);
 for(const loaded of [false,true]){
  let offers=0,queued=0,omitted=0,maxPendingBytes=0,maxPendingRecords=0;
  if(loaded){journal=new SessionJournal({directory:join(root,'recording'),recordingId:'load',maxRecords:4,maxBytes:32768});await journal.ready;
   loadTimer=setInterval(()=>{try{for(let n=0;n<16&&offers<100000;n++){const result=journal.offer(event(++offers));if(result==='queued')queued++;else if(result==='omitted')omitted++;else throw Error('unexpected recorder failure');}const s=journal.status();maxPendingBytes=Math.max(maxPendingBytes,s.queuedBytes);maxPendingRecords=Math.max(maxPendingRecords,s.queuedRecords+s.inFlight);}catch(e){loadError=e;clearInterval(loadTimer);loadTimer=null;}},2);
  }
  active={pending:new Map(),samples:[],late:[],invalid:0,unmatched:0};const started=performance.now();
  for(let i=0;i<1000;i++){const target=started+i*10;await delay(Math.max(0,target-performance.now()));const sent=performance.now();active.late.push(sent-target);active.pending.set(i,sent);output.sendMessage([176,i>>7,i&127]);}
  const deadline=performance.now()+2000;while(active.pending.size&&performance.now()<deadline)await delay(5);
  if(loadTimer){clearInterval(loadTimer);loadTimer=null;}
  if(loadError)throw loadError;
  const phase={name:loaded?'recorder-saturated':'idle',received:active.samples.length,missingIds:[...active.pending.keys()],invalid:active.invalid,unmatched:active.unmatched,loopbackMs:quantiles(active.samples.map(x=>x.receivedMs-x.sentMs)),dispatchLatenessMs:quantiles(active.late),samples:active.samples,offers,queued,omitted,maxPendingBytes,maxPendingRecords};
  if(journal){await journal.close();phase.recorderStatus=journal.status();let records=0,gapEvents=0,raw=0,recoveryGaps=[];for await(const item of recoverChunks(join(root,'recording'))){if(item.kind==='record'){records++;if(item.event.kind==='capture-gap')gapEvents++;if(item.event.kind==='raw-midi')raw++;}if(item.kind==='gap')recoveryGaps.push(item.reason);}phase.recovery={records,gapEvents,raw,recoveryGaps};assert.equal(raw,queued);assert.equal(recoveryGaps.length,0);assert(gapEvents>0);assert(omitted>0);assert.equal(phase.recorderStatus.accounting.reportedOmissions,omitted);await journal.abort();journal=null;}
  report.phases.push(phase);active=null;assert.equal(phase.received,1000);assert.equal(phase.invalid+phase.unmatched,0);assert(maxPendingBytes<=32768&&maxPendingRecords<=4);
 }
 report.passed=true;
}catch(e){report.error=e instanceof Error?e.message:String(e);process.exitCode=1;}
finally {
 if(loadTimer)clearInterval(loadTimer);if(journal)await journal.abort();
 output.closePort();input.closePort();output.destroy();input.destroy();await rm(root,{recursive:true,force:true});report.cleanup=true;
 report.finishedAt=new Date().toISOString();report.disclosureEnd='End of autonomously AI-generated load probe.';
 await writeFile(resolve(process.argv[2]??'/tmp/ai-dj-midi-load.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,phases:report.phases.map(({samples,...p})=>p)}));
}
// End of autonomously AI-generated private native MIDI load probe.
