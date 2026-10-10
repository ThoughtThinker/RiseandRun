import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
const port=33381,base=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['server.js'],{cwd:new URL('.',import.meta.url).pathname,env:{...process.env,PORT:String(port),FRED_API_KEY:''},stdio:'pipe'});
const check=(condition,msg)=>{if(!condition)throw Error(msg)};
async function post(route,value){const r=await fetch(base+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value)});if(!r.ok)throw Error(`POST ${route}: ${r.status} ${await r.text()}`);return r.json()}
try{
 let ready=false;for(let i=0;i<45;i++){try{if((await fetch(base+'/health')).ok){ready=true;break}}catch{}await sleep(100)}
 check(ready,'Server failed to start');
 for(const [url,needle] of [['/','WORLD INTELLIGENCE'],['/intel.html','World Intelligence'],['/globe.js','EmpireGlobe']]){
  const r=await fetch(base+url);check(r.ok,`${url} returned ${r.status}`);const t=await r.text();check(t.includes(needle),`${url} has unexpected content`);
 }
 const image=await fetch(base+'/assets/earth-surface.png');check(image.ok,'Surface texture not served');check(image.headers.get('content-type')?.startsWith('image/png'),'PNG MIME invalid');check((await image.arrayBuffer()).byteLength>100000,'Surface image unexpectedly small');
 const intelligence=await (await fetch(base+'/api/intelligence')).json();for(const key of ['quakes','alerts','macro','fred','weather','polls','fx','feedDetails'])check(key in intelligence,`Intelligence missing ${key}`);
 check(intelligence.feeds.fred==='unconfigured','FRED should be unconfigured without API key');check(intelligence.feeds.polls==='unconfigured','Polling must not fabricate results');
 const first=await post('/api/create',{name:'Captain A'}),second=await post('/api/join',{room:first.room,name:'Captain B'});check(first.id!==second.id,'Duplicate sessions');
 await post('/api/start',{room:first.room,id:first.id});
 const stream=await fetch(`${base}/events?room=${first.room}&id=${first.id}`,{signal:AbortSignal.timeout(5000)});check(stream.ok&&stream.headers.get('content-type')?.includes('text/event-stream'),'SSE not delivered');const reader=stream.body.getReader();const event=await reader.read();check(new TextDecoder().decode(event.value).includes('"phase":"planning"'),'Initial synchronized round state absent');await reader.cancel();
 await post('/api/action',{room:first.room,id:first.id,type:'invest',country:'egypt'});await post('/api/action',{room:first.room,id:second.id,type:'pass'});
 console.log('PASS: main page, embedded globe, WebGL assets, intelligence shape/statuses, players joining, live rounds, SSE and actions');
}catch(e){console.error('FAIL:',e.message);process.exitCode=1}finally{child.kill('SIGTERM')}
