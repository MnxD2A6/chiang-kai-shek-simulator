const test=require('node:test'),assert=require('node:assert/strict'),F=require('../homefront-core.js');
function fresh(){const s=F.createStrategic(82);F.setPace(s,1);s.world.queue=[];s.world.nextStory=150;s.campaign.nextReaction=80;s.strategy.funds=4000;return s;}
function run(s,seconds){for(let t=0;t<seconds&&!s.result&&!s.world.active;t+=.1){s.world.nextStory=s.time+100;F.step(s,.1);}}
function project(s,key){assert.ok(s.world.preparation,'preparation agenda must exist');return s.world.preparation.projects[key];}
function offer(s,key,route){const p=project(s,key);p.phase='offered';s.world.queue=[];F.queueWorldEvent(s,'prep_'+key+'_offer',0);run(s,.2);assert.equal(s.world.active?.id,'prep_'+key+'_offer');const funds=s.strategy.funds,token=s.world.active.token;assert.ok(F.worldChoice(s,token,route).ok);return{funds,token};}
function deliver(s,key){const p=project(s,key);p.acceptedAt=0;s.time=Math.max(s.time,25);s.world.queue=[];s.world.active=null;s.paused=false;run(s,.2);assert.equal(s.world.active?.id,'prep_'+key+'_delivery');assert.ok(F.worldChoice(s,s.world.active.token,p.route).ok);}

