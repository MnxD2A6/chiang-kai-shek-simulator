(function(){
 'use strict';
 const F=window.FrontCore,$=id=>document.getElementById(id),fmt=n=>Math.floor(n).toLocaleString();
 class StrategyUI{
  constructor(getState,action){this.getState=getState;this.action=action;this.open=true;this.selected=null;
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
   const region=F.regions.find(r=>r.id===this.selected);$('partnerDetails').hidden=!region;$('strategyPanel').classList.toggle('viewing-partner',!!region);
   if(region){const held=p.partners[region.id],building=p.project?.key==='partner:'+region.id;$('partnerName').textContent=region.name+' · 合作机会';$('partnerDescription').textContent=region.description;$('partnerEffect').textContent=region.effect;$('partnerAction').textContent=held?'合作已达成':building?'合作中 · '+Math.max(0,Math.ceil(p.project.endsAt-s.time))+'秒':'达成合作 · '+region.cost+'资金 / 12秒';$('partnerAction').disabled=!!s.result||held||!!p.project||p.funds<region.cost;}
   $('phaseLabel').textContent=p.phase==='preparation'?'筹备期 · 由你决定何时开战':'战时发展';
   $('funds').textContent=fmt(p.funds);$('income').textContent='+'+F.strategy.income(s).toFixed(1)+'/秒';
   $('integrity').textContent=Math.ceil(p.integrity)+'%';$('integrityBar').style.width=p.integrity+'%';
   $('forceBalance').textContent=fmt(s.factions[1].troops+F.deployed(s,1))+' / '+fmt(s.factions.slice(2).reduce((n,f)=>n+f.troops+F.deployed(s,f.id),0));
   $('protection').textContent=Math.round(F.strategy.protection(s)*100)+'%';
   $('strategyToggle').textContent=p.phase==='preparation'?'筹备':'发展';
   for(const [key,info] of Object.entries(F.strategy.projects)){
    const level=p.levels[key],cost=80+level*60,b=$('develop-'+key),building=p.project?.key===key;
    $('level-'+key).textContent=level+' / 3';
    $('benefit-'+key).textContent=info.effect;
    b.textContent=building?'进行中 · '+Math.max(0,Math.ceil(p.project.endsAt-s.time))+'秒':level===3?'已满级':cost+'资金 · 12秒';
    b.disabled=!!s.result||level===3||!!p.project||p.funds<cost;
    $('progress-'+key).style.width=building?Math.min(100,(12-p.project.endsAt+s.time)/12*100)+'%':level===3?'100%':'0%';
   }
   const capable=p.levels.technology>=2&&(p.levels.economy>=2||p.levels.diplomacy>=2);
   $('readiness').textContent=s.result?'本局已结束，可以查看战果或重新开始。':p.project?.key.startsWith('partner:')?'地区合作正在推进，完成后可继续投资其他路线。':p.phase==='war'?'资金仍会增长，可以继续发展；设施受损时及时修复。':capable?'已有一条可行的发展路线。积累驻军后，可以选择开战。':'先提升实力：推荐先发展经济，再补科技防护；也可在地图上联系合作方。';
   $('declareWar').hidden=p.phase!=='preparation';$('declareWar').disabled=!!s.result;
   $('declareWar').textContent=capable?'决定开战 →':'提前开战 · 风险高 →';
   $('repair').disabled=!!s.result||p.integrity>=100||p.funds<100||s.time<p.repairAt;
   $('repair').textContent=s.time<p.repairAt?'修复周转 '+Math.ceil(p.repairAt-s.time)+'秒':'修复 +25 · 100资金';
   $('strategicStatus').textContent=(p.phase==='preparation'?'筹备':'战时')+' · 资金 '+fmt(p.funds)+' · 设施 '+Math.ceil(p.integrity)+'%';
   if(p.warning){$('warningText').textContent='空袭预警 · '+Math.max(0,Math.ceil(p.warning.impactAt-s.time))+' 秒后抵达';$('shelter').disabled=p.warning.sheltered||p.funds<60;$('shelter').textContent=p.warning.sheltered?'本轮疏散已生效':'紧急疏散 · 60资金';}
   if(p.phase==='preparation')$('nextStep').textContent='先完成发展工程，积累兵力。准备好后主动开战。';
   else if(!s.result)$('nextStep').textContent='点敌方海岸登陆，点敌方土地推进。关注设施和空袭倒计时。';
  }
 }
 window.StrategyUI=StrategyUI;
})();
