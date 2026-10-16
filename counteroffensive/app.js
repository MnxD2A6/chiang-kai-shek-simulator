(function(){
  'use strict';
  const F=window.FrontCore,$=id=>document.getElementById(id),fmt=n=>Math.max(0,Math.floor(n)).toLocaleString(),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const time=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
  let state=F.createStrategic(1357),started=false,saved=null,selected=null,navy=true,rosterOpen=false,missileMode=false,storage=true,last=0,refresh=0,lastSave=0,reported=false,drag=null,toastTimer;
  try{const raw=localStorage.getItem('strait-front-v13')||localStorage.getItem('strait-front-v12')||localStorage.getItem('strait-front-v11')||localStorage.getItem('strait-front-v10')||localStorage.getItem('strait-front-v9')||localStorage.getItem('strait-front-v8')||localStorage.getItem('strait-front-v7')||localStorage.getItem('strait-front-v6')||localStorage.getItem('strait-front-v5')||localStorage.getItem('strait-front-v4')||localStorage.getItem('strait-front-v3');if(raw)saved=F.decode(raw);}catch{storage=false;}
  const audio=new FrontAudio();let ambientSound=false,soundOpen=false;
  try{const prefs=JSON.parse(localStorage.getItem('strait-front-audio-v1')||'{}');audio.enabled=prefs.enabled!==false;audio.volume=Number.isFinite(prefs.volume)?Math.max(0,Math.min(100,prefs.volume)):55;ambientSound=!!prefs.ambient;}catch{}
  const view=new FrontMap($('map')),strategyUI=new StrategyUI(()=>state,fn=>action(fn));strategyUI.open=false;
  const worldUI=new WorldUI(()=>state,fn=>action(fn),{onOpen:()=>{strategyUI.open=false;rosterOpen=false;render();},onPartner:key=>{strategyUI.choose(key);render();},onEscort:()=>startOperation('escort'),onEscortFocus:()=>{strategyUI.open=false;rosterOpen=false;const guard=state.naval.ships.find(v=>v.faction===1&&v.kind==='destroyer');if(guard)select(guard.id);view.focus(F.operationFocus(state));render();},onStrike:()=>{view.home();render();},onMajor:()=>{uiSound('warning');save();}});
  const campaignUI=new CampaignUI(()=>state,fn=>action(fn),worldUI,()=>{const a=state.naval.ground.find(a=>a.key==='china'),t=state.towns.find(t=>t.id==='shanghai');strategyUI.open=false;worldUI.open=false;view.focus(['assembling','sailing','landed'].includes(state.homefront.invasion.phase)?F.homeDefenseFocus(state):a?.tile??t.tile);render();});
  const homeUI=new HomefrontUI(()=>state,fn=>action(fn),strategyUI,()=>{worldUI.open=false;rosterOpen=false;render();},tile=>{view.focus(tile);render();});
  const endingsUI=new EndingsUI(()=>state,show,close,fn=>action(fn),()=>begin(false));
  audio.onChange=paintSound;view.onFeedback=playFeedback;
  function soundPrefs(){try{localStorage.setItem('strait-front-audio-v1',JSON.stringify({enabled:audio.enabled,volume:audio.volume,ambient:ambientSound}));}catch{}}
  function paintSound(){
    $('sound').hidden=false;$('sound').setAttribute('aria-expanded',soundOpen);$('soundPanel').hidden=!soundOpen;
    $('soundEnabled').checked=audio.enabled;$('soundVolume').value=audio.volume;$('soundVolumeValue').textContent=audio.volume+'%';$('soundAmbient').checked=ambientSound;
    $('soundGlyph').textContent=audio.enabled&&audio.volume?'♪':'×';$('sound').classList.toggle('muted',!audio.enabled||!audio.volume);
    $('soundStatus').textContent=!audio.enabled||!audio.volume?'已静音':audio.phase==='unavailable'?'音效暂不可用，点击试听重试':audio.phase==='loading'?'正在载入音效':audio.phase!=='ready'?'点击后启用声音':audio.suspended?'战场暂停 · 可试听':'声音已启用';
    $('sound').dataset.state=audio.phase;$('sound').dataset.context=audio.ctx?.state||'locked';$('sound').dataset.starts=audio.playCount;$('sound').dataset.lastClip=audio.lastClip;
  }
  function syncAudio(){
    audio.setSuspended(!started||state.paused||!!state.result||$('modal').open||worldUI.dialog.open||worldUI.strikeDialog.open||document.hidden);
    const actor=state.units.find(u=>u.id===selected)||state.naval.ships.find(u=>u.id===selected),moving=actor?.path.length&&actor.status!=='waiting';
    const point=actor?view.markerPoint(actor.id,actor.tile):null,pan=point?Math.max(-.8,Math.min(.8,point.x/view.width*2-1)):0;
    audio.loop('movement',!audio.suspended&&moving?(actor.kind||!state.terrain[actor.tile]?'engine':'march'):null,{pan,gain:.16});
    audio.loop('ambient',!audio.suspended&&ambientSound?'ocean':null,{gain:.09});
    const level=audio.level();$('soundMeter').style.setProperty('--level',Math.min(1,level*10));$('sound').dataset.level=level.toFixed(5);$('sound').dataset.voices=audio.active.size;
  }
  function uiSound(name){if(!audio.enabled||!audio.volume)return;audio.unlock().then(ok=>{if(ok&&!document.hidden)audio.play(name,{channel:'ui',gain:.35});});}
  function playFeedback(e){
    const major=['warning','airstrike','capture','loss','victory','defeat'].includes(e.type),point=e.tile!==undefined?view.markerPoint(e.id,e.tile):null;
    if(!major&&(view.zoom<3||(point&&!view.visible(point,90))))return;
    const pan=point?Math.max(-.8,Math.min(.8,point.x/view.width*2-1)):0,options={pan,channel:'battle'};
    if(e.type==='gun'||e.type==='rifle')audio.play(e.type,{...options,gain:e.type==='gun'?.55:.3,rate:.96+((e.id||0)%5)*.02});
    else if(e.type==='launch')audio.play('missile',{...options,gain:.6});
    else if(e.type==='impact'){
      const water=!state.terrain[e.tile]&&e.kind!=='intercept';
      audio.play(e.kind==='sink'?'sink':e.kind==='intercept'?'intercept':e.kind==='gun'?(water?'water':'impact'):'explosion',{...options,gain:e.kind==='gun'?.3:.65});
      if(water&&e.kind!=='gun')audio.play('water',{...options,gain:.35});
    }else if(e.type==='warning'||e.type==='loss')audio.play('warning',{channel:'battle',gain:.45});
    else if(e.type==='airstrike')audio.play('explosion',{...options,gain:.65});
    else if(e.type==='capture')audio.play('capture',{...options,gain:.55});
    else if(e.type==='victory'||e.type==='defeat')audio.play(e.type,{channel:'ui',gain:.6});
  }
  function toast(text){$('toast').classList.toggle('order-toast',/→|正在前往|自动进攻/.test(text));$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4200);}
  function save(){if(!started)return;try{localStorage.setItem('strait-front-v13',F.encode(state));storage=true;}catch{storage=false;}}
  function action(fn){const r=fn();uiSound(r.ok?'order':'select');toast(r.message);save();render();return r;}
  function show(html){$('modalBody').innerHTML=html;if(!$('modal').open)$('modal').showModal();}
  function close(){$('modal').close();}
  function begin(resume){
    audio.stopAll();uiSound('order');state=resume&&saved?saved:F.createStrategic(Date.now());state.paused=!!state.world.active;worldUI.reset();started=true;reported=false;selected=null;missileMode=false;navy=true;last=0;lastSave=state.time;
    view.lastTexture=-10;view.resetBattleFX();view.home();if(state.operations.active){selected=state.naval.ships.find(v=>v.faction===1&&v.kind==='destroyer')?.id??null;rosterOpen=false;view.focus(F.operationFocus(state));}strategyUI.open=false;strategyUI.selected=null;$('startScreen').hidden=true;document.body.classList.remove('intro');close();save();render();
    toast(resume?'战役已恢复；重大新闻会暂停等待你的回应。':'先点「发展」投资经济、科技或外交，国际议题会随发展出现。');
  }
  function select(id,focus=false){if(id!==selected)uiSound('select');selected=id;view.intent=null;missileMode=false;const u=state.units.find(a=>a.id===id)||state.naval.ships.find(a=>a.id===id);navy=!!u?.kind;if(!u)return;if(focus)view.focus(u.tile);render();}
  function acknowledge(tile){if(Number.isInteger(tile))view.commandAck={tile,at:state.time};}
  function paintOrderHint(){const current=FrontTactics.current(state,selected),intent=view.intent&&FrontTactics.preview(state,selected,view.intent.tile);$('commandHint').textContent=intent?.label||current?.label||'选择单位 → 点击目标';if(intent){view.intent.kind=intent.kind;$('guideTitle').textContent=intent.label;$('guideText').textContent=intent.detail;}}
  function intentAt(tile){view.intent=Number.isInteger(tile)&&selected!==null&&!missileMode?{tile,kind:FrontTactics.preview(state,selected,tile).kind}:null;paintOrderHint();}
  function victoryGuide(){endingsUI.guide();}
  function target(tile){
    if(!started||$('modal').open||tile===null)return;
    if(missileMode){const boat=state.naval.ships.find(a=>a.id===selected&&a.kind==='missile');const r=action(()=>F.missile(state,{tile},boat?.id??null));if(r.ok)missileMode=false;render();return;}
    const vessel=state.naval.ships.find(a=>a.id===selected);if(vessel){const r=action(()=>F.shipOrder(state,selected,tile));if(r.ok)acknowledge(vessel.goal);return;}
    if(selected===null){toast('先选一支我方军队，再点目的地城市。');return;}
    const r=action(()=>F.order(state,selected,tile));if(r.ok)acknowledge(tile);
  }
  function help(){show(`<span class="eyebrow">两次点击就能下令</span><h2 id="modalTitle">你只需要选人，再选地方。</h2><div class="how-steps"><div><em>01</em><span><b>点地图上的我方军队。</b><small>也可在部队列表选择。选中的部队会亮起，显示路线和兵力。</small></span></div><div><em>02</em><span><b>点一座城市。</b><small>我方城市：移动后驻守。敌方城市：自动渡海、进攻，攻下后驻守。重新点另一座城市即可改令。筹备期先试试台北与高雄之间的调动。</small></span></div><div><em>03</em><span><b>留意兵力，守住夺下的城市。</b><small>补兵从预备兵转入选中的军队；驻守部队会抵抗附近反攻。「停止 / 驻守」只取消这支部队的命令。三城守满一周、抵御两轮城市空袭、击退两次登陆，同时保住台北和高雄才能获胜。</small></span></div></div><p><b>海战：</b>运输舰靠近陆军后自动运兵；驱逐舰自动护航和拦截附近导弹；导弹艇可选中后用「导弹打击」。选舰船后点海域移动，点敌舰靠近交战。俄罗斯、朝鲜援军抵达后会反攻我方大陆据点。</p><p><b>国际：</b>右上「国际」查看架空新闻、国家关系和曙光计划。重大事件会暂停，选择后继续；后续剧情和国家行动会影响援助、制裁与战役。科研用稳步、加速、暂停三档操作，完成后可威慑、谈判或实际使用并承担严重后果。</p><p>先点左上「护送补给」或「拦截敌舰」打一场约两分钟的海战，成功后部队直接获得兵员补给。合作与建设可选；点「准备登陆」可直接进入首场登陆战。导弹会炸毁工厂并持续减收、扣民心；疏散只能减少人员伤亡。「发展 → 后方 / 防空」可重建城市、向美国购买900资金的防空系统，并花160补弹。大陆登陆前会公告：选驱逐舰再点敌方运输舰追击，或调军队回台北、高雄驻守。空格暂停，暂停也能下令。拖动与缩放地图。</p><button id="helpClose" class="primary-btn">开始指挥 →</button>`);$('helpClose').onclick=close;}
  function archives(){show(`<span class="eyebrow">渡海 / 插图与多结局版 2.7</span><h2 id="modalTitle">战役存档</h2><p>${storage?'自动保存已开启。':'本地保存不可用，请导出存档。'}原实时版存档可继续，六角格存档从独立入口进入。打开菜单时战场暂停。</p><div class="modal-actions"><button id="export" ${started?'':'disabled'}>导出 JSON</button><button id="import">导入存档</button><button id="newRun">开始新战役</button></div>`);
    $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([F.encode(state)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`strait-front-v13-${Math.floor(state.time)}s.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    $('import').onclick=()=>$('importFile').click();$('newRun').onclick=()=>{show('<h2 id="modalTitle">开始新战役？</h2><p>本版自动存档将被替换，可以先导出留档。</p><div class="modal-actions"><button id="cancelNew">返回</button><button id="confirmNew" class="primary-btn">开始新远征</button></div>');$('cancelNew').onclick=archives;$('confirmNew').onclick=()=>begin(false);};
  }
  function render(){
    if(selected!==null&&!state.units.some(u=>u.id===selected)&&!state.naval.ships.some(u=>u.id===selected))selected=null;
    const vessel=state.naval.ships.find(a=>a.id===selected&&a.faction===1),u=state.units.find(a=>a.id===selected),reserve=state.factions[1].troops,owned=state.towns.filter(t=>t.goal&&state.owners[t.tile]===1);
    view.selectedUnit=selected;
    $('game').dataset.time=state.time.toFixed(1);$('game').dataset.result=state.result||'';$('game').dataset.selected=selected??'';
    $('headerPhase').textContent=state.result?'战役结束':state.strategy.phase==='preparation'?'筹备期':'战斗中';$('headerReserve').textContent=fmt(reserve);document.body.classList.toggle('battle-paused',state.paused);$('headerFundsValue').textContent=fmt(state.strategy.funds);$('clock').textContent=time(state.time);$('troops').textContent=fmt(reserve);$('growth').textContent='预备兵 +'+fmt(F.displayRate(state,F.growth(state,1)))+'/秒';$('capacity').textContent=fmt(F.capacity(state,1));$('deployed').textContent=fmt(F.deployed(state,1));$('land').textContent=fmt(F.landCount(state,1));
    $('objectiveCount').textContent=owned.length+' / 3';$('controlPercent').textContent=(F.progress(state).ratio*100).toFixed(1)+'%';
    $('pause').disabled=!started||!!state.result;$('pauseIcon').textContent=state.paused?'▶':'Ⅱ';$('pauseText').textContent=state.paused?'继续战场':'暂停战场';$('paused').hidden=!started||!state.paused||!!state.result;
    if(!$('objectives').children.length)for(const t of state.towns.filter(t=>t.goal)){const b=document.createElement('button');b.dataset.goal=t.id;b.onclick=()=>{view.focus(t.tile);const r=action(()=>FrontTactics.goalOrder(state,selected,t.id));if(r.ok&&r.kind==='order')acknowledge(t.tile);};b.onpointerenter=()=>intentAt(t.tile);b.onpointerleave=()=>intentAt(null);$('objectives').append(b);}
    for(const b of $('objectives').children){const t=state.towns.find(t=>t.id===b.dataset.goal),held=state.owners[t.tile]===1;b.className=held?'done':'';b.classList.toggle('targeted',u?.goal===t.tile&&u.path.length>0);b.textContent=(held?'✓ ':u?'↗ ':'○ ')+t.name;b.setAttribute('aria-label',u?'命令选中陆军前往'+t.name:'定位'+t.name);b.title=u?(held?'移动驻守':'自动进攻')+' · '+u.name:'定位城市，选择陆军后可直接下令';}
    $('armyCount').textContent=state.units.length;$('reserveSummary').textContent='预备兵 '+fmt(reserve);
    $('recruit').disabled=!started||!!state.result||reserve<250||state.units.length>=6;$('recruit').title='消耗 250 预备兵，在我方城市组建新军';
    const ids=new Set(state.units.map(a=>String(a.id)));
    for(const el of [...$('armyRoster').children])if(!ids.has(el.dataset.unit))el.remove();
    for(const a of state.units){let b=$('roster-'+a.id);if(!b){b=document.createElement('button');b.id='roster-'+a.id;b.dataset.unit=a.id;b.onclick=()=>select(a.id,true);$('armyRoster').append(b);}b.className='army-card'+(a.id===selected?' selected':'');b.setAttribute('aria-label','选择'+a.name);b.setAttribute('aria-pressed',a.id===selected);const content=`<span class="roster-unit-sprite" aria-hidden="true"></span><span><b>${esc(a.name)}</b><small>${F.unitStatus(state,a)}${a.path.length?' → '+esc(state.towns.find(t=>t.tile===a.goal)?.name||'目的地'):''}</small></span><strong>${fmt(a.force)}</strong>`;if(b.innerHTML!==content)b.innerHTML=content;}
    $('selectionLabel').textContent=u?'已选择 · '+fmt(u.force)+' 人':'指挥提示';$('selectedName').textContent=u?u.name:'点选地图上的军队';
    $('selectedStatus').textContent=u?(u.path.length?'前往 '+(state.towns.find(t=>t.tile===u.goal)?.name||'指定位置')+' · 约 '+F.realSeconds(state,u.path.length/2.8)+' 秒 · 再点城市可改令':F.unitStatus(state,u)+' · 点城市下达新命令'):'再点城市，自动移动、进攻或驻守。';
    $('hold').disabled=!(u||vessel)||!!state.result||!((u||vessel).path.length||vessel?.follow);$('reinforce').disabled=!u||!!state.result||reserve<1||state.owners[u.tile]!==1;$('locate').disabled=!(u||vessel);
    $('guideTitle').textContent=u?'点目的地城市':'选一支军队';$('guideText').textContent=u?(state.strategy.phase==='preparation'?'试着点台北或高雄；准备进攻时打开「发展」。':'我方城市 = 移动驻守 · 敌方城市 = 进攻'):'点地图上我方军队的图标。';document.querySelector('.step-number').textContent=u?'2':'1';
    renderNavy(vessel);renderSelection(u,vessel);
    $('armyDock').hidden=!started||!rosterOpen;$('rosterToggle').setAttribute('aria-expanded',rosterOpen);
    $('buildDrawer').hidden=!navy;
    $('moveOrder').disabled=!(u||vessel)||!!state.result;
    $('commandLabel').textContent=(u||vessel)?.name?'COMMAND / '+(u||vessel).name:'SELECT A UNIT / 选择单位';
    strategyUI.render(started);$('strategyToggle').textContent='发展';renderOperation();worldUI.render(started);campaignUI.render(started);homeUI.render();const order=FrontTactics.current(state,selected);if(order){$('selectedStatus').textContent=order.label+' · '+order.detail;$('selectedName').title=order.label;$('selectedPanel').dataset.order=order.kind;}paintOrderHint();updateMarkers();
    endingsUI.render(started);
    if(state.result&&!reported){reported=true;save();endingsUI.result();}
  }
  function renderOperation(){
    const prep=state.strategy.phase==='preparation',o=state.operations,a=o.active,r=o.lastResult;
    document.body.classList.toggle('sea-action',prep);$('game').dataset.operation=a?.kind||'';$('game').dataset.operationResult=r?.outcome||'';
    $('missionIndex').innerHTML=prep?'行<br>动':'夺<br>城';$('objectives').hidden=prep;
    $('startEscort').hidden=!prep||!!a;$('startIntercept').hidden=!prep||!!a;$('beginLanding').hidden=!prep||!!a;$('operationFocus').hidden=!a;
    $('operationBrief').hidden=false;$('operationStats').hidden=!prep;
    if(prep){
      $('missionTitle').textContent=a?F.operationTypes[a.kind].name:r?.outcome==='success'?'补给到位，继续出击':'筹备期 · 选择你的路线';
      $('objectiveCount').textContent=a?F.realSeconds(state,a.endsAt-state.time)+'秒':'支援 '+Math.min(3,o.wins)+'/3';
      const convoy=a&&state.naval.ships.find(v=>v.id===a.convoyId),enemies=a?a.enemyIds.filter(id=>state.naval.ships.some(v=>v.id===id)).length:0;
      $('operationBrief').textContent=a?F.operationTypes[a.kind].description.replace('60 秒',F.realSeconds(state,60)+' 秒'):r?r.reason:'先发展经济、科技或外交，解锁对应国际议题。在“发展”查看验收条件，完成后从事件中领取长期收益。';
      $('operationStats').textContent=a?(convoy?'补给船 '+Math.ceil(convoy.hp)+'/180 HP · ':'')+'剩余敌舰 '+enemies+' · 成功：'+(o.wins<3?'部队 +600 / 资金 +160':'资金 +160 / 导弹 +1'):r?r.reward:'每场最多 '+F.realSeconds(state,60)+' 秒，可暂停 · 点舰船 → 点敌舰靠近开火';
      $('beginLanding').textContent=o.wins?'带兵登陆 →':'准备登陆 →';
    }else{
      const next=state.towns.find(t=>t.goal&&state.owners[t.tile]!==1);$('missionTitle').textContent=next?'下一目标：'+next.name:'守住大陆后续反击';$('operationBrief').textContent='选陆军 → 点下方目标即可进攻或驻守。';
    }
  }
  function startOperation(kind){const r=action(()=>F.startOperation(state,kind));if(r.ok){strategyUI.open=false;rosterOpen=false;const guard=state.naval.ships.find(v=>v.faction===1&&v.kind==='destroyer');select(guard.id);view.focus(F.operationFocus(state));render();}}
  function landingBrief(){
    const agendaPending=F.preparationSummary(state).filter(a=>['offered','active','review'].includes(a.phase));const army=state.units.find(u=>u.name==='第一军')||state.units[0];if(!army){toast('先在陆军列表组建一支部队。');return;}
    show(`<span class="eyebrow">登陆准备 / 由你下令</span><h2 id="modalTitle">先拿下福州。</h2><p>第一军现有 <b>${fmt(army.force)}</b> 人，预备兵 <b>${fmt(state.factions[1].troops)}</b> 人。下令后会从预备兵补充最多 500 人，自动搭乘运输舰进攻福州。你仍可随时改令。</p><p>开战后大陆会袭击城市，并组织反向登陆；俄罗斯和朝鲜也会增援。疏散只减少人员伤亡，工厂仍会停产。<b>先在「发展 → 后方 / 防空」准备防空与重建预算，给台北、高雄留下驻军。</b>提前派舰队拦截大陆运输舰。攻下三城并守满一周，还要实际抵御两轮空袭、击退两次登陆。左上会显示进度，仍有导弹或登陆威胁就不会提前结算。</p>${agendaPending.length?'<p><b>还有'+agendaPending.length+'项战前议程未兑现：'+agendaPending.map(a=>esc(a.name)).join('、')+'。现在开战会中止这些项目，投入不返还。</b></p>':''}${state.operations.active?'<p>当前海峡行动将结束，本次未完成的补给不会发放。</p>':''}<div class="modal-actions"><button id="landingBack">继续备战</button><button id="landingConfirm" class="primary-btn">出发，登陆福州 →</button></div>`);
    $('landingBack').onclick=close;$('landingConfirm').onclick=()=>{close();if(state.owners[army.tile]===1)F.reinforce(state,army.id);const r=action(()=>F.startWar(state));if(r.ok){strategyUI.open=false;rosterOpen=false;select(army.id);view.home();action(()=>F.order(state,army.id,state.towns.find(t=>t.id==='fuzhou').tile));}};
  }
  function screenObstacles(){
    const frame=$('map').getBoundingClientRect(),out=[];
    for(const id of ['selectedPanel','commandTray','armyDock','strategyPanel','fieldGuide','missileWarning','soundPanel','worldPanel','worldTicker','weekTimeline','countryRail','countryRailToggle','homeThreat']){const el=$(id),r=el.getBoundingClientRect();if(!el.hidden&&r.width&&r.height&&getComputedStyle(el).display!=='none')out.push({x:r.left-frame.left,y:r.top-frame.top,w:r.width,h:r.height});}
    for(const sel of ['.mission-panel','.map-navigation','.zoom-controls']){const r=document.querySelector(sel).getBoundingClientRect();out.push({x:r.left-frame.left,y:r.top-frame.top,w:r.width,h:r.height});}
    for(const t of state.towns)if(view.visibleTowns.has(t.id)){const p=view.townScreen(t);out.push({x:p.x-20,y:p.y-24,w:92,h:44});}
    return out;
  }
  function renderSelection(u,vessel){
    const chosen=u||vessel;$('selectedPanel').classList.toggle('is-moving',!!chosen?.path.length);$('unitValue').textContent=chosen?fmt(vessel?vessel.hp:u.force):'—';$('unitMetric').textContent=vessel?'舰体耐久 / HP':u?'现有兵力 / 人':'点图标选择单位';$('unitBar').style.width=chosen?(vessel?vessel.hp/F.shipTypes[vessel.kind].hp*100:100)+'%':'0%';
    if(!chosen){$('selectionLabel').textContent='蒋介石 / 指挥接入';$('selectedName').textContent='等待你的指令';$('selectedStatus').textContent='点地图上的图标，再点城市或海域下令。';}
  }
  function updateMarkers(){
    for(const r of F.regions){let b=$('region-'+r.id);if(!b){b=document.createElement('button');b.id='region-'+r.id;b.className='world-hit';b.setAttribute('aria-label',r.name+'，查看合作机会');b.onclick=()=>{if(started)worldUI.chooseCountry(r.id);};$('worldButtons').append(b);}const p=view.regionScreen(r);b.style.left=p.x+'px';b.style.top=p.y+'px';b.hidden=!view.visible(p,0)||!view.visibleRegions.has(r.id);}
    for(const h of F.hostiles){let b=$('hostile-'+h.id);if(!b){b=document.createElement('button');b.id='hostile-'+h.id;b.className='world-hit hostile-hit';b.setAttribute('aria-label',h.name+'，大陆援军');b.onclick=()=>worldUI.chooseCountry(h.id);$('hostileButtons').append(b);}const p=view.hostileScreen(h);b.style.left=p.x+'px';b.style.top=p.y+'px';b.hidden=!view.visible(p,0);}
    for(const t of state.towns){let b=$('target-'+t.id);if(!b){b=document.createElement('button');b.id='target-'+t.id;b.className='town-hit';b.onclick=()=>target(t.tile);b.onpointerenter=()=>intentAt(t.tile);b.onpointerleave=()=>intentAt(null);$('townButtons').append(b);}const p=view.townScreen(t),own=state.owners[t.tile]===1;b.style.left=p.x+'px';b.style.top=p.y+'px';b.hidden=!view.visible(p,0)||!view.visibleTowns.has(t.id);b.dataset.owner=state.owners[t.tile];b.classList.toggle('order-ready',selected!==null);b.setAttribute('aria-label',t.name+'，'+(own?'我方城市，移动驻守':'敌方城市，进攻'));b.title=t.name+' · '+(selected===null?'先选择单位':own?'移动并驻守':'进攻并驻守');}
    const all=[...state.units.map((a,i)=>({a,type:'army',number:i+1})),...state.naval.ships.map((a,i)=>({a,type:'ship',number:i+1}))];
    const ids=new Set(all.map(({a,type})=>(type==='army'?'unit-':'map-ship-')+a.id));
    for(const container of [$('unitButtons'),$('shipButtons')])for(const el of [...container.children])if(!ids.has(el.id))el.remove();
    const anchors=all.map(({a,type,number})=>{const pos=type==='army'?F.unitPosition(a):F.shipPosition(a),p=view.screen(pos.x,pos.y);return {id:a.id,a,type,number,...p};}).filter(m=>view.visible(m,0));
    const obstacles=screenObstacles(),placed=FrontMarkerLayout.place(anchors,view.width,view.height,obstacles,selected,view.markerSize),lookup=new Map(placed.map(m=>[m.id,m]));
    view.markerPositions=placed;view.hudObstacles=obstacles;
    for(const {a,type,number} of all){const id=(type==='army'?'unit-':'map-ship-')+a.id;let b=$(id);if(!b){b=document.createElement('button');b.id=id;b.className='map-marker';b.onclick=()=>{const current=(type==='army'?state.units:state.naval.ships).find(v=>v.id===a.id);if(!current)return;if(current.faction===1){const escort=state.naval.ships.find(v=>v.id===selected&&v.faction===1&&v.kind!=='transport');if(current.id===state.operations.active?.convoyId&&escort){action(()=>F.followShip(state,escort.id,current.id));return;}select(current.id);return;}if(missileMode){const boat=state.naval.ships.find(v=>v.id===selected&&v.kind==='missile'&&v.faction===1),r=action(()=>F.missile(state,{shipId:current.id},boat?.id??null));if(r.ok)missileMode=false;render();return;}const own=state.naval.ships.find(v=>v.id===selected&&v.faction===1);if(own)action(()=>F.followShip(state,own.id,current.id));else target(current.tile);};(type==='army'?$('unitButtons'):$('shipButtons')).append(b);}const p=lookup.get(a.id);b.hidden=!started||view.zoom<3||!p||p.hidden;if(p){b.style.left=p.x+'px';b.style.top=p.y+'px';}b.dataset.markerType=type;b.dataset.kind=a.kind||'infantry';b.classList.toggle('is-moving',!!a.path.length&&a.status!=='waiting');b.classList.toggle('selected',a.id===selected);b.classList.toggle('enemy',a.faction!==1);b.setAttribute('aria-pressed',a.id===selected);b.setAttribute('aria-label',type==='army'?'地图军队：'+a.name+'，'+fmt(a.force)+'人，'+F.unitStatus(state,a):(a.faction===1?'我方舰船：':'敌方舰船：')+a.name);b.title=a.name+' · '+(type==='army'?fmt(a.force)+' 人':Math.ceil(a.hp)+' HP');const content=`<span class="marker-number">${number}</span>`;if(b.innerHTML!==content)b.innerHTML=content;b.onpointerenter=()=>{view.hoveredUnit=a.id;};b.onpointerleave=()=>{view.hoveredUnit=null;};}
    const focus=placed.find(m=>m.id===(view.hoveredUnit??selected)),label=FrontMarkerLayout.callout(focus,view.width,view.height,obstacles,placed,132,29,view.markerSize);
    $('markerCallout').hidden=!started||view.zoom<3||!label;if(label){const a=focus.a;$('markerCallout').style.width=label.w+'px';$('markerCallout').style.left=label.x+'px';$('markerCallout').style.top=label.y+'px';$('markerCallout').textContent=a.name+' · '+(focus.type==='army'?fmt(a.force)+'人':Math.ceil(a.hp)+' HP');}
    $('game').dataset.visibleMarkers=placed.filter(m=>!m.hidden).length;
  }
  $('start').onclick=()=>begin(false);$('continue').hidden=!saved;$('continue').onclick=()=>begin(true);$('help').onclick=help;$('brand').onclick=e=>{e.preventDefault();help();};$('save').onclick=archives;$('modalClose').onclick=close;
  $('startEscort').onclick=()=>startOperation('escort');$('startIntercept').onclick=()=>startOperation('intercept');$('operationFocus').onclick=()=>{view.focus(F.operationFocus(state));render();};$('beginLanding').onclick=landingBrief;
  $('victoryGuide').onclick=victoryGuide;
  $('strategyToggle').onclick=()=>{worldUI.open=false;strategyUI.open=!strategyUI.open;render();};
  $('pause').onclick=()=>{if(state.world.active){worldUI.showEvent();toast('先回应待决新闻，再继续时间。');return;}if(started&&!state.result){state.paused=!state.paused;save();render();}};
  $('hold').onclick=()=>action(()=>state.naval.ships.some(a=>a.id===selected)?F.stopShip(state,selected):F.hold(state,selected));$('reinforce').onclick=()=>action(()=>state.naval.ships.some(a=>a.id===selected)?F.repairShip(state,selected):F.reinforce(state,selected));$('locate').onclick=()=>{const u=state.units.find(a=>a.id===selected)||state.naval.ships.find(a=>a.id===selected);if(u)view.focus(u.tile);};
  $('sound').onclick=()=>{soundOpen=!soundOpen;audio.unlock();paintSound();};$('soundClose').onclick=()=>{soundOpen=false;paintSound();};$('soundEnabled').onchange=e=>{audio.setEnabled(e.target.checked);if(audio.enabled)audio.unlock();soundPrefs();};$('soundVolume').oninput=e=>{audio.setVolume(e.target.value);soundPrefs();};$('soundAmbient').onchange=e=>{ambientSound=e.target.checked;soundPrefs();};$('soundPreview').onclick=()=>audio.preview();document.addEventListener('pointerdown',()=>audio.unlock(),{once:true});
  $('recruit').onclick=()=>{const r=action(()=>F.recruit(state));if(r.ok)select(r.id,true);};paintSound();
  $('zoomIn').onclick=()=>view.setZoom(view.zoom*1.3);$('zoomOut').onclick=()=>view.setZoom(view.zoom/1.3);$('fit').onclick=()=>view.overview();$('homeView').onclick=()=>{strategyUI.open=false;worldUI.open=false;view.home();render();};$('pacificView').onclick=()=>{strategyUI.open=false;worldUI.open=false;view.overview();render();};
  $('focusRegion').onclick=()=>{view.focusRegion(strategyUI.selected);strategyUI.open=false;render();};$('worldOverview').onclick=()=>{strategyUI.open=false;view.overview();render();toast('点击美国、日本、韩国或菲律宾洽谈合作。');};
  $('rosterToggle').onclick=()=>{rosterOpen=!rosterOpen;render();};$('rosterClose').onclick=()=>{rosterOpen=false;render();};
  $('moveOrder').onclick=()=>{missileMode=false;render();toast('现在点城市或海域，下达移动或进攻命令。');};
  $('landTab').onclick=()=>{navy=false;render();};$('navyTab').onclick=()=>{navy=true;render();};
  document.querySelectorAll('[data-build]').forEach(b=>b.onclick=()=>{const r=action(()=>F.buildShip(state,b.dataset.build));if(r.ok)select(r.id,true);});
  $('missileMode').onclick=()=>{missileMode=!missileMode;render();};
  $('enemyOverview').onclick=()=>{view.overview();strategyUI.open=false;showEnemy();};
  function showEnemy(key){const h=F.hostiles.find(a=>a.id===key);show(`<span class="eyebrow">敌方支援 / 架空战役</span><h2 id="modalTitle">${h?h.name+' · 大陆援军':'大陆援军态势'}</h2><p>${h?h.description:'开战后俄罗斯和朝鲜会派出可见的运输纵队。到达大陆后，援军会向我方据点推进，舰艇会参与海战。'}</p><div class="aid-list">${state.naval.aid.length?state.naval.aid.filter(a=>!key||a.key===key).map(a=>`<p><b>${a.key==='russia'?'俄罗斯':'朝鲜'}</b> · ${a.delivered?'已抵达':F.realSeconds(state,a.arrive-state.time)+' 秒后抵达'} · ${fmt(a.force)} 兵力</p>`).join(''):'<p>筹备期：敌方援军尚未出发。</p>'}</div><button id="enemyClose" class="primary-btn">返回指挥</button>`);$('enemyClose').onclick=close;}
  function renderNavy(vessel){
    const ships=state.naval.ships.filter(a=>a.faction===1);$('shipCount').textContent=ships.length;$('armyRoster').hidden=navy;$('shipRoster').hidden=!navy;$('fleetBuild').hidden=!navy;$('recruit').hidden=navy;$('landTab').setAttribute('aria-pressed',!navy);$('navyTab').setAttribute('aria-pressed',navy);
    const ids=new Set(ships.map(a=>String(a.id)));for(const el of [...$('shipRoster').children])if(!ids.has(el.dataset.ship))el.remove();
    for(const a of ships){let b=$('vessel-'+a.id);if(!b){b=document.createElement('button');b.id='vessel-'+a.id;b.dataset.ship=a.id;b.onclick=()=>select(a.id,true);$('shipRoster').append(b);}b.className='army-card ship-card'+(a.id===selected?' selected':'');b.setAttribute('aria-label','选择'+a.name);b.setAttribute('aria-pressed',a.id===selected);const content=`<span class="fleet-glyph" data-kind="${a.kind}" aria-hidden="true"></span><span><b>${esc(a.name)}</b><small>${F.shipTypes[a.kind].name} · ${a.cargo!==null?'运兵中':a.path.length?'航行中':'待命'}</small><i style="--hp:${a.hp/F.shipTypes[a.kind].hp*100}%"></i></span><strong>${Math.ceil(a.hp)}<small>HP</small></strong>`;if(b.innerHTML!==content)b.innerHTML=content;}
    for(const b of document.querySelectorAll('[data-build]')){const cost=F.shipCost(state,b.dataset.build);b.querySelector('small').textContent=cost+'资金';b.disabled=!started||!!state.result||state.strategy.funds<cost||ships.length>=10;}
    $('reinforce').textContent=vessel?'维修 · 60':'补兵 +500';if(vessel)$('reinforce').disabled=!!state.result||state.strategy.funds<60||vessel.hp>=F.shipTypes[vessel.kind].hp;
    if(vessel){$('selectionLabel').textContent=F.shipTypes[vessel.kind].name+' · '+Math.ceil(vessel.hp)+' HP';$('selectedName').textContent=vessel.name;$('selectedStatus').textContent=vessel.kind==='transport'?(vessel.cargo!==null?'运兵中 · 通过搭载的陆军改令':'靠近我方军队后自动承接渡海运输'):vessel.follow?'持续'+(state.naval.ships.find(v=>v.id===vessel.follow)?.faction===1?'护航':'追击')+' · '+(state.naval.ships.find(v=>v.id===vessel.follow)?.name||'目标')+' · 点其他海域可改令':vessel.kind==='destroyer'?'点敌舰持续追击；点补给船持续护航':'舰载导弹 '+vessel.ammo+' 枚 · 点「导弹打击」再点敌舰或敌城';}
    $('radioLine').textContent='指挥部 / '+(state.events[0]?.text||'通讯接入，等待指令。');
    const boat=vessel?.kind==='missile'?vessel:null;$('missileStock').textContent=boat?boat.ammo:state.naval.stock;$('missileMode').disabled=!started||!!state.result||(state.strategy.phase!=='war'&&!state.operations.active);$('missileMode').classList.toggle('armed',missileMode);$('missileMode').setAttribute('aria-pressed',missileMode);
    const pending=state.naval.aid.filter(a=>!a.delivered).sort((a,b)=>a.arrive-b.arrive)[0];$('aidStatus').textContent=pending?F.realSeconds(state,pending.arrive-state.time)+'秒':state.naval.aid.length?'已抵达':'待机';
    $('guideTitle').textContent=missileMode?'选择导弹目标':vessel?'点海域或敌舰':selected===null?'选择军队或舰船':$('guideTitle').textContent;
    if(missileMode)$('guideText').textContent='点敌舰或敌方城市发射 · 40资金 · Esc取消';else if(vessel)$('guideText').textContent=vessel.kind==='transport'?'运输舰靠近陆军，自动搭载渡海。':'点海域移动，靠近敌舰自动交战。';else if(selected===null)$('guideText').textContent='橙色标记是我方，黄色标记是敌军。在部队列表切换陆军 / 舰队。';
  }
  const canvas=$('map');canvas.onpointerdown=e=>{if(!started||$('modal').open)return;const r=canvas.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,rect:r};canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{const r=canvas.getBoundingClientRect();if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6)drag.moved=true;if(drag.moved){view.pan.x+=dx;view.pan.y+=dy;view.constrain();}drag.x=e.clientX;drag.y=e.clientY;}view.hover=view.tile(e.clientX-r.left,e.clientY-r.top);intentAt(drag?.moved?null:view.hover);};
  canvas.onpointerleave=()=>{view.hover=null;intentAt(null);};canvas.onpointerup=e=>{if(!drag)return;const d=drag;drag=null;if(!d.moved)target(view.tile(e.clientX-d.rect.left,e.clientY-d.rect.top));};canvas.onpointercancel=()=>drag=null;canvas.onlostpointercapture=()=>drag=null;
  canvas.onwheel=e=>{e.preventDefault();const r=canvas.getBoundingClientRect();view.setZoom(view.zoom*(e.deltaY<0?1.16:1/1.16),e.clientX-r.left,e.clientY-r.top);};
  document.addEventListener('keydown',e=>{if($('modal').open||worldUI.dialog.open||worldUI.strikeDialog.open||!started||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key===' '&&!e.repeat){e.preventDefault();$('pause').click();}if(e.key==='Escape'){selected=null;missileMode=false;render();}if(['1','2','3','4','5','6'].includes(e.key)){const u=state.units[Number(e.key)-1];if(u)select(u.id,true);}});
  window.addEventListener('resize',()=>{view.resize();if(window.innerWidth<700)rosterOpen=false;render();});window.addEventListener('blur',()=>{drag=null;if(started&&!state.result){state.paused=true;save();render();}});document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden)audio.stopAll();if(document.hidden&&started&&!state.result){state.paused=true;save();render();}});
  $('importFile').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>1500000)throw Error('存档文件过大。');const raw=await file.text(),version=JSON.parse(raw)?.version;if(version===1||version===2){show('<h2 id="modalTitle">旧地图存档</h2><p>请在旧地图恢复这份存档。</p><a href="./legacy/">前往 1.1 版</a>');return;}saved=F.decode(raw);begin(true);toast('存档已恢复，部队和命令已保留。');}catch(err){toast(err.message);}};
  function tick(now){const dt=last?Math.min(.1,(now-last)/1000):0;last=now;syncAudio();if(started&&!$('modal').open&&!worldUI.dialog.open&&!worldUI.strikeDialog.open&&!document.hidden)F.step(state,dt);view.draw(state,now/1000);updateMarkers();refresh+=dt;if(refresh>.25){refresh=0;render();}if(started&&state.time-lastSave>2){lastSave=state.time;save();}requestAnimationFrame(tick);}
  document.body.classList.add('intro');render();requestAnimationFrame(tick);
})();
