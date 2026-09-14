// Autonomously AI-generated desktop shell service. No performance command handler or MIDI handle.
import {createServer, type IncomingMessage, type ServerResponse} from "node:http";
import {randomBytes, randomUUID, timingSafeEqual} from "node:crypto";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {WebSocketServer, WebSocket} from "ws";

export interface ShellStatus {
  scope:"shell-only";
  performanceAvailable:false;
  hostState:"unverified";
  mode:null;
  armed:null;
}
const status:ShellStatus={scope:"shell-only",performanceAvailable:false,hostState:"unverified",mode:null,armed:null};
interface Session {id:string;token:string;expires:number;ticket:{value:string;expires:number}|null;socket:WebSocket|null}
const secret=()=>randomBytes(32).toString("base64url");
function equal(a:unknown,b:string){return typeof a==="string"&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));}
async function body(req:IncomingMessage){
  if(req.headers["content-type"]!=="application/json")throw Error("invalid-content-type");
  let bytes=0;const chunks:Buffer[]=[];
  for await(const chunk of req){bytes+=chunk.length;if(bytes>4096)throw Error("capacity-exceeded");chunks.push(chunk);}
  const value:unknown=JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if(!value||typeof value!=="object"||Array.isArray(value))throw Error("invalid-request");
  return value as Record<string,unknown>;
}
export async function startUiService(options:{port?:number}={}){
  const serviceInstanceId=randomUUID(),clockId=randomUUID(),cookieName=`dj_${randomBytes(8).toString("hex")}`;
  const sessions=new Map<string,Session>(),launches=new Map<string,number>();
  const assets=new Map<string,{type:string;bytes:Buffer}>();
  for(const [path,type,file] of [["/","text/html; charset=utf-8","index.html"],["/styles.css","text/css; charset=utf-8","styles.css"],["/app.js","text/javascript; charset=utf-8","app.js"]]){
    const asset=file==="app.js"?new URL(import.meta.url.endsWith(".ts")?"../dist/local-ui/app.js":"./app.js",import.meta.url):new URL(import.meta.url.endsWith(".ts")?`./${file}`:`../../local-ui/${file}`,import.meta.url);
    assets.set(path!,{type:type!,bytes:await readFile(asset)});
  }
  let origin="",host="",closed=false,tokens=100,lastRefill=performance.now();
  const validHost=(req:IncomingMessage)=>req.headers.host===host;
  const validOrigin=(req:IncomingMessage)=>req.headers.origin===origin;
  const authenticate=(req:IncomingMessage,needsToken=true)=>{
    const cookie=(req.headers.cookie??"").split(";").map(s=>s.trim()).find(s=>s.startsWith(cookieName+"="));
    const id=cookie?.slice(cookieName.length+1),session=id?sessions.get(id):undefined;
    if(!session||session.expires<=Date.now()||needsToken&&!equal(req.headers["x-dj-token"],session.token))return null;
    return session;
  };
  const send=(res:ServerResponse,code:number,value:object)=>{res.writeHead(code,{"Content-Type":"application/json; charset=utf-8"});res.end(JSON.stringify(value));};
  const server=createServer((req,res)=>{
    res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("Referrer-Policy","no-referrer");
    res.setHeader("Content-Security-Policy","default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
    if(!validHost(req)||req.headers.origin!==undefined&&!validOrigin(req)){send(res,403,{error:"forbidden-mode-or-origin"});return;}
    const now=performance.now();tokens=Math.min(100,tokens+(now-lastRefill)/10);lastRefill=now;
    if(tokens<1){send(res,429,{error:"rate-limited"});return;}tokens--;
    req.setTimeout(3000,()=>req.destroy());
    void (async()=>{
      if(req.method==="GET"&&assets.has(req.url??"")){const asset=assets.get(req.url!)!;res.writeHead(200,{"Content-Type":asset.type});res.end(asset.bytes);return;}
      if(req.method==="POST"&&!validOrigin(req)){send(res,403,{error:"forbidden-mode-or-origin"});return;}
      if(req.method==="POST"&&req.url==="/api/v1/bootstrap"){
        const value=await body(req);const credential=value.credential;
        if(Object.keys(value).length!==1||typeof credential!=="string"||credential.length!==43){send(res,401,{error:"unauthenticated"});return;}
        const expiry=launches.get(credential);launches.delete(credential);
        if(!expiry||expiry<=Date.now()){send(res,401,{error:"unauthenticated"});return;}
        if(sessions.size>=8){send(res,429,{error:"capacity-exceeded"});return;}
        const session:Session={id:secret(),token:secret(),expires:Date.now()+15*60_000,ticket:null,socket:null};sessions.set(session.id,session);
        res.setHeader("Set-Cookie",`${cookieName}=${session.id}; HttpOnly; SameSite=Strict; Path=/api/v1; Max-Age=900`);
        send(res,200,{serviceInstanceId,requestToken:session.token,expiresAt:session.expires});return;
      }
      if(!req.url?.startsWith("/api/v1/")){send(res,404,{error:"not-found"});return;}
      const session=authenticate(req);if(!session){send(res,401,{error:"unauthenticated"});return;}
      if(req.method==="GET"&&req.url==="/api/v1/state"){send(res,200,{serviceInstanceId,status});return;}
      if(req.method==="POST"&&req.url==="/api/v1/subscriptions"){
        const value=await body(req);if(Object.keys(value).length){send(res,400,{error:"invalid-request"});return;}
        session.ticket={value:secret(),expires:Date.now()+5000};send(res,200,{ticket:session.ticket.value});return;
      }
      send(res,404,{error:"handler-unavailable"});
    })().catch(error=>{if(!res.headersSent&&!res.destroyed)send(res,error instanceof Error&&error.message==="capacity-exceeded"?413:400,{error:"invalid-request"});else res.destroy();});
  });
  server.maxConnections=32;server.requestTimeout=5000;server.headersTimeout=5000;server.keepAliveTimeout=1000;
  const wss=new WebSocketServer({noServer:true,maxPayload:4096,perMessageDeflate:false});
  server.on("upgrade",(req,socket,head)=>{
    const session=authenticate(req,false);
    if(closed||req.url!=="/api/v1/events"||!validHost(req)||!validOrigin(req)||!session||session.socket){socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");return;}
    wss.handleUpgrade(req,socket,head,ws=>{
      session.socket=ws;const epoch=randomUUID();let authenticated=false,sequence=0,pending:number|null=null,pendingAt=0;
      const deadline=setTimeout(()=>ws.terminate(),5000);
      const publish=()=>{
        if(!authenticated)return;
        if(session.expires<=Date.now()){ws.close(4001,"session-expired");return;}
        if(pending!==null){if(performance.now()-pendingAt>=3000){ws.close(4002,"resync-required");setTimeout(()=>ws.terminate(),250).unref();}return;}
        const publication={schemaVersion:1,serviceInstanceId,subscriptionEpoch:epoch,publicationSequence:++sequence,publicationClock:{clockId,epoch:0,ms:performance.now()},kind:"snapshot",payload:status};
        const encoded=JSON.stringify(publication);
        if(Buffer.byteLength(encoded)>1024*1024||ws.bufferedAmount>4*1024*1024){ws.terminate();return;}
        pending=sequence;pendingAt=performance.now();ws.send(encoded);
      };
      const heartbeat=setInterval(publish,1000);
      ws.on("error",()=>{});
      ws.on("message",(data,binary)=>{
        try{
          if(binary)throw Error("binary");const message=JSON.parse(data.toString()) as Record<string,unknown>;
          if(!authenticated){
            const ticket=session.ticket;session.ticket=null;
            if(!ticket||ticket.expires<=Date.now()||!equal(message.ticket,ticket.value)||Object.keys(message).length!==1)throw Error("ticket");
            authenticated=true;clearTimeout(deadline);publish();return;
          }
          if(Object.keys(message).length!==1||message.ack!==pending||pending===null)throw Error("ack");pending=null;
        }catch{ws.close(4003,"invalid-client-message");setTimeout(()=>ws.terminate(),250).unref();}
      });
      ws.on("close",()=>{clearTimeout(deadline);clearInterval(heartbeat);if(session.socket===ws)session.socket=null;});
    });
  });
  await new Promise<void>((yes,no)=>{server.once("error",no);server.listen(options.port??0,"127.0.0.1",()=>{server.removeListener("error",no);yes();});});
  const address=server.address();if(!address||typeof address==="string")throw Error("invalid-listener");host=`127.0.0.1:${address.port}`;origin=`http://${host}`;
  const maintenance=setInterval(()=>{const now=Date.now();for(const [key,expires]of launches)if(expires<=now)launches.delete(key);for(const [key,s]of sessions)if(s.expires<=now){s.socket?.terminate();sessions.delete(key);}},1000);
  return {
    origin,serviceInstanceId,
    launchUrl(){if(closed)throw Error("service-closed");if(launches.size>=8)throw Error("launch-capacity");const token=secret();launches.set(token,Date.now()+60_000);return `${origin}/#bootstrap=${token}`;},
    async close(){if(closed)return;closed=true;clearInterval(maintenance);launches.clear();sessions.clear();for(const ws of wss.clients)ws.terminate();await new Promise<void>(r=>wss.close(()=>r()));await new Promise<void>(r=>server.close(()=>r()));},
  };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const service=await startUiService();console.log(service.launchUrl());
  process.on("SIGINT",()=>{void service.close();});process.on("SIGTERM",()=>{void service.close();});
}
// End of autonomously AI-generated desktop shell service.
