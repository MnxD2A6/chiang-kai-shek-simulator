(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./civic-core.js'),require('./government.js'),require('./civic.js'));else root.FrontCore=factory(root.FrontCore,root.FrontGovernment,root.FrontCivics);})(typeof globalThis!=='undefined'?globalThis:this,function(Base,G,D){
 'use strict';
 const F={...Base};F.createStrategic=seed=>G.init(Base.createStrategic(seed));F.electionSummary=G.summary;
 const action=fn=>(s,...args)=>{const r=fn(s,...args);if(r.ok)G.record(s,r.message,'success');return r;};
 F.electionAction=action(G.endorse);F.enactPolicy=action(G.enact);F.acknowledgeGovernment=G.acknowledge;
 F.togglePause=s=>{if(s.result||s.world.active||s.government?.notice)return {ok:false,message:'先阅读选举、验收或重大新闻，再继续时间。'};s.paused=!s.paused;return {ok:true,message:s.paused?'已暂停，可继续下令。':'时间继续。'};};
 F.step=(s,dt)=>{if(s.paused||s.result||s.government?.notice||!Number.isFinite(dt)||dt<=0)return;const before=s.time;Base.step(s,dt);if(s.time>before&&!s.result){G.tick(s);D.before(s);}};
 F.encode=s=>JSON.stringify({...JSON.parse(Base.encode(s)),version:16,government:s.government});
 F.decode=text=>{const raw=JSON.parse(text);if(raw.version!==16)return G.init(Base.decode(text));if(!raw.government)throw Error('缺少本局选举记录。');const s=Base.decode(JSON.stringify({...raw,version:15}));s.government=G.validate(s,raw.government);if(['kmt_compact','dpp_compact'].includes(s.finale.ending)&&G.conditions(s,s.finale.ending).some(c=>!c.ok))throw Error('执政结局尚未兑现。');return s;};
 return F;
});
