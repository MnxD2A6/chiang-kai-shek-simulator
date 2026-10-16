(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./civic-events.js'));else root.FrontCivics=factory(root.FrontCivicEvents);})(typeof globalThis!=='undefined'?globalThis:this,function(Events){
 'use strict';
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n)),active=(s,key)=>!!s.civic&&s.civic[key]>s.time;
 function init(s){s.civic={version:1,kmt:60,dpp:45,rng:(s.seed^0x28c1a43)>>>0,nextDebate:s.time+45,nextForeign:s.time+45,foreignAt:0,cooldowns:{relief:0,consult:0},warning:null,disruption:null,collapseAt:s.result==='defeat'&&s.homefront.support<=0?s.time:null,accordUntil:0,burdenUntil:0,lastSalvos:s.homefront.salvos,lastNuclear:s.world.nuclear.used,warSeen:s.strategy.phase==='war',outflows:0,history:[]};return s;}
 function income(s){const p=s.civic;if(!p)return 1;const labour=p.disruption&&p.disruption.until>s.time?{strike:.82,protest:.85,outflow:.88}[p.disruption.kind]:1;return (active(s,'accordUntil')?1.08:1)*(active(s,'burdenUntil')?.85:1)*(Math.min(p.kmt,p.dpp)<25?.9:1)*labour;}
 const repairTime=(s,base)=>Math.max(6,base-(active(s,'accordUntil')?2:0));
 const terminal=s=>!s.civic||(s.civic.collapseAt!==null&&s.time+1e-8>=s.civic.collapseAt);
 const risk=s=>s.homefront.support<=0?'collapse':s.homefront.support<=12?'flight':s.homefront.support<=20?'protest':s.homefront.support<40?'strike':null;
 function before(s){if(!s.civic||s.result)return;const p=s.civic,kind=risk(s);if(s.homefront.support<=0&&p.collapseAt===null)p.collapseAt=s.time+30;if(s.homefront.support>0)p.collapseAt=null;
  if(!kind){p.warning=null;return;}if(kind!=='collapse'&&p.disruption&&p.disruption.until>s.time){p.warning=null;return;}
  if(!p.warning||kind==='collapse'&&p.warning.kind!=='collapse'||kind!=='collapse'&&p.warning.kind==='collapse')p.warning={kind,startedAt:s.time,due:kind==='collapse'?p.collapseAt:s.time+30,announced:false};else p.warning.kind=kind;
 }
 function record(s,id,choice){s.civic.history.unshift({id,choice,at:s.time});s.civic.history.length=Math.min(20,s.civic.history.length);}
 function apply(s,e={}){const p=s.civic;if(!p)return;p.kmt=clamp(p.kmt+(e.kmt||0));p.dpp=clamp(p.dpp+(e.dpp||0));s.homefront.support=clamp(s.homefront.support+(e.support||0));
  if(e.accord)p.accordUntil=s.time+e.accord;if(e.burden)p.burdenUntil=s.time+e.burden;
  if(e.calm){p.disruption=null;p.warning=null;}if(e.shorten&&p.disruption)p.disruption.until=Math.min(p.disruption.until,s.time+e.shorten);
  if(e.outflow){p.outflows++;p.disruption={kind:'outflow',until:s.time+60};p.warning=null;}
  if(e.restraint&&s.strategy.phase==='preparation'){s.campaign.restraintUntil=s.time+e.restraint;s.campaign.pending=null;s.campaign.nextReaction=Math.max(s.campaign.nextReaction,s.time+36);}
  before(s);
 }
 function available(s,e){if(!e)return {ok:true,reason:''};if(!s.civic)return {ok:false,reason:'请从新版实时入口体验岛内议题。'};return {ok:true,reason:''};}
 function action(s,key){const p=s.civic,no=message=>({ok:false,message});if(s.result)return no('本局已结束。');if(s.world.active)return no('先回应当前重大新闻，再安排民生与协商。');if(!p||!['relief','consult'].includes(key))return no('没有这项岛内安排。');if(s.time+1e-8<p.cooldowns[key])return no('本轮安排正在落实，请等待下一轮。');const cost=key==='relief'?90:60;if(s.strategy.funds<cost)return no('需要 '+cost+' 资金。');if(key==='relief'&&s.homefront.support>=100&&!p.disruption)return no('目前无需追加生活救济。');if(key==='consult'&&active(s,'accordUntil')&&Math.min(p.kmt,p.dpp)>=65)return no('预算协作正在生效，暂不需要重复协调。');
  s.strategy.funds-=cost;p.cooldowns[key]=s.time+(key==='relief'?30:60);apply(s,key==='relief'?{support:12,kmt:6,dpp:6,calm:true}:{support:4,kmt:12,dpp:12,accord:60});record(s,key,'action');return {ok:true,message:key==='relief'?'已支出90：民心+12，两党协调各+6，解除生产扰动；一周后可再安排。':'已支出60：民心+4，两党协调各+12；两周收入+8%，新重建工程快2模拟秒。'};
 }
 const queued=(s,id,queue)=>s.world.active?.id===id||s.world.queue.some(q=>q.id===id)||queue(s,id,0).ok;
 function tick(s,dt,queue){if(!s.civic||s.result)return;const p=s.civic;if(p.disruption&&p.disruption.until<=s.time)p.disruption=null;if(p.disruption?.kind==='protest')s.homefront.support=clamp(s.homefront.support-dt/30);before(s);
  if(s.world.nuclear.used>p.lastNuclear){if(queued(s,'civic_nuclear_hearing',queue)){p.lastNuclear=s.world.nuclear.used;p.warSeen=true;}}
  if(s.strategy.phase==='war'&&!p.warSeen&&queued(s,'civic_war_debate',queue))p.warSeen=true;
  if(s.homefront.salvos>p.lastSalvos&&queued(s,'civic_joint_defense',queue))p.lastSalvos=s.homefront.salvos;
  const w=p.warning;if(w&&w.kind==='collapse'&&!w.announced&&queued(s,'civic_protest',queue))w.announced=true;
  if(w&&w.kind!=='collapse'&&s.time+1e-8>=w.due){const id=w.kind==='flight'?'civic_ferry':w.kind==='protest'?'civic_protest':'civic_strike';if(queued(s,id,queue)){p.disruption={kind:w.kind==='flight'?'protest':w.kind,until:s.time+60};p.warning=null;}}
  if(s.time>=p.nextForeign&&Math.min(p.kmt,p.dpp)<30&&(s.strategy.partners.usa||s.homefront.airDefense.order)&&queued(s,'civic_usa_conditions',queue))p.nextForeign=s.time+90;
  if(!s.world.active&&!p.warning&&!p.disruption&&s.time>=p.nextDebate){p.rng=(Math.imul(p.rng,1664525)+1013904223)>>>0;const pool=p.kmt<30?['civic_kmt_debate']:p.dpp<30?['civic_dpp_hearing']:p.kmt>=65&&p.dpp>=65&&s.homefront.support>=65?['civic_review','civic_budget']:['civic_budget','civic_kmt_debate','civic_dpp_hearing'];if(queued(s,pool[p.rng%pool.length],queue))p.nextDebate=s.time+60+(p.rng%31);}
 }
 function summary(s){const p=s.civic;if(!p)return null;const labels={strike:'罢工预警',protest:'抗议预警',flight:'外迁压力',collapse:'民心归零 · 补救中'},effects=[];if(active(s,'accordUntil'))effects.push('预算协作：收入+8%，新重建更快（剩'+Math.ceil((p.accordUntil-s.time)/3)/10+'周）');if(active(s,'burdenUntil'))effects.push('预算预支：收入−15%（剩'+Math.ceil((p.burdenUntil-s.time)/3)/10+'周）');if(Math.min(p.kmt,p.dpp)<25)effects.push('党派协调受阻：收入−10%');if(p.disruption&&p.disruption.until>s.time)effects.push(({strike:'短班罢工：收入−18%',protest:'抗议：收入−15%，每周民心−1',outflow:'临时外迁：收入−12%'})[p.disruption.kind]);const stage=p.warning?labels[p.warning.kind]:p.disruption?{strike:'罢工协调中',protest:'抗议协调中',outflow:'临时外迁中'}[p.disruption.kind]:Math.min(p.kmt,p.dpp)<25?'预算拉锯':'稳定';return {stage,warning:p.warning,danger:!!p.warning||!!p.disruption,remaining:p.warning?Math.max(0,p.warning.due-s.time):0,incomeFactor:income(s),effects,kmt:p.kmt,dpp:p.dpp,outflows:p.outflows};}
 function validate(s,p){const bad=()=>{throw Error('岛内局势、党派协调或危机倒计时存档无效。');},num=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b,int=(v,a,b)=>Number.isInteger(v)&&num(v,a,b);
  if(!p||p.version!==1||!num(p.kmt,0,100)||!num(p.dpp,0,100)||!int(p.rng,0,4294967295)||!num(p.nextDebate,0,s.time+120.1)||!num(p.nextForeign,0,s.time+90.1)||!num(p.foreignAt,0,s.time+90.1)||!p.cooldowns||!num(p.cooldowns.relief,0,s.time+30.1)||!num(p.cooldowns.consult,0,s.time+60.1)||!num(p.accordUntil,0,s.time+60.1)||!num(p.burdenUntil,0,s.time+90.1)||!int(p.lastSalvos,0,s.homefront.salvos)||!int(p.lastNuclear,0,s.world.nuclear.used)||typeof p.warSeen!=='boolean'||!int(p.outflows,0,10000))bad();
  if(p.collapseAt!==null&&(!num(p.collapseAt,0,s.time+30.1)||s.homefront.support>0)||!s.result&&s.homefront.support<=0&&p.collapseAt===null)bad();
  if(p.warning!==null){const w=p.warning;if(!w||!['strike','protest','flight','collapse'].includes(w.kind)||!num(w.startedAt,0,s.time)||!num(w.due,w.startedAt,s.time+30.1)||Math.abs(w.due-w.startedAt-30)>1e-5||typeof w.announced!=='boolean'||w.kind==='collapse'&&(p.collapseAt===null||Math.abs(w.due-p.collapseAt)>1e-5))bad();}
  if(p.disruption!==null&&(!p.disruption||!['strike','protest','outflow'].includes(p.disruption.kind)||!num(p.disruption.until,0,s.time+60.1)))bad();
  if(!Array.isArray(p.history)||p.history.length>20||p.history.some(h=>!h||!num(h.at,0,s.time)||!(['relief','consult'].includes(h.id)&&h.choice==='action'||Object.hasOwn(Events,h.id)&&Events[h.id].choices.some(c=>c.id===h.choice))))bad();
  if(s.result==='defeat'&&s.homefront.defeatReason==='support'&&(p.collapseAt===null||p.collapseAt>s.time+1e-8))bad();return JSON.parse(JSON.stringify(p));
 }
 return {init,income,repairTime,terminal,before,tick,apply,action,available,summary,validate,record};
});