test('real development unlocks a contextual agenda rather than awarding it at campaign start',()=>{
 const s=fresh();assert.ok(s.world.preparation);s.world.preparation.nextOffer=0;
 assert.equal(F.preparationSummary(s).filter(p=>p.phase==='offered').length,0);
 assert.ok(F.upgrade(s,'economy').ok);run(s,13);assert.equal(s.world.active?.id,'prep_industry_offer');
});
test('signing an export order spends funds once and does not grant its final income early',()=>{
 const s=fresh();s.strategy.levels.economy=1;const before=F.strategy.income(s),r=offer(s,'industry','exports');
 assert.equal(s.strategy.funds,r.funds-100);assert.equal(F.strategy.income(s),before);assert.equal(project(s,'industry').phase,'active');
 const saved=F.encode(s);assert.equal(F.worldChoice(s,r.token,'exports').ok,false);assert.equal(F.encode(s),saved);
});
test('a delivery waits for actual economic and cooperation milestones, not just its timer',()=>{
 const s=fresh();s.strategy.levels.economy=1;offer(s,'industry','exports');run(s,26);
 assert.equal(s.world.active,null);assert.equal(project(s,'industry').phase,'active');
 s.strategy.levels.economy=2;s.strategy.partners.japan=true;run(s,.2);assert.equal(s.world.active?.id,'prep_industry_delivery');
});
test('delivered exports increase recurring income and pause during a real shipping blockade',()=>{
 const s=fresh();s.strategy.levels.economy=2;s.strategy.partners.japan=true;offer(s,'industry','exports');
 const old=F.strategy.income(s);deliver(s,'industry');assert.equal(F.strategy.income(s),old+3);
 s.world.flags.duckBlockade=true;assert.equal(F.preparationBonuses(s).income,0);s.world.flags.duckBlockade=false;assert.equal(F.preparationBonuses(s).income,3);
});
test('a signed industry route cannot claim both mutually exclusive delivery rewards',()=>{
 const s=fresh();s.strategy.levels.economy=2;s.strategy.partners.japan=true;offer(s,'industry','exports');
 project(s,'industry').acceptedAt=0;s.time=25;run(s,.2);const token=s.world.active.token,money=s.strategy.funds;
 assert.equal(F.worldChoice(s,token,'resilience').ok,false);assert.equal(s.strategy.funds,money);assert.equal(project(s,'industry').phase,'review');
});
test('industrial resilience reduces actual physical missile damage independently of evacuation',()=>{
 const a=fresh(),b=fresh();for(const s of[a,b])s.strategy.levels.economy=2;
 offer(b,'industry','resilience');deliver(b,'industry');
 for(const s of[a,b]){s.world.queue=[];F.startWar(s);run(s,31);}
 assert.ok(b.homefront.lastStrike.industryDamage<a.homefront.lastStrike.industryDamage);
 assert.ok(b.homefront.lastStrike.buildingDamage<a.homefront.lastStrike.buildingDamage);
});
test('joint training requires US cooperation and improves real interception while retaining leakage',()=>{
 const s=fresh();s.strategy.levels.technology=2;s.strategy.partners.usa=true;offer(s,'defense','joint');deliver(s,'defense');
 F.buyAirDefense(s);run(s,25);F.startWar(s);run(s,36);
 assert.equal(s.homefront.lastStrike.intercepted,3);assert.equal(s.homefront.lastStrike.hits,3);assert.equal(s.homefront.airDefense.ammo,5);
 assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('joint supervision raises initial secret research exposure, whereas domestic repair does not',()=>{
 const a=fresh(),b=fresh();a.strategy.levels.technology=b.strategy.levels.technology=2;a.strategy.partners.usa=true;
 offer(a,'defense','joint');deliver(a,'defense');offer(b,'defense','domestic');deliver(b,'defense');
 F.startResearch(a);F.startResearch(b);assert.equal(a.world.nuclear.risk,8);assert.equal(b.world.nuclear.risk,0);
});
test('domestic repair teams restore a damaged factory sooner with the same real payment',()=>{
 const s=fresh();s.strategy.levels.technology=2;offer(s,'defense','domestic');deliver(s,'defense');
 const c=s.homefront.cities[0];c.industry=50;const money=s.strategy.funds;assert.ok(F.repairCity(s,c.id).ok);
 assert.equal(s.strategy.funds,money-160);assert.equal(c.repair.endsAt-s.time,8);run(s,8.2);assert.equal(c.industry,80);
});
test('Russian diplomatic settlement delays actual reinforcement departure and arrival',()=>{
 const s=fresh();s.strategy.levels.diplomacy=1;s.world.relations.russia=0;offer(s,'diplomacy','delay');deliver(s,'diplomacy');
 F.startWar(s);const a=s.naval.aid.find(a=>a.key==='russia');assert.ok(Math.abs(a.depart-s.strategy.warAt-48)<1e-8);assert.ok(Math.abs(a.arrive-s.strategy.warAt-96)<1e-8);
 assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('public warranty evidence weakens the actual Russian reinforcement payload',()=>{
 const s=fresh();s.strategy.levels.diplomacy=1;s.world.opinion=70;offer(s,'diplomacy','expose');deliver(s,'diplomacy');
 F.startWar(s);assert.equal(s.naval.aid.find(a=>a.key==='russia').force,1350);assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('war cancels unfinished agendas and their queued deliveries without blocking combat',()=>{
 const s=fresh();s.strategy.levels.economy=2;s.strategy.partners.japan=true;offer(s,'industry','exports');
 F.queueWorldEvent(s,'prep_industry_delivery',20);assert.ok(F.startWar(s).ok);
 assert.equal(project(s,'industry').phase,'cancelled');assert.equal(F.preparationBonuses(s).income,0);
 assert.ok(!s.world.queue.some(q=>q.id.startsWith('prep_')));run(s,13);assert.equal(s.homefront.invasion.phase,'assembling');
});
test('completed agendas are preserved with all prior save data and unfinished ones migrate safely',()=>{
 const s=fresh();s.strategy.levels.economy=2;s.strategy.partners.japan=true;offer(s,'industry','exports');deliver(s,'industry');
 const copy=F.decode(F.encode(s));assert.deepEqual(copy.world.preparation,s.world.preparation);assert.equal(F.preparationBonuses(copy).income,3);
 const old=JSON.parse(F.encode(s));old.version=10;delete old.world.preparation;
 assert.equal(F.decode(JSON.stringify(old)).world.preparation.projects.industry.phase,'locked');
});
test('forged preparation routes and premature completions are rejected at import',()=>{
 const s=fresh();assert.ok(s.world.preparation);
 for(const mutate of [v=>v.world.preparation.projects.industry.route='free_money',v=>v.world.preparation.projects.defense.phase='complete',v=>v.world.preparation.projects.diplomacy.acceptedAt=v.time+100]){
  const raw=JSON.parse(F.encode(s));mutate(raw);assert.throws(()=>F.decode(JSON.stringify(raw)));
 }
});
test('a cash-poor player can defer a contract and reopen it later without losing the route',()=>{
 const s=fresh();s.strategy.levels.economy=1;const p=project(s,'industry');p.phase='offered';s.world.queue=[];F.queueWorldEvent(s,'prep_industry_offer',0);run(s,.2);s.strategy.funds=0;
 assert.ok(F.worldChoice(s,s.world.active.token,'decline').ok);assert.equal(p.phase,'deferred');assert.equal(F.reopenPreparation(s,'industry').ok,false);
 s.strategy.funds=200;assert.ok(F.reopenPreparation(s,'industry').ok);assert.equal(s.world.active.id,'prep_industry_offer');
 assert.ok(F.worldChoice(s,s.world.active.token,'resilience').ok);assert.equal(p.route,'resilience');assert.equal(s.strategy.funds,100);
});
test('an automatic signing offer waits until the player can afford either proposed route',()=>{
 const s=fresh();s.strategy.levels.technology=1;s.strategy.funds=40;s.world.preparation.nextOffer=0;run(s,1);
 assert.equal(s.world.active,null);s.strategy.funds=120;run(s,.2);assert.equal(s.world.active.id,'prep_defense_offer');
});
test('joint calibration cannot intercept any missiles without a real deployed battery',()=>{
 const s=fresh();s.strategy.levels.technology=2;s.strategy.partners.usa=true;offer(s,'defense','joint');deliver(s,'defense');F.startWar(s);run(s,36);
 assert.equal(s.homefront.lastStrike.intercepted,0);assert.equal(s.homefront.lastStrike.hits,6);
});
test('joint benefits suspend with an embargo while previously earned project progress remains',()=>{
 const s=fresh();s.strategy.levels.technology=2;s.strategy.partners.usa=true;offer(s,'defense','joint');deliver(s,'defense');
 assert.equal(F.preparationBonuses(s).interceptBonus,1);s.world.sanctions=1;assert.equal(F.preparationBonuses(s).interceptBonus,0);
 assert.equal(project(s,'defense').phase,'complete');s.world.sanctions=0;assert.equal(F.preparationBonuses(s).interceptBonus,1);
});
test('a project with all milestones already met still needs its promised preparation time',()=>{
 const s=fresh();s.strategy.levels.economy=2;s.strategy.partners.japan=true;offer(s,'industry','exports');run(s,5);
 assert.equal(s.world.active,null);assert.equal(project(s,'industry').phase,'active');assert.equal(F.preparationBonuses(s).income,0);
});
test('an imported agenda cannot strand the player with a mismatched or missing decision event',()=>{
 const s=fresh();for(const mutate of [v=>v.world.preparation.projects.industry.phase='offered',v=>{v.world.active={id:'prep_industry_delivery',at:v.time,token:v.serial++};v.paused=true;}]){
  const raw=JSON.parse(F.encode(s));mutate(raw);assert.throws(()=>F.decode(JSON.stringify(raw)));
 }
});
