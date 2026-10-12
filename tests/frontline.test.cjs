const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../tactics.js'),W=require('../world.js');
function simulate(b,seconds){for(let i=0;i<seconds*20&&!b.result;i++)T.step(b,.05);}
test('orders move individual squads and pause freezes simulation but accepts orders',()=>{
 const b=T.create(0),a=b.units[0],other=b.units[1],x=a.x;
 assert.equal(T.order(b,a.id,'move',180,210).ok,true);simulate(b,1);assert.ok(a.x>x);assert.equal(other.x,other.home.x);
 b.paused=true;const position=a.x;T.order(b,a.id,'move',240,210);simulate(b,2);assert.equal(a.x,position);b.paused=false;simulate(b,1);assert.ok(a.x>position);
});
test('river blocks travel except at bridge and route crosses safely',()=>{
 const b=T.create(0),a=b.units[0];assert.equal(T.order(b,a.id,'move',375,60).ok,false);
 assert.equal(T.order(b,a.id,'move',465,210).ok,true);simulate(b,7);assert.ok(a.x>390);assert.ok(a.y>=150&&a.y<=270);
});
test('attack orders pursue targets and damage is caused by actual ranged combat',()=>{
 const b=T.create(0),a=b.units[0],enemy=b.units.find(u=>u.team==='red'),hp=enemy.hp;
 enemy.order='hold';a.x=300;a.y=210;enemy.x=510;enemy.y=210;
 assert.equal(T.order(b,a.id,'attack',enemy.x,enemy.y,enemy.id).ok,true);simulate(b,5);assert.ok(a.x>300);assert.ok(enemy.hp<hp);
});
test('hold stops an existing path and retreat gives a distinct destination',()=>{
 const b=T.create(0),a=b.units[0];T.order(b,a.id,'move',300,210);simulate(b,1);T.order(b,a.id,'hold');const x=a.x;simulate(b,1);assert.equal(a.x,x);T.order(b,a.id,'retreat');simulate(b,1);assert.ok(a.x<x);
});
test('enemies shoot back, cover reduces incoming fire and dead troops cannot be ordered',()=>{
 const b=T.create(0),a=b.units[0],e=b.units.find(u=>u.team==='red');a.x=450;a.y=210;e.x=530;e.y=210;e.order='hold';const hp=a.hp;simulate(b,2);assert.ok(a.hp<hp);
 assert.ok(T.damageAt(b,{...a,x:240,y:150},20)<T.damageAt(b,{...a,x:240,y:210},20));a.hp=0;assert.equal(T.order(b,a.id,'move',300,210).ok,false);
});
test('bridge requires troops at the objective and transport requires reaching its destination',()=>{
 const b=T.create(0);b.units.filter(u=>u.team==='red').forEach(u=>u.hp=0);simulate(b,6);assert.equal(b.result,null);
 b.units[0].x=450;b.units[0].y=210;simulate(b,7);assert.equal(b.result,'victory');
 const escort=T.create(1);escort.units.filter(u=>u.team==='red').forEach(u=>u.hp=0);simulate(escort,40);assert.equal(escort.result,'victory');
});
test('defense fails when all troops fall, while terminal battles cannot mutate',()=>{
 const b=T.create(2);b.units.filter(u=>u.team==='blue').forEach(u=>u.hp=0);simulate(b,1);assert.equal(b.result,'defeat');const snapshot=JSON.stringify(b);T.step(b,1);T.order(b,'b1','move',100,100);assert.equal(JSON.stringify(b),snapshot);
});
test('support adds real troops or heals survivors and cannot be used repeatedly',()=>{
 const b=T.create(0),count=b.units.length;b.units[0].hp=30;assert.equal(T.support(b,'medic').ok,true);assert.ok(b.units[0].hp>30);assert.equal(T.support(b,'medic').ok,false);assert.equal(T.support(b,'reinforce').ok,true);assert.equal(b.units.length,count+1);
});
test('unescorted convoy is vulnerable while a follow order protects the moving vehicle',()=>{
 const passive=T.create(1);simulate(passive,60);assert.equal(passive.result,'defeat');
 const b=T.create(1);for(const u of b.units.filter(u=>u.team==='blue'&&u.kind!=='truck'))assert.equal(T.order(b,u.id,'follow',undefined,undefined,'truck').ok,true);
 simulate(b,45);assert.equal(b.result,'victory');assert.ok(b.units.find(u=>u.id==='b1').x>500);
});
test('five locations have reachable entrances and NPC conversations have branching topics',()=>{
 assert.equal(Object.keys(W.scenes).length,5);for(const s of Object.values(W.scenes)){assert.ok(s.npcs.length>0);assert.ok(s.exits.length>0);assert.equal(W.blocked(s,s.spawn.x,s.spawn.y),false);for(const e of s.exits)assert.ok(W.route(s,s.spawn,e).length>0);}
 assert.ok(W.people.length>=8);assert.equal(W.contacts.length,7);
});
test('medical errand has a real prerequisite and rewards only once',()=>{
 const s=W.create();assert.equal(W.interact(s,'doctor','deliver').ok,false);assert.equal(W.interact(s,'quartermaster','medicine').ok,true);assert.equal(W.interact(s,'doctor','deliver').ok,true);assert.equal(s.medics,true);const food=s.supplies;assert.equal(W.interact(s,'doctor','deliver').ok,false);assert.equal(s.supplies,food);
});
test('campaign calls and battle rewards are bounded and save rejects forged progress',()=>{
 const s=W.create();assert.equal(W.request(s,'logistics').ok,true);assert.equal(W.request(s,'logistics').ok,false);W.finish(s,0,true);assert.equal(s.stage,1);assert.equal(W.finish(s,0,true).ok,false);assert.equal(W.decode(W.encode(s)).stage,1);
 const forged=JSON.parse(W.encode(s));forged.stage=99;assert.throws(()=>W.decode(JSON.stringify(forged)));assert.throws(()=>W.decode('{'));assert.equal(W.decode(W.encode(s)).medics,false);
});
test('saved location coordinates are bounded and imported identity never changes canonical scene data',()=>{
 const s=W.create();s.scene='village';s.hero={x:220,y:240};const restored=W.decode(W.encode(s));assert.equal(restored.scene,'village');assert.equal(restored.hero.x,220);const bad=JSON.parse(W.encode(s));bad.hero.x=1e8;assert.throws(()=>W.decode(JSON.stringify(bad)));assert.equal(W.decode(W.encode(s)).wins.length,0);
});
test('walking to an already nearby desk character never enters solid furniture',()=>{
 const s=W.scenes.hq,start={x:62,y:94},path=W.route(s,start,{x:62,y:84});assert.ok(path.length);assert.equal(W.blocked(s,path.at(-1).x,path.at(-1).y),false);
});
