// Autonomously AI-generated closed diagnostic receiver; no authoritative state or MIDI writes.
import {createSysexParser} from '../midi/sysex-decode.ts';
export const CUE_KEYS = ['cue_default','cue_gotoandstop','cue_point','cue_mode','cue_preview','cue_indicator','play','play_latched'] as const;
export interface CueObservation {
  schemaVersion:1; generation:number; sequence:number; deck:1|2; controlKey:typeof CUE_KEYS[number];
  clockDomainId:string; observedAtMs:number; trigger:'initial'|'callback'|'refresh'|'unavailable';
  presence:'present'|'unknown'|'unavailable'; value:number|null;
}
export interface CueGap {
  schemaVersion:1; kind:'gap'; generation:number; clockDomainId:string;
  firstSequence:number; lastSequence:number; count:number;
}
export type CueRecord = CueObservation | CueGap;
const max=Number.MAX_SAFE_INTEGER;
const safe=(v:unknown,min=0):v is number=>Number.isSafeInteger(v)&&Number(v)>=min&&Number(v)<=max;
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const clockId=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_.:-]{1,128}$/.test(v);
function keys(value:Record<string,unknown>,expected:string[]) {
  return Object.keys(value).sort().join(',')===expected.sort().join(',');
}
function canonical(value:unknown):string {
  const text=JSON.stringify(value);
  if(value&&typeof value==='object'&&Object.is((value as {value?:unknown}).value,-0))
    return text.replace(/"value":0(?=[,}])/,'"value":-0');
  return text;
}
export function decodeCueRecordText(text:unknown):CueRecord {
  if(typeof text!=='string'||text.length>1024)throw Error('cue-text-capacity');
  let parsed:unknown;try{parsed=JSON.parse(text);}catch{throw Error('cue-json');}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||canonical(parsed)!==text)throw Error('cue-noncanonical-json');
  const p=parsed as Record<string,unknown>;
  if(p.schemaVersion!==1||!safe(p.generation,1)||!clockId(p.clockDomainId))throw Error('cue-context');
  if(p.kind==='gap'){
    if(!keys(p,['schemaVersion','kind','generation','clockDomainId','firstSequence','lastSequence','count'])||
       !safe(p.firstSequence)||!safe(p.lastSequence)||!safe(p.count,1)||p.lastSequence===max||p.lastSequence<p.firstSequence||p.count!==p.lastSequence-p.firstSequence+1)throw Error('cue-gap');
  }else{
    if(!keys(p,['schemaVersion','generation','sequence','deck','controlKey','clockDomainId','observedAtMs','trigger','presence','value'])||
       (!safe(p.sequence)||p.sequence===max)||(p.deck!==1&&p.deck!==2)||!CUE_KEYS.includes(p.controlKey as CueObservation['controlKey'])||
       !finite(p.observedAtMs)||p.observedAtMs<0||p.observedAtMs>max||
       !['initial','callback','refresh','unavailable'].includes(p.trigger as string)||
       !['present','unknown','unavailable'].includes(p.presence as string)||
       (p.presence==='present'?!finite(p.value):p.value!==null)||
       ((p.trigger==='unavailable')!==(p.presence==='unavailable')))throw Error('cue-observation');
  }
  return Object.freeze(parsed) as CueRecord;
}
export function encodeCueRecordText(record:CueRecord):string {
  const text=canonical(record);decodeCueRecordText(text);return text;
}
export interface CueDiagnosticEvent {
  source:'unverified'; transportGeneration:number; session:string; wireSequence:number; receivedAtMs:number;
  kind:'observation'|'observer-gap'|'wire-gap'; record?:CueRecord;
  firstSequence?:number; lastSequence?:number; reason?:'host-reported'|'sequence-discontinuity';
}
export function createManualCueReceiver(options:{diagnostic:true;transportGeneration:number;session:string;
  observerGeneration:number;hostClockDomainId:string;now:()=>number}) {
  if(options.diagnostic!==true||!safe(options.transportGeneration)||!safe(options.observerGeneration,1)||
     typeof options.session!=='string'||!/^[0-9a-f]{32}$/.test(options.session)||!clockId(options.hostClockDomainId)||typeof options.now!=='function')throw Error('Invalid cue receiver context');
  // Snapshot caller configuration; later mutation cannot rebind the receiving stream.
  const {transportGeneration,session,observerGeneration,hostClockDomainId,now}=options;
  const parser=createSysexParser({direction:1,generation:transportGeneration,now,allowDiagnostic:true});
  let closed=false,wireSequence=-1,nextObserver=0,lastHostTime=-1,lastReceipt=-1;
  function close(){closed=true;parser.close();}
  return {
    receive(bytes:Uint8Array,inputGeneration:number):{events:CueDiagnosticEvent[];errors:string[];closed:boolean}{
      const events:CueDiagnosticEvent[]=[],errors:string[]=[];
      if(closed)return {events,errors:['cue-receiver-closed'],closed};
      if(inputGeneration!==transportGeneration)return {events,errors:['cue-stale-transport'],closed};
      if(!(bytes instanceof Uint8Array)||bytes.length>2048){close();return {events,errors:['cue-input-capacity'],closed};}
      let at:number;try{at=now();}catch{at=NaN;}
      if(!finite(at)||at<0||at>max||at<lastReceipt){close();return {events,errors:['cue-receipt-clock'],closed};}lastReceipt=at;
      const result=parser.push(bytes,transportGeneration);errors.push(...result.errors);if(result.droppedDiagnostics)errors.push('cue-parser-diagnostics-dropped');
      if(result.failed){close();return {events,errors,closed};}
      for(const message of result.messages){
        if(message.session!==session||message.opcode!==113||message.encoding!==2){errors.push('cue-wire-context');continue;}
        let record:CueRecord;try{record=decodeCueRecordText(message.payload);}catch(e){errors.push((e as Error).message);continue;}
        if(record.generation!==observerGeneration||record.clockDomainId!==hostClockDomainId){errors.push('cue-observer-context');continue;}
        const first='kind' in record?record.firstSequence:record.sequence;
        if(message.sequence<=wireSequence||first<nextObserver){errors.push('cue-reordered-or-duplicate');continue;}
        if(!('kind' in record)&&record.observedAtMs<lastHostTime){errors.push('cue-host-clock-regressed');continue;}
        const context={source:'unverified' as const,transportGeneration,session,wireSequence:message.sequence,receivedAtMs:at};
        if(wireSequence>=0&&message.sequence>wireSequence+1)events.push({...context,kind:'wire-gap',firstSequence:wireSequence+1,lastSequence:message.sequence-1,reason:'sequence-discontinuity'});
        if(first>nextObserver)events.push({...context,kind:'observer-gap',firstSequence:nextObserver,lastSequence:first-1,reason:'sequence-discontinuity'});
        if('kind' in record){events.push({...context,kind:'observer-gap',record,firstSequence:record.firstSequence,lastSequence:record.lastSequence,reason:'host-reported'});nextObserver=record.lastSequence+1;}
        else{events.push({...context,kind:'observation',record});nextObserver=record.sequence+1;lastHostTime=record.observedAtMs;}
        wireSequence=message.sequence;
      }
      return {events,errors,closed};
    },close,status(){return {closed,transportGeneration,observerGeneration,wireSequence,nextObserver,lastHostTime};},
  };
}
// End of autonomously AI-generated closed diagnostic receiver.
