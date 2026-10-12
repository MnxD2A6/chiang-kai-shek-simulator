const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../engine.js');
test('first turn gives a concrete objective and awards it once on settlement',()=>{
 const s=G.newGame(1); assert.equal(G.mission(s).target,5);assert.equal(G.mission(s).done,false);
 G.choose(s,0);G.act(s,'industry','chongqing');G.act(s,'industry','chongqing');assert.equal(G.mission(s).done,true);
 const r=G.endTurn(s);assert.equal(r.report.mission.success,true);assert.equal(s.missions.length,1);assert.equal(s.missions[0].success,true);
 assert.equal(G.endTurn(s).ok,false);assert.equal(s.missions.length,1);
});
test('policies persist with genuine costs and may change at most once per turn',()=>{
 const s=G.newGame(2);const c=s.cities[0],before=G.defense(s,c);assert.equal(G.act(s,'policyDefense').ok,true);
 assert.equal(s.doctrine,'defense');assert.equal(G.defense(s,c),before+8);assert.equal(s.treasury,74);assert.equal(s.ap,2);
 assert.equal(G.act(s,'policyWelfare').ok,false);G.choose(s,0);const morale=s.morale;G.endTurn(s);assert.equal(s.doctrine,'defense');assert.equal(s.policyChanged,false);
 assert.equal(G.act(s,'policyWelfare').ok,true);G.choose(s,0);G.endTurn(s);assert.ok(s.morale>=morale);
});
test('phone lines have trust and one request per contact each turn',()=>{
 const s=G.newGame(3);assert.equal(s.relations.military,50);G.act(s,'callMilitary');assert.equal(s.relations.military,57);
 const before=JSON.stringify(s);assert.equal(G.act(s,'callMilitary').ok,false);assert.equal(JSON.stringify(s),before);
 G.choose(s,0);G.endTurn(s);assert.equal(G.act(s,'callMilitary').ok,true);
});
test('v1 saves migrate without deleting progress and new data survives round trip',()=>{
 const s=G.newGame(6);G.choose(s,0);G.act(s,'policyDefense');G.endTurn(s);
 assert.deepEqual(G.decode(G.encode(s)),s);
 const old=JSON.parse(G.encode(s));delete old.doctrine;delete old.policyChanged;delete old.missions;delete old.relations;delete old.called;
 old.cities.forEach(c=>delete c.factories);const restored=G.decode(JSON.stringify(old));assert.equal(restored.turn,1);assert.equal(restored.doctrine,'balanced');assert.equal(restored.morale,s.morale);
 assert.throws(()=>G.decode(JSON.stringify({...s,doctrine:'fake'})));
});
test('industrial capacity cannot waste resources past a city or global cap',()=>{
 const s=G.newGame(4);s.cities[0].factories=3;assert.equal(G.act(s,'industry',s.cities[0].id).ok,false);
 s.industry=20;assert.equal(G.act(s,'industry','chongqing').ok,false);
});
test('guided first turn follows player actions, and can hand off to free play',()=>{
 const D=require('../director.js'); const s=G.newGame(1),flags={active:true,mapOpened:false,citySelected:false};
 assert.equal(D.guide(s,flags).id,'phone');G.choose(s,0);assert.equal(D.guide(s,flags).id,'map');
 flags.mapOpened=true;assert.equal(D.guide(s,flags).id,'city');flags.citySelected=true;assert.equal(D.guide(s,flags).id,'industry');
 G.act(s,'industry','chongqing');G.act(s,'industry','chongqing');assert.equal(D.guide(s,flags).id,'settle');G.endTurn(s);assert.equal(D.guide(s,flags).id,'complete');
 flags.active=false;assert.equal(D.guide(s,flags),null);
});
test('spending early tutorial actions still offers settlement instead of a dead end',()=>{const D=require('../director.js'),s=G.newGame(1),flags={active:true,mapOpened:true,citySelected:true};G.choose(s,0);s.ap=0;assert.equal(D.guide(s,flags).id,'settle');assert.match(D.guide(s,flags).text,/仍可|可以/);});
test('using an ordinary city command through a phone consumes that contact request',()=>{const s=G.newGame(8);assert.equal(G.phoneRequest(s,'military','fortify','shanghai').ok,true);assert.equal(s.relations.military,57);assert.equal(G.phoneRequest(s,'military','callMilitary').ok,false);});
test('late v1 campaigns are not forced to earn missing historical missions',()=>{const s=G.newGame(10);s.turn=11;s.missions=[{turn:10,success:true}];s.peace=6;s.morale=80;s.inflation=20;assert.equal(G.ending(s).id,'peace');s.missions=Array.from({length:12},(_,turn)=>({turn,success:turn===10}));assert.notEqual(G.ending(s).id,'peace');});
test('resuming a construction lesson restores the strategic view',()=>{const D=require('../director.js'),s=G.newGame(4),flags={active:true,mapOpened:true,citySelected:true};assert.equal(D.initialView(s,flags),'room');G.choose(s,0);assert.equal(D.initialView(s,flags),'map');flags.active=false;assert.equal(D.initialView(s,flags),'room');});
