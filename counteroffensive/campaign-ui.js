(function(root){
 'use strict';
 const F=root.FrontCore,$=id=>document.getElementById(id),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const names={usa:'美国',japan:'日本',korea:'韩国',philippines:'菲律宾',russia:'俄罗斯',northkorea:'朝鲜'},codes={usa:'US',japan:'JP',korea:'KR',philippines:'PH',russia:'RU',northkorea:'KP'};
 const mood=n=>n>=30?'支持':n>=0?'观望':n>=-30?'警惕':'对立';
 class CampaignUI{
  constructor(getState,action,world,focusMainland){this.getState=getState;this.action=action;this.world=world;this.key='';
   const rail=document.createElement('aside');rail.id='countryRail';rail.setAttribute('aria-label','各国状态');rail.hidden=true;
   rail.innerHTML='<header><div><small>WORLD SITUATION / LIVE</small><h2>世界局势</h2></div><button id="railClose" aria-label="收起各国状态">×</button></header><div class="rail-readings"><span>国际观感<b id="railOpinion"></b></span><span>地区紧张<b id="railTension"></b></span><span>制裁<b id="railSanctions"></b></span></div><section class="mainland-card"><div><span>CN / 大陆</span><b id="mainlandPosture"></b></div><label>警戒程度 <strong id="mainlandAlert"></strong></label><i><em id="mainlandAlertBar"></em></i><p id="mainlandAction"></p><small id="mainlandCountdown"></small><button id="mainlandTalk">缓和局势 · 50资金</button></section><div id="countryStates"></div><div class="rail-links"><button data-rail-tab="news">新闻</button><button data-rail-tab="relations">关系</button><button data-rail-tab="research">机密科研</button></div><p class="rail-note">点国家查看合作与外交。所有局势均为架空游戏规则。</p>';$('game').append(rail);
   const toggle=document.createElement('button');toggle.id='countryRailToggle';toggle.textContent='各国状态';toggle.hidden=true;$('game').append(toggle);toggle.onclick=()=>rail.classList.toggle('expanded');$('railClose').onclick=()=>rail.classList.remove('expanded');
   rail.querySelectorAll('[data-rail-tab]').forEach(b=>b.onclick=()=>{rail.classList.remove('expanded');world.openPane(b.dataset.railTab);});
   $('mainlandTalk').onclick=()=>action(()=>F.mainlandTalk(getState()));
   const focus=document.createElement('button');focus.id='mainlandFocus';focus.setAttribute('aria-label','定位大陆部署');focus.textContent='查看部署 ↗';$('mainlandPosture').parentElement.append(focus);focus.onclick=()=>focusMainland?.();
   $('paceToggle').onclick=()=>action(()=>F.setPace(getState(),getState().campaign.pace===.5?1:.5));
  }
  render(started){const s=this.getState(),w=s.world,c=s.campaign,p=F.weekProgress(s);$('countryRail').hidden=!started;$('countryRailToggle').hidden=!started;$('weekTimeline').hidden=!started;
   const stopped=s.paused||document.hidden||$('modal').open||this.world.dialog.open||this.world.strikeDialog.open||!!s.result;
   $('weekNumber').textContent='第 '+p.week+' 周';$('weekStatus').textContent=s.result?'战役结束':stopped?'已暂停 · 可继续下令':'距下周 '+p.remaining+' 秒';
   $('weekProgress').value=p.ratio*100;$('weekProgress').setAttribute('aria-valuetext','第'+p.week+'周，已过'+Math.floor(p.ratio*100)+'%'+(stopped?'，已暂停':''));
   $('paceToggle').textContent=c.pace===.5?'1×':'2×';$('paceToggle').setAttribute('aria-label',c.pace===.5?'当前1倍速，点击切换2倍速':'当前2倍速，点击切换1倍速');
   $('game').dataset.week=p.week;$('game').dataset.pace=c.pace;$('railOpinion').textContent=Math.round(w.opinion);$('railTension').textContent=Math.round(w.tension);$('railSanctions').textContent=['无','限制','全面'][w.sanctions];
   $('mainlandPosture').textContent=c.posture;$('mainlandAlert').textContent=Math.round(c.alert)+'/100';$('mainlandAlertBar').style.width=c.alert+'%';$('mainlandAction').textContent=c.lastAction;
   $('mainlandCountdown').textContent=c.pending?'部署落实倒计时 '+F.realSeconds(s,c.pending.due-s.time)+' 秒':s.strategy.phase==='preparation'?'筹备期 · 由你决定何时开战':'战时 · 关注沿海反击';
   $('mainlandTalk').disabled=!!s.result||!!w.active||s.strategy.phase!=='preparation'||s.strategy.funds<50||s.time<c.talkAt;
   $('mainlandTalk').textContent=s.strategy.phase==='war'?'战时反制进行中':s.time<c.talkAt?'沟通协调中 · '+F.realSeconds(s,c.talkAt-s.time)+'秒':'缓和局势 · 50资金';
   const rows=Object.entries(names).map(([key,name])=>{let effect;
    if(key==='russia'||key==='northkorea'){const a=s.naval.aid.find(a=>a.key===key);effect=a?a.delivered?'援军已抵达大陆':'援军 '+F.realSeconds(s,a.arrive-s.time)+'秒后抵达':w.relations[key]>=35?'未抵达援军可取消':key==='northkorea'&&w.flags.koreaWar?'增援牵制在半岛':'大陆支援方 · 尚未出发';}
    else {const held=s.strategy.partners[key],active=F.worldPartnerAvailable(s,key);effect=held?(active?{usa:'兵员与容量支援生效',japan:'贸易与生产支援生效',korea:'技术与防护支援生效',philippines:'预警支援生效'}[key]:'支援暂停 · 查看原因'):active?'可洽谈合作':'合作受限 · 可外交沟通';}
    const relation=Math.round(w.relations[key]);return '<button class="country-state" data-rail-country="'+key+'" aria-label="查看'+name+'状态"><span class="country-code">'+codes[key]+'</span><span><b>'+name+' <em>'+mood(relation)+'</em></b><small>'+esc(effect)+'</small></span><strong class="'+(relation<0?'negative':'')+'">'+(relation>0?'+':'')+relation+'</strong></button>';}).join('');
   if(rows!==this.key){this.key=rows;$('countryStates').innerHTML=rows;for(const b of $('countryStates').querySelectorAll('[data-rail-country]'))b.onclick=()=>{$('countryRail').classList.remove('expanded');this.world.chooseCountry(b.dataset.railCountry);};}
  }
 }
 root.CampaignUI=CampaignUI;
})(window);
