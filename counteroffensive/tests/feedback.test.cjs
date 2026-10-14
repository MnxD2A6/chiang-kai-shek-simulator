const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../naval-core.js'),Feedback=require('../battle-feedback.js');
const advance=(s,n)=>{for(let i=0;i<n*10;i++)F.step(s,.1);};
test('a real missile launch and impact produce one cue each, not one cue per frame',()=>{
 const s=F.createStrategic(42),f=new Feedback(F);f.read(s);F.startWar(s);
 const town=s.towns.find(t=>t.id==='fuzhou');assert.ok(F.missile(s,{tile:town.tile}).ok);
 assert.equal(f.read(s).filter(e=>e.type==='launch').length,1);
 for(let i=0;i<10;i++)assert.equal(f.read(s).length,0);
 const events=[];for(let i=0;i<45;i++){F.step(s,.1);events.push(...f.read(s));}
 assert.equal(events.filter(e=>e.type==='impact'&&e.kind==='missile').length,1);
 assert.equal(f.read(s).length,0);
});
test('loading active events, pausing, and restarting do not replay old combat audio',()=>{
 const s=F.createStrategic(43);F.startWar(s);F.missile(s,{tile:s.towns.find(t=>t.id==='fuzhou').tile});
 const f=new Feedback(F);assert.deepEqual(f.read(s),[]);s.paused=true;advance(s,2);assert.deepEqual(f.read(s),[]);
 const fresh=F.createStrategic(99);assert.deepEqual(f.read(fresh),[]);
});
test('gun feedback follows real weapon damage and cooldown changes',()=>{
 const s=F.createStrategic(44);F.startWar(s);const a=s.naval.ships.find(a=>a.kind==='destroyer');
 const b={...a,id:s.serial++,faction:3,name:'test enemy',path:[],kind:'destroyer',cargo:null,ammo:0};s.naval.ships=[a,b];
 const f=new Feedback(F);f.read(s);F.step(s,.1);const cues=f.read(s);
 assert.ok(a.hp<260&&b.hp<260);assert.equal(cues.filter(e=>e.type==='gun').length,2);assert.equal(f.read(s).length,0);
});
test('city capture, warning, and airstrike cues are edge triggered',()=>{
 const s=F.createStrategic(45),f=new Feedback(F);f.read(s);F.startWar(s);
 F.claim(s,s.towns.find(t=>t.id==='fuzhou').tile,1);assert.equal(f.read(s).filter(e=>e.type==='capture').length,1);
 const events=[];for(let i=0;i<450;i++){F.step(s,.1);events.push(...f.read(s));}
 assert.equal(events.filter(e=>e.type==='warning').length,1);assert.equal(events.filter(e=>e.type==='airstrike').length,1);
 assert.equal(f.read(s).length,0);
});

test('a missile ordered while paused sounds once when simulation resumes',()=>{const s=F.createStrategic(46),f=new Feedback(F);F.startWar(s);f.read(s);s.paused=true;F.missile(s,{tile:s.towns.find(t=>t.id==='fuzhou').tile});assert.deepEqual(f.read(s),[]);s.paused=false;F.step(s,.1);assert.equal(f.read(s).filter(e=>e.type==='launch').length,1);assert.equal(f.read(s).length,0);});
test('a newly arrived gunship can produce its first real firing cue',()=>{const s=F.createStrategic(47),a=s.naval.ships.find(a=>a.kind==='destroyer');F.startWar(s);s.naval.ships=[a];const f=new Feedback(F);f.read(s);const b={...a,id:s.serial++,faction:3,name:'new enemy',path:[],cargo:null};s.naval.ships.push(b);F.step(s,.1);assert.ok(f.read(s).some(e=>e.type==='gun'&&e.id===b.id));});
