(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./homefront-core.js'),require('./endings.js'),require('./government.js'));else root.FrontCore=factory(root.FrontCore,root.FrontEndings,root.FrontGovernment);})(typeof globalThis!=='undefined'?globalThis:this,function(Base,E,G){
 'use strict';
 const F={...Base},no=message=>({ok:false,message}),yes=message=>({ok:true,message});
 function init(s,legacy=false){if(legacy&&s.result==='defeat'&&!s.homefront.defeatReason){const h=s.homefront;h.defeatReason=h.support<=0?'support':s.strategy.integrity<=0?'infrastructure':h.homeLost>=15?'cities':null;}s.finale={version:1,ending:s.result==='victory'?(s.world.ending==='deterrence'?'deterrence':legacy?'legacy_military':s.world.nuclear.used?'nuclear_military':'military'):s.result==='defeat'?E.failure(s):null,epilogue:null,secured:0,paid:0};return s;}
 F.createStrategic=seed=>init(Base.createStrategic(seed));
 F.worldChoice=function(s,...args){const r=Base.worldChoice(s,...args);if(r.ok&&s.result==='victory'&&s.world.ending==='deterrence')s.finale.ending='deterrence';return r;};
 F.endingCatalog=E.catalog;F.routeEndings=s=>E.options(s).map(e=>({...e,ready:e.ready&&!s.result&&!s.world.active}));
 F.endingFor=s=>{const id=s.finale?.ending||s.world.ending;if(!id||!Object.hasOwn(E.catalog,id))return null;return {id,...(s.finale?.epilogue?{...E.epilogues[s.finale.epilogue],route:s.finale.epilogue,kind:'军事胜利 · 路线战后分支'}:E.catalog[id])};};
 F.finishRoute=function(s,id){if(s.result||s.world.active)return no(s.result?'本局已经结束。':'先处理当前重大新闻，再决定收官。');const option=E.evaluate(s,id);if(!option||!option.ready)return no(option?.conditions.find(c=>!c.ok)?.label||'当前没有可执行的收官方案。');s.strategy.funds-=option.cost;s.finale.ending=id;s.finale.paid=option.cost;s.result='victory';s.paused=true;s.events.unshift({text:option.title+'：已承担 '+option.cost+' 资金的收官安排。',kind:'success',t:s.time});s.events.length=Math.min(14,s.events.length);return yes('已达成「'+option.title+'」。');};
 F.epilogueChoices=function(s){if(s.result!=='victory'||!['military','kmt_military','dpp_military'].includes(s.finale?.ending)||s.finale.epilogue||s.world.nuclear.used||!Base.victoryProgress(s).ready)return [];return Object.values(s.world.preparation.projects).filter(p=>p.phase==='complete'&&Object.hasOwn(E.epilogues,p.route)).map(p=>({route:p.route,...E.epilogues[p.route]}));};
 F.chooseEpilogue=function(s,route){if(!F.epilogueChoices(s).some(e=>e.route===route))return no('只能选择本局已兑现的路线，战后方向仅确认一次。');s.finale.epilogue=route;return yes('已选择「'+E.epilogues[route].title+'」作为战后方向。');};
 F.step=function(s,dt){if(s.paused||s.result||!Number.isFinite(dt)||dt<=0)return;const before=s.time;Base.step(s,dt);const elapsed=s.time-before;if(elapsed<=0)return;
  if(s.result==='victory'){
   if(s.world.ending==='deterrence')s.finale.ending='deterrence';
   else if(s.world.nuclear.used&&!E.retaliationResolved(s)){s.result=null;}
   else s.finale.ending=s.world.nuclear.used?'nuclear_military':G.militaryEnding(s);
  }
  if(s.result==='defeat')s.finale.ending=E.failure(s);
  if(!s.result){const h=s.homefront;s.finale.secured=s.strategy.phase==='war'&&h.salvos>=2&&h.invasion.repelled>=2&&E.safe(s)?Math.min(30,s.finale.secured+elapsed):0;}
 };
 F.encode=s=>JSON.stringify({...JSON.parse(Base.encode(s)),version:13,finale:s.finale,...(s.government?{government:s.government}:{})});
 F.decode=function(text){const raw=JSON.parse(text);if(raw.version!==13)return init(Base.decode(text),true);const f=raw.finale,bad=()=>{throw Error('结局或战后方向存档无效。');};
  if(!f||f.version!==1||!(f.ending===null||Object.hasOwn(E.catalog,f.ending))||!(f.epilogue===null||Object.hasOwn(E.epilogues,f.epilogue))||!Number.isFinite(f.secured)||f.secured<0||f.secured>30||!Number.isFinite(f.paid)||f.paid<0||f.paid>1000)bad();
  const s=Base.decode(JSON.stringify({...raw,version:12}));s.finale=JSON.parse(JSON.stringify(f));if(raw.government)s.government=G.validate(s,raw.government);
  if(f.ending===null){if(raw.result!==null||f.epilogue!==null||f.paid!==0)bad();return s;}
  if(raw.result!==E.catalog[f.ending].result)bad();
  if(Object.hasOwn(E.costs,f.ending)){if(f.paid!==E.costs[f.ending]||s.world.ending!==null||!E.evaluate(s,f.ending,f.paid).ready)bad();}
  else if(f.paid!==0)bad();
  if(f.ending==='military'&&(!Base.victoryProgress(s).ready||s.world.nuclear.used)||f.ending==='nuclear_military'&&(!Base.victoryProgress(s).ready||!s.world.nuclear.used||!E.retaliationResolved(s)))bad();
  if(['kmt_military','dpp_military'].includes(f.ending)&&(!Base.victoryProgress(s).ready||!s.government||G.militaryEnding(s)!==f.ending))bad();
  if(f.ending==='deterrence'&&s.world.ending!=='deterrence')bad();
  if(f.ending==='legacy_military'&&(s.result!=='victory'||s.towns.filter(t=>t.goal&&s.owners[t.tile]===1).length!==3))bad();
  if(E.catalog[f.ending].result==='defeat'&&(raw.result!=='defeat'||E.failure(s)!==f.ending))bad();
  if(E.catalog[f.ending].result==='defeat'){const h=s.homefront,reason=h.defeatReason,valid=reason==='support'?h.support<=0:reason==='infrastructure'?s.strategy.integrity<=0:reason==='cities'?h.homeLost>=15:Base.landCount(s,1)===0;if(!valid)bad();}
  if(f.epilogue&&(!['military','kmt_military','dpp_military'].includes(f.ending)||!Object.values(s.world.preparation.projects).some(p=>p.phase==='complete'&&p.route===f.epilogue)))bad();
  s.result=raw.result;return s;
 };
 return F;
});
