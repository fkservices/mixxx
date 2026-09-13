// Autonomously AI-generated one-request local client; never owns MIDI/service lifetime.
import { createConnection } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
export function requestCommand(socketPath:string,command:string):Promise<unknown>{
  if(command.length>256||/[\r\n]/.test(command))return Promise.reject(new Error("Expected one command of at most 256 characters"));
  return new Promise((yes,no)=>{
    const socket=createConnection(socketPath);let data=Buffer.alloc(0),done=false;
    const finish=(error?:Error,value?:unknown)=>{if(done)return;done=true;socket.destroy();if(error)no(error);else yes(value);};
    socket.setTimeout(5000,()=>finish(new Error("Service response timeout; command outcome may be unknown")));
    socket.on("connect",()=>socket.write(command+"\n"));socket.on("error",e=>finish(e));
    socket.on("data",chunk=>{
      if(data.length+chunk.length>1_048_576){finish(new Error("Response too large"));return;}
      data=Buffer.concat([data,typeof chunk === "string" ? Buffer.from(chunk) : chunk]);const newline=data.indexOf(10);if(newline<0)return;
      try{finish(undefined,JSON.parse(data.subarray(0,newline).toString("utf8")));}catch{finish(new Error("Invalid service response"));}
    });
    socket.on("end",()=>{if(!done)finish(new Error("Service closed without result; command outcome may be unknown"));});
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [socket,...parts]=process.argv.slice(2);if(!socket||!parts.length)throw new Error("Usage: cli.ts SOCKET arm|disarm|status|set CONTROL VALUE");
  console.log(JSON.stringify(await requestCommand(socket,parts.join(" "))));
}
