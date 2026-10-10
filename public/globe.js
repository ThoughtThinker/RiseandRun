/* Empire: Rise & Ruin — WebGL planet and 2D geographic HUD. No remote JS dependencies. */
(()=>{'use strict';
const rad=Math.PI/180;
const C=[
{id:'usa',name:'United States',lat:39,lon:-98},{id:'brazil',name:'Brazil',lat:-15,lon:-48},{id:'uk',name:'United Kingdom',lat:53,lon:-2},{id:'egypt',name:'Egypt',lat:27,lon:30},{id:'india',name:'India',lat:21,lon:78},{id:'china',name:'China',lat:35,lon:104},{id:'singapore',name:'Singapore',lat:1.35,lon:104},{id:'southafrica',name:'South Africa',lat:-29,lon:25}
];
const PORTS=[
{name:'Panama Canal',lat:9.1,lon:-79.7,type:'choke'},{name:'Suez Canal',lat:30.45,lon:32.35,type:'choke'},{name:'Strait of Malacca',lat:2.5,lon:101.6,type:'choke'},{name:'Strait of Hormuz',lat:26.56,lon:56.25,type:'choke'},{name:'Gibraltar',lat:36.12,lon:-5.35,type:'choke'},{name:'Cape of Good Hope',lat:-34.35,lon:18.48,type:'choke'},
{name:'Singapore Port',lat:1.27,lon:103.83,type:'port'},{name:'Shanghai',lat:31.23,lon:121.48,type:'port'},{name:'Rotterdam',lat:51.94,lon:4.13,type:'port'},{name:'Mumbai',lat:18.93,lon:72.83,type:'port'},{name:'Santos',lat:-23.96,lon:-46.32,type:'port'},{name:'Los Angeles',lat:33.73,lon:-118.26,type:'port'},{name:'Jebel Ali',lat:24.98,lon:55.06,type:'port'},{name:'Cape Town',lat:-33.9,lon:18.42,type:'port'}
];
// Coarse vector fallback for browsers without WebGL. WebGL texture uses GSHHG detail.
const COAST=[
[[-166,62],[-135,68],[-128,58],[-123,48],[-112,32],[-98,16],[-83,8],[-78,22],[-87,31],[-81,48],[-95,53],[-110,60],[-135,71]],
[[-82,12],[-70,10],[-60,3],[-49,-1],[-35,-9],[-40,-24],[-52,-34],[-70,-56],[-77,-41],[-74,-22]],
[[-12,37],[4,43],[8,55],[26,71],[43,69],[44,53],[34,42],[28,35],[11,36]],
[[-18,35],[10,37],[34,31],[51,12],[43,-12],[35,-34],[16,-36],[9,-27],[-1,-1],[-17,15]],
[[32,40],[43,57],[65,72],[110,73],[145,61],[170,58],[180,53],[151,45],[142,32],[119,24],[117,13],[102,2],[95,18],[79,9],[69,23],[52,30]],
[[112,-12],[130,-12],[147,-19],[153,-30],[143,-40],[115,-35]], [[-53,60],[-40,81],[-18,82],[-37,58]], [[46,-14],[50,-17],[49,-26],[44,-25]]
];
const ROUTES=[
{name:'Panama ↔ Pacific',from:[9.1,-79.7],to:[33.73,-118.26]},
{name:'Transatlantic',from:[33.73,-118.26],to:[51.94,4.13]},
{name:'Suez trade',from:[51.94,4.13],to:[30.45,32.35]},
{name:'Suez ↔ Mumbai',from:[30.45,32.35],to:[18.93,72.83]},
{name:'Hormuz ↔ Singapore',from:[26.56,56.25],to:[1.27,103.83]},
{name:'Malacca ↔ Shanghai',from:[2.5,101.6],to:[31.23,121.48]},
{name:'Cape route',from:[-34.35,18.48],to:[1.27,103.83]},
{name:'South Atlantic',from:[-23.96,-46.32],to:[-33.9,18.42]},
];
const VERT=`attribute vec3 aPos;attribute vec2 aUV;uniform float uYaw,uPitch;uniform vec2 uScale;varying vec2 vUV;varying vec3 vNormal;void main(){float cy=cos(uYaw),sy=sin(uYaw),cp=cos(uPitch),sp=sin(uPitch);vec3 p=vec3(cy*aPos.x-sy*aPos.z,aPos.y,sy*aPos.x+cy*aPos.z);p=vec3(p.x,cp*p.y-sp*p.z,sp*p.y+cp*p.z);vUV=aUV;vNormal=p;gl_Position=vec4(p.x*uScale.x,p.y*uScale.y,-p.z*0.48,1.0);}`;
const FRAG=`precision highp float;
uniform sampler2D uTex;uniform sampler2D uCloud;uniform float uTime;
varying vec2 vUV;varying vec3 vNormal;
void main(){
  vec3 normal=normalize(vNormal);
  vec3 tex=texture2D(uTex,vUV).rgb;
  // Never darken the real Earth below 67% brightness: readable geography first.
  float sunlight=max(dot(normal,normalize(vec3(.68,.37,.73))),0.0);
  float light=.67+.32*sunlight;
  vec3 result=tex*light;
  // Subtle decorative clouds (not real-time observations).
  float cloud=texture2D(uCloud,vec2(fract(vUV.x+uTime*.000002),vUV.y)).a;
  result=mix(result,vec3(.88,.94,.98)*light,cloud*.16);
  float atmosphere=pow(1.0-max(normal.z,0.0),3.6);
  result+=vec3(.025,.13,.21)*atmosphere;
  // No artificial central white hotspot/specular bloom.
  gl_FragColor=vec4(clamp(result,0.0,1.0),1.0);
}`;
function shader(gl,type,source){const x=gl.createShader(type);gl.shaderSource(x,source);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(x));return x;}
function rgba(ctx,x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
class EmpireGlobe{
 constructor({canvas,hud,onSelect,onPoint}){this.canvas=canvas;this.hud=hud;this.ctx=hud.getContext('2d');this.onSelect=onSelect||(()=>{});this.onPoint=onPoint||(()=>{});this.yaw=-20;this.pitch=12;this.zoom=1;this.layer='influence';this.selected='egypt';this.intel=null;this.match=null;this.points=[];this.drag=null;this.gl=null;this.ready=false;this.textureReady=false;this.safeMode=true;this.animPhase=0;this.autoSpin=false;this.cloudReady=false;this.stars=Array.from({length:130},(_,i)=>{const h=x=>((x*1664525+1013904223)>>>0)/4294967295;return {u:h(i*533+31),v:h(i*1907+123),r:.45+1.1*h(i*101+9),a:.2+.55*h(i*89+8)}});this.initGL();this.initFallback();this.bind();this.resize();this.animate();}
 initGL(){try{let g=this.canvas.getContext('webgl',{antialias:true,alpha:true})||this.canvas.getContext('experimental-webgl');if(!g)throw Error('WebGL unavailable');this.gl=g;const pr=g.createProgram();g.attachShader(pr,shader(g,g.VERTEX_SHADER,VERT));g.attachShader(pr,shader(g,g.FRAGMENT_SHADER,FRAG));g.linkProgram(pr);if(!g.getProgramParameter(pr,g.LINK_STATUS))throw Error(g.getProgramInfoLog(pr));g.useProgram(pr);this.pr=pr;
 const verts=[],uvs=[],indices=[],nLon=144,nLat=72;for(let j=0;j<=nLat;j++){const lat=-Math.PI/2+Math.PI*j/nLat;for(let i=0;i<=nLon;i++){const lon=-Math.PI+2*Math.PI*i/nLon;verts.push(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));uvs.push(i/nLon,j/nLat)}}for(let j=0;j<nLat;j++)for(let i=0;i<nLon;i++){let a=j*(nLon+1)+i,b=a+nLon+1;indices.push(a,b,a+1,b,b+1,a+1)}
 const bind=(name,data,size)=>{const b=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,b);g.bufferData(g.ARRAY_BUFFER,new Float32Array(data),g.STATIC_DRAW);const attr=g.getAttribLocation(pr,name);g.vertexAttribPointer(attr,size,g.FLOAT,false,0,0);g.enableVertexAttribArray(attr)};
 bind('aPos',verts,3);bind('aUV',uvs,2);const ind=g.createBuffer();g.bindBuffer(g.ELEMENT_ARRAY_BUFFER,ind);g.bufferData(g.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),g.STATIC_DRAW);this.count=indices.length;this.uYaw=g.getUniformLocation(pr,'uYaw');this.uPitch=g.getUniformLocation(pr,'uPitch');this.uScale=g.getUniformLocation(pr,'uScale');this.uTex=g.getUniformLocation(pr,'uTex');this.uTime=g.getUniformLocation(pr,'uTime');this.uCloud=g.getUniformLocation(pr,'uCloud');this.texture=g.createTexture();g.bindTexture(g.TEXTURE_2D,this.texture);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,1,1,0,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array([8,29,43,255]));g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);
 const img=new Image();img.onload=()=>{g.bindTexture(g.TEXTURE_2D,this.texture);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,img);this.textureReady=true;this.imageFailed=false;this.canvas.title='Earth texture loaded';this.render()};img.onerror=()=>{this.imageFailed=true;this.canvas.title='Earth texture unavailable: displaying geographic fallback';this.render()};img.src='/earth-relief.jpg';
 this.reliefTexture=g.createTexture();g.bindTexture(g.TEXTURE_2D,this.reliefTexture);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,1,1,0,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array([8,29,43,255]));g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);
 const relief=new Image();relief.onload=()=>{g.bindTexture(g.TEXTURE_2D,this.reliefTexture);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,relief);this.reliefReady=true;this.render()};relief.src='/earth-surface.png';
 this.cloudTexture=g.createTexture();g.bindTexture(g.TEXTURE_2D,this.cloudTexture);
 g.texImage2D(g.TEXTURE_2D,0,g.RGBA,1,1,0,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array([255,255,255,0]));
 for(const param of [g.TEXTURE_MIN_FILTER,g.TEXTURE_MAG_FILTER])g.texParameteri(g.TEXTURE_2D,param,g.LINEAR);
 g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);
 const clouds=new Image();clouds.onload=()=>{g.bindTexture(g.TEXTURE_2D,this.cloudTexture);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,clouds);this.cloudReady=true;this.render()};clouds.src='/stylized-clouds.png';
 g.enable(g.DEPTH_TEST);g.depthFunc(g.LEQUAL);this.ready=true;
 this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.ready=false;this.imageFailed=true;this.initFallback();this.render()});
 }catch(e){this.ready=false;this.canvas.title='WebGL unavailable: '+e.message;this.canvas.style.display='none';this.hud.style.background='radial-gradient(circle at center,#1b4659 0,#0d2439 42%,#06101f 60%)';}}
 bind(){const c=this.hud;const pos=e=>{const a=c.getBoundingClientRect();return {x:e.clientX-a.left,y:e.clientY-a.top}};c.addEventListener('pointerdown',e=>{c.setPointerCapture(e.pointerId);this.drag={...pos(e),yaw:this.yaw,pitch:this.pitch,moved:false}});c.addEventListener('pointermove',e=>{if(!this.drag)return;const p=pos(e),dx=p.x-this.drag.x,dy=p.y-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>6)this.drag.moved=true;this.yaw=((this.drag.yaw+dx*.38+540)%360)-180;this.pitch=Math.max(-70,Math.min(70,this.drag.pitch-dy*.35));this.render()});c.addEventListener('pointerup',e=>{if(this.drag&&!this.drag.moved){const p=pos(e);const hit=this.points.filter(z=>z.z>.02).map(z=>({...z,d:Math.hypot(z.x-p.x,z.y-p.y)})).sort((a,b)=>a.d-b.d)[0];if(hit&&hit.d<23){if(hit.id){this.selected=hit.id;this.onSelect(hit.id)}else this.onPoint(hit)}}this.drag=null});c.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.65,Math.min(1.58,this.zoom-e.deltaY*.001));this.render()},{passive:false});window.addEventListener('resize',()=>this.resize());document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.render()});}
 resize(){const rect=this.hud.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);this.w=Math.max(1,rect.width);this.h=Math.max(1,rect.height);this.radius=Math.min(this.w,this.h)*.43*this.zoom;for(const c of [this.canvas,this.hud]){c.width=Math.round(this.w*dpr);c.height=Math.round(this.h*dpr)}this.ctx.setTransform(dpr,0,0,dpr,0,0);this.render()}
 project(lat,lon,raise=0){let latr=lat*rad,a=(lon-this.yaw)*rad,p=this.pitch*rad,x=Math.cos(latr)*Math.sin(a),y=Math.sin(latr),z=Math.cos(latr)*Math.cos(a);let yy=Math.cos(p)*y-Math.sin(p)*z,zz=Math.sin(p)*y+Math.cos(p)*z;return {x:this.w/2+x*this.radius*(1+raise),y:this.h/2-yy*this.radius*(1+raise),z:zz,visible:zz>0.01}}
 reset(){this.yaw=-20;this.pitch=12;this.zoom=1;this.resize()}
 center(lat,lon){this.yaw=lon;this.pitch=Math.max(-70,Math.min(70,lat));this.render()}
 setData(intel,match){this.intel=intel;this.match=match;this.render()}
 setLayer(layer){this.layer=layer;this.render()}
 setSelected(id){this.selected=id;this.render()}
 toggleSpin(){this.autoSpin=!this.autoSpin;return this.autoSpin}
 toggleRenderer(){this.safeMode=!this.safeMode;this.render();return this.safeMode?'Safe 3-D globe':'WebGL globe'}
 drawArc(a,b,stroke,width=1.5){const ctx=this.ctx;const va=v3(a[0],a[1]),vb=v3(b[0],b[1]);let dot=Math.max(-1,Math.min(1,va[0]*vb[0]+va[1]*vb[1]+va[2]*vb[2]));const angle=Math.acos(dot);let prev=null;ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.beginPath();for(let i=0;i<=68;i++){let t=i/68,fac1,fac2;if(angle<.001){fac1=1-t;fac2=t}else{fac1=Math.sin((1-t)*angle)/Math.sin(angle);fac2=Math.sin(t*angle)/Math.sin(angle)}const v=[va[0]*fac1+vb[0]*fac2,va[1]*fac1+vb[1]*fac2,va[2]*fac1+vb[2]*fac2];const lat=Math.asin(v[1])*180/Math.PI,lon=Math.atan2(v[0],v[2])*180/Math.PI,p=this.project(lat,lon,.09*Math.sin(Math.PI*t));if(p.visible){if(!prev)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);prev=p}else{if(prev){ctx.stroke();ctx.beginPath()}prev=null}}ctx.stroke()}
 initFallback(){
  const img=new Image();img.onload=()=>{try{const temp=document.createElement('canvas');temp.width=img.width;temp.height=img.height;const c=temp.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);this.fallbackSource={width:img.width,height:img.height,data:c.getImageData(0,0,img.width,img.height).data};this.render()}catch(e){this.canvas.title='Fallback raster unavailable: '+e.message}};img.src='/earth-relief.jpg';
 }
 drawRasterFallback(){
  const src=this.fallbackSource;if(!src)return false;
  const ctx=this.ctx,size=Math.round(Math.max(128,Math.min(460,this.radius*2))),R=size/2;
  if(!this.fallbackCanvas){this.fallbackCanvas=document.createElement('canvas')}
  const canvas=this.fallbackCanvas;canvas.width=size;canvas.height=size;const cx=canvas.getContext('2d'),image=cx.createImageData(size,size),dst=image.data;
  const yaw=this.yaw*Math.PI/180,pitch=this.pitch*Math.PI/180,cp=Math.cos(pitch),sp=Math.sin(pitch);
  const w=src.width,h=src.height,data=src.data;
  for(let py=0;py<size;py++){
   const y=(R-py)/R,y2=y*y;
   for(let px=0;px<size;px++){
    const x=(px-R)/R,d2=x*x+y2;if(d2>1)continue;
    const z=Math.sqrt(Math.max(0,1-d2)),wy=cp*y+sp*z,wz=-sp*y+cp*z;
    const lat=Math.asin(Math.max(-1,Math.min(1,wy))),lon=yaw+Math.atan2(x,wz);
    let u=(lon/Math.PI+.999999)/2;u-=Math.floor(u);
    const tx=Math.min(w-1,Math.max(0,Math.floor(u*w))),ty=Math.min(h-1,Math.max(0,Math.floor((.5-lat/Math.PI)*h)));
    const p=(ty*w+tx)*4,q=(py*size+px)*4;
    const shade=.20+.82*Math.max(0,Math.min(1,(x*.68+y*.43+z*.63+.20)/.67));
    const rim=Math.pow(1-z,3)*30;
    dst[q]=Math.min(255,data[p]*shade);dst[q+1]=Math.min(255,data[p+1]*shade+rim*.7);dst[q+2]=Math.min(255,data[p+2]*shade+rim);dst[q+3]=255;
   }
  }
  cx.putImageData(image,0,0);this.ctx.drawImage(canvas,this.w/2-this.radius,this.h/2-this.radius,this.radius*2,this.radius*2);return true;
 }
 drawFallback(){const ctx=this.ctx,cx=this.w/2,cy=this.h/2;if(this.drawRasterFallback())return;ctx.save();ctx.beginPath();ctx.arc(cx,cy,this.radius,0,Math.PI*2);ctx.clip();const g=ctx.createRadialGradient(cx-this.radius*.3,cy-this.radius*.4,0,cx,cy,this.radius*1.15);g.addColorStop(0,'#18546b');g.addColorStop(.65,'#0a334f');g.addColorStop(1,'#081827');ctx.fillStyle=g;ctx.fillRect(cx-this.radius,cy-this.radius,this.radius*2,this.radius*2);
 for(let lat=-75;lat<=75;lat+=15){ctx.beginPath();let prev=null;for(let lon=-180;lon<=180;lon+=4){const p=this.project(lat,lon);if(p.visible){if(!prev)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);prev=p}else{if(prev){ctx.stroke();ctx.beginPath()}prev=null}}ctx.strokeStyle='#6aaac322';ctx.lineWidth=.8;ctx.stroke()}
 for(let lon=-180;lon<=165;lon+=15){ctx.beginPath();let prev=null;for(let lat=-90;lat<=90;lat+=3){const p=this.project(lat,lon);if(p.visible){if(!prev)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);prev=p}else{if(prev){ctx.stroke();ctx.beginPath()}prev=null}}ctx.strokeStyle='#6aaac322';ctx.lineWidth=.8;ctx.stroke()}
 for(const poly of COAST){ctx.beginPath();let prev=null;for(let i=0;i<=poly.length;i++){const [lon,lat]=poly[i%poly.length],p=this.project(lat,lon);if(p.visible){if(!prev)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);prev=p}else{if(prev){ctx.stroke();ctx.beginPath()}prev=null}}ctx.strokeStyle='#75b7a9';ctx.lineWidth=1.8;ctx.stroke()}
 ctx.restore();}
 render(){if(!this.ctx||!this.w)return;this.radius=Math.min(this.w,this.h)*.43*this.zoom;const g=this.gl,useGL=this.ready&&this.textureReady&&!this.safeMode;this.canvas.style.visibility=useGL?'visible':'hidden';if(useGL&&g){g.viewport(0,0,this.canvas.width,this.canvas.height);g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.useProgram(this.pr);g.uniform1f(this.uYaw,this.yaw*rad);g.uniform1f(this.uPitch,this.pitch*rad);g.uniform2f(this.uScale,2*this.radius/this.w,2*this.radius/this.h);g.uniform1i(this.uTex,0);g.uniform1i(this.uCloud,1);g.uniform1f(this.uTime,performance.now()/1000);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.layer==='terrain'&&this.reliefReady?this.reliefTexture:this.texture);g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.cloudTexture);g.drawElements(g.TRIANGLES,this.count,g.UNSIGNED_SHORT,0)}
 const ctx=this.ctx;ctx.clearRect(0,0,this.w,this.h);
 const cx=this.w/2,cy=this.h/2;
 for(const star of this.stars){const x=star.u*this.w,y=star.v*this.h;if(Math.hypot(x-cx,y-cy)<this.radius+16)continue;ctx.beginPath();ctx.arc(x,y,star.r,0,Math.PI*2);ctx.fillStyle=`rgba(185,219,249,${star.a})`;ctx.fill()}
 if(!useGL)this.drawFallback();this.points=[];ctx.beginPath();ctx.arc(cx,cy,this.radius+3,0,Math.PI*2);ctx.strokeStyle='#3b829ba1';ctx.lineWidth=1.4;ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,this.radius+9,0,Math.PI*2);ctx.strokeStyle='#1b6e9466';ctx.lineWidth=9;ctx.stroke();
 if(this.layer==='routes'||this.layer==='influence'){ROUTES.forEach((r,i)=>this.drawArc(r.from,r.to,i%2?'#77d9e887':'#efc17e99',this.layer==='routes'?2:1))}
 if(this.layer==='routes'){
 ROUTES.forEach((r,i)=>{const t=((this.animPhase*.00016+i*.17)%1),a=v3(...r.from),b=v3(...r.to);let dot=Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2])),ang=Math.acos(dot),f=ang>.001?Math.sin((1-t)*ang)/Math.sin(ang):1-t,h=ang>.001?Math.sin(t*ang)/Math.sin(ang):t,v=[a[0]*f+b[0]*h,a[1]*f+b[1]*h,a[2]*f+b[2]*h],p=this.project(Math.asin(v[1])*180/Math.PI,Math.atan2(v[0],v[2])*180/Math.PI,.09*Math.sin(Math.PI*t));if(p.visible)rgba(ctx,p.x,p.y,2.7,'#f9db96','#ffffff')});
 PORTS.forEach(p=>{const a=this.project(p.lat,p.lon);if(!a.visible)return;const col=p.type==='choke'?'#ffcc7c':'#78dddf';ctx.fillStyle=col;ctx.fillRect(a.x-3,a.y-3,6,6);this.points.push({...a,label:p.name,type:p.type});if(p.type==='choke'&&this.w>460)this.label(p.name,a.x+9,a.y-9,col)})}
 if(this.layer==='seismic'){(this.intel?.quakes||[]).forEach(q=>{const a=this.project(q.lat,q.lon);if(!a.visible)return;rgba(ctx,a.x,a.y,Math.max(3,Math.min(13,q.mag*1.3)),'#ec7d61a0','#ffc1a5');this.points.push({...a,label:`M${q.mag} · ${q.place}`,type:'quake',url:q.url})})}
 C.forEach((c,i)=>{const a=this.project(c.lat,c.lon);if(!a.visible)return;const match=this.match,region=match?.countries?.find(o=>o.id===c.id),mod=match?.world?.modifiers||this.intel?.modifiers||{},w=mod.weather?.[c.id]?.weatherSeverity||0,debt=region?region.debt/region.gdp:0,ci=match?.players?.findIndex(p=>p.id===region?.controller)??-1;const cols=['#71cef0','#ed9d68','#a0d783','#cda6ff','#f7d374','#ee88b3'];let color='#79d7e2';if(this.layer==='macro'){const observation=(this.intel?.macro||[]).find(x=>x.country===c.id);color=!observation?'#7d96a1':observation.gdpGrowth<0?'#f37e7e':observation.gdpGrowth<2?'#e8b66a':'#6be2af'}if(this.layer==='debt')color=region?(debt>2?'#ef7676':debt>1?'#f1b56a':'#6ed7b3'):'#65899e';else if(this.layer==='weather')color=w===2?'#ed7770':w===1?'#edc071':'#8eb5bd';else if(this.layer==='polls')color=(mod.pollUncertainty?.[c.id]||0)?'#f4b975':'#87adb8';else if(ci>=0)color=cols[ci%cols.length];if(this.layer==='weather'&&w){ctx.strokeStyle=w>1?'#f87f7daa':'#eed38a99';ctx.lineWidth=w>1?3:2;ctx.beginPath();ctx.arc(a.x,a.y,20+w*9,0,2*Math.PI);ctx.stroke()}
 if(c.id===this.selected){rgba(ctx,a.x,a.y,17,'#ffffff0c','#fff1c0');rgba(ctx,a.x,a.y,11,color+'cc','#ffffff')}else rgba(ctx,a.x,a.y,7,color+'bb','#bde8ea');this.points.push({...a,id:c.id,label:c.name,type:'country'});if(c.id===this.selected||this.w>750)this.label(c.name,a.x+12,a.y-8,c.id===this.selected?'#ffe5ad':'#bfdde4')});
 ctx.fillStyle='#c4d7e9cc';ctx.font='11px system-ui';ctx.fillText('REAL GEOGRAPHY · SOURCED OBSERVATIONS · GAME LAYERS',15,this.h-18);if(!this.fallbackSource&&!useGL){ctx.fillStyle='#f0c98acc';ctx.font='11px system-ui';ctx.fillText(this.imageFailed?'Earth image failed to load':'Loading Earth imagery…',15,22);}
 }
 label(value,x,y,color){const ctx=this.ctx;ctx.font='11px system-ui';ctx.lineWidth=4;ctx.strokeStyle='#051320';ctx.strokeText(value,x,y);ctx.fillStyle=color;ctx.fillText(value,x,y)}
 animate(){let last=0;const tick=t=>{if(!document.hidden&&(this.autoSpin||this.layer==='routes'||this.layer==='seismic')&&t-last>120){this.animPhase=t;if(this.autoSpin)this.yaw=((this.yaw+.037+540)%360)-180;this.render();last=t}requestAnimationFrame(tick)};requestAnimationFrame(tick)}
}
function v3(lat,lon){return [Math.cos(lat*rad)*Math.sin(lon*rad),Math.sin(lat*rad),Math.cos(lat*rad)*Math.cos(lon*rad)]}
window.EmpireGlobe={create:x=>new EmpireGlobe(x),countries:C,ports:PORTS,routes:ROUTES};
})();
