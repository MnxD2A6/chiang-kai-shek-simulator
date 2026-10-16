(function(){
 'use strict';
 const F=window.FrontCore,$=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.CivicUI=class{
  constructor(get,action,showHome,showNews){Object.assign(this,{get,action,showHome,showNews});
   const card=document.createElement('section');card.id='civicCard';card.className='civic-card';card.setAttribute('aria-label','岛内局势与两党协商');card.innerHTML='<header><div><small>架空政坛 / CIVIC DESK</small><h3>民心与岛内协商</h3></div><b id="civicStage"></b></header><p class="civic-fiction">跨时代架空：国民党执政、民进党在野。协调值表示本局协商关系。</p><p class="civic-public">公众民心 <b id="civicPublic"></b></p><div class="civic-parties"><label>国民党 · 党内协调<b id="civicKmt"></b><progress id="civicKmtBar" max="100"></progress></label><label>民进党 · 议会沟通<b id="civicDpp"></b><progress id="civicDppBar" max="100"></progress></label></div><div id="civicCrisis" role="status"><b id="civicCrisisTitle"></b><progress id="civicCrisisBar" max="30"></progress><p id="civicCrisisText"></p></div><p id="civicEffects"></p><div class="civic-actions"><button id="civicRelief">民生救济 · 90</button><button id="civicConsult">两党协商 · 60</button></div><small id="civicNext"></small><div id="civicHistory"></div>';$('homefrontView').querySelector('.home-explainer').after(card);
   $('civicRelief').onclick=()=>action(()=>F.civicAction(get(),'relief'));$('civicConsult').onclick=()=>action(()=>F.civicAction(get(),'consult'));
   const quick=document.createElement('button');quick.id='civicQuick';quick.className='civic-quick';$('homefrontQuick').after(quick);quick.onclick=()=>this.open();
   const warning=document.createElement('button');warning.id='civicWarning';warning.className='civic-map-warning';warning.hidden=true;warning.setAttribute('aria-label','处理岛内危机');document.querySelector('.operation-actions').after(warning);warning.onclick=()=>this.open();
  }
  open(){const s=this.get();s.paused=true;if(s.world.active){this.showNews();return;}this.showHome();$('civicCard').scrollIntoView({block:'start',behavior:'smooth'});}
  render(started){const s=this.get(),p=s.civic,h=s.homefront,d=F.civicSummary(s);if(!d)return;$('civicStage').textContent=d.stage;$('civicPublic').textContent=Math.floor(h.support)+'/100';$('civicPublic').classList.toggle('critical',h.support<=20);$('civicKmt').textContent=Math.floor(p.kmt)+'/100';$('civicDpp').textContent=Math.floor(p.dpp)+'/100';$('civicKmtBar').value=p.kmt;$('civicDppBar').value=p.dpp;
   $('civicCrisis').hidden=!p.warning;if(p.warning){const seconds=F.realSeconds(s,d.remaining);$('civicCrisisTitle').textContent=d.stage+' · 剩余 '+seconds+' 秒';$('civicCrisisBar').value=Math.min(30,d.remaining);$('civicCrisisText').textContent=p.warning.kind==='collapse'?'民心已归零。倒计时结束且仍未恢复就会失败。回应新闻，或用民生救济、两党协商恢复支持。':'民心持续偏低。一周预警结束后会出现罢工、抗议或外迁议题；先救济、修复受损城市，也可回应后续新闻。';}
   $('civicEffects').textContent=d.effects.length?d.effects.join('；'):'民心影响收入。协调值低于25会使预算执行减速；双方也能通过监督、协商和救灾恢复合作。';
   for(const [id,key,cost] of [['civicRelief','relief',90],['civicConsult','consult',60]]){const b=$(id),waiting=p.cooldowns[key]>s.time;b.textContent=waiting?(key==='relief'?'救济落实中':'协商落实中')+' · '+F.realSeconds(s,p.cooldowns[key]-s.time)+'秒':key==='relief'?'民生救济 +12民心 · 90':'两党协商 +4民心 · 60';b.disabled=!!s.result||!!s.world.active||waiting||s.strategy.funds<cost||(key==='relief'?h.support>=100&&!p.disruption:p.accordUntil>s.time&&Math.min(p.kmt,p.dpp)>=65);}
   $('civicNext').textContent='救济：解除生产扰动，每周一次。协商：协调各+12，两周收入+8%、新重建更快。'+(s.world.active?'先回应当前新闻。':'');
   const history=p.history.slice(0,3).map(r=>'<p>'+esc(r.id==='relief'?'落实民生救济':r.id==='consult'?'完成两党协商':F.worldEvents[r.id]?.choices.find(c=>c.id===r.choice)?.label||'岛内议题已回应')+'</p>').join('');if($('civicHistory').innerHTML!==history)$('civicHistory').innerHTML=history;
   $('civicQuick').textContent='岛内局势 ↗　'+d.stage+' · 蓝 '+Math.floor(p.kmt)+' / 绿 '+Math.floor(p.dpp);$('civicQuick').classList.toggle('is-critical',d.danger);$('civicWarning').hidden=!started||!!s.result||!p.warning;$('civicWarning').textContent=p.warning?d.stage+' · '+F.realSeconds(s,d.remaining)+'秒内处理 →':'';
  }
 };
})();
