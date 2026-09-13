// Autonomously AI-generated host timer and sender conformance regressions.
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
import {createSysexParser} from "../../midi/sysex-decode.ts";
function host(){
 let time=0,id=0,failTimer=false,failCleanup=false;
 const timers=new Map<number,()=>void>(),packets:number[][]=[];
 const context=vm.createContext({AIDJ:{},engine:{beginMidiSendTimer:(callback:()=>void)=>{if(failTimer)throw Error('timer');timers.set(++id,callback);return id;},stopTimer:(key:number)=>{if(failCleanup)throw Error('cleanup');timers.delete(key);}},now:()=>time,send:(bytes:number[])=>{packets.push([...bytes]);}});
 for(const name of ['wire-encode','wire-send'])vm.runInContext(readFileSync(new URL(`../../hosts/mixxx/fragments/${name}.js`,import.meta.url),'utf8'),context);
 const evaluate=(s:string)=>vm.runInContext(s,context);
 evaluate("var sender=AIDJ.createWireSender({generation:1,now:now,send:send,allowDiagnostic:true});");
 return {evaluate,timers,packets,set:(n:number)=>{time=n;},failTimer:()=>{failTimer=true;},failCleanup:()=>{failCleanup=true;},tick:()=>{for(const [key,cb] of [...timers]){timers.delete(key);cb();}}};
}
const enqueue=(h:ReturnType<typeof host>,size=65536)=>h.evaluate(`sender.enqueue('message',{direction:1,opcode:113,session:'${'1'.repeat(32)}',sequence:1,payload:'x'.repeat(${size})},1000,1)`);
test("generated host sends maximum payload via native one-shot timers",()=>{
 const h=host();enqueue(h);for(let i=0;i<128;i++){h.set(i*5);h.tick();assert.equal(h.packets.length,i+1);assert.ok(h.timers.size<=1);}
 const p=createSysexParser({direction:1,generation:1,now:()=>0,allowDiagnostic:true,automaticExpiry:false});const messages=h.packets.flatMap(x=>p.push(Uint8Array.from(x),1).messages);assert.equal(messages.length,1);assert.equal(messages[0]?.payload,'x'.repeat(65536));assert.equal(h.timers.size,0);p.close();
});
test("host cancellation and retired timer callbacks cannot emit remaining frames",()=>{
 const h=host();enqueue(h);h.tick();const retired=[...h.timers.values()][0]!;h.evaluate("sender.cancel('message');sender.close()");retired();assert.equal(h.packets.length,1);assert.equal(h.timers.size,0);assert.equal(h.evaluate('sender.status().retainedBytes'),0);
});
test("native timer creation and cleanup failures retire bounded state",()=>{
 const h=host();h.failTimer();enqueue(h);assert.equal(h.evaluate('sender.status().closed'),true);assert.equal(h.evaluate('sender.status().retainedBytes'),0);assert.equal(h.evaluate('sender.status().fault'),'timer');
 const c=host();enqueue(c);const stale=[...c.timers.values()][0]!;c.failCleanup();c.evaluate('sender.close()');assert.equal(c.evaluate('sender.status().retainedBytes'),0);assert.equal(c.evaluate('sender.status().fault'),'timer-cleanup');stale();assert.equal(c.packets.length,0);
});
test("host timer stall expires partial reply rather than catching up",()=>{
 const h=host();enqueue(h);h.tick();h.set(300);h.tick();assert.equal(h.packets.length,1);assert.equal(h.evaluate('sender.drainResults()[0].reason'),'expired');assert.equal(h.timers.size,0);
});
test("host without explicit native pacing API retires instead of using legacy timers",()=>{
 const h=host();h.evaluate("delete engine.beginMidiSendTimer;engine.beginTimer=()=>{throw Error('legacy fallback forbidden')}");enqueue(h);
 assert.equal(h.evaluate('sender.status().closed'),true);assert.equal(h.evaluate('sender.status().fault'),'timer');
 assert.equal(h.evaluate('sender.status().retainedBytes'),0);assert.equal(h.packets.length,0);assert.equal(h.timers.size,0);
});
// End of autonomously AI-generated host sender regressions.
