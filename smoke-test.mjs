import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
const port=33379;
const child=spawn(process.execPath,['server.js'],{cwd:new URL('.',import.meta.url).pathname,env:{...process.env,PORT:String(port)},stdio:'pipe'});
const base=`http://127.0.0.1:${port}`;
const check=(x,m)=>{if(!x)throw Error(m)};
try {
 let ready=false;
 for(let i=0;i<40;i++){try{const r=await fetch(base+'/health');if(r.ok){ready=true;break}}catch{}await sleep(100)}
 check(ready,'Server did not start');
 const home=await fetch(base+'/');check(home.ok&&(await home.text()).includes('EMPIRE'),'Homepage failed');
 const post=async(path,data)=>{const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});check(r.ok,path+' failed');return r.json()};
 const a=await post('/api/create',{name:'Tester A'});check(a.room&&a.id,'Room create failed');
 const b=await post('/api/join',{room:a.room,name:'Tester B'});check(b.id!==a.id,'Room join failed');
 await post('/api/start',{room:a.room,id:a.id});
 const events=await fetch(`${base}/events?room=${a.room}&id=${a.id}`,{signal:AbortSignal.timeout(2500)});
 check(events.ok&&events.headers.get('content-type')?.includes('text/event-stream'),'SSE failed');
 await events.body.cancel();
 console.log('PASS: homepage, health, create, join, start, synchronized event stream');
} catch(e){console.error('FAIL:',e.message);process.exitCode=1}finally{child.kill('SIGTERM')}
