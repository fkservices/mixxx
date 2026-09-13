// Autonomously AI-generated R01 encoder. Pure bytes; no transport or authority.
import { types } from "node:util";

export interface SysexMessage {
  readonly direction: 0 | 1;
  readonly opcode: number;
  readonly session: string;
  readonly sequence: number;
  readonly payload: unknown;
}
const MAX = 65_536;
const directions: Readonly<Record<number, readonly number[]>> = {
  1:[0],2:[1],3:[1],4:[0],5:[1],6:[1],7:[0],8:[1],9:[0,1],10:[0],11:[1],12:[0,1],112:[0,1],113:[0,1],
};
function fail(message: string): never { throw new TypeError(message); }
function text(value: string): string {
  if(value.length>MAX || !value.isWellFormed())fail("Invalid or oversized Unicode string");
  return value;
}
function finite(value: number): number {
  if(!Number.isFinite(value)||Object.is(value,-0))fail("Expected finite canonical number");
  return value;
}
function own(value: object): PropertyDescriptorMap {
  if(types.isProxy(value))fail("Proxy input is not plain data");
  const prototype=Object.getPrototypeOf(value);
  if(prototype!==Object.prototype&&prototype!==null&&!(Array.isArray(value)&&prototype===Array.prototype))fail("Expected plain JSON data");
  const keys=Reflect.ownKeys(value);
  if(keys.length>4097)fail("Too many keys");
  const descriptors=Object.getOwnPropertyDescriptors(value);
  for(const key of keys){
    if(typeof key!=="string")fail("Symbol key");
    const d=descriptors[key]!;
    if(!("value" in d)||(!d.enumerable&&!(Array.isArray(value)&&key==="length")))fail("Accessor or hidden property");
  }
  return descriptors;
}
// Build a bounded JSON string from descriptors, never calling toJSON or accessors.
function jsonPayload(root: unknown): string {
  let nodes=0,bytes=0;
  const chunks:string[]=[],active=new Set<object>();
  const emit=(s:string)=>{bytes+=Buffer.byteLength(s,"utf8");if(bytes>MAX)fail("Payload exceeds 65536 bytes");chunks.push(s);};
  const visit=(value:unknown,depth:number):void=>{
    if(depth>32||++nodes>4096)fail("JSON depth or node limit");
    if(value===null){emit("null");return;}
    if(typeof value==="boolean"){emit(value?"true":"false");return;}
    if(typeof value==="number"){emit(JSON.stringify(finite(value)));return;}
    if(typeof value==="string"){emit(JSON.stringify(text(value)));return;}
    if(typeof value!=="object")fail("Non-JSON value");
    if(active.has(value))fail("Cyclic data");
    const d=own(value);active.add(value);
    if(Array.isArray(value)){
      const length=d.length!.value as number;
      if(length>4096||Object.keys(d).length!==length+1)fail("Sparse or extended array");
      emit("[");
      for(let i=0;i<length;i++){if(!d[String(i)])fail("Sparse array");if(i)emit(",");visit(d[String(i)]!.value,depth+1);}
      emit("]");
    }else{
      emit("{");let first=true;
      for(const key of Object.keys(d)){if(!first)emit(",");first=false;emit(JSON.stringify(text(key)));emit(":");visit(d[key]!.value,depth+1);}
      emit("}");
    }
    active.delete(value);
  };
  if(root===null||typeof root!=="object"||Array.isArray(root))fail("JSON payload must be an object");
  visit(root,1);return chunks.join("");
}
function digits(value:bigint,width:number):number[]{
  const out:number[]=[];
  for(let i=0;i<width;i++){out.push(Number(value%128n));value/=128n;}
  if(value!==0n)fail("Integer does not fit");return out;
}
function pack(bytes:Uint8Array):number[]{
  const out:number[]=[];
  for(let start=0;start<bytes.length;start+=7){
    const count=Math.min(7,bytes.length-start);let mask=0;
    for(let i=0;i<count;i++)mask|=(bytes[start+i]!>>7)<<i;
    out.push(mask);for(let i=0;i<count;i++)out.push(bytes[start+i]!&127);
  }
  return out;
}
function crc16(bytes:readonly number[]):number{
  let crc=0xffff;
  for(const byte of bytes){crc^=byte<<8;for(let i=0;i<8;i++)crc=((crc<<1)^((crc&0x8000)?0x1021:0))&0xffff;}
  return crc;
}
/** Diagnostic opcodes require explicit opt-in; this does not authorize any action. */
export function encodeSysex(input:SysexMessage,allowDiagnostic=false):readonly Uint8Array[]{
  if(input===null||typeof input!=="object"||Array.isArray(input))fail("Expected message object");
  const d=own(input);
  const names=["direction","opcode","session","sequence","payload"];
  if(Object.keys(d).length!==names.length||names.some(key=>!Object.hasOwn(d,key)))fail("Message fields do not match v1");
  const direction=d.direction!.value as unknown,opcode=d.opcode!.value as unknown,session=d.session!.value as unknown,sequence=d.sequence!.value as unknown;
  if((direction!==0&&direction!==1)||typeof opcode!=="number"||!Number.isInteger(opcode)||!Object.hasOwn(directions,opcode)||!directions[opcode]!.includes(direction))fail("Unsupported opcode or direction");
  if(typeof session!=="string"||session.length!==32||!/^[0-9a-f]{32}$/.test(session))fail("Expected 128-bit lowercase session token");
  if(typeof sequence!=="number"||!Number.isSafeInteger(sequence)||sequence<0||Object.is(sequence,-0))fail("Invalid sequence");
  if(typeof allowDiagnostic!=="boolean"||(opcode>=112&&!allowDiagnostic))fail("Diagnostic opcode disabled");
  const value=d.payload!.value as unknown;
  let encoding:number,payload:Uint8Array;
  if(opcode===112){
    if(typeof value!=="number")fail("Expected numeric payload");finite(value);
    encoding=1;payload=new Uint8Array(8);new DataView(payload.buffer).setFloat64(0,value,true);
  }else if(opcode===113){
    if(typeof value!=="string")fail("Expected text payload");encoding=2;payload=new TextEncoder().encode(text(value));
  }else{encoding=3;payload=new TextEncoder().encode(jsonPayload(value));}
  if(payload.length>MAX)fail("Payload exceeds 65536 bytes");
  const count=Math.max(1,Math.ceil(payload.length/512)),frames:Uint8Array[]=[];
  for(let index=0;index<count;index++){
    const fragment=payload.subarray(index*512,(index+1)*512);
    const body=[0x7d,0x41,0x49,0x44,0x4a,1,direction,opcode,encoding,
      ...digits(BigInt("0x"+session),19),...digits(BigInt(sequence),8),...digits(BigInt(payload.length),3),
      ...digits(BigInt(index),2),...digits(BigInt(count),2),...digits(BigInt(fragment.length),2),...pack(fragment)];
    frames.push(Uint8Array.from([0xf0,...body,...digits(BigInt(crc16(body)),3),0xf7]));
  }
  return Object.freeze(frames);
}
