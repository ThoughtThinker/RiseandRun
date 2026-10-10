import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
const port=33389,base=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['server.js'],{cwd:new URL('.',import.meta.url).pathname,env:{...process.env,PORT:String(port),FRED_API_KEY:''},stdio:'pipe'});
async function request(path,payload,expect=200){const res=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const result=await res.json();if(res.status!==expect)throw Error(`${path} expected ${expect} got ${res.status}: ${JSON.stringify(result)}`);return result;}
async function readSnapshot(room,id){const res=await fetch(`${base}/events?room=${room}&id=${id}`,{signal:AbortSignal.timeout(4500)});const reader=res.body.getReader();const chunk=await reader.read();await reader.cancel();return JSON.parse(new TextDecoder().decode(chunk.value).match(/data: ([^\n]+)/)[1]);}
try{
 let ready=false;for(let i=0;i<40;i++){try{if((await fetch(base+'/health')).ok){ready=true;break}}catch{}await sleep(100)}if(!ready)throw Error('Server unavailable');
 const a=await request('/api/create',{name:'Trade A'}),b=await request('/api/join',{room:a.room,name:'Trade B'}),c=await request('/api/join',{room:a.room,name:'Trade C'});
 await request('/api/start',{room:a.room,id:a.id});
 const initial=await readSnapshot(a.room,a.id);if(initial.players.some(p=>p.shipments!==0))throw Error('Shipments initial value wrong');
 await request('/api/offer',{room:a.room,id:a.id,to:a.id,country:'egypt',amount:4},400);
 await request('/api/offer',{room:a.room,id:a.id,to:b.id,country:'egypt',amount:99},400);
 await request('/api/offer',{room:a.room,id:a.id,to:b.id,country:'egypt',amount:4});
 const pending=await readSnapshot(a.room,b.id),deal=pending.pacts.find(p=>p.to===b.id);if(!deal||deal.status!=='pending')throw Error('Pending offer invisible to receiver');
 await request('/api/respond',{room:a.room,id:c.id,offer:deal.id,accept:true},400);
 await request('/api/respond',{room:a.room,id:b.id,offer:deal.id,accept:true});
 await request('/api/respond',{room:a.room,id:b.id,offer:deal.id,accept:true},400);
 await request('/api/offer',{room:a.room,id:a.id,to:c.id,country:'egypt',amount:2},400);
 const accepted=await readSnapshot(a.room,a.id);if(accepted.pacts[0].status!=='accepted'||accepted.players.find(p=>p.id===a.id).cash!==20||accepted.players.find(p=>p.id===b.id).cash!==28||accepted.countries.find(p=>p.id==='egypt').investments[a.id]!==2)throw Error('Accord not settled correctly');
 await request('/api/action',{room:a.room,id:a.id,type:'ship',country:'egypt'});
 await request('/api/action',{room:a.room,id:b.id,type:'invest',country:'egypt'});
 await request('/api/action',{room:a.room,id:c.id,type:'pass'});
 const done=await readSnapshot(a.room,a.id);if(done.phase!=='results'||done.players.find(p=>p.id===a.id).shipments!==1||!done.log.some(x=>x.includes('completed a shipment')))throw Error('Shipment resolution failed');
 console.log('PASS: three players, validated offers, private acceptance, immediate synchronized cash/influence transfer, shipment action, scored deliveries and round completion');
}catch(e){console.error('FAIL:',e.message);process.exitCode=1}finally{child.kill('SIGTERM')}
