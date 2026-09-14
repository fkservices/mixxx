// Autonomously AI-generated real HTTP/WebSocket shell boundary tests.
import {test} from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {request} from "node:http";
import WebSocket from "ws";
import {startUiService} from "../../local-ui/service.ts";
import {admitPublication,type ShellPublication} from "../../local-ui/app.ts";
async function fixture(t:{after:(f:()=>Promise<void>)=>void}){const s=await startUiService();t.after(()=>s.close());return s;}
async function session(s:Awaited<ReturnType<typeof startUiService>>){
 const credential=new URL(s.launchUrl()).hash.slice(11);
 const response=await fetch(`${s.origin}/api/v1/bootstrap`,{method:"POST",headers:{Origin:s.origin,"Content-Type":"application/json"},body:JSON.stringify({credential})});assert.equal(response.status,200);
 const cookie=response.headers.get("set-cookie")!.split(";")[0]!;assert.match(response.headers.get("set-cookie")!,/HttpOnly; SameSite=Strict/);
 const auth=await response.json() as {requestToken:string};return {credential,cookie,headers:{Origin:s.origin,"Content-Type":"application/json","X-DJ-Token":auth.requestToken,Cookie:cookie}};
}
async function subscribe(s:Awaited<ReturnType<typeof startUiService>>,a:Awaited<ReturnType<typeof session>>){
 const response=await fetch(`${s.origin}/api/v1/subscriptions`,{method:"POST",headers:a.headers,body:"{}"});assert.equal(response.status,200);const {ticket}=await response.json() as {ticket:string};
 const ws=new WebSocket(s.origin.replace("http:","ws:")+"/api/v1/events",{headers:{Origin:s.origin,Cookie:a.cookie}});await once(ws,"open");const next=once(ws,"message");ws.send(JSON.stringify({ticket}));const [raw]=await next;return {ws,ticket,publication:JSON.parse(String(raw)) as ShellPublication};
}
test("exact local origin and one-use bootstrap are required; cookie alone cannot restore access",async t=>{
 const s=await fixture(t),a=await session(s);
 let response=await fetch(`${s.origin}/api/v1/bootstrap`,{method:"POST",headers:a.headers,body:JSON.stringify({credential:a.credential})});assert.equal(response.status,401);
 response=await fetch(`${s.origin}/api/v1/state`,{headers:{Cookie:a.cookie}});assert.equal(response.status,401);
 response=await fetch(`${s.origin}/api/v1/state`,{headers:a.headers});assert.equal(response.status,200);assert.deepEqual((await response.json() as {status:unknown}).status,{scope:"shell-only",performanceAvailable:false,hostState:"unverified",mode:null,armed:null});
 for(const origin of ["null","https://example.com"]){response=await fetch(`${s.origin}/api/v1/subscriptions`,{method:"POST",headers:{...a.headers,Origin:origin},body:"{}"});assert.equal(response.status,403);}
 const code=await new Promise<number>((yes,no)=>{const req=request(s.origin,{headers:{Host:"evil.example"}},res=>{res.resume();yes(res.statusCode!);});req.on("error",no);req.end();});assert.equal(code,403);
 response=await fetch(`${s.origin}/api/v1/disarm`,{method:"POST",headers:a.headers,body:"{}"});assert.equal(response.status,404);
});
test("bounded snapshot subscription reconnects with new epoch and no performance authority",async t=>{
 const s=await fixture(t),a=await session(s),first=await subscribe(s,a);t.after(async()=>{first.ws.terminate();});
 assert.equal(first.publication.publicationSequence,1);assert.equal(first.publication.payload.armed,null);assert.equal(first.publication.serviceInstanceId,s.serviceInstanceId);
 const next=once(first.ws,"message");first.ws.send(JSON.stringify({ack:1}));const [raw]=await next;const second=JSON.parse(String(raw));assert.equal(second.publicationSequence,2);
 const closed=once(first.ws,"close");first.ws.close();await closed;
 const later=await subscribe(s,a);t.after(async()=>{later.ws.terminate();});assert.equal(later.publication.publicationSequence,1);assert.notEqual(later.publication.subscriptionEpoch,first.publication.subscriptionEpoch);
 assert.equal((await fetch(s.origin,{headers:{}})).status,200);
});
test("missing ACK closes a slow subscriber with explicit resync status and leaves service alive",async t=>{
 const s=await fixture(t),a=await session(s),{ws}=await subscribe(s,a);let extra=0;ws.on("message",()=>extra++);const [code,reason]=await once(ws,"close");assert.equal(code,4002);assert.equal(extra,0);assert.equal(String(reason),"resync-required");assert.equal((await fetch(`${s.origin}/api/v1/state`,{headers:a.headers})).status,200);
});
test("oversized HTTP bodies and unauthenticated WebSocket frames are rejected",async t=>{
 const s=await fixture(t),a=await session(s);
 const response=await fetch(`${s.origin}/api/v1/subscriptions`,{method:"POST",headers:a.headers,body:JSON.stringify({data:"x".repeat(5000)})});assert.equal(response.status,413);
 const ws=new WebSocket(s.origin.replace("http:","ws:")+"/api/v1/events",{headers:{Origin:s.origin,Cookie:a.cookie}});await once(ws,"open");let messages=0;ws.on("message",()=>messages++);const closed=once(ws,"close");ws.send(JSON.stringify({ticket:"invalid"}));const [code]=await closed;assert.equal(code,4003);assert.equal(messages,0);
});
test("client rejects gaps, conflicting duplicates, clock regression and fabricated performance state",()=>{
 const p:ShellPublication={schemaVersion:1,serviceInstanceId:"s",subscriptionEpoch:"e",publicationSequence:1,publicationClock:{clockId:"c",epoch:0,ms:10},kind:"snapshot",payload:{scope:"shell-only",performanceAvailable:false,hostState:"unverified",mode:null,armed:null}};
 assert.equal(admitPublication(p,"s",null),p);assert.equal(admitPublication(structuredClone(p),"s",p),p);
 for(const bad of [{...p,publicationSequence:3},{...p,serviceInstanceId:"other"},{...p,subscriptionEpoch:"new"},{...p,payload:{...p.payload,armed:true}},{...p,publicationSequence:2,publicationClock:{clockId:"c",epoch:0,ms:9}}])assert.equal(admitPublication(bad,"s",p),null);
 assert.ok(admitPublication({...p,publicationSequence:2},"s",p));
});
test("cross-origin WebSocket upgrade cannot use a valid local cookie",async t=>{
 const s=await fixture(t),a=await session(s);
 const ws=new WebSocket(s.origin.replace("http:","ws:")+"/api/v1/events",{headers:{Origin:"https://example.com",Cookie:a.cookie}});
 ws.on("error",()=>{});const code=await new Promise<number>(resolve=>ws.on("unexpected-response",(_req,res)=>{res.resume();resolve(res.statusCode!);ws.terminate();}));assert.equal(code,403);
});
// End of autonomously AI-generated shell boundary tests.
