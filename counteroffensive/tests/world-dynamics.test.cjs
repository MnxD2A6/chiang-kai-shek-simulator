const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../world-dynamics.js'),Old=require('../world-core.js');
const Tactics=require('../tactical-tools.js');
const quiet=s=>{s.world.queue=[];s.world.nextStory=99999;s.world.nextBulletin=99999;};
const run=(s,seconds)=>{for(let i=0;i<Math.ceil(seconds*10);i++)F.step(s,.1);};
test('one week takes sixty real seconds by default, pause freezes it and 2x is explicit',()=>{
 const s=F.createStrategic(1);quiet(s);s.campaign.nextReaction=99999;run(s,20);assert.ok(Math.abs(s.time-10)<1e-7);
 const p=F.weekProgress(s);assert.equal(p.week,1);assert.ok(Math.abs(p.ratio-1/3)<1e-7);assert.equal(p.remaining,40);
 s.paused=true;run(s,20);assert.ok(Math.abs(s.time-10)<1e-7);s.paused=false;
 assert.ok(F.setPace(s,1).ok);run(s,20);assert.ok(Math.abs(s.time-30)<1e-6);assert.equal(F.weekProgress(s).week,2);
 assert.equal(F.setPace(s,100).ok,false);
});
test('fresh campaigns randomize opening stories and times, excluding research and sequel-only stories',()=>{
 const openers=new Set(),times=new Set();for(let seed=1;seed<=40;seed++){
  const s=F.createStrategic(seed),q=s.world.queue[0];openers.add(q.id);times.add(q.due);
  assert.ok(F.worldEvents[q.id].starter);assert.ok(!F.worldEvents[q.id].requires);assert.ok(q.due>=12&&q.due<=24);
 }assert.ok(openers.size>=5);assert.ok(times.size>10);
 assert.deepEqual(F.createStrategic(88).world,F.createStrategic(88).world);
});
test('diplomatic pressure is announced before it actually changes country attitudes',()=>{
 const s=F.createStrategic(7);quiet(s);s.strategy.partners.usa=true;s.campaign.nextReaction=0;
 run(s,.2);assert.equal(s.campaign.pending.kind,'diplomatic');const before=s.world.relations.usa;
 assert.equal(before,35);assert.ok(s.campaign.pending.due>s.time);run(s,25);
 assert.ok(s.world.relations.usa<before);assert.ok(s.campaign.history.some(e=>e.kind==='diplomatic'));
});
test('expansion causes visible mainland mobilization, with no attack during preparation',()=>{
 const s=F.createStrategic(8);quiet(s);s.units[0].force=2600;s.campaign.nextReaction=0;run(s,.2);
 assert.equal(s.campaign.pending.kind,'mobilize');run(s,25);
 const a=s.naval.ground.find(a=>a.key==='china');assert.ok(a);assert.equal(a.path.length,0);
 assert.equal(s.strategy.phase,'preparation');assert.ok(s.campaign.lastAction.includes('守备'));
});
test('war and landed armies provoke actual mainland counterattack forces',()=>{
 const s=F.createStrategic(9);quiet(s);F.startWar(s);const t=s.towns.find(t=>t.id==='fuzhou');
 s.units[0].tile=t.tile;s.units[0].goal=t.tile;F.claim(s,t.tile,1);s.campaign.pending=null;s.campaign.nextReaction=0;
 run(s,.2);assert.equal(s.campaign.pending.kind,'counter');run(s,25);
 assert.ok(s.naval.ground.some(a=>a.key==='china'&&a.force>0));
 assert.ok(s.campaign.history.some(e=>e.kind==='counter'));assert.notEqual(s.campaign.posture,'观望');
});
test('a deliberate de-escalation cancels pending peacetime pressure and costs funds once',()=>{
 const s=F.createStrategic(10);quiet(s);s.strategy.partners.usa=true;s.campaign.nextReaction=0;run(s,.2);
 const before=s.strategy.funds;assert.ok(F.mainlandTalk(s).ok);assert.equal(s.strategy.funds,before-50);
 assert.equal(s.campaign.pending,null);assert.equal(F.mainlandTalk(s).ok,false);
 run(s,20);assert.equal(s.world.relations.usa,35);
});
test('reaction state and random sequence survive an actual v8 save roundtrip',()=>{
 const s=F.createStrategic(11);s.world.queue=[];s.world.nextStory=100;s.campaign.nextReaction=0;s.units[0].force=2400;run(s,.2);
 const copy=F.decode(F.encode(s));assert.deepEqual(copy.campaign,s.campaign);run(s,26);run(copy,26);
 assert.deepEqual(copy.campaign,s.campaign);assert.deepEqual(copy.world,s.world);assert.deepEqual(copy.naval.ground,s.naval.ground);
 assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('v7 migration retains armies, research, pending stories and original game time',()=>{
 const old=Old.createStrategic(12);old.paused=true;const copy=F.decode(Old.encode(old));
 assert.deepEqual(copy.units,old.units);assert.deepEqual(copy.world,old.world);assert.equal(copy.time,old.time);
 assert.equal(copy.campaign.pace,.5);assert.equal(JSON.parse(F.encode(copy)).version,8);
});
test('forged reaction kinds, timers, pace and history are rejected on import',()=>{
 const s=F.createStrategic(13);for(const mutate of [
  v=>v.campaign.pace=20,v=>v.campaign.alert=999,v=>v.campaign.nextReaction=99999,
  v=>v.campaign.pending={kind:'attack_everything',due:0},v=>v.campaign.history=[{kind:'trade',at:-1,text:'x'}]
 ]){const v=JSON.parse(F.encode(s));mutate(v);assert.throws(()=>F.decode(JSON.stringify(v)));}
});
test('a resolved campaign and a pending major decision cannot continue mainland reactions',()=>{
 const s=F.createStrategic(14);s.campaign.nextReaction=0;s.result='defeat';const raw=F.encode(s);run(s,20);assert.equal(F.encode(s),raw);
 const b=F.createStrategic(15);b.world.active={id:b.world.queue.shift().id,token:b.serial++,at:0};b.paused=true;
 assert.equal(F.mainlandTalk(b).ok,false);assert.equal(F.setPace(b,1).ok,true);run(b,20);assert.equal(b.time,0);
});
test('new mainland garrisons do not consume the slot required by the robot story',()=>{
 const s=F.createStrategic(16);s.world.queue=[];s.world.nextStory=100;const town=s.towns.find(t=>t.id==='shanghai');
 for(let i=0;i<4;i++)s.naval.ground.push({id:s.serial++,key:i<2?'china':'russia',name:'守备队',tile:town.tile,goal:town.tile,force:650,path:[],progress:0,nextOrder:0});
 F.queueWorldEvent(s,'mech_landing',0);run(s,.2);assert.equal(s.world.active.id,'mech_landing');
 assert.ok(F.worldChoice(s,s.world.active.token,'contain').ok);assert.ok(s.naval.ground.some(a=>a.name.includes('机甲')));
 assert.doesNotThrow(()=>F.decode(F.encode(s)));
});
test('movement estimates follow the selected pace instead of retaining old realtime seconds',()=>{
 const s=F.createStrategic(17),u=s.units[0],town=s.towns.find(t=>t.id==='kaohsiung');F.order(s,u.id,town.tile);
 const slow=Number(Tactics.current(s,u.id).detail.match(/约 (\d+)/)[1]);F.setPace(s,1);
 const fast=Number(Tactics.current(s,u.id).detail.match(/约 (\d+)/)[1]);assert.ok(slow>=fast*2-1);
});
test('first landing immediately changes mainland intent even when its periodic review is still far away',()=>{
 const s=F.createStrategic(18);quiet(s);F.startWar(s);s.campaign.nextReaction=80;
 const t=s.towns.find(t=>t.id==='fuzhou');s.units[0].tile=t.tile;s.units[0].goal=t.tile;F.claim(s,t.tile,1);run(s,.2);
 assert.equal(s.campaign.pending?.kind,'counter');assert.equal(s.campaign.landingSeen,true);
});
test('separate mainland mobilizations choose different available cities',()=>{
 const s=F.createStrategic(19);quiet(s);s.units[0].force=2600;s.campaign.nextReaction=0;run(s,25);
 s.campaign.nextReaction=0;run(s,25);const guards=s.naval.ground.filter(a=>a.key==='china');
 assert.equal(guards.length,2);assert.notEqual(guards[0].tile,guards[1].tile);
});
