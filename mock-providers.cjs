// Optional test fixture. Does not run in production; activated only via NODE_OPTIONS in a test child process.
const original=global.fetch;
global.fetch=(url,opts)=>{
 const u=String(url);
 const reply=x=>Promise.resolve(new Response(JSON.stringify(x),{status:200,headers:{'content-type':'application/json'}}));
 if(u.includes('api.open-meteo.com'))return reply(Array.from({length:8},(_,i)=>({current:{temperature_2m:20+i,wind_speed_10m:45,precipitation:0,time:'2026-10-09T10:00'}})));
 if(u.includes('api.coingecko.com'))return reply({bitcoin:{usd:100000,usd_24h_change:1.8},ethereum:{usd:4000,usd_24h_change:-1.2}});
 if(u.includes('api.frankfurter.dev'))return reply({date:'2026-10-09',rates:{EUR:.85,GBP:.73,JPY:150}});
 if(u.includes('earthquake.usgs.gov'))return reply({features:[{id:'us-test',geometry:{coordinates:[104,2,15]},properties:{mag:5.4,place:'Mock quake',time:1791500000000,url:'https://earthquake.usgs.gov/'}}]});
 if(u.includes('api.weather.gov'))return reply({features:[{id:'test',properties:{event:'Severe Thunderstorm Warning',severity:'Severe',areaDesc:'Bexar County, Texas',effective:'2026-10-09T10:00:00Z',expires:'2026-10-09T12:00:00Z','@id':'https://api.weather.gov/alerts/test'}}]});
 if(u.includes('api.worldbank.org'))return reply([{},[{country:{id:'EG'},countryiso3code:'EGY',date:'2024',value:3.6}]]);
 if(u.includes('api.stlouisfed.org'))return reply({observations:[{date:'2026-10-08',value:'98.23'}]});
 return original(url,opts);
};
