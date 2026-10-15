const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../homefront-core.js');
function fresh(){
 const s=F.createStrategic(41);F.setPace(s,1);F.startWar(s);
 s.world.queue=[];s.world.nextStory=150;s.campaign.nextReaction=80;
 for(const u of s.units)u.force=5000;
 for(const t of s.towns.filter(t=>t.goal)){F.claim(s,t.tile,1);s.units.push({id:s.serial++,faction:1,name:'守军',force:3000,tile:t.tile,goal:t.tile,path:[],progress:0,status:'guard'});}
 return s;
}
function tick(s,seconds=.2){for(let t=0;t<seconds&&!s.result;t+=.1){s.world.queue=[];s.world.nextStory=s.time+100;F.step(s,.1);}}
function ready(){const s=fresh();s.homefront.salvos=2;Object.assign(s.homefront.invasion,{wave:2,repelled:2,nextAt:80});s.homefront.victoryHold=30;return s;}

test('owning three cities for a week cannot skip the second missile or invasion wave',()=>{
 const s=fresh();s.homefront.invasion.nextAt=1000;tick(s,31);
 assert.equal(s.result,null);assert.equal(s.homefront.victoryHold,30);
});
test('the second airstrike alone cannot replace defeating the second invasion',()=>{
 const s=ready();s.homefront.invasion.repelled=1;tick(s);assert.equal(s.result,null);
});
test('two repelled invasions alone cannot skip the second city airstrike',()=>{
 const s=ready();s.homefront.salvos=1;tick(s);assert.equal(s.result,null);
});
test('victory waits for an already announced airstrike even after the required two waves',()=>{
 const s=ready();s.strategy.warning={startedAt:0,impactAt:12,sheltered:false};tick(s);assert.equal(s.result,null);
});
test('victory waits for an assembling invasion even after two previous invasions',()=>{
 const s=ready();Object.assign(s.homefront.invasion,{phase:'assembling',target:'taipei',launchAt:18,nextAt:null});
 tick(s);assert.equal(s.result,null);
});
test('a surviving landed enemy blocks victory regardless of the invasion label',()=>{
 const s=ready(),t=s.towns.find(t=>t.id==='taipei');
 s.naval.ground.push({id:s.serial++,key:'china',mission:'taiwan',name:'登陆纵队',tile:t.tile,goal:t.tile,force:2000,path:[],progress:0,nextOrder:0});
 tick(s);assert.equal(s.result,null);
});
test('two resolved waves and a week of holding objectives allow a military victory',()=>{
 const s=ready();tick(s);assert.equal(s.result,'victory');
 assert.equal(F.decode(F.encode(s)).result,'victory');
});
test('losing a target city resets the hold and prevents victory after the waves',()=>{
 const s=ready();F.claim(s,s.towns.find(t=>t.id==='nanjing').tile,3);tick(s);
 assert.equal(s.result,null);assert.equal(s.homefront.victoryHold,0);
});
test('two actual transport sorties are counted only after their payloads are defeated',()=>{
 const s=fresh();for(const u of s.units)u.force=5000;
 const sorties=new Set();
 for(let n=0;n<1800&&!s.result;n++){
  const i=s.homefront.invasion;
  if(i.phase==='sailing'){
   sorties.add(i.wave);assert.ok((i.repelled||0)<sorties.size);
   for(const p of i.payloads){const ship=s.naval.ships.find(a=>a.id===p.shipId);if(ship)ship.hp=0;}
  }
  tick(s,.1);
 }
 assert.ok(sorties.size>=2,'two fleets must really have sailed');
 assert.equal(s.homefront.invasion.repelled,2);assert.ok(s.homefront.salvos>=2);
 assert.equal(s.result,'victory');assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('a cancelled sortie does not count as a repelled landing',()=>{
 const s=fresh();for(let p=0;p<F.N;p++)if(s.owners[p]>=2&&s.owners[p]<=4)F.claim(s,p,1);
 Object.assign(s.homefront.invasion,{phase:'assembling',target:'taipei',wave:1,launchAt:0,nextAt:null});
 tick(s,.1);assert.equal(s.homefront.invasion.repelled,0);assert.equal(s.result,null);
});
test('new saves preserve defensive victories and reject impossible counters',()=>{
 const s=ready();assert.equal(JSON.parse(F.encode(s)).version,10);
 assert.equal(F.decode(F.encode(s)).homefront.invasion.repelled,2);
 for(const n of [-1,1.5,10001]){const raw=JSON.parse(F.encode(s));raw.homefront.invasion.repelled=n;assert.throws(()=>F.decode(JSON.stringify(raw)));}
});
test('a v9 save resumes conservatively without inventing completed invasion victories',()=>{
 const s=fresh(),raw=JSON.parse(F.encode(s));raw.version=9;delete raw.homefront.invasion.repelled;
 const restored=F.decode(JSON.stringify(raw));assert.equal(restored.homefront.invasion.repelled,0);
 assert.equal(restored.homefront.victoryHold,0);assert.equal(restored.result,null);
});
test('taking the named ports does not silently cancel the follow-up fleet while other coast remains',()=>{
 const s=fresh();F.claim(s,s.towns.find(t=>t.id==='shanghai').tile,1);
 Object.assign(s.homefront.invasion,{phase:'assembling',target:'taipei',wave:1,launchAt:0,nextAt:null});
 tick(s,.1);assert.equal(s.homefront.invasion.phase,'sailing');assert.equal(s.homefront.invasion.payloads.length,2);
 assert.equal(s.homefront.invasion.repelled,0);assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('an unfinished landing is not overwritten by a new announcement and completion counts once',()=>{
 const s=fresh(),t=s.towns.find(t=>t.id==='taipei');
 Object.assign(s.homefront.invasion,{phase:'landed',target:'taipei',wave:1,nextAt:0});
 s.naval.ground.push({id:s.serial++,key:'china',mission:'taiwan',name:'登陆纵队',tile:t.tile,goal:t.tile,force:2000,path:[],progress:0,nextOrder:0});
 tick(s,1);assert.equal(s.homefront.invasion.phase,'landed');assert.equal(s.homefront.invasion.wave,1);assert.equal(s.homefront.invasion.repelled,0);
 s.naval.ground=s.naval.ground.filter(a=>a.mission!=='taiwan');tick(s,1);
 assert.equal(s.homefront.invasion.repelled,1);tick(s,1);assert.equal(s.homefront.invasion.repelled,1);
});
test('a pending third salvo resolves before the otherwise-ready campaign can end',()=>{
 const s=ready();s.strategy.warning={startedAt:0,impactAt:12,sheltered:true};tick(s,11);
 assert.equal(s.result,null);tick(s,1.2);assert.equal(s.homefront.salvos,3);assert.equal(s.result,'victory');
 assert.equal(s.strategy.warning,null);
});
