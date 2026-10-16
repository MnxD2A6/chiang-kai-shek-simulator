(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./civic-events.js'));else root.FrontCivics=factory(root.FrontCivicEvents);})(typeof globalThis!=='undefined'?globalThis:this,function(Events){
 'use strict';
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n)),active=(s,key)=>!!s.civic&&s.civic[key]>s.time;
 const extras=()=>({promise:null,speeches:0,review:null,serviceUntil:0,austerityUntil:0,deadlockDue:null,nextDeadlock:0});
 function init(s){s.civic={version:2,kmt:60,dpp:45,rng:(s.seed^0x28c1a43)>>>0,nextDebate:s.time+45,nextForeign:s.time+45,foreignAt:0,cooldowns:{relief:0,consult:0},warning:null,disruption:null,collapseAt:s.result==='defeat'&&s.homefront.support<=0?s.time:null,accordUntil:0,burdenUntil:0,lastSalvos:s.homefront.salvos,lastNuclear:s.world.nuclear.used,warSeen:s.strategy.phase==='war',outflows:0,history:[],...extras()};return s;}
 const deadlocked=s=>!!s.civic&&Math.min(s.civic.kmt,s.civic.dpp)<35;
 function income(s){const p=s.civic;if(!p)return 1;const labour=p.disruption&&p.disruption.until>s.time?{strike:.75,protest:.7,outflow:.8}[p.disruption.kind]:1;return (active(s,'accordUntil')?1.05:1)*(active(s,'burdenUntil')?.85:1)*(active(s,'austerityUntil')?.8:1)*(deadlocked(s)?.85:1)*(p.promise?.phase==='overdue'?.85:1)*labour;}
 function mobilization(s){if(!s.civic)return 1;return (deadlocked(s)?.75:1)*(active(s,'serviceUntil')?.75:1)*(active(s,'austerityUntil')?.75:1)*(s.civic.promise?.phase==='overdue'?.7:1)*(s.civic.disruption&&s.civic.disruption.until>s.time?.8:1);}
 const repairTime=(s,base)=>Math.max(6,base-(active(s,'accordUntil')?2:0));
 const terminal=s=>!s.civic||(s.civic.collapseAt!==null&&s.time+1e-8>=s.civic.collapseAt);
 const risk=s=>s.homefront.support<=0?'collapse':s.homefront.support<=15?'flight':s.homefront.support<=30?'protest':s.homefront.support<50?'strike':null;
 const removeQueued=(s,...ids)=>{s.world.queue=s.world.queue.filter(q=>!ids.includes(q.id));};
 function prune(s){if(!s.civic)return;const p=s.civic,stale=id=>id==='civic_promise_due'&&(!p.promise||p.promise.phase!=='overdue')||id==='civic_recovery_check'&&(!p.review||p.review.due>s.time+1e-8)||id==='civic_deadlock'&&!deadlocked(s);s.world.queue=s.world.queue.filter(q=>!stale(q.id));if(s.world.active&&stale(s.world.active.id)){s.world.active=null;s.paused=false;}}
 function before(s){if(!s.civic||s.result)return;const p=s.civic,kind=risk(s);if(s.homefront.support<=0&&p.collapseAt===null)p.collapseAt=s.time+30;if(s.homefront.support>0)p.collapseAt=null;
  if(!kind){p.warning=null;return;}if(kind!=='collapse'&&p.disruption&&p.disruption.until>s.time){p.warning=null;return;}
  if(!p.warning||kind==='collapse'&&p.warning.kind!=='collapse'||kind!=='collapse'&&p.warning.kind==='collapse')p.warning={kind,startedAt:s.time,due:kind==='collapse'?p.collapseAt:s.time+30,announced:false};else p.warning.kind=kind;
 }
 function notice(s,text){s.events.unshift({text,kind:'danger',t:s.time});s.events.length=Math.min(14,s.events.length);s.world.news.unshift({text,kind:'danger',at:s.time});s.world.news.length=Math.min(50,s.world.news.length);}
 function record(s,id,choice){s.civic.history.unshift({id,choice,at:s.time});s.civic.history.length=Math.min(20,s.civic.history.length);}
 function promise(s,kind){const p=s.civic;p.speeches=Math.min(6,p.speeches+1);if(!p.promise)p.promise={kind,createdAt:s.time,due:s.time+45,phase:'pending',reminded:false};else{const loss=Math.min(8,p.speeches*2);s.homefront.support=clamp(s.homefront.support-loss);p.kmt=clamp(p.kmt-2);p.dpp=clamp(p.dpp-2);notice(s,'再次表态但承诺仍未兑现：民心 −'+loss+'，两党信任继续下滑；原截止时间不变。');}}
 function clearBill(s){const p=s.civic;p.promise=null;p.speeches=0;removeQueued(s,'civic_promise_due');}
 function apply(s,e={}){const p=s.civic;if(!p)return;p.kmt=clamp(p.kmt+(e.kmt||0));p.dpp=clamp(p.dpp+(e.dpp||0));s.homefront.support=clamp(s.homefront.support+(e.support||0));
  if(e.accord)p.accordUntil=s.time+e.accord;if(e.burden)p.burdenUntil=s.time+e.burden;
  if(e.calm){p.disruption=null;p.warning=null;}if(e.shorten&&p.disruption)p.disruption.until=Math.min(p.disruption.until,s.time+e.shorten);
  if(e.promise)promise(s,e.promise);
  if(e.settle||e.fund){clearBill(s);p.serviceUntil=Math.max(p.serviceUntil,s.time+30);p.review={due:s.time+45,queued:false};removeQueued(s,'civic_recovery_check');}
  if(e.service)p.serviceUntil=Math.max(p.serviceUntil,s.time+e.service);
  if(e.cuts){clearBill(s);p.review=null;removeQueued(s,'civic_recovery_check');p.austerityUntil=Math.max(p.austerityUntil,s.time+90);}
  if(e.recheck)p.review={due:s.time+45,queued:false};if(e.verify||e.withdraw)p.review=null;
  if(e.outflow){p.outflows++;p.disruption={kind:'outflow',until:s.time+60};p.warning=null;}
  if(e.restraint&&s.strategy.phase==='preparation'){s.campaign.restraintUntil=s.time+e.restraint;s.campaign.pending=null;s.campaign.nextReaction=Math.max(s.campaign.nextReaction,s.time+36);}
  prune(s);before(s);
 }
 function available(s,e){if(!e)return {ok:true,reason:''};const no=reason=>({ok:false,reason});if(!s.civic)return no('请从新版实时入口体验岛内议题。');if(e.settle&&!s.civic.promise)return no('当前没有待兑现承诺。');if((e.verify||e.recheck||e.withdraw)&&(!s.civic.review||s.civic.review.due>s.time+1e-8))return no('当前没有到期的民生验收。');if(e.verify&&!s.homefront.cities.every(c=>!c.occupied&&c.buildings>=80&&c.industry>=80))return no('两座本岛城市的建筑和工厂均需恢复到80%以上；先安排真实重建。');return {ok:true,reason:''};}
 function action(s,key){const p=s.civic,no=message=>({ok:false,message});if(s.result)return no('本局已结束。');if(s.world.active)return no('先回应当前重大新闻，再安排民生与协商。');if(!p||!['relief','consult'].includes(key))return no('没有这项岛内安排。');if(s.time+1e-8<p.cooldowns[key])return no('本轮安排正在落实，请等待下一轮。');const settle=key==='relief'&&!!p.promise,cost=key==='relief'?(settle?140:90):80;if(s.strategy.funds<cost)return no('需要 '+cost+' 资金。');if(key==='relief'&&s.homefront.support>=100&&!p.disruption&&!settle)return no('目前无需追加生活救济。');if(key==='consult'&&active(s,'accordUntil')&&Math.min(p.kmt,p.dpp)>=65)return no('预算协作正在生效，暂不需要重复协调。');
  s.strategy.funds-=cost;p.cooldowns[key]=s.time+60;
  apply(s,key==='relief'?{support:settle?10:8,kmt:settle?4:1,dpp:settle?4:1,calm:true,settle,service:30}:{kmt:8,dpp:8,accord:60});record(s,key,'action');
  return {ok:true,message:key==='relief'?'已支出'+cost+'：'+(settle?'落实承诺，民心+10；1.5周后检查本岛设施。':'民心+8，解除本轮生产扰动。')+' 民用救济占用一周运力，新增预备兵−25%；两周后可再安排。':'已支出80：两党协调各+8，不代付民生承诺；两周收入+5%，新重建工程快2模拟秒。'};
 }
 const queued=(s,id,queue)=>s.world.active?.id===id||s.world.queue.some(q=>q.id===id)||queue(s,id,0).ok;
 function tick(s,dt,queue){if(!s.civic||s.result)return;const p=s.civic;if(p.disruption&&p.disruption.until<=s.time)p.disruption=null;
  const damage=s.homefront.cities.reduce((n,c)=>n+(200-c.buildings-c.industry)/200,0)/s.homefront.cities.length;
  const drain=(s.strategy.phase==='war'?2:0)+damage*6+(p.promise?.phase==='overdue'?8:0)+(p.disruption?.kind==='protest'?3:0);
  s.homefront.support=clamp(s.homefront.support-dt*drain/30);
  if(p.promise&&p.promise.phase==='pending'&&s.time+1e-8>=p.promise.due){p.promise.phase='overdue';s.homefront.support=clamp(s.homefront.support-10);p.kmt=clamp(p.kmt-8);p.dpp=clamp(p.dpp-8);notice(s,'承诺逾期：民心 −10，两党协调各−8；收入−15%、新增预备兵−30%，未解决期间每周民心−8。');}
  if(p.promise?.phase==='overdue'&&!p.promise.reminded&&queued(s,'civic_promise_due',queue))p.promise.reminded=true;
  if(p.review&&!p.review.queued&&s.time+1e-8>=p.review.due&&queued(s,'civic_recovery_check',queue))p.review.queued=true;
  if(deadlocked(s)){if(p.deadlockDue===null){p.deadlockDue=s.time+30;notice(s,'预算协调跌破35：收入−15%、新增预备兵−25%。一周后议会将追问停摆安排。');}if(s.time>=p.deadlockDue&&s.time>=p.nextDeadlock&&queued(s,'civic_deadlock',queue))p.nextDeadlock=s.time+90;}else p.deadlockDue=null;
  before(s);prune(s);
  if(s.world.nuclear.used>p.lastNuclear){if(queued(s,'civic_nuclear_hearing',queue)){p.lastNuclear=s.world.nuclear.used;p.warSeen=true;}}
  if(s.strategy.phase==='war'&&!p.warSeen&&queued(s,'civic_war_debate',queue))p.warSeen=true;
  if(s.homefront.salvos>p.lastSalvos&&queued(s,'civic_joint_defense',queue))p.lastSalvos=s.homefront.salvos;
  const w=p.warning;if(w&&w.kind==='collapse'&&!w.announced&&queued(s,'civic_protest',queue))w.announced=true;
  if(w&&w.kind!=='collapse'&&s.time+1e-8>=w.due){const id=w.kind==='flight'?'civic_ferry':w.kind==='protest'?'civic_protest':'civic_strike';if(queued(s,id,queue)){p.disruption={kind:w.kind==='flight'?'protest':w.kind,until:s.time+60};p.warning=null;}}
  if(s.time>=p.nextForeign&&Math.min(p.kmt,p.dpp)<30&&(s.strategy.partners.usa||s.homefront.airDefense.order)&&queued(s,'civic_usa_conditions',queue))p.nextForeign=s.time+90;
  if(!s.world.active&&!p.warning&&!p.disruption&&!p.promise&&s.time>=p.nextDebate){p.rng=(Math.imul(p.rng,1664525)+1013904223)>>>0;const pool=p.kmt<35?['civic_kmt_debate']:p.dpp<35?['civic_dpp_hearing']:p.kmt>=65&&p.dpp>=65&&s.homefront.support>=65?['civic_review','civic_budget']:['civic_budget','civic_kmt_debate','civic_dpp_hearing'];if(queued(s,pool[p.rng%pool.length],queue))p.nextDebate=s.time+90+(p.rng%31);}
 }
 function summary(s){const p=s.civic;if(!p)return null;const labels={strike:'罢工预警',protest:'抗议预警',flight:'外迁压力',collapse:'民心归零 · 补救中'},effects=[];
  if(active(s,'accordUntil'))effects.push('预算协作：收入+5%，新重建更快');if(active(s,'burdenUntil'))effects.push('预算预支：收入−15%');if(deadlocked(s))effects.push('预算僵局：收入−15%、新增预备兵−25%');
  if(p.promise?.phase==='overdue')effects.push('承诺失信：收入−15%、新增预备兵−30%、每周民心−8');if(active(s,'serviceUntil'))effects.push('民用救济占用运力：新增预备兵−25%（剩'+Math.ceil((p.serviceUntil-s.time)/3)/10+'周）');if(active(s,'austerityUntil'))effects.push('紧缩安排：收入−20%、新增预备兵−25%（剩'+Math.ceil((p.austerityUntil-s.time)/3)/10+'周）');
  if(s.strategy.phase==='war')effects.push('战争疲劳：每周民心−2；受损设施另加生活压力');if(p.disruption&&p.disruption.until>s.time)effects.push(({strike:'短班罢工：收入−25%、新增预备兵−20%',protest:'抗议：收入−30%、新增预备兵−20%、每周民心−3',outflow:'临时外迁：收入−20%、新增预备兵−20%'})[p.disruption.kind]);
  const stage=p.warning?labels[p.warning.kind]:p.disruption&&p.disruption.until>s.time?{strike:'罢工协调中',protest:'抗议协调中',outflow:'临时外迁中'}[p.disruption.kind]:p.promise?.phase==='overdue'?'承诺逾期':deadlocked(s)?'预算僵局':p.promise?'承诺待兑现':'稳定';
  return {stage,warning:p.warning,danger:!!p.warning||!!p.disruption||p.promise?.phase==='overdue'||deadlocked(s),remaining:p.warning?Math.max(0,p.warning.due-s.time):0,incomeFactor:income(s),mobilizationFactor:mobilization(s),effects,kmt:p.kmt,dpp:p.dpp,outflows:p.outflows,reliefCost:p.promise?140:90,consultCost:80,promise:p.promise,review:p.review};
 }
 function validate(s,p,legacy=false){const bad=()=>{throw Error('岛内局势、承诺或危机倒计时存档无效。');},num=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b,int=(v,a,b)=>Number.isInteger(v)&&num(v,a,b);
  if(!p||p.version!==(legacy?1:2)||!num(p.kmt,0,100)||!num(p.dpp,0,100)||!int(p.rng,0,4294967295)||!num(p.nextDebate,0,s.time+120.1)||!num(p.nextForeign,0,s.time+90.1)||!num(p.foreignAt,0,s.time+90.1)||!p.cooldowns||!num(p.cooldowns.relief,0,s.time+(legacy?30.1:60.1))||!num(p.cooldowns.consult,0,s.time+60.1)||!num(p.accordUntil,0,s.time+60.1)||!num(p.burdenUntil,0,s.time+90.1)||!int(p.lastSalvos,0,s.homefront.salvos)||!int(p.lastNuclear,0,s.world.nuclear.used)||typeof p.warSeen!=='boolean'||!int(p.outflows,0,10000))bad();
  if(p.collapseAt!==null&&(!num(p.collapseAt,0,s.time+30.1)||s.homefront.support>0)||!s.result&&s.homefront.support<=0&&p.collapseAt===null)bad();
  if(p.warning!==null){const w=p.warning;if(!w||!['strike','protest','flight','collapse'].includes(w.kind)||!num(w.startedAt,0,s.time)||!num(w.due,w.startedAt,s.time+30.1)||Math.abs(w.due-w.startedAt-30)>1e-5||typeof w.announced!=='boolean'||w.kind==='collapse'&&(p.collapseAt===null||Math.abs(w.due-p.collapseAt)>1e-5))bad();}
  if(p.disruption!==null&&(!p.disruption||!['strike','protest','outflow'].includes(p.disruption.kind)||!num(p.disruption.until,0,s.time+60.1)))bad();
  if(!Array.isArray(p.history)||p.history.length>20||p.history.some(h=>!h||!num(h.at,0,s.time)||!(['relief','consult'].includes(h.id)&&h.choice==='action'||Object.hasOwn(Events,h.id)&&Events[h.id].choices.some(c=>c.id===h.choice))))bad();
  if(s.result==='defeat'&&s.homefront.defeatReason==='support'&&(p.collapseAt===null||p.collapseAt>s.time+1e-8))bad();
  const copy=JSON.parse(JSON.stringify(p));if(legacy)return {...copy,...extras(),version:2};
  if(!int(p.speeches,0,6)||!num(p.serviceUntil,0,s.time+30.1)||!num(p.austerityUntil,0,s.time+90.1)||!num(p.nextDeadlock,0,s.time+90.1)||p.deadlockDue!==null&&!num(p.deadlockDue,0,s.time+30.1))bad();
  if(p.promise!==null){const b=p.promise;if(!b||!['budget','audit','shelter','dialogue'].includes(b.kind)||!num(b.createdAt,0,s.time)||!num(b.due,b.createdAt,s.time+45.1)||Math.abs(b.due-b.createdAt-45)>1e-5||!['pending','overdue'].includes(b.phase)||typeof b.reminded!=='boolean'||b.phase==='overdue'&&b.due>s.time+1e-8)bad();}
  if(p.review!==null&&(!p.review||!num(p.review.due,0,s.time+45.1)||typeof p.review.queued!=='boolean'))bad();return copy;
 }
 return {init,income,mobilization,repairTime,terminal,before,tick,apply,action,available,summary,validate,record,prune};
});
