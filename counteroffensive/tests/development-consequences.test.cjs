const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../homefront-core.js'),P=require('../preparation.js'),H=require('../homefront.js');
function fresh(){const s=F.createStrategic(82);F.setPace(s,1);s.world.queue=[];s.world.nextStory=150;s.campaign.nextReaction=80;s.strategy.funds=5000;return s;}
function event(s,id){s.world.queue=[];s.world.active=null;s.paused=false;s.world.nextStory=s.time+150;assert.ok(F.queueWorldEvent(s,id).ok);F.step(s,.1);assert.equal(s.world.active?.id,id);}
function choose(s,id){const r=F.worldChoice(s,s.world.active.token,id);assert.ok(r.ok,r.message);return r;}
function run(s,seconds){const until=s.time+seconds;while(s.time<until&&!s.world.active&&!s.result){s.world.nextStory=s.time+150;F.step(s,.1);}}
function complete(s,key,route){s.world.preparation.projects[key].phase='offered';event(s,'prep_'+key+'_offer');choose(s,route);s.world.preparation.projects[key].acceptedAt=0;s.time=Math.max(s.time,25);s.world.queue=[];s.world.active=null;s.paused=false;run(s,.2);assert.equal(s.world.active?.id,'prep_'+key+'_delivery');choose(s,route);}
function strike(s,sheltered=true){s.strategy.warning={startedAt:s.time,impactAt:s.time+12,sheltered};H.warn(s);H.strike(s,{W:F.W,deployed:F.deployed,event:()=>{}});s.strategy.warning=null;return s.homefront.lastStrike;}

