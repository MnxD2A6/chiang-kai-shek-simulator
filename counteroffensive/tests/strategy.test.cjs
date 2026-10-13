const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../core.js');
function run(s,seconds){for(let i=0;i<seconds*10&&!s.result;i++)F.step(s,.1);}
function develop(s,key){while(!F.upgrade(s,key).ok){if(s.result)throw Error('ended');run(s,1);}run(s,13);}
test('Pacific map exposes four non-belligerent partners and cooperation changes the economy',()=>{
 const s=F.createStrategic(44);assert.ok(F.W>=260);assert.deepEqual(F.regions.map(r=>r.id),['usa','japan','korea','philippines']);
 const japan=F.regions.find(r=>r.id==='japan'),before=F.encode(s);
 assert.equal(F.command(s,F.id(180,50),.5).ok,false);assert.equal(F.encode(s),before);
 const income=F.strategy.income(s);assert.equal(F.partner(s,japan.id).ok,true);run(s,13);assert.equal(s.strategy.partners.japan,true);assert.ok(F.strategy.income(s)>income);
 const funds=s.strategy.funds;assert.equal(F.partner(s,japan.id).ok,false);assert.equal(s.strategy.funds,funds);
});
test('old 176-wide fleet saves migrate coordinates while new partner regions retain their identity',()=>{
 const s=F.create(23);F.command(s,F.id(123,82),.5);const v=JSON.parse(F.encode(s)),old=i=>Math.floor(i/F.W)*176+i%F.W;
 v.owners=[];for(let y=0;y<124;y++)for(let x=0;x<176;x++){const o=s.owners[F.id(x,y)];v.owners.push(o>4?-1:o);}v.troops=v.troops.slice(0,5);
 v.fleets=v.fleets.map(f=>({...f,source:old(f.source),target:old(f.target),goal:old(f.goal),path:f.path.map(old)}));
 const restored=F.decode(JSON.stringify(v));assert.deepEqual(restored.fleets,s.fleets);assert.equal(F.landCount(restored,1),F.landCount(s,1));assert.ok(F.landCount(restored,6)>0);
});
test('strategic opening has a stronger occupied mainland and requires deliberate declaration',()=>{
 const s=F.createStrategic(1);assert.equal(s.strategy.phase,'preparation');assert.equal(F.landCount(s,0),0);
 assert.ok(s.factions.slice(2).reduce((n,f)=>n+f.troops,0)>s.factions[1].troops*5);
 assert.equal(F.command(s,F.id(123,82),.5).ok,false);run(s,90);assert.equal(s.strategy.integrity,100);assert.equal(s.fleets.length,0);
 assert.equal(F.startWar(s).ok,true);assert.equal(F.command(s,F.id(123,82),.5).ok,true);
});
test('projects spend actual funds, complete once, and economy increases income and capacity',()=>{
 const s=F.createStrategic(2),money=s.strategy.funds,cap=F.capacity(s,1);
 assert.equal(F.upgrade(s,'economy').ok,true);assert.ok(s.strategy.funds<money);const after=s.strategy.funds;
 assert.equal(F.upgrade(s,'technology').ok,false);assert.equal(s.strategy.funds,after);
 run(s,13);assert.equal(s.strategy.levels.economy,1);assert.ok(F.capacity(s,1)>cap);const funds=s.strategy.funds;run(s,5);assert.ok(s.strategy.funds-funds>20);
});
test('pause freezes budgets, project completion, and incoming missiles',()=>{
 const s=F.createStrategic(3);F.upgrade(s,'technology');s.paused=true;const raw=F.encode(s);run(s,30);assert.equal(F.encode(s),raw);
 s.paused=false;run(s,13);F.startWar(s);run(s,19);assert.ok(s.strategy.warning);s.paused=true;const war=F.encode(s);run(s,30);assert.equal(F.encode(s),war);
});
test('unprepared attack causes real infrastructure and troop loss after a visible warning',()=>{
 const s=F.createStrategic(4);F.startWar(s);run(s,19);assert.ok(s.strategy.warning);const health=s.strategy.integrity,troops=s.factions[1].troops;
 run(s,12);assert.ok(s.strategy.integrity<health);assert.ok(s.factions[1].troops<troops);assert.ok(s.strategy.lastStrike);
});
test('technology, aid and emergency shelter reduce damage with real costs',()=>{
 const bare=F.createStrategic(5),ready=F.createStrategic(5);
 develop(ready,'technology');develop(ready,'technology');develop(ready,'diplomacy');
 F.startWar(bare);F.startWar(ready);run(bare,19);run(ready,19);
 const before=ready.strategy.funds;assert.equal(F.shelter(ready).ok,true);assert.ok(ready.strategy.funds<before);assert.equal(F.shelter(ready).ok,false);
 run(bare,12);run(ready,12);assert.ok(ready.strategy.integrity>bare.strategy.integrity+10);
});
test('repair restores damaged infrastructure, costs money and cannot exceed 100',()=>{
 const s=F.createStrategic(6);F.startWar(s);run(s,31);const health=s.strategy.integrity,funds=s.strategy.funds;
 assert.equal(F.repair(s).ok,true);assert.ok(s.strategy.integrity>health);assert.ok(s.strategy.funds<funds);
 run(s,30);F.repair(s);assert.ok(s.strategy.integrity<=100);
});
test('strategic saves retain projects and warnings while legacy games stay legacy',()=>{
 const s=F.createStrategic(7);F.upgrade(s,'technology');run(s,4);assert.deepEqual(F.decode(F.encode(s)).strategy,s.strategy);
 run(s,10);F.startWar(s);run(s,20);assert.deepEqual(F.decode(F.encode(s)).strategy,s.strategy);
 const bad=JSON.parse(F.encode(s));bad.strategy.levels.technology=99;assert.throws(()=>F.decode(JSON.stringify(bad)));
 const old=F.create(7);assert.equal(F.decode(F.encode(old)).strategy,undefined);
});
test('invalid and terminal development orders never mutate the campaign',()=>{
 const s=F.createStrategic(8);const before=F.encode(s);assert.equal(F.upgrade(s,'unknown').ok,false);assert.equal(F.shelter(s).ok,false);assert.equal(F.repair(s).ok,false);assert.equal(F.encode(s),before);
 s.result='defeat';const end=F.encode(s);F.upgrade(s,'economy');F.startWar(s);F.repair(s);F.shelter(s);run(s,5);assert.equal(F.encode(s),end);
});
test('early war collapses while two genuine development routes can win through normal commands',()=>{
 const routes=[[],['economy','economy','economy','technology','technology','technology','diplomacy'],['technology','technology','technology','diplomacy','diplomacy','diplomacy']];
 for(const route of routes){const s=F.createStrategic(31);for(const key of route)develop(s,key);F.startWar(s);F.command(s,F.id(123,82),.5);
  for(let i=0;i<3500&&!s.result;i++){
   if(route.length&&s.strategy.warning&&!s.strategy.warning.sheltered)F.shelter(s);
   if(route.length&&s.strategy.integrity<60)F.repair(s);
   if(i%80===0){const border=F.sharedBorder(s,1,3);if(border.length)F.command(s,border[0],.5);else if(!s.fleets.some(f=>f.faction===1))F.command(s,F.id(123,82),.5);}
   F.step(s,.1);if(i%200===0)assert.doesNotThrow(()=>F.decode(F.encode(s)));
  }
  assert.equal(s.result,route.length?'victory':'defeat');assert.doesNotThrow(()=>F.decode(F.encode(s)));if(route.length)assert.ok(F.progress(s).ratio>=.2);else assert.equal(s.strategy.integrity,0);
 }
});
test('country cooperation is retained through saves and gives distinct aid, research and warning effects',()=>{
 const s=F.createStrategic(42);run(s,40);const initial=F.capacity(s,1);F.partner(s,'usa');run(s,13);assert.equal(s.strategy.partners.usa,true);assert.ok(F.capacity(s,1)>initial);
 while(!F.partner(s,'korea').ok)run(s,1);run(s,13);assert.ok(F.strategy.protection(s)>0);
 while(!F.partner(s,'philippines').ok)run(s,1);run(s,13);F.startWar(s);run(s,19);assert.ok(Math.abs(s.strategy.warning.impactAt-s.strategy.warning.startedAt-16)<1e-6);
 assert.deepEqual(F.decode(F.encode(s)).strategy,s.strategy);
 const bad=JSON.parse(F.encode(s));bad.strategy.project={key:'partner:unknown',endsAt:s.time+4};assert.throws(()=>F.decode(JSON.stringify(bad)));
});
