const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const F=fs.existsSync(require.resolve('../civic-core.js').replace('civic-core','election-core'))?require('../election-core.js'):require('../civic-core.js');
const jump=(s,time)=>{s.time=time;s.world.nextStory=time+120;s.world.nextBulletin=time+8;s.campaign.nextReaction=time+60;s.civic.nextDebate=time+60;s.nextAI=time+18;s.nextNavy=time+100;s.naval.nextAmmo=time+45;};
const fresh=()=>{const s=F.createStrategic(2910);s.strategy.funds=5000;s.world.queue=[];for(const p of Object.values(s.world.preparation.projects))p.phase='declined';jump(s,0);return s;};
const run=(s,n)=>{for(let i=0;i<Math.ceil(n*10);i++)F.step(s,.1);};
const gov=s=>{assert.ok(s.government,'new campaigns need a real elected government');return s.government;};
const ack=s=>{assert.ok(F.acknowledgeGovernment(s).ok);s.paused=false;};
const vote=(s,party)=>{const g=gov(s);if(g.reviewAt!==null&&g.reviewAt<=g.nextElection-30){jump(s,g.reviewAt-.01);run(s,.1);ack(s);}jump(s,g.nextElection-30);assert.ok(F.electionAction(s,party).ok);jump(s,g.nextElection-.01);run(s,.1);return s;};

