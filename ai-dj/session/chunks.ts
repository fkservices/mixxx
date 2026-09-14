// Autonomously AI-generated recorder-worker storage; not a communicator-thread API.
import { mkdir, open, readdir } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
const MAX_CHUNK=16*1024*1024, MAX_RECORD=256*1024;
const hash=(b:Uint8Array)=>createHash("sha256").update(b).digest("hex");
const validId=(s:unknown)=>typeof s==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(s);
function envelope(line:string,recordingId:string) {
  const e=JSON.parse(line) as Record<string,unknown>;
  if(!e||e.schemaVersion!==1||e.recordingId!==recordingId||!validId(e.eventId)||!Number.isSafeInteger(e.recorderSequence)||Number(e.recorderSequence)<1)throw Error("invalid-record-envelope");
  return {sequence:Number(e.recorderSequence),event:e};
}
export interface ChunkSeal {schemaVersion:1;index:number;bytes:number;count:number;firstSequence:number;lastSequence:number;sha256:string}
export class ChunkWriter {
  private handle:FileHandle|null=null;
  private index=0;private bytes=0;private count=0;private first=0;private last=0;
  private digest=createHash("sha256");private busy=false;private ended=false;private failed=false;
  private readonly directory:string;private readonly recordingId:string;private readonly limit:number;
  private constructor(directory:string,recordingId:string,limit:number){this.directory=directory;this.recordingId=recordingId;this.limit=limit;}
  static async create(directory:string,recordingId:string,limit=MAX_CHUNK) {
    if(!validId(recordingId)||!Number.isSafeInteger(limit)||limit<1024||limit>MAX_CHUNK)throw Error("invalid-storage-options");
    await mkdir(directory,{recursive:false,mode:0o700});
    const h=await open(join(directory,"recording.json"),"wx",0o600);
    try {await h.writeFile(JSON.stringify({schemaVersion:1,recordingId,chunkBytes:limit}));await h.sync();}finally{await h.close();}
    return new ChunkWriter(directory,recordingId,limit);
  }
  private async seal() {
    if(!this.handle)return;
    await this.handle.sync();await this.handle.close();this.handle=null;
    const descriptor:ChunkSeal={schemaVersion:1,index:this.index,bytes:this.bytes,count:this.count,firstSequence:this.first,lastSequence:this.last,sha256:this.digest.digest("hex")};
    const h=await open(join(this.directory,`${this.index}.seal.json`),"wx",0o600);
    try{await h.writeFile(JSON.stringify(descriptor));await h.sync();}finally{await h.close();}
    this.index++;this.bytes=0;this.count=0;this.digest=createHash("sha256");
  }
  async append(line:string):Promise<void> {
    if(this.busy||this.ended||this.failed)throw Error("writer-not-ready");
    if(typeof line!=="string"||line.length>MAX_RECORD||/[\r\n]/.test(line))throw Error("record-size-or-framing");
    const bytes=Buffer.from(line+"\n"),e=envelope(line,this.recordingId);
    if(bytes.length>MAX_RECORD||bytes.length>this.limit)throw Error("record-too-large");
    if(e.sequence!==this.last+1)throw Error("sequence-discontinuity");
    this.busy=true;
    try {
      if(this.bytes+bytes.length>this.limit)await this.seal();
      if(!this.handle)this.handle=await open(join(this.directory,`${this.index}.ndjson`),"wx",0o600);
      let offset=0;
      while(offset<bytes.length){const result=await this.handle.write(bytes,offset,bytes.length-offset);if(result.bytesWritten<=0)throw Error("short-write");offset+=result.bytesWritten;}
      this.digest.update(bytes);this.bytes+=bytes.length;this.count++;if(this.count===1)this.first=e.sequence;this.last=e.sequence;
    }catch(error){this.failed=true;throw error;}finally{this.busy=false;}
  }
  async abort():Promise<void> {
    if(this.busy)throw Error("writer-busy");
    this.failed=true;this.ended=true;await this.handle?.close();this.handle=null;
  }
  async close():Promise<void> {
    if(this.busy)throw Error("writer-busy");
    if(this.ended)return;
    this.busy=true;
    try {
      if(this.failed)throw Error("writer-failed");
      await this.seal();
      const h=await open(join(this.directory,"end.json"),"wx",0o600);
      try{await h.writeFile(JSON.stringify({schemaVersion:1,chunks:this.index,lastSequence:this.last}));await h.sync();}finally{await h.close();}
    }catch(error){this.failed=true;throw error;}finally{await this.handle?.close();this.handle=null;this.ended=true;this.busy=false;}
  }
}
export type RecoveredChunkItem=
 | {kind:"record";event:Record<string,unknown>;sealed:boolean}
 | {kind:"gap";reason:string;chunk:number|null}
 | {kind:"end";cleanStorageClose:boolean;lastSequence:number;grantsPerformanceAuthority:false};
