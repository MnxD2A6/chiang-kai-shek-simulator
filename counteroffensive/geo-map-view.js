(function(root){
 'use strict';
 const F=root.FrontCore,G=F.geography;
 const colors=['#657975','#3daf9e','#bb6864','#c59e60','#9b7dae'];
 const partnerLocations={usa:[-98,39],japan:[138,38],korea:[127.7,36.6],philippines:[123,12]};
 const countryNames={CHN:'大陆',TWN:'台湾',USA:'美国',JPN:'日本',KOR:'韩国',PRK:'朝鲜',RUS:'俄罗斯',CAN:'加拿大',MEX:'墨西哥',PHL:'菲律宾',VNM:'越南',AUS:'澳大利亚',IDN:'印度尼西亚',MNG:'蒙古'};
 class FrontMap{
  constructor(canvas){
   this.canvas=canvas;this.ctx=canvas.getContext('2d');this.texture=document.createElement('canvas');this.texture.width=F.W;this.texture.height=F.H;this.tc=this.texture.getContext('2d');this.zoom=1;this.pan={x:0,y:0};this.lastTexture=-10;this.hover=null;this.rings=[];this.labels=[];this.unitHits=[];this.visibleTowns=new Set();this.visibleRegions=new Set();
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
  regionScreen(region){const p=G.project(...partnerLocations[region.id]);return this.point(p.x,p.y);}
  tile(x,y){const p=this.world(x,y),cx=Math.floor(p.x),cy=Math.floor(p.y);return cx<0||cy<0||cx>=F.W||cy>=F.H?null:F.id(cx,cy);}
  center(p){this.pan={x:0,y:0};const s=this.point(p.x,p.y);this.pan.x=this.width/2-s.x;this.pan.y=this.height*.47-s.y;}
  constrain(){const t=this.transform,margin=70;this.pan.x+=Math.min(0,margin-t.x)+Math.max(0,this.width-margin-(t.x+G.worldWidth*t.scale));this.pan.y+=Math.min(0,margin-t.y)+Math.max(0,this.height-margin-(t.y+G.worldHeight*t.scale));}
  home(){this.zoom=this.width<700?20:8.5;this.center(G.project(120,25.5));this.constrain();}
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
  rebuild(s){const im=this.tc.createImageData(F.W,F.H);for(const i of G.land){const hex=colors[s.owners[i]]||colors[0],n=parseInt(hex.slice(1),16);im.data[i*4]=n>>16;im.data[i*4+1]=(n>>8)&255;im.data[i*4+2]=n&255;im.data[i*4+3]=210;}this.tc.putImageData(im,0,0);this.lastTexture=s.time;}
  arrow(from,to,color,time){const c=this.ctx;if(Math.hypot(to.x-from.x,to.y-from.y)<18)return;c.strokeStyle=color;c.lineWidth=1.5;c.setLineDash([5,6]);c.lineDashOffset=-time*10;c.beginPath();c.moveTo(from.x,from.y);c.lineTo(to.x,to.y);c.stroke();c.setLineDash([]);const a=Math.atan2(to.y-from.y,to.x-from.x);c.fillStyle=color;c.beginPath();c.moveTo(to.x,to.y);c.lineTo(to.x-Math.cos(a-.5)*9,to.y-Math.sin(a-.5)*9);c.lineTo(to.x-Math.cos(a+.5)*9,to.y-Math.sin(a+.5)*9);c.fill();}
  draw(s,now){
   if(s.time-this.lastTexture>.22||this.lastTexture>s.time||this.lastTexture<0)this.rebuild(s);
   const c=this.ctx,t=this.transform;this.labels=[];this.unitHits=[];document.body.classList.toggle('world-view',this.zoom<2.5);this.visibleTowns.clear();this.visibleRegions.clear();
   c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#102e3c';c.fillRect(0,0,this.width,this.height);
   const ext=[this.worldPoint(0,0),this.worldPoint(this.width,this.height)];
   c.save();c.translate(t.x,t.y);c.scale(t.scale,t.scale);
   for(const sh of this.shapes){const b=sh.bounds;if(b.x1<ext[0].x||b.x0>ext[1].x||b.y1<ext[0].y||b.y0>ext[1].y)continue;c.fillStyle=sh.code==='CHN'?'#917b67':sh.code==='TWN'?'#449e92':['USA','JPN','KOR','PHL'].includes(sh.code)?'#506e72':'#334e57';c.strokeStyle='#8ea8a06e';c.lineWidth=.65/t.scale;c.fill(sh.path);c.stroke(sh.path);}
   c.save();c.clip(this.combatClip);c.imageSmoothingEnabled=false;const origin=G.fromGrid(0,0);c.drawImage(this.texture,origin.x,origin.y,F.W*G.data.grid.cell,F.H*G.data.grid.cell);c.restore();
   c.strokeStyle='#cedbd057';c.lineWidth=.8/t.scale;c.stroke(this.combatClip);c.restore();
   this.graticule();
   for(const r of F.regions){const p=this.regionScreen(r);if(!this.visible(p,0))continue;this.visibleRegions.add(r.id);const held=s.strategy?.partners[r.id];c.fillStyle=held?'#b1e8b8':'#a9c4cf';c.strokeStyle='#17313d';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,6,0,Math.PI*2);c.fill();c.stroke();this.label(r.name,p.x,p.y-14,this.zoom<2?14:16,'#e5e9d7','center',true);this.label(held?'已合作':'洽谈合作',p.x,p.y+22,10,'#acc9bd','center');}
   // Priority labels have screen-sized markers and never scale into unreadable text.
   const cityList=[...s.towns].sort((a,b)=>Number(b.country==='TWN')-Number(a.country==='TWN')||Number(b.goal)-Number(a.goal));
   for(const town of cityList){const p=this.townScreen(town);if(!this.visible(p,0))continue;const detail=this.zoom>=4;if(!detail&&!['taipei','beijing'].includes(town.id))continue;this.visibleTowns.add(town.id);const owner=s.owners[town.tile],r=town.goal?5:4;c.fillStyle=owner===1?'#ddf3c9':'#f5dab0';c.strokeStyle='#162e37';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();c.stroke();this.label(this.zoom<3&&town.id==='taipei'?'台湾':town.name,p.x+10,p.y-5,this.zoom>=10?14:12,owner===1?'#dff5c8':'#fff0cf');if(this.zoom>=12)this.label(owner===1?'我方城市':town.goal?'目标城市':'城市',p.x+10,p.y+12,10,'#b4c9c8');}
   if(this.zoom>=2.5)for(const town of G.data.cities){if(cityList.some(t=>t.id===town.id))continue;const p=this.townScreen(town);if(!this.visible(p,0))continue;c.fillStyle='#c0d1d2';c.beginPath();c.arc(p.x,p.y,3,0,Math.PI*2);c.fill();this.label(town.name,p.x+8,p.y-3,12,'#bdced1');}
   if(this.zoom>=6)for(const place of G.data.places){if(this.zoom<10&&place.population<1000000)continue;const p=this.townScreen(place);if(!this.visible(p,0))continue;c.fillStyle='#97b4b4';c.beginPath();c.arc(p.x,p.y,2.5,0,Math.PI*2);c.fill();this.label(place.name,p.x+7,p.y-3,11,'#c4d4cf');}
   for(const flash of s.flashes){const p=F.xy(flash.tile),q=this.screen(p.x,p.y);if(!this.visible(q))continue;c.fillStyle=`rgba(230,242,180,${Math.max(0,1-(s.time-flash.t)/1.4)*.45})`;c.fillRect(q.x,q.y,G.data.grid.cell*t.scale,G.data.grid.cell*t.scale);}
   for(const a of s.armies){if(a.faction!==1&&a.target!==1)continue;const p=F.xy(a.source),g=F.xy(a.goal),from=this.screen(p.x+.5,p.y+.5),to=this.screen(g.x+.5,g.y+.5);if(!this.visible(from))continue;this.arrow(from,to,a.faction===1?'#bce6c9b0':'#efa48eaf',s.time);c.fillStyle=a.faction===1?'#d0efc6':'#f5b092';c.strokeStyle='#143440';c.lineWidth=2;c.fillRect(from.x-8,from.y-6,16,12);c.strokeRect(from.x-8,from.y-6,16,12);c.beginPath();c.moveTo(from.x-6,from.y-4);c.lineTo(from.x+6,from.y+4);c.moveTo(from.x+6,from.y-4);c.lineTo(from.x-6,from.y+4);c.stroke();if(this.zoom>=4)this.label((a.faction===1?'陆军 ':'敌军 ')+Math.ceil(a.force).toLocaleString(),from.x,from.y-14,12,a.faction===1?'#d9f0c8':'#ffbca4','center',true);this.unitHits.push({x:from.x,y:from.y,tile:a.source});}
   for(const f of s.fleets){const k=Math.min(f.path.length-1,Math.floor(f.progress)),a=F.xy(f.path[k]),b=F.xy(f.path[Math.min(k+1,f.path.length-1)]),lerp=f.progress-k,p=this.screen(a.x+(b.x-a.x)*lerp+.5,a.y+(b.y-a.y)*lerp+.5),end=F.xy(f.target);if(!this.visible(p))continue;this.arrow(p,this.screen(end.x+.5,end.y+.5),f.faction===1?'#9be0d0b0':'#f4b399a0',s.time);c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x));c.fillStyle=f.faction===1?'#d1eee2':'#ffb79a';c.strokeStyle='#122d38';c.lineWidth=2;c.beginPath();c.moveTo(11,0);c.lineTo(-7,-6);c.lineTo(-4,0);c.lineTo(-7,6);c.closePath();c.fill();c.stroke();c.restore();this.label('舰队 '+Math.ceil(f.force).toLocaleString(),p.x,p.y-15,12,'#cfebe0','center',true);this.unitHits.push({x:p.x,y:p.y,tile:f.path[k]});}
   if(this.zoom>=4){const home=this.townScreen(s.towns.find(t=>t.id==='taipei'));if(this.visible(home)){this.label('驻军 '+Math.floor(s.factions[1].troops).toLocaleString(),home.x-12,home.y+40,12,'#b8ead3','center');}}
   if(s.strategy?.warning){const w=s.strategy.warning,phase=Math.min(1,(s.time-w.startedAt)/(w.impactAt-w.startedAt)),a=this.townScreen(s.towns.find(t=>t.id==='fuzhou')),b=this.townScreen(s.towns.find(t=>t.id==='taipei'));c.strokeStyle='#f8ab8877';c.setLineDash([4,5]);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-90,b.x,b.y);c.stroke();c.setLineDash([]);c.fillStyle='#ffd3a8';c.beginPath();c.arc(a.x+(b.x-a.x)*phase,a.y+(b.y-a.y)*phase-Math.sin(phase*Math.PI)*45,4,0,Math.PI*2);c.fill();}
   if(this.hover!==null&&s.terrain[this.hover]){const p=F.xy(this.hover),q=this.screen(p.x,p.y);c.strokeStyle='#f2df9e';c.lineWidth=1;c.strokeRect(q.x,q.y,G.data.grid.cell*t.scale,G.data.grid.cell*t.scale);}
   this.scaleBar();c.setTransform(1,0,0,1,0,0);
  }
  graticule(){const c=this.ctx,t=this.transform,step=this.zoom>=10?2:this.zoom>=3?5:20;c.strokeStyle='#bdd5dc12';c.lineWidth=1;for(let lon=70;lon<=300;lon+=step){const p=this.point(lon-70,0);if(p.x<0||p.x>this.width)continue;c.beginPath();c.moveTo(p.x,0);c.lineTo(p.x,this.height);c.stroke();if(p.x>250&&p.x<this.width-90)this.label((lon>180?360-lon:lon)+'°'+(lon>180?'W':'E'),p.x,22,9,'#6c949f','center');}for(let lat=-10;lat<72;lat+=step){const p=this.point(0,G.project(100,lat).y);if(p.y<40||p.y>this.height-50)continue;c.beginPath();c.moveTo(0,p.y);c.lineTo(this.width,p.y);c.stroke();this.label(Math.abs(lat)+'°'+(lat<0?'S':'N'),this.width-45,p.y-5,9,'#6c949f');}if(this.zoom<2){const p=G.project(185,15),q=this.point(p.x,p.y);this.label('太  平  洋',q.x,q.y,22,'#6897a6','center');}}
  scaleBar(){const c=this.ctx,mid=this.worldPoint(this.width/2,this.height/2),ll=G.unproject(mid.x,mid.y),pixelsPerKm=this.transform.scale/(111.32*Math.cos(ll.lat*Math.PI/180));const sizes=[10,20,50,100,200,500,1000,2000],km=sizes.findLast(n=>n*pixelsPerKm<110)||10,w=km*pixelsPerKm,x=18,y=this.height-48;c.strokeStyle='#aac4c9';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-4);c.lineTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w,y-4);c.stroke();this.label(km+' km',x,y-8,10,'#a8c5cd');const el=document.getElementById('mapScale');if(el)el.textContent=this.zoom.toFixed(1)+'× · '+(this.zoom>=10?'城市 / 部队':this.zoom>=3?'区域视图':'太平洋全图');}
 }
 root.FrontMap=FrontMap;
})(window);
