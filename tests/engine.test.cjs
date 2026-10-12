const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../engine.js');

test('new game exposes 12 turns, 9 cities and 3 actions', () => {
  const s=G.newGame(42,true);
  assert.equal(s.turn,0); assert.equal(s.ap,3); assert.equal(s.cities.length,9);
  assert.equal(G.content.events.length,12); assert.equal(s.drama,true);
});
test('invalid commands, exhausted AP and costs leave state intact', () => {
  const s=G.newGame(4); const before=JSON.stringify(s);
  assert.equal(G.act(s,'invalid','nanjing').ok,false); assert.equal(JSON.stringify(s),before);
  s.treasury=0; const broke=JSON.stringify(s);
  assert.equal(G.act(s,'reinforce','nanjing').ok,false); assert.equal(JSON.stringify(s),broke);
  s.treasury=90; s.ap=0;
  assert.equal(G.act(s,'farm','nanjing').ok,false);
});
test('event must be resolved, invalid or repeated decisions have no effect', () => {
  const s=G.newGame(7); assert.equal(G.endTurn(s).ok,false);
  assert.equal(G.choose(s,-1).ok,false); assert.equal(G.choose(s,999).ok,false);
  assert.equal(G.choose(s,0).ok,true); const before=JSON.stringify(s);
  assert.equal(G.choose(s,1).ok,false); assert.equal(JSON.stringify(s),before);
  assert.equal(G.endTurn(s).ok,true); assert.equal(s.turn,1);
});
test('forecast is deterministic and end turn applies the advertised attack', () => {
  const a=G.newGame(19); const b=G.newGame(19);
  G.choose(a,0); G.choose(b,0); G.endTurn(a); G.endTurn(b);
  assert.deepEqual(G.forecast(a),G.forecast(b));
  const f=G.forecast(a); G.choose(a,0); G.choose(b,0); G.endTurn(a); G.endTurn(b);
  assert.deepEqual(a,b); assert.ok(a.log.some(l=>l.text.includes(f.city.name)));
});
test('save round trip works; invalid, altered and future versions are rejected', () => {
  const s=G.newGame(10); G.choose(s,0); G.act(s,'farm','nanjing');
  assert.deepEqual(G.decode(G.encode(s)),s);
  for(const bad of ['nope','null','{}',JSON.stringify({...s,version:99}),JSON.stringify({...s,ap:-1}),JSON.stringify({...s,cities:[]}),JSON.stringify({...s,turn:999}),JSON.stringify({...s,treasury:'999'}),JSON.stringify({...s,seed:NaN})]) assert.throws(()=>G.decode(bad));
});
test('dramatic option unavailable in history mode', () => {
  const s=G.newGame(1,false); const last=G.content.events[0].choices.length-1;
  assert.equal(G.choose(s,last).ok,false); assert.equal(G.choose(G.newGame(1,true),last).ok,true);
});
test('no commands or choices can mutate a completed run', () => {
  const s=G.newGame(1); s.over=true; s.result=G.ending(s,'morale');
  const before=JSON.stringify(s);
  assert.equal(G.choose(s,0).ok,false); assert.equal(G.act(s,'farm','nanjing').ok,false); assert.equal(G.endTurn(s).ok,false); assert.equal(JSON.stringify(s),before);
});
test('multiple final outcomes can be reached with distinct state', () => {
  const s=G.newGame(1); s.morale=80; s.inflation=10; s.diplomacy=80;
  assert.equal(G.ending(s).id,'reconstruction');
  s.morale=20; s.inflation=80; assert.equal(G.ending(s).id,'fragile');
  assert.equal(G.ending(s,'food').id,'collapse');
});
test('outgoing calls cost one action, change resources and obey mode/cost constraints', () => {
  const s=G.newGame(22,false); const before=s.army;
  assert.equal(G.act(s,'callMilitary').ok,true); assert.equal(s.ap,2); assert.equal(s.army,before+10); assert.equal(s.treasury,76);
  assert.equal(G.act(s,'callSwitchboard').ok,false);
  s.treasury=0; assert.equal(G.act(s,'callLogistics').ok,false);
  assert.equal(G.act(s,'callFinance').ok,true); assert.equal(s.treasury,20); assert.equal(s.ap,1);
});
test('every event has a zero-cost choice even when all resources are depleted',()=>{
  for(let turn=0;turn<12;turn++){
    const s=G.newGame(2,false);s.turn=turn;for(const key of Object.keys(G.caps))s[key]=0;
    const choice=G.content.events[turn].choices.findIndex(c=>!c.drama&&Object.entries(c.effects).every(([k,v])=>!(['treasury','supplies'].includes(k)&&v<0)));
    assert.notEqual(choice,-1);assert.equal(G.choose(s,choice).ok,true);
  }
});
test('reordering, missing historical decisions and fabricated result are sanitized or rejected',()=>{
  const s=G.newGame(23);G.choose(s,0);G.endTurn(s);G.choose(s,0);G.endTurn(s);
  const bad={...s,decisions:[{turn:1,index:0},{turn:2,index:0}]};assert.throws(()=>G.decode(JSON.stringify(bad)));
  const distorted=JSON.parse(G.encode(s));distorted.cities[0].income=99999;distorted.cities[0].name='malicious';
  const restored=G.decode(JSON.stringify(distorted));assert.equal(restored.cities[0].income,3);assert.equal(restored.cities[0].name,'西安');
});
function simulate(strategy,seed=42){const s=G.newGame(seed),picks=[0,0,0,1,0,0,2,0,1,0,0,2];
  for(let round=0;round<12&&!s.over;round++){
    let r=G.choose(s,strategy==='reckless'?1:picks[s.turn]);if(!r.ok)for(let i=0;i<4&&!s.eventDone;i++)G.choose(s,i);assert.equal(s.eventDone,true);
    for(let i=0;i<3&&s.ap;i++){
      const f=G.forecast(s),id=strategy==='idle'?'':strategy==='reckless'?'bonds':s.industry<7?'industry':s.supplies<28?'farm':f&&!f.safe?'fortify':s.morale<65?'relief':s.inflation>35?'reform':s.diplomacy<50?'diplomacy':'industry';
      if(!id||!G.act(s,id,f?f.city.id:s.capital).ok)break;
    }
    assert.equal(G.endTurn(s).ok,true);assert.deepEqual(G.decode(G.encode(s)),s);
  }return s;
}
test('an economic and defensive strategy reaches the peace ending across seeds',()=>{
  for(const seed of [1,42,123,4294967295]){const s=simulate('steady',seed);assert.equal(s.over,true);assert.equal(s.turn,11);assert.equal(s.result.id,'peace');}
});
test('reckless borrowing collapses while passive play misses the best campaign outcome',()=>{
  const reckless=simulate('reckless'),idle=simulate('idle');assert.equal(reckless.result.id,'collapse');assert.ok(reckless.turn<11);assert.notEqual(idle.result.id,'peace');assert.ok(idle.missions.filter(m=>m.success).length<7);
});
test('attacked capital automatically relocates, and war end restores lost cities',()=>{
  const s=G.newGame(8);G.choose(s,0);G.endTurn(s);s.cities.find(c=>c.id==='shanghai').held=false;s.army=0;s.cities.find(c=>c.id==='nanjing').defense=0;G.choose(s,0);G.endTurn(s);
  assert.notEqual(s.capital,'nanjing');assert.ok(s.cities.find(c=>c.id===s.capital).held);
  s.turn=8;s.eventDone=false;assert.equal(G.forecast(s),null);G.choose(s,0);G.endTurn(s);assert.equal(s.cities.filter(c=>c.held).length,9);
});
test('two turns with inadequate food end the run and save preserves reason priority',()=>{
  const s=G.newGame(3);s.industry=0;s.supplies=0;s.army=0;G.choose(s,0);G.endTurn(s);assert.equal(s.starvation,1);G.choose(s,0);G.endTurn(s);assert.equal(s.over,true);assert.equal(s.result.id,'collapse');assert.deepEqual(G.decode(G.encode(s)),s);
});
