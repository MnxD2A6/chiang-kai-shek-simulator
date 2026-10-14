(function(){
  'use strict';
  const F=window.FrontCore,$=id=>document.getElementById(id),fmt=n=>Math.max(0,Math.floor(n)).toLocaleString(),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const time=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
  let state=F.createStrategic(1357),started=false,saved=null,selected=null,navy=true,rosterOpen=window.innerWidth>=900,missileMode=false,storage=true,last=0,refresh=0,lastSave=0,reported=false,drag=null,toastTimer;
  try{const raw=localStorage.getItem('strait-front-v5')||localStorage.getItem('strait-front-v4')||localStorage.getItem('strait-front-v3');if(raw)saved=F.decode(raw);}catch{storage=false;}
  const view=new FrontMap($('map')),strategyUI=new StrategyUI(()=>state,fn=>action(fn));strategyUI.open=false;
  function toast(text){$('toast').classList.toggle('order-toast',/→|正在前往|自动进攻/.test(text));$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4200);}
  function save(){if(!started)return;try{localStorage.setItem('strait-front-v5',F.encode(state));storage=true;}catch{storage=false;}}
  function action(fn){const r=fn();toast(r.message);save();render();return r;}
  function show(html){$('modalBody').innerHTML=html;if(!$('modal').open)$('modal').showModal();}
  function close(){$('modal').close();}
  function begin(resume){
    state=resume&&saved?saved:F.createStrategic(Date.now());state.paused=false;started=true;reported=false;selected=null;missileMode=false;navy=true;last=0;lastSave=state.time;
    view.lastTexture=-10;view.home();strategyUI.open=false;strategyUI.selected=null;$('startScreen').hidden=true;document.body.classList.remove('intro');close();save();render();
    toast(resume?'战役已恢复；点选军队即可继续指挥。':'点军队或舰船，再点城市或海域。选择后即可直接下令。');
  }
  function select(id,focus=false){selected=id;missileMode=false;const u=state.units.find(a=>a.id===id)||state.naval.ships.find(a=>a.id===id);navy=!!u?.kind;if(!u)return;if(focus)view.focus(u.tile);render();}
  function target(tile){
    if(!started||$('modal').open||tile===null)return;
    if(missileMode){const boat=state.naval.ships.find(a=>a.id===selected&&a.kind==='missile');const r=action(()=>F.missile(state,{tile},boat?.id??null));if(r.ok)missileMode=false;render();return;}
    const vessel=state.naval.ships.find(a=>a.id===selected);if(vessel){action(()=>F.shipOrder(state,selected,tile));return;}
    if(selected===null){toast('先选一支我方军队，再点目的地城市。');return;}
    const r=action(()=>F.order(state,selected,tile));if(r.ok)view.rings.push({tile,t:performance.now()/1000});
  }
  function help(){show(`<span class="eyebrow">两次点击就能下令</span><h2 id="modalTitle">你只需要选人，再选地方。</h2><div class="how-steps"><div><em>01</em><span><b>点地图上的我方军队。</b><small>也可在部队列表选择。选中的部队会亮起，显示路线和兵力。</small></span></div><div><em>02</em><span><b>点一座城市。</b><small>我方城市：移动后驻守。敌方城市：自动渡海、进攻，攻下后驻守。重新点另一座城市即可改令。筹备期先试试台北与高雄之间的调动。</small></span></div><div><em>03</em><span><b>留意兵力，守住夺下的城市。</b><small>补兵从预备兵转入选中的军队；驻守部队会抵抗附近反攻。「停止 / 驻守」只取消这支部队的命令。控制福州、南京、广州获胜。</small></span></div></div><p><b>海战：</b>运输舰靠近陆军后自动运兵；驱逐舰自动护航和拦截附近导弹；导弹艇可选中后用「导弹打击」。选舰船后点海域移动，点敌舰靠近交战。俄罗斯、朝鲜援军抵达后会反攻我方大陆据点。</p><p>准备进攻时打开「发展」：可投资经济、科技、外交，再决定开战。空袭时疏散，受损后修复。空格暂停，暂停也能下令。拖动与缩放地图。</p><button id="helpClose" class="primary-btn">开始指挥 →</button>`);$('helpClose').onclick=close;}
  function archives(){show(`<span class="eyebrow">渡海 / 赛璐璐指挥版 1.6</span><h2 id="modalTitle">战役存档</h2><p>${storage?'自动保存已开启。':'本地保存不可用，请导出存档。'}旧版地图进度会自动迁移，原存档保留。打开菜单时战场暂停。</p><div class="modal-actions"><button id="export" ${started?'':'disabled'}>导出 JSON</button><button id="import">导入存档</button><button id="newRun">开始新战役</button></div>`);
    $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([F.encode(state)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`strait-front-v5-${Math.floor(state.time)}s.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    $('import').onclick=()=>$('importFile').click();$('newRun').onclick=()=>{show('<h2 id="modalTitle">开始新战役？</h2><p>本版自动存档将被替换，可以先导出留档。</p><div class="modal-actions"><button id="cancelNew">返回</button><button id="confirmNew" class="primary-btn">开始新远征</button></div>');$('cancelNew').onclick=archives;$('confirmNew').onclick=()=>begin(false);};
  }
  function render(){
    if(selected!==null&&!state.units.some(u=>u.id===selected)&&!state.naval.ships.some(u=>u.id===selected))selected=null;
    const vessel=state.naval.ships.find(a=>a.id===selected&&a.faction===1),u=state.units.find(a=>a.id===selected),reserve=state.factions[1].troops,owned=state.towns.filter(t=>t.goal&&state.owners[t.tile]===1);
    view.selectedUnit=selected;
    $('game').dataset.time=state.time.toFixed(1);$('game').dataset.result=state.result||'';$('game').dataset.selected=selected??'';
    $('headerPhase').textContent=state.result?'战役结束':state.strategy.phase==='preparation'?'筹备期':'战斗中';$('headerReserve').textContent=fmt(reserve);document.body.classList.toggle('battle-paused',state.paused);$('headerFundsValue').textContent=fmt(state.strategy.funds);$('clock').textContent=time(state.time);$('troops').textContent=fmt(reserve);$('growth').textContent='预备兵 +'+fmt(F.growth(state,1))+'/秒';$('capacity').textContent=fmt(F.capacity(state,1));$('deployed').textContent=fmt(F.deployed(state,1));$('land').textContent=fmt(F.landCount(state,1));
    $('objectiveCount').textContent=owned.length+' / 3';$('controlPercent').textContent=(F.progress(state).ratio*100).toFixed(1)+'%';
    $('pause').disabled=!started||!!state.result;$('pauseIcon').textContent=state.paused?'▶':'Ⅱ';$('pauseText').textContent=state.paused?'继续战场':'暂停战场';$('paused').hidden=!started||!state.paused||!!state.result;
    if(!$('objectives').children.length)for(const t of state.towns.filter(t=>t.goal)){const b=document.createElement('button');b.dataset.goal=t.id;b.onclick=()=>{view.focus(t.tile);toast('已定位'+t.name+'。选军队后，点击地图上的城市下令。');};$('objectives').append(b);}
    for(const b of $('objectives').children){const t=state.towns.find(t=>t.id===b.dataset.goal),held=state.owners[t.tile]===1;b.className=held?'done':'';b.textContent=(held?'✓ ':'○ ')+t.name;b.setAttribute('aria-label','定位'+t.name);}
    $('armyCount').textContent=state.units.length;$('reserveSummary').textContent='预备兵 '+fmt(reserve);
    $('recruit').disabled=!started||!!state.result||reserve<250||state.units.length>=6;$('recruit').title='消耗 250 预备兵，在我方城市组建新军';
    const ids=new Set(state.units.map(a=>String(a.id)));
    for(const el of [...$('armyRoster').children])if(!ids.has(el.dataset.unit))el.remove();
    for(const a of state.units){let b=$('roster-'+a.id);if(!b){b=document.createElement('button');b.id='roster-'+a.id;b.dataset.unit=a.id;b.onclick=()=>select(a.id,true);$('armyRoster').append(b);}b.className='army-card'+(a.id===selected?' selected':'');b.setAttribute('aria-label','选择'+a.name);b.setAttribute('aria-pressed',a.id===selected);const content=`<span class="unit-symbol">${!state.terrain[a.tile]?'≈':'×'}</span><span><b>${esc(a.name)}</b><small>${F.unitStatus(state,a)}${a.path.length?' → '+esc(state.towns.find(t=>t.tile===a.goal)?.name||'目的地'):''}</small></span><strong>${fmt(a.force)}</strong>`;if(b.innerHTML!==content)b.innerHTML=content;}
    $('selectionLabel').textContent=u?'已选择 · '+fmt(u.force)+' 人':'指挥提示';$('selectedName').textContent=u?u.name:'点选地图上的军队';
    $('selectedStatus').textContent=u?(u.path.length?'前往 '+(state.towns.find(t=>t.tile===u.goal)?.name||'指定位置')+' · 约 '+Math.ceil(u.path.length/2.8)+' 秒 · 再点城市可改令':F.unitStatus(state,u)+' · 点城市下达新命令'):'再点城市，自动移动、进攻或驻守。';
    $('hold').disabled=!(u||vessel)||!!state.result||!(u||vessel).path.length;$('reinforce').disabled=!u||!!state.result||reserve<1||state.owners[u.tile]!==1;$('locate').disabled=!(u||vessel);
    $('guideTitle').textContent=u?'点目的地城市':'选一支军队';$('guideText').textContent=u?(state.strategy.phase==='preparation'?'试着点台北或高雄；准备进攻时打开「发展」。':'我方城市 = 移动驻守 · 敌方城市 = 进攻'):'点地图上我方军队的图标。';document.querySelector('.step-number').textContent=u?'2':'1';
    renderNavy(vessel);renderSelection(u,vessel);
    $('armyDock').hidden=!started||!rosterOpen;$('rosterToggle').setAttribute('aria-expanded',rosterOpen);
    $('buildDrawer').hidden=!navy;
    $('moveOrder').disabled=!(u||vessel)||!!state.result;
    $('commandLabel').textContent=(u||vessel)?.name?'COMMAND / '+(u||vessel).name:'SELECT A UNIT / 选择单位';
    strategyUI.render(started);$('strategyToggle').textContent='发展';updateMarkers();
    if(state.result&&!reported){reported=true;save();show(`<span class="eyebrow">战役结束 · ${time(state.time)}</span><h2 id="modalTitle">${state.result==='victory'?'三座目标城市已控制。':'这次远征结束了。'}</h2><p>${state.result==='victory'?'你的部队完成了这次战役。':'重新积累实力，并留下部队守住后方；空袭前及时疏散和修复设施。'}</p><div class="modal-actions"><button id="again" class="primary-btn">再来一局</button><button id="viewResult">查看地图</button></div>`);$('again').onclick=()=>begin(false);$('viewResult').onclick=close;}
  }
  function screenObstacles(){
    const frame=$('map').getBoundingClientRect(),out=[];
    for(const id of ['selectedPanel','commandTray','armyDock','strategyPanel','fieldGuide','missileWarning']){const el=$(id),r=el.getBoundingClientRect();if(!el.hidden&&r.width&&r.height&&getComputedStyle(el).display!=='none')out.push({x:r.left-frame.left,y:r.top-frame.top,w:r.width,h:r.height});}
    for(const sel of ['.mission-panel','.map-navigation','.zoom-controls']){const r=document.querySelector(sel).getBoundingClientRect();out.push({x:r.left-frame.left,y:r.top-frame.top,w:r.width,h:r.height});}
    for(const t of state.towns)if(view.visibleTowns.has(t.id)){const p=view.townScreen(t);out.push({x:p.x-15,y:p.y-19,w:76,h:33});}
    return out;
  }
  function renderSelection(u,vessel){
    const chosen=u||vessel;$('selectedPanel').classList.toggle('is-moving',!!chosen?.path.length);$('unitValue').textContent=chosen?fmt(vessel?vessel.hp:u.force):'—';$('unitMetric').textContent=vessel?'舰体耐久 / HP':u?'现有兵力 / 人':'点图标选择单位';$('unitBar').style.width=chosen?(vessel?vessel.hp/F.shipTypes[vessel.kind].hp*100:100)+'%':'0%';
    if(!chosen){$('selectionLabel').textContent='蒋介石 / 指挥接入';$('selectedName').textContent='等待你的指令';$('selectedStatus').textContent='点地图上的图标，再点城市或海域下令。';}
  }
  function updateMarkers(){
    for(const r of F.regions){let b=$('region-'+r.id);if(!b){b=document.createElement('button');b.id='region-'+r.id;b.className='world-hit';b.setAttribute('aria-label',r.name+'，查看合作机会');b.onclick=()=>{if(started)strategyUI.choose(r.id);};$('worldButtons').append(b);}const p=view.regionScreen(r);b.style.left=p.x+'px';b.style.top=p.y+'px';b.hidden=!view.visible(p,0)||!view.visibleRegions.has(r.id);}
    for(const h of F.hostiles){let b=$('hostile-'+h.id);if(!b){b=document.createElement('button');b.id='hostile-'+h.id;b.className='world-hit hostile-hit';b.setAttribute('aria-label',h.name+'，大陆援军');b.onclick=()=>showEnemy(h.id);$('hostileButtons').append(b);}const p=view.hostileScreen(h);b.style.left=p.x+'px';b.style.top=p.y+'px';b.hidden=!view.visible(p,0);}
    for(const t of state.towns){let b=$('target-'+t.id);if(!b){b=document.createElement('button');b.id='target-'+t.id;b.className='town-hit';b.onclick=()=>target(t.tile);$('townButtons').append(b);}const p=view.townScreen(t),own=state.owners[t.tile]===1;b.style.left=p.x+'px';b.style.top=p.y+'px';b.hidden=!view.visible(p,0)||!view.visibleTowns.has(t.id);b.dataset.owner=state.owners[t.tile];b.classList.toggle('order-ready',selected!==null);b.setAttribute('aria-label',t.name+'，'+(own?'我方城市，移动驻守':'敌方城市，进攻'));b.title=t.name+' · '+(selected===null?'先选择单位':own?'移动并驻守':'进攻并驻守');}
    const all=[...state.units.map((a,i)=>({a,type:'army',number:i+1})),...state.naval.ships.map((a,i)=>({a,type:'ship',number:i+1}))];
    const ids=new Set(all.map(({a,type})=>(type==='army'?'unit-':'map-ship-')+a.id));
    for(const container of [$('unitButtons'),$('shipButtons')])for(const el of [...container.children])if(!ids.has(el.id))el.remove();
    const anchors=all.map(({a,type,number})=>{const pos=type==='army'?F.unitPosition(a):F.shipPosition(a),p=view.screen(pos.x,pos.y);return {id:a.id,a,type,number,...p};}).filter(m=>view.visible(m,0));
    const obstacles=screenObstacles(),placed=FrontMarkerLayout.place(anchors,view.width,view.height,obstacles,selected,34),lookup=new Map(placed.map(m=>[m.id,m]));
    view.markerPositions=placed;view.hudObstacles=obstacles;
    for(const {a,type,number} of all){const id=(type==='army'?'unit-':'map-ship-')+a.id;let b=$(id);if(!b){b=document.createElement('button');b.id=id;b.className='map-marker';b.onclick=()=>{const current=(type==='army'?state.units:state.naval.ships).find(v=>v.id===a.id);if(!current)return;if(current.faction===1){select(current.id);return;}if(missileMode){const boat=state.naval.ships.find(v=>v.id===selected&&v.kind==='missile'&&v.faction===1),r=action(()=>F.missile(state,{shipId:current.id},boat?.id??null));if(r.ok)missileMode=false;render();return;}const own=state.naval.ships.find(v=>v.id===selected&&v.faction===1);if(own)action(()=>F.shipOrder(state,own.id,current.tile));else target(current.tile);};(type==='army'?$('unitButtons'):$('shipButtons')).append(b);}const p=lookup.get(a.id);b.hidden=!started||view.zoom<3||!p||p.hidden;if(p){b.style.left=p.x+'px';b.style.top=p.y+'px';}b.dataset.markerType=type;b.classList.toggle('selected',a.id===selected);b.classList.toggle('enemy',a.faction!==1);b.setAttribute('aria-pressed',a.id===selected);b.setAttribute('aria-label',type==='army'?'地图军队：'+a.name+'，'+fmt(a.force)+'人，'+F.unitStatus(state,a):(a.faction===1?'我方舰船：':'敌方舰船：')+a.name);b.title=a.name+' · '+(type==='army'?fmt(a.force)+' 人':Math.ceil(a.hp)+' HP');const content=(type==='ship'?`<img src="./assets/ship-${a.kind}.svg" alt="">`:'<span class="army-glyph">×</span>')+`<span class="marker-number">${number}</span>`;if(b.innerHTML!==content)b.innerHTML=content;b.onpointerenter=()=>{view.hoveredUnit=a.id;};b.onpointerleave=()=>{view.hoveredUnit=null;};}
    const focus=placed.find(m=>m.id===(view.hoveredUnit??selected)),label=FrontMarkerLayout.callout(focus,view.width,view.height,obstacles,placed);
    $('markerCallout').hidden=!started||view.zoom<3||!label;if(label){const a=focus.a;$('markerCallout').style.width=label.w+'px';$('markerCallout').style.left=label.x+'px';$('markerCallout').style.top=label.y+'px';$('markerCallout').textContent=a.name+' · '+(focus.type==='army'?fmt(a.force)+'人':Math.ceil(a.hp)+' HP');}
    $('game').dataset.visibleMarkers=placed.filter(m=>!m.hidden).length;
  }
  $('start').onclick=()=>begin(false);$('continue').hidden=!saved;$('continue').onclick=()=>begin(true);$('help').onclick=help;$('brand').onclick=e=>{e.preventDefault();help();};$('save').onclick=archives;$('modalClose').onclick=close;
  $('pause').onclick=()=>{if(started&&!state.result){state.paused=!state.paused;save();render();}};
  $('hold').onclick=()=>action(()=>state.naval.ships.some(a=>a.id===selected)?F.stopShip(state,selected):F.hold(state,selected));$('reinforce').onclick=()=>action(()=>state.naval.ships.some(a=>a.id===selected)?F.repairShip(state,selected):F.reinforce(state,selected));$('locate').onclick=()=>{const u=state.units.find(a=>a.id===selected)||state.naval.ships.find(a=>a.id===selected);if(u)view.focus(u.tile);};
  $('recruit').onclick=()=>{const r=action(()=>F.recruit(state));if(r.ok)select(r.id,true);};$('sound').hidden=true;
  $('zoomIn').onclick=()=>view.setZoom(view.zoom*1.3);$('zoomOut').onclick=()=>view.setZoom(view.zoom/1.3);$('fit').onclick=()=>view.overview();$('homeView').onclick=()=>{strategyUI.open=false;view.home();render();};$('pacificView').onclick=()=>{strategyUI.open=false;view.overview();render();};
  $('focusRegion').onclick=()=>{view.focusRegion(strategyUI.selected);strategyUI.open=false;render();};$('worldOverview').onclick=()=>{strategyUI.open=false;view.overview();render();toast('点击美国、日本、韩国或菲律宾洽谈合作。');};
  $('rosterToggle').onclick=()=>{rosterOpen=!rosterOpen;render();};$('rosterClose').onclick=()=>{rosterOpen=false;render();};
  $('moveOrder').onclick=()=>{missileMode=false;render();toast('现在点城市或海域，下达移动或进攻命令。');};
  $('landTab').onclick=()=>{navy=false;render();};$('navyTab').onclick=()=>{navy=true;render();};
  document.querySelectorAll('[data-build]').forEach(b=>b.onclick=()=>{const r=action(()=>F.buildShip(state,b.dataset.build));if(r.ok)select(r.id,true);});
  $('missileMode').onclick=()=>{missileMode=!missileMode;render();};
  $('enemyOverview').onclick=()=>{view.overview();strategyUI.open=false;showEnemy();};
  function showEnemy(key){const h=F.hostiles.find(a=>a.id===key);show(`<span class="eyebrow">敌方支援 / 架空战役</span><h2 id="modalTitle">${h?h.name+' · 大陆援军':'大陆援军态势'}</h2><p>${h?h.description:'开战后俄罗斯和朝鲜会派出可见的运输纵队。到达大陆后，援军会向我方据点推进，舰艇会参与海战。'}</p><div class="aid-list">${state.naval.aid.length?state.naval.aid.filter(a=>!key||a.key===key).map(a=>`<p><b>${a.key==='russia'?'俄罗斯':'朝鲜'}</b> · ${a.delivered?'已抵达':Math.max(0,Math.ceil(a.arrive-state.time))+' 秒后抵达'} · ${fmt(a.force)} 兵力</p>`).join(''):'<p>筹备期：敌方援军尚未出发。</p>'}</div><button id="enemyClose" class="primary-btn">返回指挥</button>`);$('enemyClose').onclick=close;}
  function renderNavy(vessel){
    const ships=state.naval.ships.filter(a=>a.faction===1);$('shipCount').textContent=ships.length;$('armyRoster').hidden=navy;$('shipRoster').hidden=!navy;$('fleetBuild').hidden=!navy;$('recruit').hidden=navy;$('landTab').setAttribute('aria-pressed',!navy);$('navyTab').setAttribute('aria-pressed',navy);
    const ids=new Set(ships.map(a=>String(a.id)));for(const el of [...$('shipRoster').children])if(!ids.has(el.dataset.ship))el.remove();
    for(const a of ships){let b=$('vessel-'+a.id);if(!b){b=document.createElement('button');b.id='vessel-'+a.id;b.dataset.ship=a.id;b.onclick=()=>select(a.id,true);$('shipRoster').append(b);}b.className='army-card ship-card'+(a.id===selected?' selected':'');b.setAttribute('aria-label','选择'+a.name);b.setAttribute('aria-pressed',a.id===selected);const content=`<span class="fleet-glyph" aria-hidden="true"></span><span><b>${esc(a.name)}</b><small>${F.shipTypes[a.kind].name} · ${a.cargo!==null?'运兵中':a.path.length?'航行中':'待命'}</small><i style="--hp:${a.hp/F.shipTypes[a.kind].hp*100}%"></i></span><strong>${Math.ceil(a.hp)}<small>HP</small></strong>`;if(b.innerHTML!==content)b.innerHTML=content;}
    for(const b of document.querySelectorAll('[data-build]'))b.disabled=!started||!!state.result||state.strategy.funds<F.shipTypes[b.dataset.build].cost||ships.length>=10;
    $('reinforce').textContent=vessel?'维修 · 60':'补兵 +500';if(vessel)$('reinforce').disabled=!!state.result||state.strategy.funds<60||vessel.hp>=F.shipTypes[vessel.kind].hp;
    if(vessel){$('selectionLabel').textContent=F.shipTypes[vessel.kind].name+' · '+Math.ceil(vessel.hp)+' HP';$('selectedName').textContent=vessel.name;$('selectedStatus').textContent=vessel.kind==='transport'?(vessel.cargo!==null?'运兵中 · 通过搭载的陆军改令':'靠近我方军队后自动承接渡海运输'):vessel.kind==='destroyer'?'自动攻击附近敌舰，并拦截附近来袭导弹':'舰载导弹 '+vessel.ammo+' 枚 · 点「导弹打击」再点敌舰或敌城';}
    $('radioLine').textContent='指挥部 / '+(state.events[0]?.text||'通讯接入，等待指令。');
    const boat=vessel?.kind==='missile'?vessel:null;$('missileStock').textContent=boat?boat.ammo:state.naval.stock;$('missileMode').disabled=!started||!!state.result||state.strategy.phase!=='war';$('missileMode').classList.toggle('armed',missileMode);$('missileMode').setAttribute('aria-pressed',missileMode);
    const pending=state.naval.aid.filter(a=>!a.delivered).sort((a,b)=>a.arrive-b.arrive)[0];$('aidStatus').textContent=pending?Math.ceil(Math.max(0,pending.arrive-state.time))+'秒':state.naval.aid.length?'已抵达':'待机';
    $('guideTitle').textContent=missileMode?'选择导弹目标':vessel?'点海域或敌舰':selected===null?'选择军队或舰船':$('guideTitle').textContent;
    if(missileMode)$('guideText').textContent='点敌舰或敌方城市发射 · 40资金 · Esc取消';else if(vessel)$('guideText').textContent=vessel.kind==='transport'?'运输舰靠近陆军，自动搭载渡海。':'点海域移动，靠近敌舰自动交战。';else if(selected===null)$('guideText').textContent='白色是我方，黄色是敌舰。在部队列表切换陆军 / 舰队。';
  }
  const canvas=$('map');canvas.onpointerdown=e=>{if(!started||$('modal').open)return;const r=canvas.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,rect:r};canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{const r=canvas.getBoundingClientRect();if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6)drag.moved=true;if(drag.moved){view.pan.x+=dx;view.pan.y+=dy;view.constrain();}drag.x=e.clientX;drag.y=e.clientY;}view.hover=view.tile(e.clientX-r.left,e.clientY-r.top);};
  canvas.onpointerup=e=>{if(!drag)return;const d=drag;drag=null;if(!d.moved)target(view.tile(e.clientX-d.rect.left,e.clientY-d.rect.top));};canvas.onpointercancel=()=>drag=null;canvas.onlostpointercapture=()=>drag=null;
  canvas.onwheel=e=>{e.preventDefault();const r=canvas.getBoundingClientRect();view.setZoom(view.zoom*(e.deltaY<0?1.16:1/1.16),e.clientX-r.left,e.clientY-r.top);};
  document.addEventListener('keydown',e=>{if($('modal').open||!started||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key===' '&&!e.repeat){e.preventDefault();$('pause').click();}if(e.key==='Escape'){selected=null;missileMode=false;render();}if(['1','2','3','4','5','6'].includes(e.key)){const u=state.units[Number(e.key)-1];if(u)select(u.id,true);}});
  window.addEventListener('resize',()=>{view.resize();if(window.innerWidth<700)rosterOpen=false;render();});window.addEventListener('blur',()=>{drag=null;if(started&&!state.result){state.paused=true;save();render();}});document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden&&started&&!state.result){state.paused=true;save();render();}});
  $('importFile').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>1500000)throw Error('存档文件过大。');const raw=await file.text(),version=JSON.parse(raw)?.version;if(version===1||version===2){show('<h2 id="modalTitle">旧地图存档</h2><p>请在旧地图恢复这份存档。</p><a href="./legacy/">前往 1.1 版</a>');return;}saved=F.decode(raw);begin(true);toast('存档已恢复，部队和命令已保留。');}catch(err){toast(err.message);}};
  function tick(now){const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(started&&!$('modal').open&&!document.hidden)F.step(state,dt);view.draw(state,now/1000);updateMarkers();refresh+=dt;if(refresh>.25){refresh=0;render();}if(started&&state.time-lastSave>2){lastSave=state.time;save();}requestAnimationFrame(tick);}
  document.body.classList.add('intro');render();requestAnimationFrame(tick);
})();
