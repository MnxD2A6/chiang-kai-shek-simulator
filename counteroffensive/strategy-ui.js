(function(){
 'use strict';
 const F=window.FrontCore,$=id=>document.getElementById(id),fmt=n=>Math.floor(n).toLocaleString();
 class StrategyUI{
  constructor(getState,action){this.getState=getState;this.action=action;this.open=true;this.selected=null;
   const agenda=document.createElement('section');agenda.id='preparationAgenda';agenda.className='preparation-agenda';agenda.setAttribute('aria-label','战前议程');agenda.innerHTML='<header><b>选一套适合你的准备</b><small>每组3选1 → 达标 → 新闻中验收</small></header><p class="route-guide">想多赚钱：出口＋联合防空<br>想稳住本岛：韧性＋民防＋医疗互助<br>想先玩海战：后勤＋抢修＋延后俄援</p><div id="preparationProjects"></div><p>三组路线可以混搭，不必全部升满。开战会中止未兑现项目，已完成收益保留。</p>';const cards=$('strategyPanel').querySelectorAll('.development-card');cards[cards.length-1].after(agenda);const lasting=document.createElement('section');lasting.id='consequenceStatus';lasting.className='preparation-agenda consequence-status';lasting.setAttribute('aria-label','事件的持续影响');agenda.after(lasting);this.consequenceKey='';const jump=document.createElement('button');jump.id='preparationJump';jump.className='preparation-jump';jump.textContent='战前议程 · 发展后解锁 ↘';jump.onclick=()=>agenda.scrollIntoView({behavior:'smooth',block:'start'});$('strategyPanel').querySelector('.strategy-budget').after(jump);this.agendaKey='';
   for(const key of Object.keys(F.strategy.projects))$('develop-'+key).onclick=()=>action(()=>F.upgrade(getState(),key));
   $('declareWar').onclick=()=>action(()=>{const result=F.startWar(getState());if(result.ok)this.open=false;return result;});
   $('shelter').onclick=()=>action(()=>F.shelter(getState()));$('repair').onclick=()=>action(()=>F.repair(getState()));
   $('strategyToggle').onclick=()=>{this.open=!this.open;this.render(true);};$('strategyClose').onclick=()=>{this.open=false;this.render(true);};
   $('partnerBack').onclick=()=>{this.selected=null;this.render(true);};$('partnerAction').onclick=()=>action(()=>F.partner(getState(),this.selected));
  }
  reset(){this.open=true;}
  choose(key){if(!this.getState().strategy){this.action(()=>({ok:false,message:'继续旧局会维持基础版规则；开始新局可使用地区合作。'}));return;}this.selected=key;this.open=true;this.render(true);}
  render(started){const s=this.getState(),p=s.strategy,enabled=!!p&&started;
   $('strategyToggle').hidden=!enabled;$('strategyPanel').hidden=!enabled||!this.open;$('strategicStatus').hidden=!enabled;$('missileWarning').hidden=!enabled||!p.warning||!!s.result;
   document.body.classList.toggle('preparing',enabled&&p.phase==='preparation');document.body.classList.toggle('strategy-open',enabled&&this.open);
   if(!enabled)return;
   const agendas=F.preparationSummary(s),agendaKey=JSON.stringify([agendas,[90,100,120].map(n=>p.funds>=n),!!s.world.active,!!s.result]);const waiting=agendas.filter(a=>['active','offered','review'].includes(a.phase)).length,done=agendas.filter(a=>a.phase==='complete').length,deferred=agendas.filter(a=>a.phase==='deferred').length;$('preparationJump').textContent='战前路线 · '+done+'/3 已兑现'+(waiting?' · '+waiting+'项进行中':'')+' ↘';if(this.agendaKey!==agendaKey){this.agendaKey=agendaKey;$('preparationProjects').replaceChildren(...agendas.map(a=>{const row=document.createElement('article');row.dataset.phase=a.phase;const name=document.createElement('b'),detail=document.createElement('span'),effect=document.createElement('small');name.textContent=a.routeName||a.name;detail.textContent=a.detail;effect.textContent=a.effect;row.append(name,detail,effect);if(a.canOpen){const reopen=document.createElement('button'),cost={industry:100,defense:120,diplomacy:90}[a.id];reopen.dataset.preparationOpen=a.id;reopen.textContent=(a.phase==='deferred'?'重新洽谈':'选择路线')+' · 预留'+cost;reopen.disabled=!!s.world.active||!!s.result||p.funds<cost;reopen.onclick=()=>this.action(()=>F.reopenPreparation(this.getState(),a.id));row.append(reopen);}return row;}));}
   const consequences=F.consequenceSummary(s),consequenceKey=JSON.stringify(consequences);if(this.consequenceKey!==consequenceKey){this.consequenceKey=consequenceKey;$('consequenceStatus').replaceChildren();const header=document.createElement('header');header.textContent='事件留下的影响';$('consequenceStatus').append(header);for(const a of consequences){const row=document.createElement('article'),name=document.createElement('b'),detail=document.createElement('small');name.textContent=a.name;detail.textContent=a.detail;row.append(name,detail);if(a.action==='escort'){const focus=document.createElement('button');focus.textContent='定位这笔订单的护航';focus.onclick=()=>{this.open=false;$('operationFocus').click();};row.append(focus);}$('consequenceStatus').append(row);}if(!consequences.length){const note=document.createElement('p');note.textContent='货运、医疗、保险与科研选择的后续会在这里持续显示。';$('consequenceStatus').append(note);}}
   const region=F.regions.find(r=>r.id===this.selected);$('partnerDetails').hidden=!region;$('preparationAgenda').hidden=!!region;$('consequenceStatus').hidden=!!region;$('preparationJump').hidden=!!region;$('strategyPanel').classList.toggle('viewing-partner',!!region);
   if(region){const held=p.partners[region.id],building=p.project?.key==='partner:'+region.id;$('partnerName').textContent=region.name+' · 合作机会';$('partnerDescription').textContent=region.description;$('partnerEffect').textContent=region.effect;$('partnerAction').textContent=held?'合作已达成':building?'合作中 · '+F.realSeconds(s,p.project.endsAt-s.time)+'秒':'达成合作 · '+region.cost+'资金 / '+F.realSeconds(s,12)+'秒';$('partnerAction').disabled=!!s.result||held||!!p.project||p.funds<region.cost;}
   $('phaseLabel').textContent=p.phase==='preparation'?'筹备期 · 由你决定何时开战':'战时发展';
   $('funds').textContent=fmt(p.funds);$('income').textContent='+'+F.displayRate(s,F.strategy.income(s)).toFixed(1)+'/秒';
   $('integrity').textContent=Math.ceil(p.integrity)+'%';$('integrityBar').style.width=p.integrity+'%';
   $('forceBalance').textContent=fmt(s.factions[1].troops+F.deployed(s,1))+' / '+fmt(s.factions.slice(2).reduce((n,f)=>n+f.troops+F.deployed(s,f.id),0));
   $('protection').textContent=Math.round(F.strategy.protection(s)*100)+'%';
   $('strategyToggle').textContent=p.phase==='preparation'?'筹备':'发展';
   for(const [key,info] of Object.entries(F.strategy.projects)){
    const level=p.levels[key],cost=80+level*60,b=$('develop-'+key),building=p.project?.key===key;
    $('level-'+key).textContent=level+' / 3';
    $('benefit-'+key).textContent=(s.homefront&&key==='technology'?'设施加固 +6%，进攻损耗 −18%':s.homefront&&key==='diplomacy'?'援军 +700，空袭间隔 +18秒，设施加固 +2%':info.effect).replace(/收入 \+(\d+)\/秒/,(_,n)=>'收入 +'+F.displayRate(s,Number(n))+'/秒').replace('间隔 +18秒','间隔 +'+F.realSeconds(s,18)+'秒');
    const duration=key==='technology'&&window.FrontConsequences.active(s,'lab')?8:12;b.textContent=building?'进行中 · '+F.realSeconds(s,p.project.endsAt-s.time)+'秒':level===3?'已满级':cost+'资金 · '+F.realSeconds(s,duration)+'秒'+(duration===8?' / 科研交流':'');
    b.disabled=!!s.result||level===3||!!p.project||p.funds<cost;
    $('progress-'+key).style.width=building?Math.max(0,Math.min(100,(duration-p.project.endsAt+s.time)/duration*100))+'%':level===3?'100%':'0%';
   }
   const capable=p.levels.technology>=2&&(p.levels.economy>=2||p.levels.diplomacy>=2)&&(!s.homefront||s.homefront.airDefense.batteries>0);
   $('readiness').textContent=s.result?'本局已结束，可以查看战果或重新开始。':p.project?.key.startsWith('partner:')?'地区合作正在推进，完成后可继续投资其他路线。':p.phase==='war'?'导弹会持续损伤生产；到「后方 / 防空」重建、补弹，留意本岛登陆威胁。':capable?'已有科技、生产与防空。留下本岛驻军、备好拦截舰队后，可以选择开战。':'推荐先发展经济和科技，再到「后方 / 防空」购买900资金的防空系统。开战前给台湾两城留守军。';
   $('declareWar').hidden=p.phase!=='preparation';$('declareWar').disabled=!!s.result;
   const pending=agendas.filter(a=>['offered','active','review'].includes(a.phase)).length;if(pending&&p.phase==='preparation')$('readiness').textContent+=' 尚有'+pending+'项议程待兑现，提前开战会中止。';
   $('declareWar').textContent=pending?'开战 · 中止'+pending+'项议程 →':capable?'决定开战 →':'提前开战 · 风险高 →';
   $('repair').disabled=!!s.result||p.integrity>=100||p.funds<100||s.time<p.repairAt;
   $('repair').textContent=s.time<p.repairAt?'修复周转 '+F.realSeconds(s,p.repairAt-s.time)+'秒':'修复 +25 · 100资金';
   $('strategicStatus').textContent=(p.phase==='preparation'?'筹备':'战时')+' · 资金 '+fmt(p.funds)+' · 设施 '+Math.ceil(p.integrity)+'%';
   if(p.warning){const shelterCost=F.preparationBonuses(s).shelterCost;$('warningText').textContent=(s.homefront?s.towns.find(t=>t.id===s.homefront.strikeTarget)?.name+' · 6枚导弹来袭 · ':'空袭预警 · ')+F.realSeconds(s,p.warning.impactAt-s.time)+' 秒后抵达';$('shelter').disabled=p.warning.sheltered||p.funds<shelterCost;$('shelter').textContent=p.warning.sheltered?'已疏散 · 建筑仍会受损':'疏散人员 · '+shelterCost+'资金';}
   if(p.phase==='preparation')$('nextStep').textContent='先完成发展工程，积累兵力。准备好后主动开战。';
   else if(!s.result)$('nextStep').textContent='点敌方海岸登陆，点敌方土地推进。关注设施和空袭倒计时。';
  }
 }
 window.StrategyUI=StrategyUI;
})();