test('election opens on schedule, pauses for a result and preserves soldiers and unpaid promises on turnover',()=>{
 const s=fresh(),g=gov(s);assert.equal(g.party,'kmt');assert.equal(g.nextElection,90);s.civic.promise={kind:'budget',createdAt:0,due:45,phase:'overdue',reminded:true};s.homefront.support=45;
 const units=structuredClone(s.units),debt=structuredClone(s.civic.promise),cities=Array.from(s.owners);vote(s,'dpp');
 assert.equal(g.party,'dpp');assert.equal(g.transitions,1);assert.equal(g.notice.kind,'election');assert.equal(s.paused,true);assert.deepEqual(s.units,units);assert.deepEqual(s.civic.promise,debt);assert.deepEqual(Array.from(s.owners),cities);assert.equal(g.nextElection,270);
});
test('poor morale and broken promises lower incumbent polling rather than guaranteeing the ruling party wins',()=>{
 const s=fresh();gov(s);const a=F.electionSummary(s).kmt;s.homefront.support=25;s.civic.promise={kind:'budget',createdAt:0,due:45,phase:'overdue',reminded:true};assert.ok(F.electionSummary(s).kmt<a-20);
});
test('campaign spending happens once in the campaign window and does not buy an immediate government change',()=>{
 const s=fresh();gov(s);const raw=F.encode(s);assert.equal(F.electionAction(s,'dpp').ok,false);assert.equal(F.encode(s),raw);s.time=60;const money=s.strategy.funds,poll=F.electionSummary(s).dpp;assert.ok(F.electionAction(s,'dpp').ok);assert.equal(s.strategy.funds,money-80);assert.ok(F.electionSummary(s).dpp>poll);assert.equal(s.government.party,'kmt');const paid=F.encode(s);assert.equal(F.electionAction(s,'kmt').ok,false);assert.equal(F.encode(s),paid);
});
test('a peaceful handover gives access to different policies and removes the previous policy bonuses',()=>{
 const s=fresh();gov(s);assert.ok(F.enactPolicy(s,'reserves').ok);const kmtIncome=F.strategy.income(s),kmtGrowth=F.growth(s,1);vote(s,'dpp');ack(s);assert.equal(s.government.policy,null);assert.equal(F.enactPolicy(s,'reserves').ok,false);assert.ok(F.enactPolicy(s,'commerce').ok);assert.ok(F.strategy.income(s)>kmtIncome);assert.ok(F.growth(s,1)<kmtGrowth);
});
test('policies have real one-time costs and cannot be stacked or selected without money',()=>{
 const s=fresh();gov(s);s.strategy.funds=159;const before=F.encode(s);assert.equal(F.enactPolicy(s,'reserves').ok,false);assert.equal(F.encode(s),before);s.strategy.funds=200;assert.ok(F.enactPolicy(s,'reserves').ok);assert.equal(s.strategy.funds,40);const once=F.encode(s);assert.equal(F.enactPolicy(s,'coastal').ok,false);assert.equal(F.encode(s),once);
});
test('policy review checks real facilities and forces, pays a success only once and does not forgive old civilian debt',()=>{
 const s=fresh();gov(s);F.enactPolicy(s,'reserves');s.units[0].force=2600;const debt={kind:'budget',createdAt:0,due:45,phase:'pending',reminded:false};s.civic.promise=debt;s.time=59.99;run(s,.1);assert.equal(s.government.achievements.reserves,1);assert.ok(s.civic.promise);assert.equal(s.government.notice.kind,'review');F.acknowledgeGovernment(s);const morale=s.homefront.support;run(s,1);assert.equal(s.government.achievements.reserves,1);assert.ok(s.homefront.support<=morale);
});
test('unfulfilled policy targets cause public and party losses instead of a free reward',()=>{
 const s=fresh();gov(s);F.enactPolicy(s,'coastal');s.time=59.99;const morale=s.homefront.support,kmt=s.civic.kmt;run(s,.1);assert.equal(s.government.achievements.coastal,0);assert.equal(s.government.lastReview.success,false);assert.ok(s.homefront.support<morale);assert.ok(s.civic.kmt<kmt);
});
test('civil government repairs real damage faster while mobilizing fewer new reserves',()=>{
 const s=fresh();gov(s);vote(s,'dpp');ack(s);F.enactPolicy(s,'civil');s.homefront.cities[0].buildings=60;s.homefront.cities[0].industry=60;const id=s.homefront.cities[0].id;assert.ok(F.repairCity(s,id).ok);assert.ok(s.homefront.cities[0].repair.endsAt-s.time<10);const support=s.homefront.support;jump(s,s.homefront.cities[0].repair.endsAt);run(s,.1);assert.equal(s.homefront.cities[0].buildings,84);assert.equal(s.homefront.cities[0].industry,90);assert.ok(s.homefront.support>=support+7);
});
test('coastal policy needs real air-defence hardware and consumes ammunition',()=>{
 const H=require('../homefront.js'),s=fresh();gov(s);F.enactPolicy(s,'coastal');assert.equal(H.interceptionCapacity(s),0);s.homefront.airDefense.batteries=1;s.homefront.airDefense.ammo=8;assert.equal(H.interceptionCapacity(s),3);s.strategy.warning={sheltered:true};H.warn(s);H.strike(s,{event(){},deployed:()=>0,W:F.W});assert.equal(s.homefront.lastStrike.intercepted,3);assert.equal(s.homefront.airDefense.ammo,5);
});
test('manual pauses and major news freeze elections and policy deadlines',()=>{
 const s=fresh();gov(s);F.enactPolicy(s,'reserves');s.paused=true;const raw=F.encode(s);run(s,100);assert.equal(F.encode(s),raw);s.paused=false;F.queueWorldEvent(s,'civic_budget');run(s,.2);const at=s.time;run(s,100);assert.equal(s.time,at);
});
test('election and unresolved result survive v16 export without rerolling or clearing inherited bills',()=>{
 const s=fresh();gov(s);vote(s,'dpp');const copy=F.decode(F.encode(s));assert.equal(JSON.parse(F.encode(s)).version,16);assert.deepEqual(copy.government,s.government);assert.equal(copy.paused,true);const before=F.encode(copy);run(copy,100);assert.equal(F.encode(copy),before);
});
test('v15 campaigns migrate without immediate elections, lost progress or forgiven promises',()=>{
 const Old=require('../civic-core.js'),s=Old.createStrategic(29);s.civic.promise={kind:'budget',createdAt:0,due:45,phase:'pending',reminded:false};const copy=F.decode(Old.encode(s));assert.equal(gov(copy).nextElection,90);assert.deepEqual(copy.civic,s.civic);assert.deepEqual(copy.units,s.units);assert.equal(copy.strategy.funds,s.strategy.funds);
});
test('invalid parties, policies, forged results, non-finite polls and deadlines are rejected on import',()=>{
 const s=fresh();gov(s);for(const mutate of [v=>delete v.government,v=>v.government.party='other',v=>v.government.policy='commerce',v=>v.government.nextElection=9999,v=>v.government.wins.dpp=-1,v=>v.government.notice={kind:'election',winner:'dpp'},v=>v.government.achievements.reserves=Infinity]){const v=JSON.parse(F.encode(s));mutate(v);assert.throws(()=>F.decode(JSON.stringify(v)));}
});
const peace=(party,policy)=>{const s=fresh();gov(s);vote(s,party);ack(s);assert.ok(F.enactPolicy(s,policy).ok);s.strategy.levels={economy:3,technology:2,diplomacy:2};s.units[0].force=2600;s.homefront.airDefense.batteries=1;s.homefront.airDefense.ammo=8;s.world.opinion=85;jump(s,s.government.reviewAt-.01);run(s,.1);ack(s);jump(s,180);return s;};
test('each party earns a distinct peaceful ending with actual election and fulfilled policy, then saves correctly',()=>{
 for(const [party,policy,id] of [['kmt','coastal','kmt_compact'],['dpp','civil','dpp_compact']]){const s=peace(party,policy);assert.equal(F.routeEndings(s).find(e=>e.id===id).ready,true);const money=s.strategy.funds;assert.ok(F.finishRoute(s,id).ok);assert.equal(s.strategy.funds,money-400);assert.equal(F.endingFor(s).id,id);assert.equal(F.decode(F.encode(s)).finale.ending,id);}
});
test('party endings cannot be bought before an election, with failed policies, during civil collapse or after nuclear use',()=>{
 for(const mutate of [s=>s.government.wins.dpp=0,s=>s.government.achievements.civil=0,s=>s.homefront.support=0,s=>s.world.nuclear.used=1,s=>s.strategy.phase='war']){const s=peace('dpp','civil');mutate(s);const raw=F.encode(s);assert.equal(F.finishRoute(s,'dpp_compact').ok,false);assert.equal(F.encode(s),raw);}
});
test('both parties can win militarily, retaining the genuine two-wave conditions and earned postwar route choices',()=>{
 for(const [party,policy,id] of [['kmt','reserves','kmt_military'],['dpp','civil','dpp_military']]){const s=peace(party,policy);F.startWar(s);s.civic.warSeen=true;for(const t of s.towns.filter(t=>t.goal))F.claim(s,t.tile,1);s.homefront.salvos=2;s.civic.lastSalvos=2;Object.assign(s.homefront.invasion,{phase:'repelled',wave:2,repelled:1,nextAt:s.time+90});s.homefront.victoryHold=30;s.world.preparation.projects.industry={phase:'complete',route:'exports',acceptedAt:0};run(s,.1);assert.equal(s.result,null);s.homefront.invasion.repelled=2;run(s,.1);assert.equal(F.endingFor(s).id,id);assert.ok(F.epilogueChoices(s).some(e=>e.route==='exports'));assert.ok(F.chooseEpilogue(s,'exports').ok);assert.equal(F.decode(F.encode(s)).finale.ending,id);}
});
test('ended games cannot hold elections or spend policy resources',()=>{
 const s=peace('dpp','civil');F.finishRoute(s,'dpp_compact');const raw=F.encode(s);assert.equal(F.enactPolicy(s,'commerce').ok,false);assert.equal(F.electionAction(s,'kmt').ok,false);run(s,500);assert.equal(F.encode(s),raw);
});
test('continuing while an election result is unread leaves a paused, loadable save',()=>{
 const s=fresh();vote(s,'dpp');const before=F.encode(s);assert.equal(typeof F.togglePause,'function');assert.equal(F.togglePause(s).ok,false);assert.equal(F.encode(s),before);assert.doesNotThrow(()=>F.decode(F.encode(s)));ack(s);assert.ok(F.togglePause(s).ok);assert.equal(s.paused,true);
});
test('a failed policy which exhausts morale opens the existing rescue window and exports a valid save',()=>{
 const s=fresh();F.enactPolicy(s,'coastal');s.homefront.support=5;jump(s,59.99);run(s,.1);assert.equal(s.homefront.support,0);assert.equal(s.result,null);assert.ok(s.civic.collapseAt>s.time);assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('imports cannot backdate policy success before this government took office or invent extra term achievements',()=>{
 const s=peace('kmt','reserves');assert.doesNotThrow(()=>F.decode(F.encode(s)));for(const mutate of [v=>{v.government.policyAt=0;v.government.lastReview.at=0;},v=>v.government.lastReview.at=v.government.policyAt,v=>Object.keys(v.government.achievements).forEach(id=>v.government.achievements[id]=2),v=>{Object.keys(v.government.achievements).forEach(id=>v.government.achievements[id]=2);v.government.achievements.extra='x';}]){const raw=JSON.parse(F.encode(s));mutate(raw);assert.throws(()=>F.decode(JSON.stringify(raw)));}
});
