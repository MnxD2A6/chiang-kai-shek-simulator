const test=require('node:test'),assert=require('node:assert/strict'),F=require('../geo-core.js'),G=F.geography;
const run=(s,seconds)=>{for(let t=0;t<seconds&&!s.result;t+=.2)F.step(s,.2);};
test('Pacific projection preserves coordinates and correctly crosses the date line',()=>{
 for(const [lon,lat] of [[121.568333,25.035833],[139.749462,35.686963],[-118.231986,34.049219],[-157.858301,21.303429]]){const p=G.project(lon,lat),back=G.unproject(p.x,p.y);assert.ok(Math.abs(back.lon-lon)<1e-8);assert.ok(Math.abs(back.lat-lat)<1e-8);}
 assert.ok(G.project(-118,34).x>G.project(140,36).x);assert.ok(Math.abs(G.project(179,20).x-G.project(-179,20).x)<3);
 for(const f of G.data.features)for(const r of f.rings)for(let i=1;i<r.length;i++)assert.ok(Math.abs(r[i][0]-r[i-1][0])<80,'no date-line seam spanning the ocean');
});
test('Natural Earth vector coastlines retain major islands and accurately placed cities',()=>{
 for(const code of ['CHN','TWN','JPN','USA','KOR','PHL'])assert.ok(G.data.features.find(f=>f.code===code).rings.length);
 const taipei=G.towns.find(t=>t.id==='taipei'),fuzhou=G.towns.find(t=>t.id==='fuzhou');assert.ok(taipei.lon>121&&taipei.lon<122&&taipei.lat>25&&taipei.lat<26);assert.ok(fuzhou.lon<taipei.lon&&fuzhou.lat>taipei.lat);
 for(const t of G.towns){assert.ok(G.base[t.tile]>=0);const p=G.fromGrid(t.tile%G.W+.5,Math.floor(t.tile/G.W)+.5),city=G.project(t.lon,t.lat);assert.ok(Math.hypot(p.x-city.x,p.y-city.y)<.45,t.name+' snaps to nearby real land');}
 assert.equal(G.base.length,G.N);assert.ok(G.land.length>30000);assert.ok(G.base.filter(v=>v===1).length>70);
});
test('geographic landing follows sea tiles and produces actual territorial expansion',()=>{
 const s=F.createStrategic(22),goal=s.towns.find(t=>t.id==='fuzhou');assert.equal(F.command(s,goal.tile).ok,false);F.startWar(s);assert.equal(F.command(s,goal.tile).ok,true);const fleet=s.fleets[0];assert.ok(fleet.path.every(i=>!s.terrain[i]));assert.equal(fleet.goal,goal.tile);while(s.fleets.length)F.step(s,.2);run(s,.4);assert.ok(F.mainlandCount(s,1)>0);assert.ok(s.armies.some(a=>a.faction===1));assert.ok(F.deployed(s,1)>0);
 const restored=F.decode(F.encode(s));assert.deepEqual(restored.owners,s.owners);assert.equal(restored.armies.length,s.armies.length);assert.equal(restored.strategy.phase,'war');
});
test('v3 saves remain separate and reject old map coordinates without changing old decoders',()=>{
 const legacy=require('../legacy/core.js'),old=legacy.createStrategic(3),raw=legacy.encode(old);assert.throws(()=>F.decode(raw));assert.ok(legacy.decode(raw).strategy);const s=F.createStrategic(3);assert.equal(JSON.parse(F.encode(s)).version,3);assert.equal(F.decode(F.encode(s)).version,3);s.paused=true;const before=F.encode(s);run(s,10);assert.equal(F.encode(s),before);
});
test('foreign land cannot be attacked or mistaken for navigable water',()=>{
 const s=F.createStrategic(7),p=G.toGrid(127.7,36.6),tile=G.nearestLand(p.x,p.y,9);assert.ok(tile>=0);assert.equal(s.terrain[tile],1);assert.equal(F.preview(s,tile).kind,'partner');F.startWar(s);const before=F.encode(s);assert.equal(F.command(s,tile).ok,false);assert.equal(F.encode(s),before);
 const corrupted=JSON.parse(before);corrupted.owners[tile]=1;assert.throws(()=>F.decode(JSON.stringify(corrupted)));
});
test('screen clicks stay aligned to geographic tiles after zoom, pan and viewport changes',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),context={window:{FrontCore:F}};vm.runInNewContext(fs.readFileSync(require.resolve('../geo-map-view.js'),'utf8'),context);
 for(const [width,height] of [[1280,644],[390,783]]){const view=Object.create(context.window.FrontMap.prototype);Object.assign(view,{width,height,fitScale:Math.min(width/G.worldWidth,height/G.worldHeight)*.96,zoom:1,pan:{x:0,y:0}});view.home();for(const zoom of [2,8.5,20,38]){view.setZoom(zoom,width*.63,height*.41);for(const town of G.towns){const tile=town.tile,p=view.screen(tile%G.W+.5,Math.floor(tile/G.W)+.5);assert.equal(view.tile(p.x,p.y),tile);}}const anchor=view.worldPoint(width*.4,height*.5);view.setZoom(12,width*.4,height*.5);const after=view.worldPoint(width*.4,height*.5);assert.ok(Math.hypot(anchor.x-after.x,anchor.y-after.y)<1e-8);}
});
test('prepared geographic campaign is winnable through normal commands',()=>{
 const s=F.createStrategic(40);for(const key of ['economy','economy','economy','technology','technology','technology','diplomacy']){while(!F.upgrade(s,key).ok)run(s,1);run(s,12.4);}F.startWar(s);F.command(s,s.towns.find(t=>t.id==='fuzhou').tile,.75);
 for(let n=0;n<4000&&!s.result;n++){if(n%20===0){if(s.strategy.warning)F.shelter(s);if(s.strategy.integrity<80)F.repair(s);const target=s.towns.find(t=>t.goal&&s.owners[t.tile]!==1&&F.preview(s,t.tile).kind!=='blocked');if(target)F.command(s,target.tile,.5);else{for(let f=2;f<=4;f++){const border=F.sharedBorder(s,1,f);if(border.length){F.command(s,border[0],.5);break;}}}}F.step(s,.2);}assert.equal(s.result,'victory');assert.ok(F.progress(s).ratio>=.2);assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
