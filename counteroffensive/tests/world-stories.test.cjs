const test=require('node:test'),assert=require('node:assert/strict'),F=require('../homefront-core.js');
const families=['budget','port','cable','insurance','panda','recall','karaoke','aurora'];
const newEvents=()=>Object.entries(F.worldEvents).filter(([id])=>id.startsWith('story_'));
function fresh(){const s=F.createStrategic(742);F.setPace(s,1);s.world.queue=[];s.world.nextStory=s.time+150;s.campaign.nextReaction=s.time+80;s.strategy.funds=2000;return s;}
function event(s,id){s.world.queue=[];s.world.active=null;s.paused=false;s.world.nextStory=s.time+100;assert.ok(F.queueWorldEvent(s,id,0).ok);F.step(s,.1);assert.equal(s.world.active?.id,id);}
const choose=(s,id)=>{const r=F.worldChoice(s,s.world.active.token,id);assert.ok(r.ok,r.message);return r;};

test('eight new branching stories each reach a conclusion in three decisions without dead ends',()=>{
 assert.equal(newEvents().length,32);
 for(const family of families){const start='story_'+family+'_start';assert.ok(F.worldEvents[start]?.starter,start);
  const visit=(id,depth,trail)=>{const e=F.worldEvents[id];assert.ok(e,id);assert.ok(!trail.includes(id),'no story loops');assert.ok(e.choices.length>=2&&e.choices.length<=3);assert.ok(e.choices.some(c=>c.cost===0&&!c.requires),'a free exit must remain');
   for(const c of e.choices){assert.ok(c.cost>=0&&c.cost<=120);assert.ok(c.next.length<=1);if(c.next.length){assert.ok(depth<3);for(const q of c.next){assert.ok(q.id.startsWith('story_'+family+'_'));visit(q.id,depth+1,[...trail,id]);}}else assert.equal(depth,3,'each chosen path has a payoff');}
  };visit(start,1,[]);
  assert.equal(new Set(F.worldEvents[start].choices.map(c=>c.next[0].id)).size,2,'opening responses choose different followups');
 }
});
test('contextual stories wait for real cooperation or an actual mech and do not pollute opening draws',()=>{
 const s=fresh();assert.equal(typeof F.worldEventEligible,'function');
 assert.equal(F.worldEventEligible(s,F.worldEvents.story_budget_start),false);
 s.strategy.partners.usa=true;assert.equal(F.worldEventEligible(s,F.worldEvents.story_budget_start),true);
 assert.equal(F.worldEventEligible(s,F.worldEvents.story_recall_start),false);
 const t=s.towns.find(t=>t.id==='shanghai');s.naval.ground.push({id:s.serial++,key:'russia',name:'俄方机甲纵队',tile:t.tile,goal:t.tile,force:1600,path:[],progress:0,nextOrder:s.time});
 assert.equal(F.worldEventEligible(s,F.worldEvents.story_recall_start),true);
 assert.equal(F.worldEventEligible(s,{requires:'unknown'}),false);
 const draws=new Set();for(let seed=1;seed<=120;seed++){const v=F.createStrategic(seed),id=v.world.queue[0].id;assert.notEqual(id,'story_budget_start');assert.notEqual(id,'story_recall_start');draws.add(id);}
 assert.ok([...draws].some(id=>id.startsWith('story_')),'new stories really enter normal opening draws');
});
test('public budget conditions can suspend and restore actual US procurement permission',()=>{
 const H=require('../homefront.js'),s=fresh();s.strategy.partners.usa=true;s.world.relations.usa=20;
 event(s,'story_budget_start');choose(s,'refuse');assert.equal(H.permit(s),false);
 event(s,'story_budget_pressure');choose(s,'explain');assert.equal(H.permit(s),true);
 assert.ok(F.buyAirDefense(s).ok);
});
test('port compromise changes real export income through diplomatic support rather than phantom funds',()=>{
 const s=fresh();s.strategy.partners.japan=true;s.world.relations.japan=-35;
 s.world.preparation.projects.industry={phase:'complete',route:'exports',acceptedAt:0};
 const before=F.strategy.income(s);event(s,'story_port_mediate');choose(s,'negotiate');assert.ok(s.world.relations.japan>-30);assert.ok(F.strategy.income(s)>before+3);
});
test('a recall settlement weakens only present mech forces, leaving conventional armies intact',()=>{
 const s=fresh(),t=s.towns.find(t=>t.id==='shanghai');
 for(const name of ['俄方机甲纵队','俄军援军'])s.naval.ground.push({id:s.serial++,key:'russia',name,tile:t.tile,goal:t.tile,force:1600,path:[],progress:0,nextOrder:s.time});
 event(s,'story_recall_finish');choose(s,'settle');assert.ok(Math.abs(s.naval.ground.find(a=>a.name.includes('机甲')).force-880)<1e-8);assert.equal(s.naval.ground.find(a=>a.name==='俄军援军').force,1600);
});
test('a mech destroyed before recall settlement cannot charge the player for an empty reward',()=>{
 const s=fresh(),t=s.towns.find(t=>t.id==='shanghai');s.naval.ground.push({id:s.serial++,key:'russia',name:'俄方机甲纵队',tile:t.tile,goal:t.tile,force:1600,path:[],progress:0,nextOrder:s.time});
 event(s,'story_recall_start');choose(s,'inspect');s.naval.ground=[];event(s,'story_recall_finish');const before=F.encode(s),paid=F.worldEvents.story_recall_finish.choices.find(c=>c.id==='settle');
 assert.equal(F.worldChoiceAvailable(s,paid).ok,false);assert.equal(F.worldChoice(s,s.world.active.token,'settle').ok,false);assert.equal(F.encode(s),before);choose(s,'close');
});
test('solar monitoring choices affect an already running abstract research project',()=>{
 const s=fresh();assert.ok(F.startResearch(s).ok);s.world.nuclear.risk=40;event(s,'story_aurora_ground');const before=s.world.nuclear.risk;choose(s,'quiet');assert.ok(s.world.nuclear.risk<before-9);assert.equal(s.world.nuclear.mode,'paused');assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('all new event decisions and queued branches survive current save roundtrips with real prerequisites',()=>{
 assert.ok(newEvents().length>0);
 for(const [id,e] of newEvents())for(const c of e.choices){const s=fresh();if(c.requires==='mech'){const t=s.towns.find(t=>t.id==='shanghai');s.naval.ground.push({id:s.serial++,key:'russia',name:'俄方机甲纵队',tile:t.tile,goal:t.tile,force:1600,path:[],progress:0,nextOrder:s.time});}const setup={procurement:[['story_budget_start','audit'],['story_budget_audit','publish']],harbor:[['story_port_start','mediate']],medical:[['story_cable_start','repair']]};for(const [prior,answer] of setup[c.effects.consequence]||[]){event(s,prior);choose(s,answer);}event(s,id);const pending=F.decode(F.encode(s));assert.equal(pending.world.active.id,id);choose(s,c.id);const restored=F.decode(F.encode(s));assert.deepEqual(restored.world,s.world);assert.equal(restored.strategy.funds,s.strategy.funds);assert.equal(F.worldChoice(s,s.serial,c.id).ok,false);}
});
test('zero-budget players can respond to every new event and continue time',()=>{
 assert.ok(newEvents().length>0);
 for(const [id,e] of newEvents()){const s=fresh();event(s,id);s.strategy.funds=0;choose(s,e.choices.find(c=>c.cost===0&&!c.requires).id);assert.equal(s.world.active,null);assert.equal(s.paused,false);assert.ok(s.strategy.funds>=0);}
});
