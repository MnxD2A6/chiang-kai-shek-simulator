(function(root){
 'use strict';
 const F=root.FrontCore,G=F.geography;
 const colors=['#acc298','#ff8744','#d0b897','#c8bc91','#b8c2a0'];
 const partnerLocations={usa:[-98,39],japan:[138,38],korea:[127.7,36.6],philippines:[123,12]};
 const countryNames={CHN:'大陆',TWN:'台湾',USA:'美国',JPN:'日本',KOR:'韩国',PRK:'朝鲜',RUS:'俄罗斯',CAN:'加拿大',MEX:'墨西哥',PHL:'菲律宾',VNM:'越南',AUS:'澳大利亚',IDN:'印度尼西亚',MNG:'蒙古'};
 class FrontMap{
  constructor(canvas){
   this.art={};for(const [key,asset] of Object.entries(root.FrontBattleArt||{})){const img=new Image();img.src=asset.src;this.art[key]={...asset,img};}this.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;this.resetBattleFX();this.missileBadge=new Image();this.missileBadge.src='./assets/ui-cel/missile-warning-badge.png';this.shipArt={};for(const kind of ['transport','destroyer','missile']){const img=new Image();img.src='./assets/ship-'+kind+'.svg';this.shipArt[kind]=img;}this.canvas=canvas;this.ctx=canvas.getContext('2d');this.texture=document.createElement('canvas');this.texture.width=F.W;this.texture.height=F.H;this.tc=this.texture.getContext('2d');this.regionPins=new Map();this.zoom=1;this.pan={x:0,y:0};this.lastTexture=-10;this.hover=null;this.rings=[];this.labels=[];this.unitHits=[];this.visibleTowns=new Set();this.visibleRegions=new Set();
   this.shapes=G.data.features.map(f=>{const path=new Path2D(),bounds={x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity};for(const ring of f.rings){ring.forEach(([lon,lat],i)=>{const p=G.project(lon,lat);bounds.x0=Math.min(bounds.x0,p.x);bounds.x1=Math.max(bounds.x1,p.x);bounds.y0=Math.min(bounds.y0,p.y);bounds.y1=Math.max(bounds.y1,p.y);if(i)path.lineTo(p.x,p.y);else path.moveTo(p.x,p.y);});path.closePath();}return {code:f.code,path,bounds};});
   this.landClip=new Path2D();for(const sh of this.shapes)this.landClip.addPath(sh.path);this.oceanClip=new Path2D();this.oceanClip.rect(0,0,G.worldWidth,G.worldHeight);this.oceanClip.addPath(this.landClip);this.combatClip=new Path2D();for(const s of this.shapes)if(['CHN','TWN'].includes(s.code))this.combatClip.addPath(s.path);
   this.resize();this.home();
  }
  get markerSize(){return this.width<700?52:60;}
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
  label(text,x,y,size=12,color='#244c50',align='left',priority=false){
   const c=this.ctx;c.font=`${size}px "Microsoft YaHei",sans-serif`;const w=c.measureText(String(text)).width,left=align==='center'?x-w/2:x;
   const box={x:left-3,y:y-size-3,w:w+6,h:size+6};
   if(!this.visible({x:left,y},10)||left<4||left+w>this.width-4)return false;
   if(!priority&&this.labels.some(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y))return false;
   this.labels.push(box);c.save();c.textAlign=align;c.lineWidth=3;c.strokeStyle='#f6f3dc';c.strokeText(String(text),x,y);c.fillStyle=color;c.fillText(String(text),x,y);c.restore();return true;
  }
  rebuild(s){const im=this.tc.createImageData(F.W,F.H);for(const i of G.land){const hex=colors[s.owners[i]]||colors[0],n=parseInt(hex.slice(1),16);im.data[i*4]=n>>16;im.data[i*4+1]=(n>>8)&255;im.data[i*4+2]=n&255;im.data[i*4+3]=s.owners[i]===1?(G.base[i]===1?10:80):18;}this.tc.putImageData(im,0,0);this.lastTexture=s.time;}
  arrow(from,to,color,time){const c=this.ctx;if(Math.hypot(to.x-from.x,to.y-from.y)<18)return;c.strokeStyle=color;c.lineWidth=1.5;c.setLineDash([5,6]);c.lineDashOffset=-time*10;c.beginPath();c.moveTo(from.x,from.y);c.lineTo(to.x,to.y);c.stroke();c.setLineDash([]);const a=Math.atan2(to.y-from.y,to.x-from.x);c.fillStyle=color;c.beginPath();c.moveTo(to.x,to.y);c.lineTo(to.x-Math.cos(a-.5)*9,to.y-Math.sin(a-.5)*9);c.lineTo(to.x-Math.cos(a+.5)*9,to.y-Math.sin(a+.5)*9);c.fill();}
  draw(s,now){
   if(s.time-this.lastTexture>.22||this.lastTexture>s.time||this.lastTexture<0)this.rebuild(s);
   const c=this.ctx,t=this.transform;this.labels=[];this.unitHits=[];document.body.classList.toggle('world-view',this.zoom<2.5);this.visibleTowns.clear();this.visibleRegions.clear();
   c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#80bdce';c.fillRect(0,0,this.width,this.height);c.strokeStyle='#e7f4ed0b';c.lineWidth=.6;for(let x=0;x<this.width;x+=24){c.beginPath();c.moveTo(x,0);c.lineTo(x,this.height);c.stroke();}for(let y=0;y<this.height;y+=24){c.beginPath();c.moveTo(0,y);c.lineTo(this.width,y);c.stroke();}
   const ext=[this.worldPoint(0,0),this.worldPoint(this.width,this.height)];
   c.save();c.translate(t.x,t.y);c.scale(t.scale,t.scale);
   for(const sh of this.shapes){const b=sh.bounds;if(b.x1<ext[0].x||b.x0>ext[1].x||b.y1<ext[0].y||b.y0>ext[1].y)continue;c.fillStyle=sh.code==='TWN'?'#d4dfa9':['USA','JPN','KOR','PHL'].includes(sh.code)?'#e4dfba':'#d6ddb2';c.strokeStyle='#f5efca';c.lineWidth=4/t.scale;c.fill(sh.path);c.stroke(sh.path);c.strokeStyle='#4d7c6c';c.lineWidth=.9/t.scale;c.stroke(sh.path);}
   c.save();c.clip(this.combatClip);c.imageSmoothingEnabled=false;const origin=G.fromGrid(0,0);c.drawImage(this.texture,origin.x,origin.y,F.W*G.data.grid.cell,F.H*G.data.grid.cell);c.restore();
   c.shadowBlur=0;c.strokeStyle='#487663b0';c.lineWidth=1.2/t.scale;c.stroke(this.combatClip);c.shadowBlur=0;c.restore();
   this.drawMapDecorations(s);this.graticule();this.layoutCountries();
   for(const r of F.regions){const p=this.regionScreen(r);if(!this.visible(p,0))continue;this.visibleRegions.add(r.id);const held=s.strategy?.partners[r.id];c.fillStyle=held?'#b1e8b8':'#a9c4cf';c.strokeStyle='#17313d';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,5,0,Math.PI*2);c.fill();c.stroke();this.label(r.name,p.x,p.y-14,this.zoom<2?14:16,'#244c50','center',true);this.label(held?'已合作':'合作港口',p.x,p.y+19,9,'#244c50','center');}
   // Priority labels have screen-sized markers and never scale into unreadable text.
   const cityList=[...s.towns].sort((a,b)=>Number(b.country==='TWN')-Number(a.country==='TWN')||Number(b.goal)-Number(a.goal));
   for(const town of cityList){const p=this.townScreen(town);if(!this.visible(p,0))continue;const detail=this.zoom>=4;if(!detail&&!['taipei','beijing'].includes(town.id))continue;this.visibleTowns.add(town.id);const owner=s.owners[town.tile],r=town.goal?5:4;c.fillStyle=owner===1?'#ddf3c9':'#f5dab0';c.strokeStyle='#162e37';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,3,0,Math.PI*2);c.fill();c.stroke();if(this.zoom>=4)this.sprite('map-landmarks-atlas',2,p.x,p.y-8,this.zoom>=10?29:22);const name=this.zoom<3&&town.id==='taipei'?'台湾':town.name;this.label(name,p.x+19,p.y-9,this.zoom>=10?13:12,owner===1?'#244c50':'#244c50');if(town.goal){c.strokeStyle=owner===1?'#65c7da66':'#efb78a66';c.lineWidth=1;c.beginPath();c.moveTo(p.x,p.y-10);c.lineTo(p.x+10,p.y);c.lineTo(p.x,p.y+10);c.lineTo(p.x-10,p.y);c.closePath();c.stroke();}}
   if(this.zoom>=2.5)for(const town of G.data.cities){if(cityList.some(t=>t.id===town.id))continue;const p=this.townScreen(town);if(!this.visible(p,0))continue;c.fillStyle='#c0d1d2';c.beginPath();c.arc(p.x,p.y,3,0,Math.PI*2);c.fill();this.label(town.name,p.x+8,p.y-3,12,'#244c50');}
   if(this.zoom>=6)for(const place of G.data.places){if(this.zoom<10&&place.population<1000000)continue;const p=this.townScreen(place);if(!this.visible(p,0))continue;c.fillStyle='#97b4b4';c.beginPath();c.arc(p.x,p.y,2.5,0,Math.PI*2);c.fill();this.label(place.name,p.x+7,p.y-3,11,'#244c50');}
   for(const a of s.armies){if(this.zoom<3)continue;if(a.faction!==1&&a.target!==1)continue;const p=F.xy(a.source),g=F.xy(a.goal),from=this.screen(p.x+.5,p.y+.5),to=this.screen(g.x+.5,g.y+.5);if(!this.visible(from))continue;this.arrow(from,to,a.faction===1?'#bce6c9b0':'#efa48eaf',s.time);this.sprite('infantry-march-atlas',Math.floor(s.time*7)%4,from.x,from.y,40,0,to.x<from.x);c.fillStyle='#ffcc24';c.fillRect(from.x-10,from.y+19,20,3);this.unitHits.push({x:from.x,y:from.y,tile:a.source});}
   for(const f of s.fleets){const k=Math.min(f.path.length-1,Math.floor(f.progress)),a=F.xy(f.path[k]),b=F.xy(f.path[Math.min(k+1,f.path.length-1)]),lerp=f.progress-k,p=this.screen(a.x+(b.x-a.x)*lerp+.5,a.y+(b.y-a.y)*lerp+.5),end=F.xy(f.target);if(!this.visible(p))continue;this.arrow(p,this.screen(end.x+.5,end.y+.5),f.faction===1?'#9be0d0b0':'#f4b399a0',s.time);c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x));c.fillStyle=f.faction===1?'#d1eee2':'#ffb79a';c.strokeStyle='#122d38';c.lineWidth=2;c.beginPath();c.moveTo(11,0);c.lineTo(-7,-6);c.lineTo(-4,0);c.lineTo(-7,6);c.closePath();c.fill();c.stroke();c.restore();this.unitHits.push({x:p.x,y:p.y,tile:f.path[k]});}
   if(!s.units&&this.zoom>=4){const home=this.townScreen(s.towns.find(t=>t.id==='taipei'));if(this.visible(home)){this.label('驻军 '+Math.floor(s.factions[1].troops).toLocaleString(),home.x-12,home.y+40,12,'#b8ead3','center');}}
   if(s.strategy?.warning){const w=s.strategy.warning,phase=Math.min(1,(s.time-w.startedAt)/(w.impactAt-w.startedAt)),a=this.townScreen(s.towns.find(t=>t.id==='fuzhou')),b=this.townScreen(s.towns.find(t=>t.id==='taipei'));c.strokeStyle='#f8ab8877';c.setLineDash([4,5]);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-90,b.x,b.y);c.stroke();c.setLineDash([]);c.fillStyle='#ffd3a8';c.beginPath();c.arc(a.x+(b.x-a.x)*phase,a.y+(b.y-a.y)*phase-Math.sin(phase*Math.PI)*45,4,0,Math.PI*2);c.fill();}
   if(this.hover!==null&&s.terrain[this.hover]){const p=F.xy(this.hover),q=this.screen(p.x,p.y);c.strokeStyle='#f2df9e';c.lineWidth=1;c.strokeRect(q.x,q.y,G.data.grid.cell*t.scale,G.data.grid.cell*t.scale);}
   this.observeCombat(s);this.drawUnits(s);this.drawNaval(s);this.drawOperation(s);this.drawMarkerLeaders(s);this.drawCombatFX(s);this.scaleBar();c.setTransform(1,0,0,1,0,0);
  }
  drawOperation(s){
   const a=s.operations?.active;if(!a||this.zoom<3)return;
   const convoy=s.naval.ships.find(v=>v.id===a.convoyId);if(!convoy)return;
   const p=this.markerPoint(convoy.id,convoy.tile),c=this.ctx;if(!this.visible(p,0))return;
   const box={x:p.x-50,y:p.y-53,w:100,h:20};
   if((this.hudObstacles||[]).some(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y))return;
   c.fillStyle='#111318';c.fillRect(box.x,box.y,box.w,box.h);c.fillStyle='#ffcc24';c.fillRect(box.x,box.y,3,box.h);c.font='bold 10px "Microsoft YaHei",sans-serif';c.textAlign='center';c.fillText('补给船 '+Math.ceil(convoy.hp)+' HP',p.x,box.y+14);c.textAlign='left';
  }
  drawUnits(s){
   const c=this.ctx;
   for(const u of s.units||[]){const p=F.unitPosition(u),q=this.screen(p.x,p.y),chosen=u.id===this.selectedUnit;
    if(u.path.length){c.strokeStyle=chosen?'#ff8b4b':'#e0d5bc33';c.lineWidth=chosen?2.5:1.2;c.setLineDash(chosen?[7,5]:[3,7]);c.lineDashOffset=-s.time*12;c.beginPath();c.moveTo(q.x,q.y);for(const tile of u.path){const v=F.xy(tile),r=this.screen(v.x+.5,v.y+.5);c.lineTo(r.x,r.y);}c.stroke();c.setLineDash([]);
     const town=s.towns.find(t=>t.tile===u.goal),g=town?this.townScreen(town):this.screen(F.xy(u.goal).x+.5,F.xy(u.goal).y+.5);c.strokeStyle=chosen?'#b9deff':'#8cbff070';c.beginPath();c.arc(g.x,g.y,chosen?16:12,0,Math.PI*2);c.stroke();
    }
    if(!this.visible(q))continue;

   }
  }
  drawNaval(s){
   if(!s.naval)return;const c=this.ctx;
   for(const h of F.hostiles||[]){const p=this.hostileScreen(h);if(!this.visible(p,0))continue;c.fillStyle='#ff879c';c.beginPath();c.arc(p.x,p.y,6,0,Math.PI*2);c.fill();this.label(h.name,p.x,p.y-15,14,'#244c50','center',true);this.label('大陆援军',p.x,p.y+23,10,'#244c50','center',true);}
   for(const a of s.naval.aid){if(a.delivered||s.time<a.depart)continue;const h=F.hostiles.find(h=>h.id===a.key),town=s.towns.find(t=>t.id===a.city),from=this.townScreen(h),to=this.townScreen(town),n=(s.time-a.depart)/(a.arrive-a.depart),p={x:from.x+(to.x-from.x)*n,y:from.y+(to.y-from.y)*n};this.arrow(from,to,'#ff89986b',s.time);this.sprite('naval-cel-atlas',0,p.x,p.y,Math.min(38,Math.max(12,this.zoom*8)),0,to.x<from.x);this.label(h.name+'增援 '+Math.ceil(a.arrive-s.time)+'秒',p.x,p.y-13,11,'#244c50','center',true);}
   for(const a of s.naval.ground){if(this.zoom<3)continue;const pos=F.unitPosition(a),p=this.screen(pos.x,pos.y);if(!this.visible(p))continue;this.sprite('infantry-march-atlas',a.path.length?Math.floor(s.time*7)%4:0,p.x,p.y,44,0,a.path.length&&F.xy(a.path[0]).x<F.xy(a.tile).x);c.fillStyle='#ffcc24';c.fillRect(p.x-12,p.y+21,24,3);if(this.zoom>=12)this.label(a.name,p.x,p.y-16,10,'#244c50','center');}
   for(const a of s.naval.ships){const pos=F.shipPosition(a),p=this.screen(pos.x,pos.y),next=F.xy(a.path[0]??a.tile),curr=F.xy(a.tile),selected=a.id===this.selectedUnit;if(a.path.length){const g=F.xy(a.goal);this.arrow(p,this.screen(g.x+.5,g.y+.5),a.faction===1?'#86e0ee80':'#ff849986',s.time);}if(!this.visible(p))continue;c.fillStyle=a.faction===1?'#61bddd':'#e87889';c.beginPath();c.arc(p.x,p.y,2,0,Math.PI*2);c.fill();if(selected&&F.shipTypes[a.kind].range){const range=F.shipTypes[a.kind].range*G.data.grid.cell*this.transform.scale;c.strokeStyle='#ff96584a';c.setLineDash([3,5]);c.lineWidth=1;c.beginPath();c.arc(p.x,p.y,range,0,Math.PI*2);c.stroke();c.setLineDash([]);}}
   for(const m of s.naval.missiles){const a=F.xy(m.from),b=F.xy(m.to),from=this.screen(a.x+.5,a.y+.5),to=this.screen(b.x+.5,b.y+.5),n=Math.min(1,(s.time-m.launched)/4),p={x:from.x+(to.x-from.x)*n,y:from.y+(to.y-from.y)*n-Math.sin(n*Math.PI)*60};this.drawMissileSmoke(from,to,n,s.time);c.strokeStyle=m.faction===1?'#ff8a3d':'#ffda4d';c.lineWidth=2;c.beginPath();c.moveTo(from.x,from.y);c.quadraticCurveTo((from.x+p.x)/2,(from.y+p.y)/2-25,p.x,p.y);c.stroke();this.sprite('weapon-fx-atlas',1,p.x,p.y,Math.min(39,Math.max(10,this.zoom*3)),Math.atan2(to.y-from.y-Math.cos(n*Math.PI)*40,to.x-from.x));if(this.zoom>=3&&this.missileBadge.complete&&this.missileBadge.naturalWidth)c.drawImage(this.missileBadge,p.x+38,p.y-34,35,35);this.label('导弹',p.x+79,p.y-10,9,'#fff4d1');}

  }
  layoutCountries(){
   if(!root.FrontMarkerLayout)return;this.regionPins.clear();const anchors=[];
   for(const r of F.regions){const v=G.project(...partnerLocations[r.id]),p=this.point(v.x,v.y);if(this.visible(p,0))anchors.push({id:r.faction,key:r.id,...p});}
   for(const [i,h] of (F.hostiles||[]).entries()){const p=this.townScreen(h);if(this.visible(p,0))anchors.push({id:10+i,key:h.id,...p});}
   const out=root.FrontMarkerLayout.place(anchors,this.width,this.height,this.hudObstacles||[],null,84);
   for(const r of out)if(!r.hidden){this.regionPins.set(r.key,{x:r.x,y:r.y});if(Math.hypot(r.x-r.anchorX,r.y-r.anchorY)>8){const c=this.ctx;c.strokeStyle='#84badc55';c.lineWidth=1;c.beginPath();c.moveTo(r.anchorX,r.anchorY);c.lineTo(r.x,r.y);c.stroke();c.fillStyle='#8fbbd3';c.beginPath();c.arc(r.anchorX,r.anchorY,2,0,Math.PI*2);c.fill();}}
  }
  resetBattleFX(){this.feedback=new root.FrontFeedback(F);this.gunShots=[];this.impacts=[];this.launchFlashes=[];}
  sprite(key,frame,x,y,width,angle=0,mirror=false,alpha=1){
   const art=this.art[key];if(!art||!art.img.complete||!art.img.naturalWidth)return false;
   const r=art.frames[frame%art.frames.length],height=width*r[3]/r[2],c=this.ctx;
   c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);if(mirror)c.scale(-1,1);c.imageSmoothingEnabled=true;c.drawImage(art.img,...r,-width/2,-height/2,width,height);c.restore();return true;
  }
  clipDecoration(path,rule='nonzero'){
   const c=this.ctx,t=this.transform;c.save();c.translate(t.x,t.y);c.scale(t.scale,t.scale);c.clip(path,rule);c.setTransform(this.dpr,0,0,this.dpr,0,0);
  }
  drawMapDecorations(s){
   const c=this.ctx,z=this.zoom;if(!this.art['map-landmarks-atlas'])return;
   this.clipDecoration(this.oceanClip,'evenodd');
   const step=z>=10?2.3:z>=3?7:23;
   for(let lon=72;lon<300;lon+=step)for(let lat=-10;lat<70;lat+=step){const p=this.point(...Object.values(G.project(lon+Math.sin(lat)*step*.2,lat)));if(this.visible(p,30))this.sprite('map-landmarks-atlas',4,p.x,p.y,Math.min(45,18+z),0,false,.19);}
   c.restore();
   if(z<2.4)return;this.clipDecoration(this.landClip);
   const mountains=[[121,23.7],[121.25,24.5],[120.8,22.8],[118,27.5],[116,29],[113,25],[111,30],[108,33],[105,37],[117,35],[114,38],[127.6,40],[128,37],[138.7,35.4],[137,36.6],[140,40],[142.5,43],[135,48],[-111,40],[-120,37],[-108,48],[-150,63]];
   const forests=[[120.9,23.1],[117,26],[115,27],[112,24],[113,28],[119,30],[110,35],[127,38],[139,37],[141,44],[133,46],[-118,45],[-83,35],[-95,46]];
   for(const [frame,points] of [[0,mountains],[1,forests]])for(const [lon,lat] of points){const q=G.project(lon,lat),p=this.point(q.x,q.y),size=Math.min(frame?39:51,Math.max(13,z*(frame?2.2:2.8)));if(this.visible(p,50)&&!G.towns.some(t=>{const town=this.townScreen(t);return Math.hypot(town.x-p.x,town.y-p.y)<39;}))this.sprite('map-landmarks-atlas',frame,p.x,p.y,size,0,false,.85);}
   c.restore();
  }
  observeCombat(s){
   if(!this.feedback.ready)for(const e of s.naval?.bursts||[])if(s.time-e.at<2)this.impacts.push({...e,water:!s.terrain[e.tile]&&e.kind!=='intercept'});
   const events=this.feedback.read(s);
   for(const e of events){
    if(e.type==='gun')this.gunShots.push(e);
    if(e.type==='launch')this.launchFlashes.push(e);
    if(e.type==='impact'||e.type==='airstrike')this.impacts.push({...e,kind:e.kind||'airstrike',water:!s.terrain[e.tile]&&e.kind!=='intercept',targetId:s.naval.ships.find(a=>a.tile===e.tile)?.id});
    if(this.onFeedback)this.onFeedback(e);
   }
   this.gunShots=this.gunShots.filter(e=>s.time-e.at<.6).slice(-24);this.impacts=this.impacts.filter(e=>s.time-e.at<3).slice(-36);this.launchFlashes=this.launchFlashes.filter(e=>s.time-e.at<.35).slice(-12);
  }
  markerPoint(id,tile){const m=(this.markerPositions||[]).find(m=>m.id===id&&!m.hidden);if(m)return m;const p=F.xy(tile);return this.screen(p.x+.5,p.y+.5);}
  drawMarkerLeaders(s){
   const c=this.ctx;for(const m of this.markerPositions||[]){if(m.hidden||this.zoom<3)continue;
    const a=m.a,d=Math.hypot(m.x-m.anchorX,m.y-m.anchorY),selected=m.id===this.selectedUnit;
    if(d>5){c.strokeStyle=selected?'#da6629aa':'#356c7080';c.lineWidth=1;c.beginPath();c.moveTo(m.anchorX,m.anchorY);c.lineTo(m.x,m.y+13);c.stroke();c.fillStyle='#d9602e';c.beginPath();c.arc(m.anchorX,m.anchorY,2,0,Math.PI*2);c.fill();}
    const moving=a.path.length&&a.status!=='waiting',sea=m.type==='ship'||!s.terrain[a.tile],enemy=a.faction!==1,flip=moving&&F.xy(a.path[0]).x<F.xy(a.tile).x;
    c.fillStyle=enemy?'#ffcb2470':selected?'#ff6b2470':'#214d5530';c.beginPath();c.ellipse(m.x,m.y+this.markerSize*.3,this.markerSize*.42,8,0,0,Math.PI*2);c.fill();
    if(selected||enemy){c.strokeStyle=enemy?'#997b10':'#d85d21';c.lineWidth=selected?2.5:1.5;c.setLineDash(selected?[9,4]:[]);c.beginPath();c.ellipse(m.x,m.y+this.markerSize*.3,this.markerSize*.45,10,0,0,Math.PI*2);c.stroke();c.setLineDash([]);}
    const bob=this.reducedMotion?0:sea?Math.sin(s.time*2+a.id)*1:0;
    if(sea){
     if(moving&&!this.reducedMotion){const next=F.xy(a.path[0]),curr=F.xy(a.tile),from=this.screen(curr.x+.5,curr.y+.5),to=this.screen(next.x+.5,next.y+.5),angle=Math.atan2(to.y-from.y,to.x-from.x);for(let k=1;k<=2;k++)this.sprite('weapon-fx-atlas',2,m.x-Math.cos(angle)*k*18,m.y+9-Math.sin(angle)*k*18,this.markerSize*(1.1+k*.12),angle,false,(.45/k)+Math.sin(s.time*7+a.id)*.06);}
     const shot=this.gunShots.find(e=>e.id===a.id&&s.time-e.at<.17),target=shot?this.markerPoint(shot.targetId,shot.to):null,angle=target?Math.atan2(target.y-m.y,target.x-m.x):0,recoil=shot&&!this.reducedMotion?2.6*(1-(s.time-shot.at)/.17):0;
     this.sprite('naval-cel-atlas',m.type==='army'?0:({transport:0,destroyer:1,missile:2}[a.kind]),m.x-Math.cos(angle)*recoil,m.y+bob-Math.sin(angle)*recoil,this.markerSize,0,flip);
    }
    else this.sprite('infantry-march-atlas',moving&&!this.reducedMotion?Math.floor(s.time*7+a.id)%4:0,m.x,m.y-1,this.markerSize*.88,0,flip);
   }
  }
  drawMissileSmoke(from,to,n,time){
   if(this.reducedMotion||this.zoom<3)return;const c=this.ctx;c.save();
   for(let k=10;k>0;k--){const v=n-k*.022;if(v<0)continue;const x=from.x+(to.x-from.x)*v,y=from.y+(to.y-from.y)*v-Math.sin(v*Math.PI)*60;this.sprite('combat-fx-atlas',5,x,y,10+k*1.8,0,false,.08+(11-k)*.018);}
   c.restore();
  }
  impactRing(x,y,age,heavy,water){
   if(this.reducedMotion)return;const c=this.ctx,life=heavy?.65:.35,n=age/life;if(n<0||n>1)return;
   c.save();c.globalAlpha=(1-n)*.8;c.strokeStyle=water?'#f5ffff':'#fff2c4';c.lineWidth=heavy?3:2;c.beginPath();c.ellipse(x,y+8,8+(heavy?62:30)*Math.sqrt(n),(water?.32:.7)*(8+(heavy?62:30)*Math.sqrt(n)),0,0,Math.PI*2);c.stroke();c.restore();
  }
  impactSparks(e,x,y,age,heavy){
   if(this.reducedMotion||age>.6)return;const c=this.ctx,count=heavy?11:5;c.save();c.globalAlpha=Math.max(0,1-age/.6);c.lineWidth=2;c.strokeStyle=e.water?'#f4ffff':'#ffb12f';
   for(let i=0;i<count;i++){const seed=Math.abs(Math.sin((e.tile+17)*(i+3))),angle=i/count*Math.PI*2+seed*.5,speed=(heavy?95:42)*(seed+.4),d=speed*age,fall=60*age*age,px=x+Math.cos(angle)*d,py=y+Math.sin(angle)*d+fall;c.beginPath();c.moveTo(px,py);c.lineTo(px-Math.cos(angle)*7,py-Math.sin(angle)*7);c.stroke();}c.restore();
  }
  drawCombatFX(s){
   const c=this.ctx;if(!s.naval||this.zoom<3)return;
   for(const e of this.gunShots){const age=s.time-e.at,from=this.markerPoint(e.id,e.from),to=this.markerPoint(e.targetId,e.to),angle=Math.atan2(to.y-from.y,to.x-from.x),n=Math.min(1,age/.22);
    if(age<.22&&!this.reducedMotion){const x=from.x+(to.x-from.x)*n,y=from.y+(to.y-from.y)*n;c.strokeStyle='#d05a24';c.lineWidth=4;c.beginPath();c.moveTo(from.x+(to.x-from.x)*Math.max(0,n-.17),from.y+(to.y-from.y)*Math.max(0,n-.17));c.lineTo(x,y);c.stroke();c.strokeStyle='#fff4c8';c.lineWidth=1.5;c.stroke();}
    if(age<.14)this.sprite('weapon-fx-atlas',0,from.x+Math.cos(angle)*23,from.y+Math.sin(angle)*23,38*(1-age/.2),angle);
   }
   for(const e of this.launchFlashes){const p=F.xy(e.from),q=this.screen(p.x+.5,p.y+.5);this.sprite('weapon-fx-atlas',0,q.x,q.y,28,Math.PI/4,false,Math.max(0,1-(s.time-e.at)/.35));}
   for(const u of s.units||[]){if(F.unitStatus(s,u)!=='交战中'||this.reducedMotion||s.time%0.7>.14)continue;const p=this.markerPoint(u.id,u.tile),q=F.xy(u.path[0]),to=this.screen(q.x+.5,q.y+.5);this.sprite('weapon-fx-atlas',0,p.x+22,p.y,24,Math.atan2(to.y-p.y,to.x-p.x));}
   for(const e of this.impacts){
    const age=s.time-e.at,heavy=e.kind!=='gun',duration=heavy?2.7:1.15;if(age<0||age>=duration)continue;
    const p=this.markerPoint(e.targetId,e.tile),size=heavy?(e.kind==='sink'?102:87):39,phase=this.reducedMotion?2:Math.min(5,Math.floor(age/(heavy?1.4:.8)*6));
    this.impactRing(p.x,p.y,age,heavy,e.water);this.impactSparks(e,p.x,p.y,age,heavy);
    if(e.water&&age<1.5)this.sprite('water-impact-atlas',this.reducedMotion?2:Math.min(5,Math.floor(age/1.5*6)),p.x,p.y-21,heavy?91:49,0,false,Math.min(1,(1.5-age)*2));
    const fade=Math.min(1,(duration-age)*2),drift=age>1?Math.min(19,(age-1)*13):0;
    this.sprite('combat-fx-atlas',phase,p.x,p.y-7-drift,size*(this.reducedMotion?1:.78+Math.min(.28,age*.5)),0,false,fade*(e.water&&e.kind==='gun'?.65:1));
    if(heavy&&age<.7)this.label(e.kind==='sink'?'击沉':e.kind==='intercept'?'拦截':'命中',p.x+23,p.y-27,11,'#b95025');
   }
   for(const e of s.flashes.slice(-8)){const age=s.time-e.t;if(age<0||age>.6||this.zoom<6)continue;const p=F.xy(e.tile),q=this.screen(p.x+.5,p.y+.5);this.sprite('combat-fx-atlas',this.reducedMotion?1:Math.min(3,Math.floor(age/.6*4)),q.x,q.y,23,0,false,.7);}
  }
  graticule(){const c=this.ctx,t=this.transform,step=this.zoom>=10?2:this.zoom>=3?5:20;c.strokeStyle='#39788825';c.lineWidth=1;for(let lon=70;lon<=300;lon+=step){const p=this.point(lon-70,0);if(p.x<0||p.x>this.width)continue;c.beginPath();c.moveTo(p.x,0);c.lineTo(p.x,this.height);c.stroke();if(p.x>250&&p.x<this.width-90)this.label((lon>180?360-lon:lon)+'°'+(lon>180?'W':'E'),p.x,22,9,'#244c50','center');}for(let lat=-10;lat<72;lat+=step){const p=this.point(0,G.project(100,lat).y);if(p.y<40||p.y>this.height-50)continue;c.beginPath();c.moveTo(0,p.y);c.lineTo(this.width,p.y);c.stroke();this.label(Math.abs(lat)+'°'+(lat<0?'S':'N'),this.width-45,p.y-5,9,'#244c50');}if(this.zoom<2){const p=G.project(185,15),q=this.point(p.x,p.y);this.label('太  平  洋',q.x,q.y,22,'#244c50','center');}}
  scaleBar(){const c=this.ctx,mid=this.worldPoint(this.width/2,this.height/2),ll=G.unproject(mid.x,mid.y),pixelsPerKm=this.transform.scale/(111.32*Math.cos(ll.lat*Math.PI/180));const sizes=[10,20,50,100,200,500,1000,2000],km=sizes.findLast(n=>n*pixelsPerKm<110)||10,w=km*pixelsPerKm,x=this.width/2-45,y=this.height-20;c.strokeStyle='#aac4c9';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-4);c.lineTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w,y-4);c.stroke();this.label(km+' km',x,y-8,10,'#244c50');const el=document.getElementById('mapScale');if(el)el.textContent=this.zoom.toFixed(1)+'× · '+(this.zoom>=10?'城市 / 部队':this.zoom>=3?'区域视图':'太平洋全图');}
 }
 root.FrontMap=FrontMap;
})(window);
