// Autonomously AI-generated R01 parser. Decoded data is not semantic admission.
export interface DecodedSysex {
  direction:0|1; opcode:number; encoding:1|2|3; session:string; sequence:number;
  payload:unknown; payloadBytes:Uint8Array;
}
export interface ParserResult {
  messages:DecodedSysex[]; realtime:number[]; otherMidi:number[];
  errors:string[]; droppedDiagnostics:number; failed:boolean;
}
interface Fragment {direction:0|1;opcode:number;encoding:1|2|3;session:string;sequence:number;total:number;index:number;count:number;bytes:Uint8Array;}
interface Slot {header:Omit<Fragment,"bytes">;bytes:Uint8Array;seen:Uint8Array;received:number;first:number;last:number;}
const roles:Readonly<Record<number,readonly number[]>>={1:[0],2:[1],3:[1],4:[0],5:[1],6:[1],7:[0],8:[1],9:[0,1],10:[0],11:[1],12:[0,1],112:[0,1],113:[0,1]};
const bad=(reason:string):never=>{throw new Error(reason);};
function integer(bytes:readonly number[],at:number,width:number):bigint{
 let n=0n;for(let i=width-1;i>=0;i--)n=n*128n+BigInt(bytes[at+i]!);return n;
}
function frame(bytes:readonly number[],direction:0|1,diagnostic:boolean):Fragment|null{
 if(bytes[1]!==0x7d||bytes.slice(2,6).join(",")!=="65,73,68,74")return null;
 if(bytes.length<50)bad("truncated-frame");
 if(bytes[6]!==1)bad("unsupported-version");
 const opcode=bytes[8]!,encoding=bytes[9]!;
 if(bytes[7]!==direction||!Object.hasOwn(roles,opcode)||!roles[opcode]!.includes(direction))bad("unsupported-route");
 if(opcode>=112&&!diagnostic)bad("diagnostic-disabled");
 if(encoding!==(opcode===112?1:opcode===113?2:3))bad("unsupported-encoding");
 if(bytes[28]!>3||bytes[36]!>15||bytes[bytes.length-2]!>3)bad("noncanonical-integer");
 const total=Number(integer(bytes,37,3)),index=Number(integer(bytes,40,2)),count=Number(integer(bytes,42,2)),length=Number(integer(bytes,44,2));
 if(total>65536||count!==Math.max(1,Math.ceil(total/512))||index>=count||length!==(index===count-1?total-index*512:512))bad("invalid-length");
 if(bytes.length!==50+length+Math.ceil(length/7))bad("invalid-length");
 if(encoding===1&&total!==8)bad("invalid-number-length");
 let crc=0xffff;
 for(let i=1;i<bytes.length-4;i++){crc^=bytes[i]!<<8;for(let j=0;j<8;j++)crc=((crc<<1)^((crc&0x8000)?0x1021:0))&0xffff;}
 if(BigInt(crc)!==integer(bytes,bytes.length-4,3))bad("checksum-mismatch");
 const decoded=new Uint8Array(length);let cursor=46;
 for(let start=0;start<length;start+=7){const n=Math.min(7,length-start),mask=bytes[cursor++]!;if(mask>=2**n)bad("noncanonical-mask");for(let i=0;i<n;i++)decoded[start+i]=bytes[cursor++]!|(((mask>>i)&1)<<7);}
 return {direction,opcode,encoding:encoding as 1|2|3,session:integer(bytes,10,19).toString(16).padStart(32,"0"),sequence:Number(integer(bytes,29,8)),total,index,count,bytes:decoded};
}
// Strict bounded recursive-descent JSON: reject duplicates before object insertion.
function json(source:string):unknown{
 let at=0,nodes=0;
 const whitespace=()=>{while(at<source.length&&/[ \t\r\n]/.test(source[at]!))at++;};
 const string=():string=>{
  if(source[at]!== '"')bad("invalid-json");const start=at++;
  while(at<source.length){const c=source[at++]!;if(c==='\\'){at++;continue;}if(c==='"'){
    let value:string;try{value=JSON.parse(source.slice(start,at)) as string;}catch{bad("invalid-json-string");}
    if(!value!.isWellFormed())bad("invalid-unicode");return value!;
  }}return bad("invalid-json-string");
 };
 const numeric=/-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
 const value=(depth:number):unknown=>{
  if(depth>32||++nodes>4096)bad("json-resource-limit");whitespace();const c=source[at];
  if(c==='"')return string();
  if(c==='{'){
   at++;whitespace();const result:Record<string,unknown>=Object.create(null);
   if(source[at]==='}'){at++;return result;}
   while(at<source.length){whitespace();const key=string();if(Object.hasOwn(result,key))bad("duplicate-json-key");whitespace();if(source[at++]!==':')bad("invalid-json");result[key]=value(depth+1);whitespace();const end=source[at++];if(end==='}')return result;if(end!==',')bad("invalid-json");}
   return bad("invalid-json");
  }
  if(c==='['){at++;whitespace();const result:unknown[]=[];if(source[at]===']'){at++;return result;}
   while(at<source.length){result.push(value(depth+1));whitespace();const end=source[at++];if(end===']')return result;if(end!==',')bad("invalid-json");}return bad("invalid-json");}
  for(const [literal,result] of [["null",null],["true",true],["false",false]] as const){if(source.startsWith(literal,at)){at+=literal.length;return result;}}
  numeric.lastIndex=at;const match=numeric.exec(source);if(!match)bad("invalid-json");at=numeric.lastIndex;
  const n=Number(match![0]);if(!Number.isFinite(n)||Object.is(n,-0))bad("invalid-number");return n;
 };
 if(source.charCodeAt(0)===0xfeff)bad("json-bom");
 const result=value(1);whitespace();if(at!==source.length||result===null||typeof result!=="object"||Array.isArray(result))bad("invalid-json-root");return result;
}
function payload(bytes:Uint8Array,encoding:number):unknown{
 if(encoding===1){const n=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getFloat64(0,true);if(!Number.isFinite(n)||Object.is(n,-0))bad("invalid-number");return n;}
 let text:string;try{text=new TextDecoder("utf-8",{fatal:true,ignoreBOM:true}).decode(bytes);}catch{bad("invalid-utf8");}
 return encoding===2?text!:json(text!);
}
export interface ParserOptions {direction:0|1;generation:number;now:()=>number;allowDiagnostic?:boolean;automaticExpiry?:boolean;}
/** One parser per ingress endpoint. Call close on disposal; no host callbacks exist. */
export function createSysexParser(options:ParserOptions){
 const direction=options.direction,now=options.now,diagnostic=options.allowDiagnostic??false;
 let generation=options.generation;
 if((direction!==0&&direction!==1)||!Number.isSafeInteger(generation)||generation<0||typeof now!=="function"||typeof diagnostic!=="boolean")throw new TypeError("Invalid parser configuration");
 let partial:number[]=[],partialAt=0,lastTime=-1,failed=false,closed=false,dropped=0;
 const slots=new Map<string,Slot>(),errors:string[]=[];
 const report=(reason:string)=>{if(errors.length<32)errors.push(reason);else dropped=Math.min(Number.MAX_SAFE_INTEGER,dropped+1);};
 const clear=()=>{partial=[];slots.clear();};
 const time=():number|null=>{
  if(closed||failed)return null;
  let t:number;try{t=now();}catch{t=NaN;}
  if(!Number.isFinite(t)||t<0||t>Number.MAX_SAFE_INTEGER||t<lastTime){failed=true;clear();report("clock-failed");return null;}
  lastTime=t;return t;
 };
 const expire=():number|null=>{
  const t=time();if(t===null)return null;
  if(partial.length&&t-partialAt>=250){partial=[];report("frame-timeout");}
  for(const [key,slot] of slots)if(t-slot.first>=1000||t-slot.last>=250){slots.delete(key);report("message-timeout");}
  return t;
 };
 const drain=(messages:DecodedSysex[]=[],realtime:number[]=[],otherMidi:number[]=[]):ParserResult=>{
  const result={messages,realtime,otherMidi,errors:errors.splice(0),droppedDiagnostics:dropped,failed};dropped=0;return result;
 };
 const accept=(f:Fragment,t:number):DecodedSysex|null=>{
  const key=f.session+":"+f.sequence;let slot=slots.get(key);
  if(slot&&(slot.header.opcode!==f.opcode||slot.header.encoding!==f.encoding||slot.header.total!==f.total||slot.header.count!==f.count)){slots.delete(key);bad("fragment-conflict");}
  if(!slot){if(slots.size>=4)bad("reassembly-capacity");const {bytes:_decoded,...header}=f;slot={header,bytes:new Uint8Array(f.total),seen:new Uint8Array(16),received:0,first:t,last:t};slots.set(key,slot);}
  const flag=1<<(f.index%8),cell=Math.floor(f.index/8),start=f.index*512;
  if(slot.seen[cell]!&flag){for(let i=0;i<f.bytes.length;i++)if(slot.bytes[start+i]!==f.bytes[i]){slots.delete(key);bad("fragment-conflict");}return null;}
  slot.bytes.set(f.bytes,start);slot.seen[cell]=slot.seen[cell]!|flag;slot.received++;slot.last=t;
  if(slot.received!==f.count)return null;
  slots.delete(key);const value=payload(slot.bytes,f.encoding);
  return {direction,opcode:f.opcode,encoding:f.encoding,session:f.session,sequence:f.sequence,payload:value,payloadBytes:slot.bytes};
 };
 const interval=options.automaticExpiry===false?undefined:setInterval(expire,25);interval?.unref();
 return {
  push(bytes:Uint8Array,inputGeneration:number):ParserResult{
   const messages:DecodedSysex[]=[],realtime:number[]=[],otherMidi:number[]=[];
   const t=expire();if(t===null)return drain();
   if(inputGeneration!==generation){report("stale-generation");return drain();}
   if(!(bytes instanceof Uint8Array)||bytes.length>2048){clear();failed=true;report("input-capacity-gap");return drain();}
   for(const byte of bytes){
    if(byte>=0xf8){realtime.push(byte);if(byte===0xff){clear();failed=true;report("midi-reset");break;}continue;}
    if(byte===0xf0){if(partial.length)report("nested-start");partial=[byte];partialAt=t;continue;}
    if(!partial.length){if(byte===0xf7)report("unmatched-end");else otherMidi.push(byte);continue;}
    if(byte===0xf7){const complete=partial;partial=[];complete.push(byte);
     try{if(complete.length>636)bad("frame-capacity");const f=frame(complete,direction,diagnostic);if(f){const message=accept(f,t);if(message)messages.push(message);}}catch(error){report(error instanceof Error?error.message:"invalid-frame");}continue;
    }
    if(byte>=0x80){partial=[];report("interrupted-frame");otherMidi.push(byte);continue;}
    if(partial.length>=635){partial=[];report("frame-capacity");continue;}
    partial.push(byte);
   }
   return drain(messages,realtime,otherMidi);
  },
  tick():ParserResult{expire();return drain();},
  status(){return {generation,closed,failed,partialBytes:partial.length,incompleteMessages:slots.size,retainedPayloadBytes:[...slots.values()].reduce((n,s)=>n+s.bytes.length,0),pendingDiagnostics:errors.length,droppedDiagnostics:dropped};},
  resetGeneration(next:number){if(!Number.isSafeInteger(next)||next<=generation)throw new TypeError("Generation must increase");generation=next;clear();report("generation-reset");},
  close(){if(closed)return;closed=true;clear();if(interval)clearInterval(interval);},
 };
}