test('logistics route requires a real third transport, then reduces actual replacement cost',()=>{
 const s=fresh();s.strategy.levels.economy=2;s.world.preparation.projects.industry={phase:'review',route:'logistics',acceptedAt:0};
 assert.equal(P.available(s,{project:'industry',stage:'complete',route:'logistics'}).ok,false);
 F.buildShip(s,'transport');s.world.preparation.projects.industry={phase:'locked',route:null,acceptedAt:null};complete(s,'industry','logistics');
 const money=s.strategy.funds;assert.ok(F.buildShip(s,'transport').ok);assert.equal(money-s.strategy.funds,70);assert.equal(F.preparationBonuses(s).income,0);assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('civil defence is a domestic alternative with cheaper evacuation and real personnel protection',()=>{
 const a=fresh(),b=fresh();b.strategy.levels.technology=2;complete(b,'defense','civil');a.strategy.levels.technology=2;
 for(const s of[a,b])s.strategy.warning={startedAt:s.time,impactAt:s.time+12,sheltered:false};
 const money=b.strategy.funds;assert.ok(F.shelter(b).ok);assert.equal(money-b.strategy.funds,30);F.shelter(a);
 const ar=strike(a),br=strike(b);assert.ok(br.lost<ar.lost);assert.ok(br.supportLoss<ar.supportLoss);assert.equal(br.buildingDamage,ar.buildingDamage);
});
test('regional medical route needs a genuine regional partnership and strengthens rebuilding support',()=>{
 const s=fresh();s.strategy.levels.diplomacy=2;s.world.preparation.projects.diplomacy={phase:'review',route:'regional',acceptedAt:0};
 assert.equal(P.available(s,{project:'diplomacy',stage:'complete',route:'regional'}).ok,false);
 s.strategy.partners.philippines=true;s.world.preparation.projects.diplomacy={phase:'locked',route:null,acceptedAt:null};complete(s,'diplomacy','regional');
 s.homefront.support=40;s.homefront.cities.find(c=>c.id==='taipei').industry=50;assert.ok(F.repairCity(s,'taipei').ok);run(s,12.2);assert.equal(s.homefront.support,48);
});
test('unlocked route offers can be opened directly instead of waiting for a random draw',()=>{
 const s=fresh();assert.equal(F.reopenPreparation(s,'industry').ok,false);s.strategy.levels.economy=1;
 assert.ok(F.reopenPreparation(s,'industry').ok);assert.equal(s.world.active.id,'prep_industry_offer');choose(s,'logistics');assert.equal(s.world.preparation.projects.industry.route,'logistics');
});
test('free cable and aurora paths no longer refund money that was never invested',()=>{
 const s=fresh();let delta=0;
 for(const [id,choice] of [['story_cable_start','reserve'],['story_cable_route','finish'],['story_cable_finish','return'],['story_aurora_start','wait'],['story_aurora_ground','quiet'],['story_aurora_finish','close']]){event(s,id);const before=s.strategy.funds;choose(s,choice);delta+=s.strategy.funds-before;}
 assert.equal(delta,0);
});
test('civilian disaster assistance protects two actual missile salvos without stopping physical damage',()=>{
 const s=fresh(),plain=fresh();for(const [id,c] of [['story_cable_start','repair'],['story_cable_repair','civil'],['story_cable_finish','meeting']]){event(s,id);choose(s,c);}
 const a=strike(plain),b=strike(s);assert.ok(b.lost<a.lost);assert.ok(b.supportLoss<a.supportLoss);assert.equal(b.industryDamage,a.industryDamage);strike(s);assert.equal(s.world.consequences.medical,0);assert.equal(strike(s).supportLoss,a.supportLoss);
});
test('insurance pays a bounded share of real emergency bills and does not prevent missile hits',()=>{
 const s=fresh();event(s,'story_insurance_start');choose(s,'audit');event(s,'story_insurance_audit');choose(s,'open');event(s,'story_insurance_finish');choose(s,'cover');
 assert.ok(F.startWar(s).ok);const r=strike(s,false);assert.equal(r.hits,6);assert.equal(r.bill,105);assert.equal(s.world.consequences.insurance,1);assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('port investment opens an alternate export route through a blockade, with a real expiry',()=>{
 const s=fresh();s.strategy.partners.japan=true;s.strategy.levels.economy=2;s.world.preparation.projects.industry={phase:'complete',route:'exports',acceptedAt:0};s.world.flags.duckBlockade=true;
 assert.equal(F.preparationBonuses(s).income,0);event(s,'story_port_start');choose(s,'mediate');event(s,'story_port_mediate');choose(s,'negotiate');event(s,'story_port_finish');choose(s,'exchange');
 assert.equal(F.preparationBonuses(s).income,3);const until=s.world.consequences.harbor.until;s.world.queue=[];s.world.active=null;s.paused=false;run(s,until-s.time+.2);assert.equal(F.preparationBonuses(s).income,0);assert.equal(s.world.active?.id,'consequence_harbor_renewal');
});
test('public scientific exchange accelerates a real technology project and can be declined without research',()=>{
 const s=fresh();event(s,'story_aurora_finish');choose(s,'research');assert.ok(F.upgrade(s,'technology').ok);assert.equal(s.strategy.project.endsAt-s.time,8);assert.equal(s.world.nuclear.status,'idle');
});
test('an ordinary cargo order pays only after actual delivery and claims cannot be replayed',()=>{
 const s=fresh();event(s,'story_panda_customs');const money=s.strategy.funds;choose(s,'order');assert.equal(s.strategy.funds,money-35);assert.equal(s.world.consequences.cargo.phase,'signed');
 event(s,'consequence_cargo_departure');choose(s,'charter');assert.equal(s.world.consequences.cargo.phase,'shipping');s.world.queue=[];run(s,16.2);assert.equal(s.world.active?.id,'consequence_cargo_success');
 const token=s.world.active.token,before=s.strategy.funds;choose(s,'claim');assert.equal(s.strategy.funds-before,180);assert.equal(F.worldChoice(s,token,'claim').ok,false);assert.equal(s.world.consequences.cargo.phase,'settled');assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('a cargo escort uses the real naval operation and a sunk convoy produces failure, not income',()=>{
 const s=fresh();event(s,'story_panda_customs');choose(s,'order');event(s,'consequence_cargo_departure');choose(s,'escort');
 assert.equal(s.operations.active.kind,'escort');const convoy=s.operations.active.convoyId;s.naval.ships=s.naval.ships.filter(a=>a.id!==convoy);s.world.queue=[];run(s,.2);
 assert.equal(s.operations.lastResult.outcome,'failure');assert.equal(s.world.active?.id,'consequence_cargo_failure');const before=s.strategy.funds;choose(s,'close');assert.equal(s.strategy.funds,before);assert.equal(s.world.consequences.cargo.phase,'cancelled');
});
test('changing to war cancels an unfinished civilian order and keeps earned protection',()=>{
 const s=fresh();event(s,'story_panda_customs');choose(s,'order');event(s,'story_cable_start');choose(s,'repair');event(s,'story_cable_finish');choose(s,'meeting');s.world.queue=[];assert.ok(F.startWar(s).ok);assert.equal(s.world.consequences.cargo.phase,'cancelled');assert.equal(s.world.consequences.medical,2);assert.ok(!s.world.queue.some(q=>q.id==='consequence_cargo_departure'));
});
test('old v11 campaigns migrate without retroactively awarding new commitments',()=>{
 const s=fresh(),raw=JSON.parse(F.encode(s));raw.version=11;delete raw.world.consequences;const loaded=F.decode(JSON.stringify(raw));assert.equal(loaded.world.consequences.cargo.phase,'idle');assert.equal(loaded.world.consequences.medical,0);assert.equal(loaded.units[0].force,s.units[0].force);
});
test('malformed consequence counts and premature delivery claims fail closed',()=>{
 const s=fresh();assert.ok(s.world.consequences);
 for(const mutate of [v=>v.world.consequences.medical=900,v=>v.world.consequences.harbor.until=v.time+1000,v=>v.world.consequences.cargo.phase='invented']){const raw=JSON.parse(F.encode(s));mutate(raw);assert.throws(()=>F.decode(JSON.stringify(raw)));}
 event(s,'consequence_cargo_success');const before=F.encode(s);assert.equal(F.worldChoice(s,s.world.active.token,'claim').ok,false);assert.equal(F.encode(s),before);choose(s,'close');
});
test('a forced intervention war also cancels an unfinished civilian cargo contract',()=>{
 const s=fresh();event(s,'story_panda_customs');choose(s,'order');event(s,'dawn_ultimatum');choose(s,'reject');s.world.queue=[];run(s,30.2);
 assert.equal(s.strategy.phase,'war');assert.equal(s.world.consequences.cargo.phase,'cancelled');
});
test('paid procurement paperwork cannot be sold after both allowed batteries are deployed',()=>{
 const s=fresh();s.homefront.airDefense.batteries=2;s.homefront.airDefense.ammo=16;event(s,'story_budget_start');choose(s,'audit');event(s,'story_budget_audit');choose(s,'publish');event(s,'story_budget_finish');const before=F.encode(s);
 assert.equal(F.worldChoice(s,s.world.active.token,'thanks').ok,false);assert.equal(F.encode(s),before);choose(s,'close');
});
test('scientific exchange cannot charge for accelerating a fully upgraded technology tree',()=>{
 const s=fresh();s.strategy.levels.technology=3;event(s,'story_aurora_finish');const before=F.encode(s);assert.equal(F.worldChoice(s,s.world.active.token,'research').ok,false);assert.equal(F.encode(s),before);choose(s,'close');
});
test('cargo escort delivery and logistics rewards follow actual naval victory, then save once',()=>{
 const s=fresh();s.strategy.levels.economy=2;F.buildShip(s,'transport');complete(s,'industry','logistics');event(s,'story_panda_customs');choose(s,'order');event(s,'consequence_cargo_departure');choose(s,'escort');
 const a=s.operations.active,guard=s.naval.ships.find(v=>v.faction===1&&v.kind==='destroyer');F.followShip(s,guard.id,a.convoyId);for(const id of a.enemyIds)assert.ok(F.missile(s,{shipId:id}).ok);s.world.queue=[];run(s,40);
 assert.equal(s.operations.lastResult.outcome,'success');assert.match(s.operations.lastResult.reward,/后勤额外 \+80/);assert.equal(s.world.active?.id,'consequence_cargo_success');choose(s,'claim');const restored=F.decode(F.encode(s));assert.equal(restored.world.consequences.cargo.phase,'settled');assert.equal(restored.operations.wins,1);
});
