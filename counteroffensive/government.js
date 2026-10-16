(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FrontGovernment=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n)),partyNames={kmt:'国民党',dpp:'民进党'},other=p=>p==='kmt'?'dpp':'kmt';
 const policies={
  reserves:{party:'kmt',name:'整军动员',cost:160,income:.85,mobilization:1.35,repair:1,intercept:0,support:0,goal:'现役陆军合计至少2500人',effect:'新增预备兵总+35%；收入总−15%'},
  coastal:{party:'kmt',name:'沿岸联防',cost:200,income:.95,mobilization:1.15,repair:1,intercept:1,support:0,goal:'一套防空、4枚拦截弹；两城建筑和工厂均80',effect:'新增预备兵+15%、收入−5%；有防空时每轮多拦1枚，最多5枚，仍消耗弹药'},
  commerce:{party:'dpp',name:'商贸开放',cost:160,income:1.2,mobilization:.85,repair:.85,intercept:0,support:0,goal:'经济2、国际观感65；两城工厂均80',effect:'收入总+20%、新增预备兵总−15%、新维修工期−15%；观感+6，已启动秘密科研风险+4'},
  civil:{party:'dpp',name:'民生重建',cost:200,income:1.05,mobilization:.85,repair:.65,intercept:0,support:3,goal:'民心70；两城建筑和工厂均80',effect:'收入总+5%、新增预备兵总−15%、新维修工期−35%；修城额外恢复3民心'}
 };
 function init(s){s.government={version:1,party:'kmt',round:0,nextElection:s.time+90,endorsement:null,policy:null,policyAt:null,reviewAt:null,lastReview:null,wins:{kmt:0,dpp:0},transitions:0,achievements:{reserves:0,coastal:0,commerce:0,civil:0},history:[],notice:null};return s;}
 function bonuses(s){const g=s.government;if(!g)return {income:1,mobilization:1,repair:1,intercept:0,support:0};return g.policy?policies[g.policy]:g.party==='kmt'?{income:.95,mobilization:1.15,repair:1,intercept:0,support:0}:{income:1.1,mobilization:.9,repair:.85,intercept:0,support:0};}
 function polling(s){const g=s.government,h=s.homefront,p=s.civic,w=s.world,facilities=h.cities.reduce((n,c)=>n+c.buildings+c.industry,0)/(h.cities.length*2),reasons=[];
  const support=(h.support-60)*.35,production=(facilities-85)*.12,coord=((p.kmt+p.dpp)/2-50)*.08,debt=p.promise?.phase==='overdue'?-12:0,crisis=p.disruption?-6:0,loss=-h.cities.filter(c=>c.occupied).length*8,nuclear=w.nuclear.used?-15:0,record=g.lastReview?.round===g.round?(g.lastReview.success?3:-5):0;
  reasons.push('民心'+(support>=0?'+':'')+support.toFixed(1),'设施'+(production>=0?'+':'')+production.toFixed(1),'协商'+(coord>=0?'+':'')+coord.toFixed(1));if(debt)reasons.push('失信−12');if(crisis)reasons.push('生产危机−6');if(loss)reasons.push('城市失守'+loss);if(nuclear)reasons.push('核使用−15');if(record)reasons.push('本届政策'+(record>0?'+3':'−5'));
  let incumbent=50+support+production+coord+debt+crisis+loss+nuclear+record;
  if(g.endorsement){incumbent+=g.endorsement===g.party?16:-16;reasons.push(partyNames[g.endorsement]+'竞选议程+16');}
  incumbent=clamp(incumbent,5,95);const kmt=Math.round((g.party==='kmt'?incumbent:100-incumbent)*10)/10;
  return {kmt,dpp:Math.round((100-kmt)*10)/10,reasons};
 }
 function summary(s){const g=s.government;if(!g)return null;return {...polling(s),party:g.party,partyName:partyNames[g.party],round:g.round,remaining:Math.max(0,g.nextElection-s.time),campaign:s.time>=g.nextElection-30&&s.time<g.nextElection,policy:g.policy,reviewRemaining:g.reviewAt===null?null:Math.max(0,g.reviewAt-s.time),bonuses:bonuses(s),policies:Object.entries(policies).filter(([,p])=>p.party===g.party).map(([id,p])=>({id,...p})),defaultEffect:g.party==='kmt'?'新增预备兵+15% · 收入−5%':'收入+10% · 新增预备兵−10% · 新维修工期−15%'};}
 const no=message=>({ok:false,message}),yes=message=>({ok:true,message});
 function available(s){return !s.government?no('这份旧战果没有执政记录。'):s.result?no('本局已经结束。'):s.world.active?no('先回应当前重大新闻。'):s.government.notice?no('先阅读本次选举或政策验收结果。'):null;}
 function endorse(s,party){const error=available(s);if(error)return error;const g=s.government;if(!Object.hasOwn(partyNames,party))return no('没有这个参选党。');if(s.time<g.nextElection-30||s.time>=g.nextElection)return no('投票前一周才能安排竞选议程。');if(g.endorsement)return no('本届已安排一次竞选议程，不能重复叠加。');if(s.strategy.funds<80)return no('竞选议程需要80资金。');s.strategy.funds-=80;g.endorsement=party;return yes('支出80：支持'+partyNames[party]+'竞选议程，得票倾向+16个百分点；投票前仍受政绩和危机影响，不立即换党。');}
 function enact(s,id){const error=available(s);if(error)return error;const g=s.government,p=policies[id];if(!p||p.party!==g.party)return no('只能实施当前执政党的政策。');if(g.policy)return no('每届只实施一项重点政策，投票后可重选。');if(s.strategy.funds<p.cost)return no('需要'+p.cost+'资金落实这项政策。');if(g.nextElection-s.time<60)return no('距投票不足两周，来不及验收；请等新一届政府。');s.strategy.funds-=p.cost;g.policy=id;g.policyAt=s.time;g.reviewAt=s.time+60;g.lastReview=null;if(id==='commerce'){s.world.opinion=clamp(s.world.opinion+6);if(s.world.nuclear.status!=='idle'&&!s.world.nuclear.disclosed)s.world.nuclear.risk=clamp(s.world.nuclear.risk+4);}return yes('已支出'+p.cost+'，实施「'+p.name+'」。两周后检查：'+p.goal+'。政策不代付旧民生承诺。');}
 const ownedHome=s=>s.homefront.cities.every(c=>s.owners[s.towns.find(t=>t.id===c.id).tile]===1);
 const facilities=(s,n,industryOnly=false)=>ownedHome(s)&&s.homefront.cities.every(c=>c.industry>=n&&(industryOnly||c.buildings>=n));
 function goal(s,id){if(id==='reserves')return ownedHome(s)&&s.units.reduce((n,u)=>n+u.force,0)>=2500;if(id==='coastal')return facilities(s,80)&&s.homefront.airDefense.batteries>=1&&s.homefront.airDefense.ammo>=4;if(id==='commerce')return facilities(s,80,true)&&s.strategy.levels.economy>=2&&s.world.opinion>=65;return facilities(s,80)&&s.homefront.support>=70;}
 function record(s,text,kind='info'){s.events.unshift({text,kind,t:s.time});s.events.length=Math.min(14,s.events.length);}
 function tick(s){const g=s.government;if(!g||s.result||g.notice||s.world.active)return;
  if(g.reviewAt!==null&&s.time+1e-8>=g.reviewAt){const id=g.policy,success=goal(s,id);g.reviewAt=null;g.lastReview={round:g.round,policy:id,success,at:s.time};if(success){g.achievements[id]++;s.homefront.support=clamp(s.homefront.support+4);s.civic.kmt=clamp(s.civic.kmt+3);s.civic.dpp=clamp(s.civic.dpp+3);}else{s.homefront.support=clamp(s.homefront.support-6);s.civic[g.party]=clamp(s.civic[g.party]-6);}g.notice={kind:'review',...g.lastReview};s.paused=true;record(s,policies[id].name+(success?'验收通过：真实条件达标，民心+4，两党各+3。':'验收未通过：民心−6，执政党协调−6。'),success?'success':'danger');return;}
  if(s.time+1e-8<g.nextElection)return;const poll=polling(s),previous=g.party,winner=poll.kmt===50?previous:poll.kmt>50?'kmt':'dpp';g.round++;g.wins[winner]++;if(winner!==previous)g.transitions++;g.party=winner;g.nextElection+=180;g.endorsement=null;g.policy=null;g.policyAt=null;g.reviewAt=null;g.lastReview=null;const result={kind:'election',round:g.round,winner,previous,kmt:poll.kmt,dpp:poll.dpp,at:s.time,reasons:poll.reasons};g.history.unshift(result);g.history.length=Math.min(12,g.history.length);g.notice={...result};s.paused=true;record(s,'第'+g.round+'次投票：'+partyNames[winner]+(winner===previous?'连任':'接替执政')+'。军队、城市和旧承诺保留。','success');
 }
 function acknowledge(s){if(!s.government?.notice)return no('当前没有待阅读结果。');if(s.result)return no('本局已结束。');s.government.notice=null;return yes('已阅读结果，战场保持暂停，可先安排本届政策。');}
 const fulfilled=s=>{const g=s.government;return !!g&&g.wins[g.party]>0&&g.lastReview?.round===g.round&&g.lastReview.success&&g.lastReview.policy===g.policy&&g.achievements[g.policy]>0;};
 const militaryEnding=s=>fulfilled(s)&&!s.world.nuclear.used? s.government.party+'_military':'military';
 function conditions(s,id){if(!s.government)return [{label:'需要新版真实选举与执政记录',ok:false}];const g=s.government,party=id.startsWith('kmt')?'kmt':'dpp',dpp=party==='dpp';return [
  {label:partyNames[party]+'当前执政并真实赢过选举',ok:g.party===party&&g.wins[party]>0},
  {label:'本届重点政策已按实际条件验收通过',ok:fulfilled(s)},
  {label:'筹备至少6周，尚未宣战',ok:s.time>=180&&s.strategy.phase==='preparation'},
  {label:dpp?'经济3、外交2、国际观感75':'经济2、科技2、外交2、国际观感65',ok:s.strategy.levels.economy>=(dpp?3:2)&&s.strategy.levels.diplomacy>=2&&(dpp||s.strategy.levels.technology>=2)&&s.world.opinion>=(dpp?75:65)},
  {label:dpp?'民心75，两城建筑工厂均90':'民心70，两城建筑工厂均80',ok:s.homefront.support>=(dpp?75:70)&&facilities(s,dpp?90:80)},
  {label:'没有未兑现的民生承诺或生产危机',ok:!s.civic?.promise&&!s.civic?.disruption},
  {label:'从未实际使用核武',ok:s.world.nuclear.used===0}
 ];}
 function validate(s,value){const bad=()=>{throw Error('选举、执政或政策记录无效。');},num=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b,int=(n,a,b)=>Number.isInteger(n)&&num(n,a,b),party=p=>Object.hasOwn(partyNames,p),policy=p=>Object.hasOwn(policies,p);const g=value;
  if(!g||g.version!==1||!party(g.party)||!int(g.round,0,1000)||!num(g.nextElection,s.time-0.21,s.time+180.21)||!(g.endorsement===null||party(g.endorsement))||!(g.policy===null||policy(g.policy)&&policies[g.policy].party===g.party)||!g.wins||!int(g.wins.kmt,0,g.round)||!int(g.wins.dpp,0,g.round)||g.wins.kmt+g.wins.dpp!==g.round||!int(g.transitions,0,g.round)||!g.achievements||Object.keys(policies).some(id=>!int(g.achievements[id],0,g.round+1))||!Array.isArray(g.history)||g.history.length!==Math.min(12,g.round))bad();
  if(g.round===0&&(g.party!=='kmt'||g.transitions!==0))bad();
  if(Object.keys(g.achievements).length!==Object.keys(policies).length||Object.keys(policies).reduce((n,id)=>n+g.achievements[id],0)>g.round+1)bad();
  if(g.policy===null?(g.policyAt!==null||g.reviewAt!==null||g.lastReview!==null):!num(g.policyAt,g.history[0]?.at||0,s.time))bad();
  if(g.reviewAt!==null&&(!num(g.reviewAt,g.policyAt,s.time+60.21)||Math.abs(g.reviewAt-g.policyAt-60)>1e-5||g.lastReview!==null))bad();
  const review=r=>r&&r.round===g.round&&r.policy===g.policy&&typeof r.success==='boolean'&&num(r.at,g.policyAt+60-1e-8,s.time)&&(r.success?g.achievements[r.policy]>0:true);
  if(g.lastReview!==null&&(!review(g.lastReview)||g.reviewAt!==null)||g.policy!==null&&g.reviewAt===null&&g.lastReview===null)bad();
  const election=r=>r&&r.kind==='election'&&int(r.round,1,g.round)&&party(r.winner)&&party(r.previous)&&num(r.kmt,5,95)&&num(r.dpp,5,95)&&Math.abs(r.kmt+r.dpp-100)<1e-5&&r.winner===(r.kmt===50?r.previous:r.kmt>50?'kmt':'dpp')&&num(r.at,0,s.time)&&Array.isArray(r.reasons)&&r.reasons.length<=12&&r.reasons.every(x=>typeof x==='string'&&x.length<100);
  if(g.history.some((r,i)=>!election(r)||r.round!==g.round-i)||g.round>0&&(g.history[0].winner!==g.party||g.wins[g.party]===0))bad();
  if(g.notice!==null){const n=g.notice;if(n.kind==='election'? !election(n)||JSON.stringify(n)!==JSON.stringify(g.history[0]):n.kind!=='review'||!review(n))bad();if(!s.paused&&!s.result)bad();}
  return JSON.parse(JSON.stringify(g));
 }
 return {partyNames,policies,init,bonuses,summary,endorse,enact,tick,acknowledge,fulfilled,militaryEnding,conditions,validate,record};
});
