import {spawn} from 'node:child_process';import {setTimeout as sleep} from 'node:timers/promises';
const port=33385,base=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['server.js'],{cwd:new URL('.',import.meta.url).pathname,env:{...process.env,PORT:String(port),NODE_OPTIONS:'--require ./mock-providers.cjs',FRED_API_KEY:'fixture-key'},stdio:'pipe'});
try{
 let found;
 for(let i=0;i<45;i++){try{const r=await fetch(base+'/api/intelligence');if(r.ok){const v=await r.json();if(['weather','markets','fx','quakes','alerts','macro','fred'].every(k=>v.feeds[k]==='live')){found=v;break}}}catch{}await sleep(100)}
 if(!found)throw Error('Mock providers did not produce complete live intelligence');
 if(found.macro[0]?.country!=='egypt')throw Error('World Bank country mapping failed: '+JSON.stringify(found.macro));
 if(found.quakes[0]?.mag!==5.4||found.alerts[0]?.severity!=='Severe')throw Error('USGS/NWS parsing failed');
 if(found.fred.length!==3)throw Error('FRED parsing failed');
 if(found.modifiers?.weather?.egypt?.weatherSeverity!==1)throw Error('Weather effect missing');
 if(found.feeds.polls!=='unconfigured')throw Error('Polls should not fabricate data');
 console.log('PASS: mocked weather, FX, crypto, USGS, NOAA alerts, World Bank, FRED, game modifiers and poll safety');
}catch(e){console.error('FAIL:',e.message);process.exitCode=1}finally{child.kill('SIGTERM')}
