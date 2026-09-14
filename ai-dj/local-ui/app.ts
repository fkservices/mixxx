// Autonomously AI-generated desktop shell client; snapshots never grant performance authority.
export interface ShellPublication {
 schemaVersion:1;serviceInstanceId:string;subscriptionEpoch:string;publicationSequence:number;
 publicationClock:{clockId:string;epoch:number;ms:number};kind:"snapshot";
 payload:{scope:"shell-only";performanceAvailable:false;hostState:"unverified";mode:null;armed:null};
}
export function admitPublication(input:unknown,instance:string,prior:ShellPublication|null):ShellPublication|null{
 if(!input||typeof input!=="object")return null;
 const p=input as Partial<ShellPublication>,q=p.payload,c=p.publicationClock;
 if(p.schemaVersion!==1||p.serviceInstanceId!==instance||typeof p.subscriptionEpoch!=="string"||p.subscriptionEpoch.length>128||!p.subscriptionEpoch||!Number.isSafeInteger(p.publicationSequence)||Number(p.publicationSequence)<1||p.kind!=="snapshot"||!c||typeof c.clockId!=="string"||!c.clockId||c.clockId.length>128||!Number.isSafeInteger(c.epoch)||c.epoch<0||!Number.isFinite(c.ms)||c.ms<0||!q||q.scope!=="shell-only"||q.performanceAvailable!==false||q.hostState!=="unverified"||q.mode!==null||q.armed!==null)return null;
 if(prior&&JSON.stringify(p)===JSON.stringify(prior))return prior;
 if(prior&&(p.subscriptionEpoch!==prior.subscriptionEpoch||p.publicationSequence!==prior.publicationSequence+1||c.clockId!==prior.publicationClock.clockId||c.epoch!==prior.publicationClock.epoch||c.ms<prior.publicationClock.ms)||!prior&&p.publicationSequence!==1)return null;
 return p as ShellPublication;
}
if(typeof document!=="undefined"){
 const element=(id:string)=>document.getElementById(id)!;
 const reconnect=element("reconnect") as HTMLButtonElement;
 const bootstrap=new URLSearchParams(location.hash.slice(1)).get("bootstrap");
 if(bootstrap)history.replaceState(null,"",location.pathname+"#setup");
 let token:string|null=null,instance:string|null=null,socket:WebSocket|null=null,prior:ShellPublication|null=null,lastSeen=0;
 let generation=0,retry:ReturnType<typeof setTimeout>|null=null,attempt=0,connecting=false,expired=false;
 const display=(state:string,heading:string,detail:string)=>{
   element("connection").textContent=state;const wrapper=element("connection").parentElement!;wrapper.dataset.state=state.toLowerCase();
   element("service-heading").textContent=heading;element("service-detail").textContent=detail;
   element("authority").textContent="AI state unknown";
 };
 async function post(path:string,value:object){
   const response=await fetch(`/api/v1/${path}`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{"X-DJ-Token":token}:{})},body:JSON.stringify(value),credentials:"same-origin",cache:"no-store",signal:AbortSignal.timeout(4000)});
   if(response.status===401){expired=true;token=null;throw Error("Access expired. Open a fresh launcher link.");}
   if(!response.ok)throw Error(`Local service returned ${response.status}.`);
   const text=await response.text();if(text.length>8192)throw Error("Invalid service response.");return JSON.parse(text) as Record<string,unknown>;
 }
 function disconnected(detail:string){display("Disconnected","Service connection unavailable",detail);reconnect.disabled=!token||expired;}
 function schedule(){if(retry||expired||!token)return;retry=setTimeout(()=>{retry=null;void connect();},Math.min(5000,500*2**Math.min(attempt++,4)));}
 async function connect(){
   if(connecting||!token||!instance||expired)return;connecting=true;reconnect.disabled=true;const epoch=++generation;
   if(socket){socket.onclose=null;socket.close();socket=null;}prior=null;
   display("Connecting","Reconnecting to the local service","Waiting for a fresh snapshot. No command is retried.");
   try{
     const result=await post("subscriptions",{});if(epoch!==generation)return;
     if(typeof result.ticket!=="string"||result.ticket.length!==43)throw Error("Invalid subscription ticket.");
     const ws=new WebSocket(`${location.protocol==="https:"?"wss:":"ws:"}//${location.host}/api/v1/events`);socket=ws;
     const opening=setTimeout(()=>{if(epoch===generation)ws.close();},5000);
     ws.onopen=()=>{clearTimeout(opening);if(epoch===generation)ws.send(JSON.stringify({ticket:result.ticket}));};
     ws.onmessage=event=>{
       if(epoch!==generation)return;
       try{
         if(typeof event.data!=="string"||event.data.length>1024*1024)throw Error("Invalid publication size");
         const next=admitPublication(JSON.parse(event.data),instance!,prior);if(!next)throw Error("Snapshot discontinuity");
         if(next===prior)return;
         prior=next;lastSeen=performance.now();attempt=0;display("Connected","Local service connected","Fresh shell snapshot received. Mixxx and performance controls remain unverified.");
         element("instance").textContent=`Service ${instance!.slice(0,8)} · publication ${next.publicationSequence}`;
         ws.send(JSON.stringify({ack:next.publicationSequence}));reconnect.disabled=false;
       }catch{display("Stale","Fresh snapshot required","The publication could not be reconciled. Live state is unknown.");ws.close();}
     };
     ws.onerror=()=>{if(epoch===generation)disconnected("Connection failed. Live AI state cannot be confirmed.");};
     ws.onclose=event=>{clearTimeout(opening);if(epoch!==generation)return;if(event.code===4001){expired=true;token=null;}disconnected(expired?"Access expired. Open a fresh launcher link.":"Last-known information is stale. Reconnecting does not arm or replay commands.");schedule();};
   }catch(error){disconnected(error instanceof Error?error.message:"Connection failed.");schedule();}finally{if(epoch===generation)connecting=false;}
 }
 reconnect.addEventListener("click",()=>{if(retry){clearTimeout(retry);retry=null;}void connect();});
 setInterval(()=>{
   if(lastSeen){const age=(performance.now()-lastSeen)/1000;element("freshness").textContent=`Last snapshot ${age.toFixed(1)}s ago`;
     if(age>=3&&socket?.readyState===WebSocket.OPEN){display("Stale","Service updates have stopped","Last-known values are frozen. AI state is unknown; no action is confirmed.");socket.close();}}
 },250);
 const views:Record<string,[string,string,string]>={setup:["START WITH THE CONNECTION","One computer. One shared booth.","Connect the companion, check the host, then build your set. Every live control will show what the service actually knows."],playlist:["YOUR COMPLETE SET","Playlist & set","Keep every playlist occurrence, including repeated songs, while choosing the flow."],plan:["BEFORE THE FIRST TRANSITION","Plan review","Review the order, timing and musical choices before handing over control."],live:["HUMAN + AI","Live booth","See what is playing, who owns each control and what happens next."],history:["UNDERSTAND THE SESSION","Session history","Inspect past actions and track layers. History never sends MIDI."],settings:["MAKE IT YOURS","Settings","Musical choices, controller setup and recording preferences will live here."]};
 function navigate(){const id=location.hash.slice(1);const key=Object.hasOwn(views,id)?id:"setup",view=views[key]!;element("view-kicker").textContent=view[0];element("view-title").textContent=view[1];element("view-description").textContent=view[2];element("view-placeholder").hidden=key==="setup";for(const link of document.querySelectorAll("nav a")){if(link.getAttribute("href")===`#${key}`)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");}}
 window.addEventListener("hashchange",navigate);navigate();
 if(bootstrap){
   display("Connecting","Opening local access","Exchanging the one-use launcher credential.");
   void post("bootstrap",{credential:bootstrap}).then(result=>{
     if(typeof result.requestToken!=="string"||result.requestToken.length!==43||typeof result.serviceInstanceId!=="string"||result.serviceInstanceId.length>128)throw Error("Invalid bootstrap response.");
     token=result.requestToken;instance=result.serviceInstanceId;return connect();
   }).catch(error=>disconnected(error instanceof Error?error.message:"Bootstrap failed."));
 }else disconnected("Open a fresh launcher link to establish local access. Reloading does not restore control credentials.");
}
// End of autonomously AI-generated desktop shell client.
