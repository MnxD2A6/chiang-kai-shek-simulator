const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../homefront-core.js');
const Old=require('../world-dynamics.js');
function fresh(seed=21){const s=F.createStrategic(seed);s.world.queue=[];s.world.nextStory=150;s.world.nextBulletin=14;s.campaign.nextReaction=80;F.setPace(s,1);return s;}
function run(s,seconds){for(let i=0;i<Math.ceil(seconds*10)&&!s.result;i++){if(!s.world.active&&!s.paused){s.world.queue=[];s.world.nextStory=s.time+100;}F.step(s,.1);}}
function strike(s,shelter=false){F.startWar(s);run(s,19);assert.ok(s.strategy.warning);if(shelter)assert.ok(F.shelter(s).ok);run(s,12);}
test('evacuation saves people while buildings and factories take the same physical damage',()=>{
 const a=fresh(),b=fresh();strike(a);strike(b,true);assert.ok(a.homefront,'city damage model must exist');
 assert.deepEqual(a.homefront.cities.map(c=>[c.buildings,c.industry]),b.homefront.cities.map(c=>[c.buildings,c.industry]));
 assert.ok(b.homefront.cities.some(c=>c.industry<=45&&c.buildings<=70));
 assert.ok(b.homefront.support<a.homefront.support+30&&b.homefront.support>a.homefront.support);
 assert.ok(b.homefront.support<80);assert.ok(b.strategy.lastStrike.lost<a.strategy.lastStrike.lost);
});
test('a sheltered strike has an immediate bill and a persistent fall in actual tax income',()=>{
 const s=fresh();s.strategy.levels.economy=2;const income=F.strategy.income(s);strike(s,true);
 const report=s.homefront?.lastStrike;assert.ok(report,'strike must produce an itemized report');assert.ok(report.bill>=150);
 assert.ok(F.strategy.income(s)<income*.8);const money=s.strategy.funds;run(s,4);
 assert.ok(s.strategy.funds-money<income*4*.8);assert.ok(s.homefront.cities.some(c=>c.industry<100));
});
test('repairs cost money and take time, then restore production and some domestic support',()=>{
 const s=fresh();strike(s,true);assert.ok(s.homefront);s.strategy.funds=1000;
 const c=s.homefront.cities.find(c=>c.industry<100),old=c.industry,money=s.strategy.funds,support=s.homefront.support;
 assert.ok(F.repairCity(s,c.id).ok);assert.equal(c.industry,old);assert.equal(s.strategy.funds,money-160);
 assert.equal(F.repairCity(s,c.id).ok,false);s.paused=true;const frozen=F.encode(s);run(s,20);assert.equal(F.encode(s),frozen);
 s.paused=false;run(s,13);assert.ok(c.industry>old);assert.ok(c.buildings<=100);assert.ok(s.homefront.support>support);
});
test('repair does not rebuild a city occupied by mainland troops',()=>{
 const s=fresh();assert.ok(s.homefront);const c=s.homefront.cities[0];c.industry=30;F.claim(s,s.towns.find(t=>t.id===c.id).tile,3);s.strategy.funds=1000;
 assert.equal(F.repairCity(s,c.id).ok,false);assert.equal(s.strategy.funds,1000);
});
test('US air defence is an expensive timed delivery with finite interceptors and leakage',()=>{
 const a=fresh(),b=fresh();assert.equal(typeof F.buyAirDefense,'function');
 assert.equal(F.buyAirDefense(b).ok,false);b.strategy.funds=2000;assert.ok(F.buyAirDefense(b).ok);assert.equal(b.strategy.funds,1100);
 assert.equal(b.homefront.airDefense.batteries,0);assert.equal(F.buyAirDefense(b).ok,false);run(b,25);
 assert.equal(b.homefront.airDefense.batteries,1);const ammo=b.homefront.airDefense.ammo;strike(a,true);strike(b,true);
 assert.ok(b.homefront.lastStrike.intercepted>0);assert.ok(b.homefront.lastStrike.hits>0);assert.ok(b.homefront.airDefense.ammo<ammo);
 assert.ok(b.strategy.integrity>a.strategy.integrity);assert.ok(b.homefront.lastStrike.industryDamage<a.homefront.lastStrike.industryDamage);
});
test('air defence cannot fire with an empty magazine and a reload has a real cost',()=>{
 const s=fresh();assert.equal(typeof F.buyAirDefense,'function');s.strategy.funds=2000;F.buyAirDefense(s);run(s,25);s.homefront.airDefense.ammo=0;
 strike(s,true);assert.equal(s.homefront.lastStrike.intercepted,0);const funds=s.strategy.funds;assert.ok(F.reloadAirDefense(s).ok);assert.equal(s.strategy.funds,funds-160);assert.equal(s.homefront.airDefense.ammo,4);
});
test('US refuses new arms contracts under an embargo and pending delivery waits for permission',()=>{
 const s=fresh();assert.equal(typeof F.buyAirDefense,'function');s.strategy.funds=2000;s.world.sanctions=2;
 assert.equal(F.buyAirDefense(s).ok,false);s.world.sanctions=0;F.buyAirDefense(s);s.world.relations.usa=-40;run(s,25);
 assert.equal(s.homefront.airDefense.batteries,0);assert.ok(s.homefront.airDefense.order);s.world.relations.usa=35;run(s,.2);assert.equal(s.homefront.airDefense.batteries,1);
});
test('war announces a Taiwan invasion before actual transport and escort ships sail',()=>{
 const s=fresh();assert.ok(s.homefront);F.startWar(s);run(s,13);
 assert.equal(s.homefront.invasion.phase,'assembling');assert.ok(s.homefront.invasion.launchAt>s.time);assert.ok(s.world.news.some(n=>n.text.includes('收复台湾')));
 assert.equal(s.homefront.invasion.payloads.length,0);run(s,19);
 assert.equal(s.homefront.invasion.phase,'sailing');assert.equal(s.homefront.invasion.payloads.length,2);
 assert.ok(s.homefront.invasion.payloads.every(p=>s.naval.ships.some(a=>a.id===p.shipId&&a.kind==='transport'&&a.faction===3)));
 assert.ok(s.naval.ships.some(a=>a.name.includes('登陆护航')&&a.kind==='destroyer'));
 assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('destroying the invasion transports prevents those troops from spawning on Taiwan',()=>{
 const s=fresh();assert.ok(s.homefront);F.startWar(s);run(s,32);const ids=s.homefront.invasion.payloads.map(p=>p.shipId);
 for(const a of s.naval.ships)if(ids.includes(a.id))a.hp=0;run(s,.2);
 assert.equal(s.naval.ground.some(a=>a.mission==='taiwan'),false);assert.equal(s.homefront.invasion.phase,'repelled');
});
test('unopposed transports land real troops and seize a Taiwanese city',()=>{
 const s=fresh();assert.ok(s.homefront);F.startWar(s);run(s,32);
 const ids=new Set(s.homefront.invasion.payloads.map(p=>p.shipId));s.naval.ships=s.naval.ships.filter(a=>ids.has(a.id));s.units=[];
 run(s,38);assert.ok(s.naval.ground.some(a=>a.mission==='taiwan'));assert.ok(s.towns.some(t=>t.country==='TWN'&&s.owners[t.tile]===3));
 assert.ok(s.homefront.support<70);assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('military victory requires holding objectives through a counterattack and retaining home cities',()=>{
 const s=fresh();assert.ok(s.homefront);F.startWar(s);for(const t of s.towns.filter(t=>t.goal))F.claim(s,t.tile,1);
 run(s,1);assert.equal(s.result,null);assert.ok(s.homefront.victoryHold>0);
 const t=s.towns.find(t=>t.id==='kaohsiung');F.claim(s,t.tile,3);run(s,.2);assert.equal(s.homefront.victoryHold,0);assert.equal(s.result,null);
});
test('zero domestic support ends the game with a specific visible reason',()=>{
 const s=fresh();assert.ok(s.homefront);s.homefront.support=0;run(s,.2);assert.equal(s.result,'defeat');assert.equal(s.homefront.defeatReason,'support');
});
test('modern save reload preserves city damage, repair work, magazines and invasion routes',()=>{
 const s=fresh();assert.ok(s.homefront);s.strategy.funds=3000;F.buyAirDefense(s);run(s,25);strike(s,true);F.repair(s);run(s,2);
 const copy=F.decode(F.encode(s));assert.deepEqual(copy.homefront,s.homefront);run(s,2);run(copy,2);assert.deepEqual(copy.homefront,s.homefront);
});
test('v8 migration preserves existing damage instead of repairing cities for free',()=>{
 const s=Old.createStrategic(23);s.strategy.integrity=42;const copy=F.decode(Old.encode(s));assert.ok(copy.homefront);
 assert.equal(copy.strategy.integrity,42);assert.ok(copy.homefront.cities.every(c=>c.buildings===42&&c.industry<=42));assert.deepEqual(copy.units,s.units);
});
test('migrating an active v8 airstrike assigns a named city before the warning is shown',()=>{
 const s=Old.createStrategic(24);s.world.queue=[];s.world.nextStory=150;Old.setPace(s,1);Old.startWar(s);for(let i=0;i<190;i++)Old.step(s,.1);
 assert.ok(s.strategy.warning);const copy=F.decode(Old.encode(s));assert.ok(copy.homefront.cities.some(c=>c.id===copy.homefront.strikeTarget));
 run(copy,12);assert.ok(copy.homefront.lastStrike);assert.doesNotThrow(()=>F.decode(F.encode(copy)));
});
test('tampered city, interceptor, invasion and repair records fail import',()=>{
 const s=fresh();assert.ok(s.homefront);for(const mutate of [v=>v.homefront.support=-1,v=>v.homefront.cities[0].industry=999,v=>v.homefront.cities[0].buildings=0,v=>v.homefront.airDefense.ammo=100,v=>v.homefront.invasion.payloads=[{shipId:99999,force:900,target:'taipei'}],v=>v.homefront.cities[0].repair={endsAt:v.time+999}]){
  const v=JSON.parse(F.encode(s));mutate(v);assert.throws(()=>F.decode(JSON.stringify(v)));
 }
});
test('pre-positioned destroyers sink an invasion transport before its troops can land',()=>{
 const s=fresh();F.startWar(s);run(s,32);const transport=s.naval.ships.find(a=>a.id===s.homefront.invasion.payloads[0].shipId),guard=s.naval.ships.find(a=>a.faction===1&&a.kind==='destroyer');
 const choke=transport.path[5];guard.tile=choke;guard.path=[];guard.goal=guard.tile;
 const guards=[guard,F.spawnShip(s,'destroyer',1,choke,'拦截二号'),F.spawnShip(s,'destroyer',1,choke,'拦截三号')];
 for(const a of guards)assert.ok(F.followShip(s,a.id,transport.id).ok);run(s,4);
 assert.equal(s.naval.ships.some(a=>a.id===transport.id),false);assert.equal(s.naval.ground.some(a=>a.mission==='taiwan'),false);
});
test('holding all objectives for a full week keeps the campaign running for later counterattacks',()=>{
 const s=fresh();F.startWar(s);s.homefront.invasion.nextAt=80;s.campaign.nextReaction=80;
 for(const t of s.towns.filter(t=>t.goal)){F.claim(s,t.tile,1);s.units.push({id:s.serial++,faction:1,name:'目标驻军',force:1000,tile:t.tile,goal:t.tile,path:[],progress:0,status:'guard'});}run(s,29);assert.equal(s.result,null);run(s,1.2);assert.equal(s.result,null);assert.equal(s.homefront.victoryHold,30);
 assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('losing both home cities gives a recovery countdown and states the final defeat reason',()=>{
 const s=fresh();F.startWar(s);for(const t of s.towns.filter(t=>t.country==='TWN'))F.claim(s,t.tile,3);run(s,1);assert.equal(s.result,null);assert.ok(s.homefront.homeLost>0);
 run(s,15);assert.equal(s.result,'defeat');assert.equal(s.homefront.defeatReason,'cities');assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('city damage lowers domestic support without silently replacing international opinion',()=>{
 const s=fresh(),opinion=s.world.opinion;strike(s,true);assert.equal(s.world.opinion,opinion);assert.ok(s.homefront.support<80);
});
test('a selected hostile transport takes priority over a nearer escort when firing',()=>{
 const s=fresh();F.startWar(s);s.naval.ships=[];const p=F.seaTile(s,s.towns.find(t=>t.id==='taipei').tile),own=F.spawnShip(s,'destroyer',1,p,'拦截舰'),escort=F.spawnShip(s,'destroyer',3,p,'护航舰'),target=F.spawnShip(s,'transport',3,p,'目标运输舰');
 F.followShip(s,own.id,target.id);F.step(s,.1);assert.ok(target.hp<180);assert.equal(escort.hp,260);
});
test('topping up two missing interceptors charges for two rather than a full pack',()=>{
 const s=fresh();s.strategy.funds=2000;F.buyAirDefense(s);run(s,25);s.homefront.airDefense.ammo=6;const funds=s.strategy.funds;
 assert.ok(F.reloadAirDefense(s).ok);assert.equal(s.homefront.airDefense.ammo,8);assert.equal(s.strategy.funds,funds-80);
});
test('loss of a home garrison never leaves a dead unit in an automatic save',()=>{
 const s=fresh();F.startWar(s);let count=s.units.length;for(let i=0;i<850&&!s.result;i++){run(s,.1);assert.ok(s.units.every(u=>u.force>0));if(count!==s.units.length){count=s.units.length;assert.doesNotThrow(()=>F.decode(F.encode(s)));}}
 assert.ok(s.homefront.cities.some(c=>c.occupied)||s.units.length<2);
 assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('defeating the landed army clears the invasion alert and reports a defensive success',()=>{
 const s=fresh();for(const u of s.units)u.force=2000;F.startWar(s);run(s,83);
 assert.equal(s.naval.ground.some(a=>a.mission==='taiwan'),false);assert.equal(s.homefront.invasion.phase,'repelled');
});