export async function* recoverChunks(directory:string):AsyncGenerator<RecoveredChunkItem> {
  const bounded=async(path:string,limit:number)=>{
    const h=await open(path,"r");try {
      const info=await h.stat();if(!info.isFile()||info.size>limit)throw Error("file-too-large-or-not-regular");
      const data=Buffer.alloc(limit+1);let length=0;
      while(length<data.length){const r=await h.read(data,length,data.length-length);if(!r.bytesRead)break;length+=r.bytesRead;}
      if(length>limit)throw Error("file-too-large");return data.subarray(0,length);
    }finally{await h.close();}
  };
  const meta=JSON.parse((await bounded(join(directory,"recording.json"),1024)).toString());
  if(meta.schemaVersion!==1||!validId(meta.recordingId)||!Number.isSafeInteger(meta.chunkBytes)||meta.chunkBytes<1024||meta.chunkBytes>MAX_CHUNK)throw Error("invalid-recording-metadata");
  const names=await readdir(directory);if(names.length>100000)throw Error("too-many-chunks");
  const indices=names.filter(n=>/^(0|[1-9][0-9]*)\.ndjson$/.test(n)).map(n=>Number(n.split(".")[0])).sort((a,b)=>a-b);
  let last=0,clean=true,expected=0;
  for(const index of indices) {
    if(index!==expected){clean=false;yield {kind:"gap",reason:"missing-chunk",chunk:expected};break;}
    expected++;
    const data=await bounded(join(directory,`${index}.ndjson`),meta.chunkBytes);
    let sealed=false;
    try {
      const s=JSON.parse((await bounded(join(directory,`${index}.seal.json`),2048)).toString());
      if(s.schemaVersion!==1||s.index!==index||s.bytes!==data.length||s.sha256!==hash(data))throw Error("seal-mismatch");
      const lines=data.toString("utf8").split("\n");lines.pop();
      if(!data.length||data.at(-1)!==10||s.count!==lines.length||s.firstSequence!==last+1||s.lastSequence!==last+lines.length)throw Error("seal-mismatch");
      sealed=true;
    }catch(error){clean=false;yield {kind:"gap",reason:(error as NodeJS.ErrnoException).code==="ENOENT"?"unsealed-chunk":"invalid-seal",chunk:index};}
    const finalNewline=data.lastIndexOf(10);
    if(finalNewline!==data.length-1){clean=false;yield {kind:"gap",reason:"truncated-tail",chunk:index};}
    let text:string;
    try{text=new TextDecoder("utf-8",{fatal:true}).decode(data.subarray(0,finalNewline+1));}
    catch{clean=false;yield {kind:"gap",reason:"invalid-utf8",chunk:index};break;}
    const lines=text.split("\n");lines.pop();
    let valid=true;
    for(const line of lines){
      try {
        if(Buffer.byteLength(line)+1>MAX_RECORD)throw Error("oversized-record");
        const e=envelope(line,meta.recordingId);if(e.sequence!==last+1)throw Error("sequence-discontinuity");
        last=e.sequence;yield {kind:"record",event:e.event,sealed};
      }catch{clean=false;valid=false;yield {kind:"gap",reason:"invalid-record-or-sequence",chunk:index};break;}
    }
    if(!valid||!sealed)break;
  }
  try {const end=JSON.parse((await bounded(join(directory,"end.json"),1024)).toString());if(end.schemaVersion!==1||end.chunks!==expected||end.chunks!==indices.length||end.lastSequence!==last)throw Error("end-mismatch");}
  catch{clean=false;yield {kind:"gap",reason:"missing-or-invalid-end",chunk:null};}
  yield {kind:"end",cleanStorageClose:clean,lastSequence:last,grantsPerformanceAuthority:false};
}
// End of autonomously AI-generated recorder-worker storage.
