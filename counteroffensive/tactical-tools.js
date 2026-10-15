(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./world-core.js'));else root.FrontTactics=factory(root.FrontCore);})(typeof globalThis!=='undefined'?globalThis:this,function(F){
 'use strict';
 const valid=tile=>Number.isInteger(tile)&&tile>=0&&tile<F.N;
 function preview(s,id,tile){
  const u=s.units.find(u=>u.id===id),ship=s.naval.ships.find(a=>a.id===id&&a.faction===1),town=s.towns.find(t=>t.tile===tile),name=town?.name||'目标位置';
  if(!u&&!ship)return {kind:'choose',label:'先选一支军队或舰船',detail:'点橙色单位，再点城市或海域。'};
  if(s.result||!valid(tile)||s.owners[tile]>4)return {kind:'blocked',label:'这里不能下令',detail:'选择地图上的可通行目标。'};
  if(ship&&ship.cargo!==null)return {kind:'blocked',label:'运输舰正在运兵',detail:'选择搭载的陆军改令，运输舰会自动随行。'};
  if(ship)return {kind:'move',label:ship.name+' → '+(town?name+'近海':'指定海域'),detail:ship.kind==='transport'?'移到陆军附近，自动接运。':'进入射程后自动开火；点敌舰可持续追击。'};
  if(!s.terrain[tile])return {kind:'blocked',label:'陆军需要一个陆地目标',detail:'点一座城市，渡海会自动寻找运输舰。'};
  if(s.strategy.phase==='preparation'&&s.owners[tile]!==1)return {kind:'blocked',label:'先准备登陆，再进攻'+name,detail:'左上“准备登陆”可以进入战役。'};
  const own=s.owners[tile]===1;return {kind:own?'guard':'attack',label:u.name+' → '+(own?'驻守':'进攻')+name,detail:own?'抵达后自动驻守；可在我方陆地补兵。':'沿真实路线推进，攻下后自动驻守。'};
 }
 function goalOrder(s,id,key){const town=s.towns.find(t=>t.id===key&&t.goal);if(!town)return {ok:false,message:'请选择一座目标城市。'};if(!s.units.some(u=>u.id===id))return {ok:true,kind:'focus',tile:town.tile,message:'已定位'+town.name+'。选一支陆军后再点目标即可下令。'};return {...F.order(s,id,town.tile),kind:'order',tile:town.tile};}
 function current(s,id){const u=s.units.find(a=>a.id===id),ship=s.naval.ships.find(a=>a.id===id&&a.faction===1),a=u||ship;if(!a)return null;
  const town=s.towns.find(t=>t.tile===a.goal),name=town?.name||'指定位置';
  if(ship&&ship.cargo!==null){const cargo=s.units.find(u=>u.id===ship.cargo);return {label:'运兵 · '+(cargo?.name||'陆军'),detail:'通过搭载的陆军改令，运输舰自动随行。',tile:cargo?.goal??ship.tile,kind:'cargo'};}
  if(ship?.follow){const target=s.naval.ships.find(v=>v.id===ship.follow);return {label:(target?.faction===1?'护航':'追击')+' · '+(target?.name||'舰艇'),detail:'持续跟随目标，点其他目的地可改令。',tile:target?.tile??ship.goal,kind:'follow'};}
  if(u?.status==='waiting')return {label:'等待运输舰 · '+name,detail:'运输舰靠近后自动搭载；目标保留。',tile:u.goal,kind:'waiting'};
  if(u?.status==='blocked')return {label:'推进已停止',detail:'兵力不足；在我方陆地补兵，再重新下令。',tile:u.tile,kind:'blocked'};
  if(!a.path.length)return {label:u?'驻守 · '+(s.towns.find(t=>t.tile===a.tile)?.name||'当前据点'):'舰艇待命',detail:'点地图上的城市'+(u?'移动或进攻。':'近海、海域或敌舰下令。'),tile:a.tile,kind:'guard'};
  const seconds=Math.ceil(a.path.reduce((n,t,i)=>n+((i===0?1-a.progress:1)/(ship?4:!s.terrain[t]?3.8:2.8)),0));
  return {label:(u?(s.owners[a.goal]===1?'前往驻守':'进攻'):'航行')+' · '+name,detail:'移动约 '+seconds+' 秒（不含交战）· 可改令。',tile:a.goal,kind:u&&s.owners[a.goal]!==1?'attack':'move'};
 }
 function victories(s){const goals=s.towns.filter(t=>t.goal),n=s.world.nuclear;return {goals,held:goals.filter(t=>s.owners[t.tile]===1).length,canNegotiate:n.status==='ready'&&n.disclosed&&n.stock>0&&!n.used,research:Math.floor(n.progress),used:!!n.used};}
 return {preview,goalOrder,current,victories};
});
