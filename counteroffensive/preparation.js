(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FrontPreparation=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const catalog={
  industry:{name:'日本产线订单',level:'economy',budget:100,routes:['exports','resilience']},
  defense:{name:'防空与抢修合作',level:'technology',budget:120,routes:['joint','domestic']},
  diplomacy:{name:'俄方机甲售后风波',level:'diplomacy',budget:90,routes:['delay','expose']}
 };
 const phases=['locked','offered','deferred','active','review','complete','declined','cancelled'];
 const eventIds=Object.keys(catalog).flatMap(k=>['prep_'+k+'_offer','prep_'+k+'_delivery']);
 function init(s){s.world.preparation={version:1,nextOffer:s.time+22,projects:Object.fromEntries(Object.keys(catalog).map(k=>[k,{phase:'locked',route:null,acceptedAt:null}]))};return s.world.preparation;}
 const state=s=>s.world?.preparation;
 const completed=(s,key,route)=>state(s)?.projects[key]?.phase==='complete'&&state(s).projects[key].route===route;
 const tradeOpen=s=>!!s.strategy.partners.japan&&s.world.sanctions<2&&s.world.relations.japan>-30&&!s.world.flags.duckBlockade;
 const jointOpen=s=>!!s.strategy.partners.usa&&s.world.relations.usa>=10&&s.world.sanctions===0&&!s.world.flags.koreaWar;
 function bonuses(s){return {income:completed(s,'industry','exports')&&tradeOpen(s)?3:0,damageFactor:completed(s,'industry','resilience')?.8:1,repairTime:completed(s,'defense','domestic')?8:12,interceptBonus:completed(s,'defense','joint')&&jointOpen(s)?1:0,warningBonus:completed(s,'defense','joint')&&jointOpen(s)?4:0,researchRisk:completed(s,'defense','joint')?8:0,russianDelay:completed(s,'diplomacy','delay')?30:0,russianFactor:completed(s,'diplomacy','expose')?.75:1};}
 function requirement(s,key,route){
  const level=s.strategy.levels,partners=s.strategy.partners;
  if(key==='industry')return level.economy<2?'经济建设还需达到2级':route==='exports'&&!partners.japan?'还需完成日本合作':route==='exports'&&!tradeOpen(s)?'日本贸易受阻，先处理封锁或修复关系':'';
  if(key==='defense')return level.technology<2?'科技研发还需达到2级':route==='joint'&&!partners.usa?'还需完成美国合作':route==='joint'&&!jointOpen(s)?'美国军售条件暂不满足，先修复关系或航路':'';
  return route==='delay'&&s.world.relations.russia<0?'俄罗斯态度还需达到0':route==='expose'&&s.world.opinion<65?'国际观感还需达到65':'';
 }
 function available(s,e){
  if(!e)return {ok:true,reason:''};const p=state(s)?.projects[e.project],info=catalog[e.project];
  if(!p||s.strategy.phase!=='preparation')return {ok:false,reason:'这项议程仅在筹备期办理'};
  if(e.stage==='enroll')return {ok:p.phase==='offered'&&info.routes.includes(e.route),reason:'当前没有可签署的新方案'};
  if(e.stage==='decline'||e.stage==='defer')return {ok:p.phase==='offered',reason:'这项方案已处理'};
  if(e.stage==='cancel')return {ok:p.phase==='review',reason:'当前没有待验收项目'};
  if(e.stage!=='complete'||p.phase!=='review'||p.route!==e.route)return {ok:false,reason:'你未签署这条路线，不能领取其收益'};
  const reason=requirement(s,e.project,e.route);return {ok:!reason,reason};
 }
 function apply(s,e){const p=state(s).projects[e.project];
  if(e.stage==='enroll'){p.phase='active';p.route=e.route;p.acceptedAt=s.time;}
  else if(e.stage==='complete'){p.phase='complete';if(e.project==='diplomacy'&&e.route==='expose')for(const a of s.naval.ground)if(a.key==='russia')a.force*=.75;}
  else p.phase=e.stage==='defer'?'deferred':e.stage==='decline'?'declined':'cancelled';
 }
 function onWar(s){const p=state(s);if(!p)return;let count=0;for(const a of Object.values(p.projects))if(['offered','active','review'].includes(a.phase)){a.phase='cancelled';count++;}
  s.world.queue=s.world.queue.filter(q=>!eventIds.includes(q.id));if(count){s.world.news.unshift({text:'开战：'+count+'项未兑现的战前议程已中止，已完成项目的收益保留。',kind:'diplomacy',at:s.time});s.world.news.length=Math.min(50,s.world.news.length);}
 }
 function schedule(s,queue,random){const p=state(s);if(!p||!s.homefront)return;if(s.strategy.phase!=='preparation'){onWar(s);return;}
  for(const [key,a] of Object.entries(p.projects))if(a.phase==='active'&&s.time-a.acceptedAt>=24&&!requirement(s,key,a.route)){
   if(queue(s,'prep_'+key+'_delivery',0).ok)a.phase='review';return;
  }
  if(s.world.active||s.time<p.nextOffer||s.world.queue.some(q=>eventIds.includes(q.id)))return;
  const candidates=Object.keys(catalog).filter(k=>p.projects[k].phase==='locked'&&s.strategy.levels[catalog[k].level]>=1&&s.strategy.funds>=catalog[k].budget);if(!candidates.length)return;
  const key=candidates[Math.floor(random(s)*candidates.length)];if(queue(s,'prep_'+key+'_offer',0).ok){p.projects[key].phase='offered';p.nextOffer=s.time+30+random(s)*12;}
 }
 const benefits={exports:'出口税收 +3/模拟秒，受日本贸易状态影响',resilience:'城市建筑与工厂的导弹物理损伤 −20%',joint:'联合预警 +4模拟秒；有防空时每轮多拦1枚；秘密科研初始风险 +8',domestic:'160资金重建用时由12缩短至8模拟秒',delay:'俄方常规援军出发与抵达延后1周',expose:'俄方常规援军与后续机甲兵力 −25%'};
 function describe(s,text){const pace=s.campaign?.pace||.5,seconds=n=>Math.ceil(n/pace);return text.replaceAll('出口税收 +3/模拟秒','出口税收 +'+(3*pace).toFixed(1)+'/秒').replaceAll('预警 +4模拟秒','预警 +'+seconds(4)+'秒').replaceAll('用时由12缩短至8模拟秒','用时由'+seconds(12)+'缩短至'+seconds(8)+'秒').replaceAll('仅需8模拟秒','仅需'+seconds(8)+'秒');}
 function summary(s){const p=state(s);return Object.entries(catalog).map(([id,info])=>{const a=p?.projects[id]||{phase:'locked',route:null},wait=a.acceptedAt===null?0:Math.max(0,24-(s.time-a.acceptedAt));let detail;
   if(a.phase==='locked')detail=s.strategy.phase!=='preparation'?'本局未开展，已进入战时':s.strategy.levels[info.level]>=1?(s.strategy.funds<info.budget?'预留'+info.budget+'资金后可遇到议题':'发展与预算已齐，等待筹备议题'):({economy:'经济',technology:'科技',diplomacy:'外交'})[info.level]+'达到1级后出现议题';
   else if(a.phase==='offered')detail='等待你的事件回应';
   else if(a.phase==='deferred')detail=s.strategy.phase==='preparation'?'已暂缓，可到发展面板重新洽谈':'未开展，已进入战时';
   else if(a.phase==='active')detail=requirement(s,id,a.route)||(wait>0?'条件已齐，约'+Math.ceil(wait/(s.campaign?.pace||.5))+'秒后验收':'条件已齐，等待验收新闻');
   else if(a.phase==='review')detail='验收新闻已到，选择兑现或取消';
   else if(a.phase==='complete')detail=id==='industry'&&a.route==='exports'&&!tradeOpen(s)?'收益暂停：日本贸易受阻':id==='defense'&&a.route==='joint'&&!jointOpen(s)?'联合预警暂停：美国关系或航路受阻':'收益已生效';
   else detail=a.phase==='declined'?'本局未参与':'项目已中止';
   return {id,name:info.name,phase:a.phase,route:a.route,detail,effect:a.route?describe(s,benefits[a.route]):'两种路线任选其一，达标后兑现'};
  });}
 function validate(s,v){const bad=()=>{throw Error('战前议程存档无效。');},num=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b,decisions=[...s.world.queue.map(q=>q.id),...(s.world.active?[s.world.active.id]:[])];if(v===undefined){if(decisions.some(id=>eventIds.includes(id)))bad();return init(s);}
  if(!v||v.version!==1||!num(v.nextOffer,0,s.time+43)||!v.projects||Object.keys(v.projects).length!==3)bad();
  for(const [key,info] of Object.entries(catalog)){const a=v.projects[key];if(!a||!phases.includes(a.phase)||!(a.route===null||info.routes.includes(a.route))||!(a.acceptedAt===null||num(a.acceptedAt,0,s.time)))bad();
   if(['locked','offered','deferred','declined'].includes(a.phase)&&(a.route!==null||a.acceptedAt!==null)||['active','review','complete'].includes(a.phase)&&(a.route===null||a.acceptedAt===null))bad();
   const offer='prep_'+key+'_offer',delivery='prep_'+key+'_delivery';if((a.phase==='offered')!==decisions.includes(offer)||(a.phase==='review')!==decisions.includes(delivery))bad();
  }s.world.preparation=JSON.parse(JSON.stringify(v));return s.world.preparation;
 }
 return {catalog,eventIds,init,bonuses,available,apply,onWar,schedule,summary,validate,describe};
});
