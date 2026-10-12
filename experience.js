(function(root){
 'use strict';
 class GameExperience{
  constructor(api){this.api=api;this.flags={active:false,mapOpened:false,citySelected:false};try{const saved=JSON.parse(localStorage.getItem('chiang-guide-v1.1'));if(saved?.turn===api.state().turn&&['active','mapOpened','citySelected'].every(k=>typeof saved.flags?.[k]==='boolean'))this.flags=saved.flags;}catch{}this.currentView=root.GameDirector.initialView(api.state(),this.flags);this.mount();}
  mount(){
   const $=id=>document.getElementById(id),layout=document.querySelector('.command-layout'),room=document.querySelector('.room-panel'),map=document.querySelector('.map-panel'),left=document.querySelector('.left-column'),right=document.querySelector('.right-column');
   const stage=document.createElement('section');stage.className='play-stage';stage.innerHTML='<div class="stage-tabs"><div><span class="eyebrow">你的指挥桌</span><h2>走进去，做决定。</h2></div><nav aria-label="游戏主视图"><button id="viewRoom" aria-pressed="true">作战室</button><button id="viewMap" aria-pressed="false">战略图</button><button id="policyBtn">施政方针</button></nav></div><div class="stage-status"><span id="sceneStatus">电话铃响了。先接起听筒。</span><span>WASD 走动 · E 互动 · 点击地面自动走过去</span></div>';
   layout.prepend(stage);stage.append(room,map);right.prepend(left);this.roomPanel=room;this.mapPanel=map;
   const quick=document.createElement('div');quick.className='room-quick';quick.innerHTML='<button id="scenePhone"><b>☎</b><span>接电话 / 拨号<small>事件决定与顾问请求</small></span></button><button id="sceneMap"><b>▥</b><span>打开战略图<small>选城市，下达具体命令</small></span></button><button id="scenePolicy"><b>◈</b><span>调整施政方针<small>持续改变每轮结算</small></span></button>';room.append(quick);
   const task=document.createElement('section');task.id='missionPanel';task.className='mission-panel';right.prepend(task);
   const goal=document.createElement('section');goal.className='campaign-goal';goal.innerHTML='<div><span class="eyebrow">你的目标</span><h2>把指挥部带到 1949。</h2><p>守住城市，保证粮食，留住人心。每轮先处理来电，再安排最多三项命令。</p></div><div class="campaign-rules"><b id="completedMissions">0 / 12</b><span>任务已完成</span><button id="learnBtn">带我学第一回合</button></div>';document.querySelector('.turn-strip').after(goal);
   const guide=document.createElement('section');guide.id='guidePanel';guide.className='guide-panel';guide.hidden=true;$('resources').after(guide);
   $('viewRoom').onclick=()=>this.view('room');$('viewMap').onclick=()=>this.view('map');$('sceneMap').onclick=()=>this.view('map');$('scenePhone').onclick=()=>this.api.phone();$('scenePolicy').onclick=()=>this.policy();$('policyBtn').onclick=()=>this.policy();$('learnBtn').onclick=()=>{if(this.api.state().turn===0&&!this.api.state().over){this.api.ensureStarted();this.beginGuide();}else this.api.newGame();};
   this.view(this.currentView,false);
  }
  beginGuide(){this.flags={active:true,mapOpened:false,citySelected:false};this.view('room',false);this.render();}
  stopGuide(){this.flags.active=false;this.api.room().targetStation=null;this.render();this.api.toast('教学已关闭。上方任务和行动建议会继续帮助你。');}
  view(name,signal=true){this.currentView=name;this.roomPanel.hidden=name!=='room';this.mapPanel.hidden=name!=='map';document.getElementById('viewRoom').setAttribute('aria-pressed',name==='room');document.getElementById('viewMap').setAttribute('aria-pressed',name==='map');if(name==='map'&&signal)this.flags.mapOpened=true;this.render();}
  signal(name,data){if(name==='city'&&data==='chongqing')this.flags.citySelected=true;if(name==='map'){this.view('map');return;}this.render();}
  render(){
   const $=id=>document.getElementById(id),s=this.api.state(),G=root.GameCore,m=G.mission(s),g=root.GameDirector.guide(s,this.flags),wins=s.missions.filter(m=>m.success).length;
   try{localStorage.setItem('chiang-guide-v1.1',JSON.stringify({turn:s.turn,flags:this.flags}));}catch{}
   $('completedMissions').textContent=`${wins} / 12`;$('sceneStatus').textContent=s.over?'这段时间线已经结束。':!s.eventDone?'总机有来电。先听听这一轮发生了什么。':s.ap>0?`决定已传达。还有 ${s.ap} 次行动，可以安排城市、电话或方针。`:'三项命令已用完。结束回合，看它们带来了什么。';
   $('missionPanel').innerHTML=`<div class="panel-heading"><span class="eyebrow">第 ${s.turn+1} 回合 · 本轮任务</span><span class="mission-state ${m.done?'ready':''}">${m.done?'已达成，等待结算':'进行中'}</span></div><h3>${m.title}</h3><p>${m.text}</p><div class="mission-progress"><b>${m.value}</b><span>${m.below?'≤':'/'} ${m.target} ${G.content.resources[m.metric]||'守备'}</span><i class="${m.done?'ready':''}">${m.done?'✓':'○'}</i></div><div class="mission-reward">完成奖励：国库 +12 · 粮秣 +8 · 民心 +3</div><p class="mission-footnote">任务不是硬性门槛，未完成也能继续。最佳和解结局需要完成至少 7 项任务。</p>`;
   document.querySelectorAll('.guide-focus').forEach(el=>el.classList.remove('guide-focus'));
   $('guidePanel').hidden=!g;
   if(g){$('guidePanel').innerHTML=`<div class="guide-number">${String(g.number).padStart(2,'0')}<small>/ 06</small></div><div class="guide-copy"><span class="eyebrow">参谋带你玩第一回合</span><h3>${g.title}</h3><p>${g.text}</p></div><div class="guide-buttons"><button id="guideAction">${g.button} →</button><button id="skipGuide">跳过教学</button></div>`;const target=document.querySelector(g.target);if(target)target.classList.add('guide-focus');$('guideAction').onclick=()=>this.next(g);$('skipGuide').onclick=()=>this.stopGuide();this.api.room().targetStation=g.id==='map'?'map':g.id==='phone'?'phone':null;}
   else this.api.room().targetStation=null;
   if(g&&!document.getElementById('modal').open&&this.lastGuide!==g.id){this.lastGuide=g.id;const target=document.querySelector(g.target);target?.scrollIntoView({behavior:'smooth',block:'center'});}
  }
  next(g){
   if(g.id==='phone')this.api.answer();
   if(g.id==='map')this.view('map');
   if(g.id==='city'){this.api.selectCity('chongqing');this.flags.citySelected=true;this.render();}
   if(g.id==='industry'){this.api.selectCity('chongqing');this.api.action('industry');this.render();}
   if(g.id==='settle')document.getElementById('endTurnBtn').click();
   if(g.id==='complete')this.stopGuide();
  }
  policy(){
   const s=this.api.state(),G=root.GameCore,names={balanced:'均衡',defense:'守势',mobilize:'动员',welfare:'民生'};
   this.api.show(`<div class="modal-content"><span class="eyebrow">施政方针 / 持续到你再次更改</span><h2 id="modalTitle">今天的方针，明天的代价。</h2><p>当前采用「${names[s.doctrine]}」。更换消耗 8 国库与 1 行动，每轮最多调整一次；下一轮不会自动恢复。</p><div class="policy-options">${['policyBalanced','policyDefense','policyMobilize','policyWelfare'].map(id=>{const a=G.content.actions[id],check=G.canAct(s,id);return `<button data-policy="${id}" ${check.ok?'':'disabled'} class="${s.doctrine===a.policy?'selected':''}"><span>${a.icon} ${a.name}</span><small>${a.detail}</small><em>${s.doctrine===a.policy?'当前采用':check.ok?'更换：国库 8 · 1 行动':check.message}</em></button>`;}).join('')}</div><div class="modal-actions"><button id="policyClose" class="secondary-btn">返回指挥部</button></div></div>`);
   document.querySelectorAll('[data-policy]').forEach(b=>b.onclick=()=>{const result=this.api.action(b.dataset.policy);if(result.ok)this.api.close();});document.getElementById('policyClose').onclick=this.api.close;
  }
  report(r){
   const G=root.GameCore,e=G.content.events[r.turn],b=r.battle,delta=k=>r.after[k]-r.before[k],names=G.content.resources;
   const result=b?(b.held?'防线守住了。':'防线失守了。'):'后方开始运转。';
   const battle=b?`<div class="battle-report ${b.held?'held':'lost'}"><div><span>我方 · ${b.city}</span><b>${b.defense}</b><i style="--battle-width:${Math.min(b.defense,100)}%"></i></div><span class="battle-vs">对阵</span><div><span>进攻压力</span><b>${b.strength}</b><i style="--battle-width:${b.strength}%"></i></div></div><p class="report-explain">${b.held?'守备、军备和粮秣形成的战力足够挡住本轮攻势。守军付出了消耗，需要在下轮修复。':'我方战力低于进攻压力。下轮可以组织反攻；也可以保存力量、经营后方。'}</p>`:'<div class="logistics-report"><span>▥<small>城市与工厂</small></span><b>→</b><span>¤<small>收入到库</small></span><b>→</b><span>♧<small>粮秣配给</small></span></div><p class="report-explain">本轮没有前线战斗。你的城市、工业和施政方针一起决定财政与粮秣结算。</p>';
   this.api.show(`<div class="modal-content settlement"><span class="eyebrow">${e.date} · 回合战报</span><h2 id="modalTitle">${result}</h2>${battle}<div class="report-deltas">${['treasury','supplies','army','morale'].map(k=>`<div><span>${names[k]}</span><b class="${delta(k)<0?'negative':''}">${delta(k)>=0?'+':''}${delta(k)}</b><small>${r.before[k]} → ${r.after[k]}</small></div>`).join('')}</div><div class="report-task ${r.mission.success?'success':''}"><b>${r.mission.success?'✓ 任务完成':'○ 任务未完成'}</b><span>${r.mission.title}</span><small>${r.mission.success?'已收到奖励：国库 +12、粮秣 +8、民心 +3。':'没有收到任务奖励，下轮仍可以继续。'}</small></div><div class="next-risk"><span class="eyebrow">下一轮先看什么</span><p>${r.next?`${r.next.city.name}将承受 ${r.next.strength} 点压力，我方当前战力 ${r.next.defense}。${r.next.safe?'修整后继续经营后方。':'优先考虑守备、粮食或守势方针。'}`:'先接新的电话，看看下一个阶段的任务。'}</p></div><div class="modal-actions"><button id="reportClose" class="primary-btn">进入 ${G.content.events[this.api.state().turn].date} <span>→</span></button></div><p class="save-notice">上面的变化是结束回合时的净变化，已包含战斗、任务奖励与资源结算。</p></div>`);document.getElementById('reportClose').onclick=()=>{this.api.close();if(this.flags.active)this.view('map');this.render();};
  }
 }
 root.GameExperience=GameExperience;
})(window);
