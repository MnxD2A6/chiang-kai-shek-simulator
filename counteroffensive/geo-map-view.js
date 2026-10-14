(function(root){
 'use strict';
 const F=root.FrontCore,G=F.geography;
 const colors=['#5a7c99','#57cdea','#a46979','#aa7980','#817398'];
 const partnerLocations={usa:[-98,39],japan:[138,38],korea:[127.7,36.6],philippines:[123,12]};
 const countryNames={CHN:'大陆',TWN:'台湾',USA:'美国',JPN:'日本',KOR:'韩国',PRK:'朝鲜',RUS:'俄罗斯',CAN:'加拿大',MEX:'墨西哥',PHL:'菲律宾',VNM:'越南',AUS:'澳大利亚',IDN:'印度尼西亚',MNG:'蒙古'};
 class FrontMap{
  constructor(canvas){
   this.shipArt={};for(const kind of ['transport','destroyer','missile']){const img=new Image();img.src='./assets/ship-'+kind+'.svg';this.shipArt[kind]=img;}this.canvas=canvas;this.ctx=canvas.getContext('2d');this.texture=document.createElement('canvas');this.texture.width=F.W;this.texture.height=F.H;this.tc=this.texture.getContext('2d');this.regionPins=new Map();this.zoom=1;this.pan={x:0,y:0};this.lastTexture=-10;this.hover=null;this.rings=[];this.labels=[];this.unitHits=[];this.visibleTowns=new Set();this.visibleRegions=new Set();
   this.shapes=G.data.features.map(f=>{const path=new Path2D(),bounds={x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity};for(const ring of f.rings){ring.forEach(([lon,lat],i)=>{const p=G.project(lon,lat);bounds.x0=Math.min(bounds.x0,p.x);bounds.x1=Math.max(bounds.x1,p.x);bounds.y0=Math.min(bounds.y0,p.y);bounds.y1=Math.max(bounds.y1,p.y);if(i)path.lineTo(p.x,p.y);else path.moveTo(p.x,p.y);});path.closePath();}return {code:f.code,path,bounds};});
   this.combatClip=new Path2D();for(const s of this.shapes)if(['CHN','TWN'].includes(s.code))this.combatClip.addPath(s.path);
   this.resize();this.home();
  }
  resize(){const old=this.width?this.worldPoint(this.width/2,this.height/2):null,r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;this.dpr=Math.min(2,window.devicePixelRatio||1);this.canvas.width=Math.round(r.width*this.dpr);this.canvas.height=Math.round(r.height*this.dpr);this.fitScale=Math.min(r.width/G.worldWidth,(r.height-40)/G.worldHeight)*.96;if(old)this.center(old);this.constrain();}
  get transform(){const scale=this.fitScale*this.zoom;return {scale,x:(this.width-G.worldWidth*scale)/2+this.pan.x,y:(this.height-G.worldHeight*scale)/2+this.pan.y};}
  point(x,y){const t=this.transform;return {x:t.x+x*t.scale,y:t.y+y*t.scale};}
  worldPoint(x,y){const t=this.transform;return {x:(x-t.x)/t.scale,y:(y-t.y)/t.scale};}
  screen(x,y){const p=G.fromGrid(x,y);return this.point(p.x,p.y);}
  world(x,y){const p=this.worldPoint(x,y),ll=G.unproject(p.x,p.y);return G.toGrid(ll.lon,ll.lat);}
  townScreen(town){const p=G.project(town.lon,town.lat);return this.point(p.x,p.y);}
  regionScreen(region){const p=G.project(...partnerLocations[region.id]);return this.regionPins.get(region.id)||this.point(p.x,p.y);}
  hostileScreen(region){return this.regionPins.get(region.id)||this.townScreen(region);}
  tile(x,y){const p=this.world(x,y),cx=Math.floor(p.x),cy=Math.floor(p.y);return cx<0||cy<0||cx>=F.W||cy>=F.H?null:F.id(cx,cy);}
  center(p){this.pan={x:0,y:0};const s=this.point(p.x,p.y);this.pan.x=this.width/2-s.x;this.pan.y=this.height*.47-s.y;}
  constrain(){const t=this.transform,margin=70;this.pan.x+=Math.min(0,margin-t.x)+Math.max(0,this.width-margin-(t.x+G.worldWidth*t.scale));this.pan.y+=Math.min(0,margin-t.y)+Math.max(0,this.height-margin-(t.y+G.worldHeight*t.scale));}
  home(){this.zoom=this.width<700?20:15;this.center(G.project(this.width<700?120.8:119,24.5));this.constrain();}
  overview(){this.zoom=1;this.pan={x:0,y:0};this.constrain();}
  setZoom(value,x=this.width/2,y=this.height/2){const before=this.worldPoint(x,y);this.zoom=Math.max(1,Math.min(38,value));const after=this.point(before.x,before.y);this.pan.x+=x-after.x;this.pan.y+=y-after.y;this.constrain();}
  focusRegion(key){const loc=key==='usa'?[-110,38]:key==='japan'?[137,36.5]:partnerLocations[key];this.zoom=key==='usa'?3:key==='japan'?5.2:10;this.center(G.project(...loc));this.constrain();}
  focus(tile){const p=F.xy(tile);this.zoom=Math.max(this.width<700?20:14,this.zoom);this.center(G.fromGrid(p.x+.5,p.y+.5));this.constrain();}
  unitAt(x,y){return this.unitHits.find(u=>Math.hypot(u.x-x,u.y-y)<22);}
  visible(p,margin=35){return p.x>-margin&&p.x<this.width+margin&&p.y>-margin&&p.y<this.height+margin;}
  label(text,x,y,size=12,color='#e6ebdf',align='left',priority=false){
   const c=this.ctx;c.font=`${size}px "Microsoft YaHei",sans-serif`;const w=c.measureText(String(text)).width,left=align==='center'?x-w/2:x;
   const box={x:left-3,y:y-size-3,w:w+6,h:size+6};
   if(!this.visible({x:left,y},10)||left<4||left+w>this.width-4)return false;
   if(!priority&&this.labels.some(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y))return false;
   this.labels.push(box);c.save();c.textAlign=align;c.lineWidth=4;c.strokeStyle='#122d38';c.strokeText(String(text),x,y);c.fillStyle=color;c.fillText(String(text),x,y);c.restore();return true;
  }
  rebuild(s){const im=this.tc.createImageData(F.W,F.H);for(const i of G.land){const hex=colors[s.owners[i]]||colors[0],n=parseInt(hex.slice(1),16);im.data[i*4]=n>>16;im.data[i*4+1]=(n>>8)&255;im.data[i*4+2]=n&255;im.data[i*4+3]=s.owners[i]===1?92:42;}this.tc.putImageData(im,0,0);this.lastTexture=s.time;}
  arrow(from,to,color,time){const c=this.ctx;if(Math.hypot(to.x-from.x,to.y-from.y)<18)return;c.strokeStyle=color;c.lineWidth=1.5;c.setLineDash([5,6]);c.lineDashOffset=-time*10;c.beginPath();c.moveTo(from.x,from.y);c.lineTo(to.x,to.y);c.stroke();c.setLineDash([]);const a=Math.atan2(to.y-from.y,to.x-from.x);c.fillStyle=color;c.beginPath();c.moveTo(to.x,to.y);c.lineTo(to.x-Math.cos(a-.5)*9,to.y-Math.sin(a-.5)*9);c.lineTo(to.x-Math.cos(a+.5)*9,to.y-Math.sin(a+.5)*9);c.fill();}
  draw(s,now){
   if(s.time-this.lastTexture>.22||this.lastTexture>s.time||this.lastTexture<0)this.rebuild(s);
   const c=this.ctx,t=this.transform;this.labels=[];this.unitHits=[];document.body.classList.toggle('world-view',this.zoom<2.5);this.visibleTowns.clear();this.visibleRegions.clear();
   c.setTransform(this.dpr,0,0,this.dpr,0,0);const ocean=c.createLinearGradient(0,0,this.width,this.height);ocean.addColorStop(0,'#10263e');ocean.addColorStop(.5,'#09192e');ocean.addColorStop(1,'#102a43');c.fillStyle=ocean;c.fillRect(0,0,this.width,this.height);c.strokeStyle='#91bedd09';c.lineWidth=.6;for(let x=0;x<this.width;x+=24){c.beginPath();c.moveTo(x,0);c.lineTo(x,this.height);c.stroke();}for(let y=0;y<this.height;y+=24){c.beginPath();c.moveTo(0,y);c.lineTo(this.width,y);c.stroke();}
   const ext=[this.worldPoint(0,0),this.worldPoint(this.width,this.height)];
   c.save();c.translate(t.x,t.y);c.scale(t.scale,t.scale);
   for(const sh of this.shapes){const b=sh.bounds;if(b.x1<ext[0].x||b.x0>ext[1].x||b.y1<ext[0].y||b.y0>ext[1].y)continue;c.fillStyle=sh.code==='TWN'?'#194562':['USA','JPN','KOR','PHL'].includes(sh.code)?'#18334e':'#142a42';c.strokeStyle='#87b6d560';c.lineWidth=.8/t.scale;c.fill(sh.path);c.stroke(sh.path);}
   c.save();c.clip(this.combatClip);c.imageSmoothingEnabled=false;const origin=G.fromGrid(0,0);c.drawImage(this.texture,origin.x,origin.y,F.W*G.data.grid.cell,F.H*G.data.grid.cell);c.restore();
   c.shadowColor='#6dcbea88';c.shadowBlur=7/t.scale;c.strokeStyle='#a0d6ed8a';c.lineWidth=1/t.scale;c.stroke(this.combatClip);c.shadowBlur=0;c.restore();
   this.graticule();this.layoutCountries();
   for(const r of F.regions){const p=this.regionScreen(r);if(!this.visible(p,0))continue;this.visibleRegions.add(r.id);const held=s.strategy?.partners[r.id];c.fillStyle=held?'#b1e8b8':'#a9c4cf';c.strokeStyle='#17313d';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,5,0,Math.PI*2);c.fill();c.stroke();this.label(r.name,p.x,p.y-14,this.zoom<2?14:16,'#e5e9d7','center',true);this.label(held?'已合作':'合作港口',p.x,p.y+19,9,'#7098b6','center');}
   // Priority labels have screen-sized markers and never scale into unreadable text.
   const cityList=[...s.towns].sort((a,b)=>Number(b.country==='TWN')-Number(a.country==='TWN')||Number(b.goal)-Number(a.goal));
   for(const town of cityList){const p=this.townScreen(town);if(!this.visible(p,0))continue;const detail=this.zoom>=4;if(!detail&&!['taipei','beijing'].includes(town.id))continue;this.visibleTowns.add(town.id);const owner=s.owners[town.tile],r=town.goal?5:4;c.fillStyle=owner===1?'#ddf3c9':'#f5dab0';c.strokeStyle='#162e37';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();c.stroke();const name=this.zoom<3&&town.id==='taipei'?'台湾':town.name;this.label(name,p.x+10,p.y-4,this.zoom>=10?13:12,owner===1?'#c8ecfc':'#d5c2b2');if(town.goal){c.strokeStyle=owner===1?'#65c7da66':'#efb78a66';c.lineWidth=1;c.beginPath();c.moveTo(p.x,p.y-10);c.lineTo(p.x+10,p.y);c.lineTo(p.x,p.y+10);c.lineTo(p.x-10,p.y);c.closePath();c.stroke();}}
   if(this.zoom>=2.5)for(const town of G.data.cities){if(cityList.some(t=>t.id===town.id))continue;const p=this.townScreen(town);if(!this.visible(p,0))continue;c.fillStyle='#c0d1d2';c.beginPath();c.arc(p.x,p.y,3,0,Math.PI*2);c.fill();this.label(town.name,p.x+8,p.y-3,12,'#bdced1');}
   if(this.zoom>=6)for(const place of G.data.places){if(this.zoom<10&&place.population<1000000)continue;const p=this.townScreen(place);if(!this.visible(p,0))continue;c.fillStyle='#97b4b4';c.beginPath();c.arc(p.x,p.y,2.5,0,Math.PI*2);c.fill();this.label(place.name,p.x+7,p.y-3,11,'#c4d4cf');}
   for(const flash of s.flashes){const p=F.xy(flash.tile),q=this.screen(p.x,p.y);if(!this.visible(q))continue;c.fillStyle=`rgba(230,242,180,${Math.max(0,1-(s.time-flash.t)/1.4)*.45})`;c.fillRect(q.x,q.y,G.data.grid.cell*t.scale,G.data.grid.cell*t.scale);}
   for(const a of s.armies){if(a.faction!==1&&a.target!==1)continue;const p=F.xy(a.source),g=F.xy(a.goal),from=this.screen(p.x+.5,p.y+.5),to=this.screen(g.x+.5,g.y+.5);if(!this.visible(from))continue;this.arrow(from,to,a.faction===1?'#bce6c9b0':'#efa48eaf',s.time);c.fillStyle=a.faction===1?'#d0efc6':'#f5b092';c.strokeStyle='#143440';c.lineWidth=2;c.fillRect(from.x-8,from.y-6,16,12);c.strokeRect(from.x-8,from.y-6,16,12);c.beginPath();c.moveTo(from.x-6,from.y-4);c.lineTo(from.x+6,from.y+4);c.moveTo(from.x+6,from.y-4);c.lineTo(from.x-6,from.y+4);c.stroke();this.unitHits.push({x:from.x,y:from.y,tile:a.source});}
   for(const f of s.fleets){const k=Math.min(f.path.length-1,Math.floor(f.progress)),a=F.xy(f.path[k]),b=F.xy(f.path[Math.min(k+1,f.path.length-1)]),lerp=f.progress-k,p=this.screen(a.x+(b.x-a.x)*lerp+.5,a.y+(b.y-a.y)*lerp+.5),end=F.xy(f.target);if(!this.visible(p))continue;this.arrow(p,this.screen(end.x+.5,end.y+.5),f.faction===1?'#9be0d0b0':'#f4b399a0',s.time);c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x));c.fillStyle=f.faction===1?'#d1eee2':'#ffb79a';c.strokeStyle='#122d38';c.lineWidth=2;c.beginPath();c.moveTo(11,0);c.lineTo(-7,-6);c.lineTo(-4,0);c.lineTo(-7,6);c.closePath();c.fill();c.stroke();c.restore();this.unitHits.push({x:p.x,y:p.y,tile:f.path[k]});}
   if(!s.units&&this.zoom>=4){const home=this.townScreen(s.towns.find(t=>t.id==='taipei'));if(this.visible(home)){this.label('驻军 '+Math.floor(s.factions[1].troops).toLocaleString(),home.x-12,home.y+40,12,'#b8ead3','center');}}
   if(s.strategy?.warning){const w=s.strategy.warning,phase=Math.min(1,(s.time-w.startedAt)/(w.impactAt-w.startedAt)),a=this.townScreen(s.towns.find(t=>t.id==='fuzhou')),b=this.townScreen(s.towns.find(t=>t.id==='taipei'));c.strokeStyle='#f8ab8877';c.setLineDash([4,5]);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-90,b.x,b.y);c.stroke();c.setLineDash([]);c.fillStyle='#ffd3a8';c.beginPath();c.arc(a.x+(b.x-a.x)*phase,a.y+(b.y-a.y)*phase-Math.sin(phase*Math.PI)*45,4,0,Math.PI*2);c.fill();}
   if(this.hover!==null&&s.terrain[this.hover]){const p=F.xy(this.hover),q=this.screen(p.x,p.y);c.strokeStyle='#f2df9e';c.lineWidth=1;c.strokeRect(q.x,q.y,G.data.grid.cell*t.scale,G.data.grid.cell*t.scale);}
   this.drawUnits(s);this.drawNaval(s);this.drawMarkerLeaders();this.scaleBar();c.setTransform(1,0,0,1,0,0);
  }
  drawUnits(s){
   const c=this.ctx;
   for(const u of s.units||[]){const p=F.unitPosition(u),q=this.screen(p.x,p.y),chosen=u.id===this.selectedUnit;
    if(u.path.length){c.strokeStyle=chosen?'#c0f1ff':'#77adc923';c.lineWidth=chosen?2.5:1.2;c.setLineDash(chosen?[7,5]:[3,7]);c.lineDashOffset=-s.time*12;c.beginPath();c.moveTo(q.x,q.y);for(const tile of u.path){const v=F.xy(tile),r=this.screen(v.x+.5,v.y+.5);c.lineTo(r.x,r.y);}c.stroke();c.setLineDash([]);
     const town=s.towns.find(t=>t.tile===u.goal),g=town?this.townScreen(town):this.screen(F.xy(u.goal).x+.5,F.xy(u.goal).y+.5);c.strokeStyle=chosen?'#b9deff':'#8cbff070';c.beginPath();c.arc(g.x,g.y,chosen?16:12,0,Math.PI*2);c.stroke();
    }
    if(!this.visible(q))continue;c.fillStyle='#80baff';c.strokeStyle='#0c1928';c.lineWidth=2;c.beginPath();c.arc(q.x,q.y,chosen?7:5,0,Math.PI*2);c.fill();c.stroke();

   }
  }
  drawNaval(s){
   if(!s.naval)return;const c=this.ctx;
   for(const h of F.hostiles||[]){const p=this.hostileScreen(h);if(!this.visible(p,0))continue;c.fillStyle='#ff879c';c.beginPath();c.arc(p.x,p.y,6,0,Math.PI*2);c.fill();this.label(h.name,p.x,p.y-15,14,'#ffb5c2','center',true);this.label('大陆援军',p.x,p.y+23,10,'#e99baa','center',true);}
   for(const a of s.naval.aid){if(a.delivered||s.time<a.depart)continue;const h=F.hostiles.find(h=>h.id===a.key),town=s.towns.find(t=>t.id===a.city),from=this.townScreen(h),to=this.townScreen(town),n=(s.time-a.depart)/(a.arrive-a.depart),p={x:from.x+(to.x-from.x)*n,y:from.y+(to.y-from.y)*n};this.arrow(from,to,'#ff89986b',s.time);c.fillStyle='#ff879a';c.fillRect(p.x-5,p.y-5,10,10);this.label(h.name+'增援 '+Math.ceil(a.arrive-s.time)+'秒',p.x,p.y-13,11,'#ffc5cf','center',true);}
   for(const a of s.naval.ground){const pos=F.unitPosition(a),p=this.screen(pos.x,pos.y);if(!this.visible(p))continue;c.fillStyle='#fa8fa3';c.strokeStyle='#52293f';c.lineWidth=2;c.fillRect(p.x-9,p.y-6,18,12);c.strokeRect(p.x-9,p.y-6,18,12);if(this.zoom>=12)this.label(a.name,p.x,p.y-16,10,'#df8b9b','center');}
   for(const a of s.naval.ships){const pos=F.shipPosition(a),p=this.screen(pos.x,pos.y),next=F.xy(a.path[0]??a.tile),curr=F.xy(a.tile),selected=a.id===this.selectedUnit;if(a.path.length){const g=F.xy(a.goal);this.arrow(p,this.screen(g.x+.5,g.y+.5),a.faction===1?'#86e0ee80':'#ff849986',s.time);}if(!this.visible(p))continue;c.fillStyle=a.faction===1?'#61bddd':'#e87889';c.beginPath();c.arc(p.x,p.y,2,0,Math.PI*2);c.fill();if(selected&&F.shipTypes[a.kind].range){const range=F.shipTypes[a.kind].range*G.data.grid.cell*this.transform.scale;c.strokeStyle='#72c7e54a';c.setLineDash([3,5]);c.lineWidth=1;c.beginPath();c.arc(p.x,p.y,range,0,Math.PI*2);c.stroke();c.setLineDash([]);}}
   for(const m of s.naval.missiles){const a=F.xy(m.from),b=F.xy(m.to),from=this.screen(a.x+.5,a.y+.5),to=this.screen(b.x+.5,b.y+.5),n=Math.min(1,(s.time-m.launched)/4),p={x:from.x+(to.x-from.x)*n,y:from.y+(to.y-from.y)*n-Math.sin(n*Math.PI)*60};c.strokeStyle=m.faction===1?'#b9f8ee':'#ffacb7';c.lineWidth=2;c.beginPath();c.moveTo(from.x,from.y);c.quadraticCurveTo((from.x+p.x)/2,(from.y+p.y)/2-25,p.x,p.y);c.stroke();c.fillStyle='#fff4bf';c.beginPath();c.arc(p.x,p.y,4,0,Math.PI*2);c.fill();this.label('导弹',p.x+8,p.y-9,10,m.faction===1?'#c9fff0':'#ffb3c2');}
   for(const e of s.naval.bursts){const a=F.xy(e.tile),p=this.screen(a.x+.5,a.y+.5),n=(s.time-e.at)/2;c.globalAlpha=Math.max(0,1-n);c.strokeStyle=e.kind==='intercept'?'#84f0e5':'#ffb695';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,8+n*35,0,Math.PI*2);c.stroke();for(let i=0;i<6;i++){const angle=i*Math.PI/3;c.fillStyle=c.strokeStyle;c.fillRect(p.x+Math.cos(angle)*n*30-2,p.y+Math.sin(angle)*n*30-2,4,4);}c.globalAlpha=1;}
  }
  layoutCountries(){
   if(!root.FrontMarkerLayout)return;this.regionPins.clear();const anchors=[];
   for(const r of F.regions){const v=G.project(...partnerLocations[r.id]),p=this.point(v.x,v.y);if(this.visible(p,0))anchors.push({id:r.faction,key:r.id,...p});}
   for(const [i,h] of (F.hostiles||[]).entries()){const p=this.townScreen(h);if(this.visible(p,0))anchors.push({id:10+i,key:h.id,...p});}
   const out=root.FrontMarkerLayout.place(anchors,this.width,this.height,this.hudObstacles||[],null,84);
   for(const r of out)if(!r.hidden){this.regionPins.set(r.key,{x:r.x,y:r.y});if(Math.hypot(r.x-r.anchorX,r.y-r.anchorY)>8){const c=this.ctx;c.strokeStyle='#84badc55';c.lineWidth=1;c.beginPath();c.moveTo(r.anchorX,r.anchorY);c.lineTo(r.x,r.y);c.stroke();c.fillStyle='#8fbbd3';c.beginPath();c.arc(r.anchorX,r.anchorY,2,0,Math.PI*2);c.fill();}}
  }
  drawMarkerLeaders(){const c=this.ctx;for(const m of this.markerPositions||[]){if(m.hidden)continue;const d=Math.hypot(m.x-m.anchorX,m.y-m.anchorY);if(d<5)continue;c.strokeStyle=m.id===this.selectedUnit?'#c3edff99':'#74a5c066';c.lineWidth=1;c.beginPath();c.moveTo(m.anchorX,m.anchorY);c.lineTo(m.x,m.y);c.stroke();c.fillStyle='#71b6d2';c.beginPath();c.arc(m.anchorX,m.anchorY,2,0,Math.PI*2);c.fill();}}
  graticule(){const c=this.ctx,t=this.transform,step=this.zoom>=10?2:this.zoom>=3?5:20;c.strokeStyle='#bdd5dc12';c.lineWidth=1;for(let lon=70;lon<=300;lon+=step){const p=this.point(lon-70,0);if(p.x<0||p.x>this.width)continue;c.beginPath();c.moveTo(p.x,0);c.lineTo(p.x,this.height);c.stroke();if(p.x>250&&p.x<this.width-90)this.label((lon>180?360-lon:lon)+'°'+(lon>180?'W':'E'),p.x,22,9,'#6c949f','center');}for(let lat=-10;lat<72;lat+=step){const p=this.point(0,G.project(100,lat).y);if(p.y<40||p.y>this.height-50)continue;c.beginPath();c.moveTo(0,p.y);c.lineTo(this.width,p.y);c.stroke();this.label(Math.abs(lat)+'°'+(lat<0?'S':'N'),this.width-45,p.y-5,9,'#6c949f');}if(this.zoom<2){const p=G.project(185,15),q=this.point(p.x,p.y);this.label('太  平  洋',q.x,q.y,22,'#6897a6','center');}}
  scaleBar(){const c=this.ctx,mid=this.worldPoint(this.width/2,this.height/2),ll=G.unproject(mid.x,mid.y),pixelsPerKm=this.transform.scale/(111.32*Math.cos(ll.lat*Math.PI/180));const sizes=[10,20,50,100,200,500,1000,2000],km=sizes.findLast(n=>n*pixelsPerKm<110)||10,w=km*pixelsPerKm,x=this.width/2-45,y=this.height-20;c.strokeStyle='#aac4c9';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-4);c.lineTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w,y-4);c.stroke();this.label(km+' km',x,y-8,10,'#a8c5cd');const el=document.getElementById('mapScale');if(el)el.textContent=this.zoom.toFixed(1)+'× · '+(this.zoom>=10?'城市 / 部队':this.zoom>=3?'区域视图':'太平洋全图');}
 }
 root.FrontMap=FrontMap;
})(window);
