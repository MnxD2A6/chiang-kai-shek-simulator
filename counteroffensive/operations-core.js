(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./naval-core.js'));else root.FrontCore=factory(root.FrontCore);})(typeof globalThis!=='undefined'?globalThis:this,function(Base){
 'use strict';
 const F={...Base},empty=()=>({wins:0,attempts:0,active:null,lastResult:null});
 F.operationTypes={escort:{name:'护送补给',description:'补给船自动驶向台北。点海岚号，再点补给船持续护航；点敌舰可追击，也能发射导弹。',reward:'第一军 +600 人 · 160 资金 · 岸防导弹 +1'},intercept:{name:'拦截袭击舰队',description:'60 秒内击沉两艘敌舰。点驱逐舰，再点敌舰靠近开火；导弹可以迅速削减耐久。',reward:'第一军 +600 人 · 160 资金 · 岸防导弹 +1'}};
 const log=(s,text,kind='info')=>{s.events.unshift({text,kind,t:s.time});s.events.length=Math.min(14,s.events.length);};
 const point=(s,x,y)=>F.seaTile(s,F.id(x,y));
 const init=s=>{s.operations=empty();return s;};
 F.createStrategic=seed=>init(Base.createStrategic(seed));
 function clean(s,a){const ids=[a.convoyId,...a.enemyIds];for(const v of s.naval.ships)if(ids.includes(v.follow)){v.follow=null;v.path=[];v.progress=0;v.goal=v.tile;}s.naval.ships=s.naval.ships.filter(v=>!ids.includes(v.id));s.naval.missiles=s.naval.missiles.filter(m=>!ids.includes(m.targetId)&&m.faction===1);}
 function finish(s,outcome,reason){const o=s.operations,a=o.active;if(!a)return;let reward='未获得补给；可重新行动，或调整舰队后再试。';if(outcome==='success'){
   o.wins++;s.strategy.funds=Math.min(99999,s.strategy.funds+160);s.naval.stock=Math.min(5,s.naval.stock+1);
   // First three victories strengthen a field army directly; repeat missions cannot farm unlimited troops.
   const home=s.units.find(u=>u.name==='第一军'&&s.owners[u.tile]===1)||s.units.find(u=>s.owners[u.tile]===1);
   if(home&&o.wins<=3){home.force+=600;reward=home.name+' +600 人 · 160 资金 · 岸防导弹 +1';}else reward='160 资金 · 岸防导弹 +1（兵员支援限前 3 次）';
  }
  clean(s,a);o.lastResult={kind:a.kind,outcome,at:s.time,reason,reward};o.active=null;log(s,reason+' '+reward,outcome==='success'?'success':'danger');
 }
 F.startOperation=function(s,kind){const o=s.operations;if(!Object.hasOwn(F.operationTypes,kind)||!o||o.active||s.result||s.strategy.phase!=='preparation')return {ok:false,message:'筹备期可开始一项海峡行动；先完成当前行动。'};
  if(!s.naval.ships.some(v=>v.faction===1&&v.kind==='destroyer'))return {ok:false,message:'需要一艘驱逐舰。可在舰队列表建造。'};
  const a={kind,startedAt:s.time,endsAt:s.time+60,convoyId:null,enemyIds:[],nextOrder:s.time,goal:point(s,246,209)};o.active=a;o.attempts++;
  if(kind==='escort'){const convoy=F.spawnShip(s,'transport',1,point(s,264,198),'晨光补给船');a.convoyId=convoy.id;Base.shipOrder(s,convoy.id,a.goal);}
  for(const [n,x,y] of [[1,269,196],[2,269,207]]){const e=F.spawnShip(s,kind==='intercept'&&n===1?'destroyer':'missile',3,point(s,x,y),'袭击'+(n===1?'一':'二')+'号');e.hp=kind==='intercept'&&n===1?150:90;e.ammo=0;e.cooldown=s.time+6;a.enemyIds.push(e.id);}
  log(s,F.operationTypes[kind].name+'开始：'+F.operationTypes[kind].description,'danger');return {ok:true,message:'海峡行动开始。点「定位战区」，调动海岚号；导弹也已解锁。'};
 };
 F.shipOrder=function(s,id,tile){if(s.operations?.active?.convoyId===id)return {ok:false,message:'补给船自动进港；请选择海岚号，靠近它护航。'};return Base.shipOrder(s,id,tile);};
 F.stopShip=function(s,id){if(s.operations?.active?.convoyId===id)return {ok:false,message:'补给船自动进港，请指挥护航舰。'};return Base.stopShip(s,id);};
 F.startWar=function(s){if(s.operations?.active)finish(s,'aborted','已结束海峡行动，舰队转入登陆作战。');return Base.startWar(s);};
 F.step=function(s,dt){if(s.paused||s.result||!Number.isFinite(dt)||dt<=0)return;const a=s.operations?.active;
  if(a&&s.time>=a.nextOrder){a.nextOrder=s.time+2;const convoy=s.naval.ships.find(v=>v.id===a.convoyId),target=convoy?.tile??point(s,279,212);for(const id of a.enemyIds){const e=s.naval.ships.find(v=>v.id===id);if(!e)continue;e.path=F.navalRoute(s,e.tile,target)||[];e.goal=target;e.progress=0;}}
  Base.step(s,dt);if(!a)return;const convoy=s.naval.ships.find(v=>v.id===a.convoyId),remaining=a.enemyIds.filter(id=>s.naval.ships.some(v=>v.id===id));
  if(s.result)finish(s,'failure','战役已结束，海峡行动中止。');
  else if(a.kind==='escort'&&!convoy)finish(s,'failure','补给船被击沉。请让驱逐舰更早靠近，或先用导弹清除袭击艇。');
  else if(a.kind==='escort'&&convoy.tile===a.goal&&!convoy.path.length)finish(s,'success','补给船安全靠港！');
  else if(a.kind==='intercept'&&!remaining.length)finish(s,'success','两艘袭击舰均已击沉！');
  else if(s.time>=a.endsAt)finish(s,'failure',a.kind==='escort'?'护送超时，补给船返航。':'敌舰突破拦截区。下次可把舰炮和导弹集中打一艘。');
 };
 F.operationFocus=s=>{const a=s.operations?.active;if(!a)return s.towns.find(t=>t.id==='taipei').tile;const convoy=s.naval.ships.find(v=>v.id===a.convoyId);return convoy?.tile??s.naval.ships.find(v=>a.enemyIds.includes(v.id))?.tile??a.goal;};
 F.encode=s=>JSON.stringify({...JSON.parse(Base.encode(s)),version:6,operations:s.operations});
 F.decode=function(text){const v=JSON.parse(text);if(v.version!==6)return init(Base.decode(text));const o=v.operations,bad=()=>{throw Error('海峡行动存档数据无效。');},num=(n,lo,hi)=>Number.isFinite(n)&&n>=lo&&n<=hi;
  if(!o||!Number.isInteger(o.wins)||!num(o.wins,0,10000)||!Number.isInteger(o.attempts)||!num(o.attempts,o.wins,10000))bad();
  // Validate reserve against the expanded capacity only after the action state is trusted.
  if(!Array.isArray(v.troops))bad();const troops=[...v.troops],reserve=troops[1];troops[1]=0;
  const s=Base.decode(JSON.stringify({...v,troops,version:5}));s.operations={wins:o.wins};if(!num(reserve,0,F.capacity(s,1)+1))bad();s.factions[1].troops=reserve;
  if(o.lastResult!==null){const r=o.lastResult;if(!r||!Object.hasOwn(F.operationTypes,r.kind)||!['success','failure','aborted'].includes(r.outcome)||!num(r.at,0,s.time)||typeof r.reason!=='string'||r.reason.length>160||typeof r.reward!=='string'||r.reward.length>160)bad();}
  if(o.active!==null){const a=o.active;if(!a||!Object.hasOwn(F.operationTypes,a.kind)||s.strategy.phase!=='preparation'||s.result||!num(a.startedAt,0,s.time)||!num(a.endsAt,s.time,s.time+60.1)||Math.abs(a.endsAt-a.startedAt-60)>.001||!num(a.nextOrder,0,s.time+2.1)||!Number.isInteger(a.goal)||a.goal<0||a.goal>=F.N||s.terrain[a.goal]||!Array.isArray(a.enemyIds)||a.enemyIds.length!==2||new Set(a.enemyIds).size!==2||a.enemyIds.some(id=>!Number.isInteger(id)||id<1||id>=s.serial||s.naval.ships.some(v=>v.id===id&&v.faction!==3)))bad();
   if(a.kind==='escort'?!s.naval.ships.some(v=>v.id===a.convoyId&&v.faction===1&&v.kind==='transport'&&v.cargo===null):a.convoyId!==null)bad();
  }
  s.operations=JSON.parse(JSON.stringify(o));return s;
 };
 return F;
});
