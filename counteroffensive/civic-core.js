(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./endings-core.js'),require('./civic.js'));else root.FrontCore=factory(root.FrontCore,root.FrontCivics);})(typeof globalThis!=='undefined'?globalThis:this,function(Base,D){
 'use strict';
 const F={...Base};F.createStrategic=seed=>D.init(Base.createStrategic(seed));F.civicSummary=s=>D.summary(s);
 F.routeEndings=s=>Base.routeEndings(s).map(e=>({...e,conditions:[...e.conditions,{label:'民心归零危机已经解除',ok:s.homefront.support>0}],ready:e.ready&&s.homefront.support>0}));
 F.finishRoute=(s,id)=>s.homefront.support<=0?{ok:false,message:'先用救济、协商或新闻回应恢复民心，再决定收官。'}:Base.finishRoute(s,id);
 F.civicAction=(s,key)=>{const r=D.action(s,key);if(r.ok){s.events.unshift({text:r.message,kind:'success',t:s.time});s.events.length=Math.min(14,s.events.length);}return r;};
 F.worldChoiceAvailable=(s,c)=>{const base=Base.worldChoiceAvailable(s,c);if(!base.ok)return base;if(c.effects.ending&&s.homefront.support<=0)return {ok:false,reason:'先恢复民心，再确认结束本局。'};return D.available(s,c.effects.civic);};
 F.worldChoice=(s,token,id)=>{const current=s.world.active,c=current?.token===token?F.worldEvents[current.id].choices.find(c=>c.id===id):null;if(c){const available=F.worldChoiceAvailable(s,c);if(!available.ok)return {ok:false,message:available.reason};}const r=Base.worldChoice(s,token,id);if(r.ok&&c?.effects.civic){D.apply(s,c.effects.civic);D.record(s,current.id,c.id);}return r;};
 F.step=(s,dt)=>{if(s.paused||s.result||!Number.isFinite(dt)||dt<=0)return;D.before(s);const before=s.time;Base.step(s,dt);const elapsed=s.time-before;if(elapsed>0&&!s.result)D.tick(s,elapsed,F.queueWorldEvent);};
 F.encode=s=>JSON.stringify({...JSON.parse(Base.encode(s)),version:14,civic:s.civic});
 F.decode=text=>{const raw=JSON.parse(text);if(raw.version!==14){const s=D.init(Base.decode(text));if(!s.result&&s.homefront.support<=0)D.before(s);return s;}const s=Base.decode(JSON.stringify({...raw,version:13}));s.civic=D.validate(s,raw.civic);return s;};
 return F;
});
