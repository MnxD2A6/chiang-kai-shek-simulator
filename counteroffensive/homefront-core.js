(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./world-dynamics.js'),require('./homefront.js'));else root.FrontCore=factory(root.FrontCore,root.FrontHomefront);})(typeof globalThis!=='undefined'?globalThis:this,function(Base,H){
 'use strict';
 const F={...Base};
 function news(s,text,kind='danger'){s.events.unshift({text,kind,t:s.time});s.events.length=Math.min(14,s.events.length);s.world.news.unshift({text,kind:kind==='success'?'brief':'danger',at:s.time});s.world.news.length=Math.min(50,s.world.news.length);}
 F.createStrategic=seed=>H.init(Base.createStrategic(seed));
 F.buyAirDefense=s=>H.buy(s);F.reloadAirDefense=s=>H.reload(s);F.repairCity=(s,id)=>H.repair(s,id,{event:news});
 F.repair=s=>H.repair(s,null,{event:news});
 F.startWar=s=>{const r=Base.startWar(s);if(r.ok){s.homefront.invasion.nextAt=s.time+12;r.message='已开战。大陆将袭击城市并组织登陆；留下驻军和拦截舰队，疏散不能保护建筑。';}return r;};
 function announce(s){const i=s.homefront.invasion,targets=s.towns.filter(t=>t.country==='TWN'&&s.owners[t.tile]===1);if(!targets.length)return;
  const guard=t=>s.units.filter(u=>s.terrain[u.tile]&&Math.hypot(u.tile%F.W-t.x,Math.floor(u.tile/F.W)-t.y)<6).reduce((n,u)=>n+u.force,0);
  targets.sort((a,b)=>guard(a)-guard(b));i.target=targets[0].id;i.phase='assembling';i.launchAt=s.time+18;i.nextAt=null;i.wave++;
  i.lastAction='大陆宣布“收复台湾”作战，目标 '+targets[0].name+'。两艘运输舰与护航舰正在集结。';news(s,i.lastAction+' 出港倒计时 '+F.realSeconds(s,18)+' 秒。');
 }
 function launch(s){const i=s.homefront.invasion,t=s.towns.find(t=>t.id===i.target),origin=['fuzhou','shanghai','guangzhou'].map(id=>s.towns.find(t=>t.id===id)).find(t=>s.owners[t.tile]!==1);if(!origin){i.phase='repelled';i.launchAt=null;i.nextAt=s.time+60;i.lastAction='大陆三个主要出航港口失守，本轮登陆舰队取消出港。';news(s,i.lastAction,'success');return;}if(s.naval.ships.length>36){i.launchAt=s.time+5;return;}
  const end=F.seaTile(s,t.tile),from=F.seaTile(s,origin.tile),route=F.navalRoute(s,from,end);if(!route){i.phase='repelled';i.launchAt=null;i.nextAt=s.time+60;i.lastAction='登陆舰队未能找到航路，本轮部署取消。';news(s,i.lastAction);return;}
  i.payloads=[];for(let j=0;j<2;j++){const ship=F.spawnShip(s,'transport',3,from,'大陆登陆运输舰 '+i.wave+'-'+(j+1));ship.goal=end;ship.path=[...route];i.payloads.push({shipId:ship.id,force:900,target:t.id});}
  const escort=F.spawnShip(s,'destroyer',3,from,'大陆登陆护航舰 '+i.wave);escort.follow=i.payloads[0].shipId;escort.goal=end;escort.path=[...route];i.phase='sailing';i.launchAt=null;
  i.lastAction='大陆登陆舰队已出港 → '+t.name+'，搭载 1,800 人。击沉运输舰可阻止登陆。';news(s,i.lastAction);
 }
 function invasion(s){const i=s.homefront.invasion;if(i.phase==='landed'&&!s.naval.ground.some(a=>a.mission==='taiwan')){i.phase='repelled';i.lastAction='大陆登陆部队已被守军消灭，本轮反登陆成功。';news(s,i.lastAction,'success');}if(i.nextAt===null&&i.phase==='idle')i.nextAt=s.time+12;if(i.nextAt!==null&&s.time>=i.nextAt)announce(s);if(i.phase==='assembling'&&s.time>=i.launchAt)launch(s);if(i.phase!=='sailing')return;
  let landed=false;for(const payload of [...i.payloads]){const ship=s.naval.ships.find(a=>a.id===payload.shipId);if(!ship){i.payloads=i.payloads.filter(p=>p!==payload);continue;}if(ship.path.length||s.naval.ground.length>=8)continue;
   const t=s.towns.find(t=>t.id===payload.target);s.naval.ground.push({id:s.serial++,key:'china',mission:'taiwan',name:'大陆登陆纵队',tile:t.tile,goal:t.tile,force:payload.force,path:[],progress:0,nextOrder:s.time});
   s.naval.ships=s.naval.ships.filter(a=>a.id!==ship.id);i.payloads=i.payloads.filter(p=>p!==payload);landed=true;i.lastAction='大陆部队已在 '+t.name+' 登陆。驻军正在抵抗，立即增援或夺回城市！';news(s,i.lastAction);
  }
  if(!i.payloads.length){i.phase=landed||s.naval.ground.some(a=>a.mission==='taiwan')?'landed':'repelled';i.nextAt=s.time+60;if(i.phase==='repelled'){i.lastAction='登陆运输舰已全部击沉，本轮反登陆成功。';news(s,i.lastAction,'success');}}
 }
 function status(s,dt){const h=s.homefront;for(const c of h.cities){const t=s.towns.find(t=>t.id===c.id),occupied=s.owners[t.tile]!==1;if(occupied&&!c.occupied){c.buildings=Math.max(0,c.buildings-20);c.industry=Math.max(0,c.industry-25);h.support=Math.max(0,h.support-12);news(s,t.name+'失守：民心 −12，建筑和工厂进一步受损。');}c.occupied=occupied;}s.strategy.integrity=H.average(s,'buildings');
  h.homeLost=h.cities.every(c=>c.occupied)?Math.min(15,h.homeLost+dt):0;
  if(h.support<=0||s.strategy.integrity<=0||h.homeLost>=15){h.defeatReason=h.support<=0?'support':s.strategy.integrity<=0?'infrastructure':'cities';s.result='defeat';news(s,h.defeatReason==='support'?'民心耗尽，政府失去继续作战的支持。':h.defeatReason==='cities'?'台北与高雄均失守且未能及时夺回，战役失败。':'城市基础设施全面瘫痪，战役失败。');return;}
  const held=s.towns.filter(t=>t.goal).every(t=>s.owners[t.tile]===1)&&h.cities.every(c=>!c.occupied);h.victoryHold=held?h.victoryHold+dt:0;
  if(h.victoryHold>=30){h.victoryHold=30;s.result='victory';news(s,'三座目标城市守住一周，台湾后方仍在我方控制，战役胜利！','success');}
 }
 F.step=(s,dt)=>{if(s.paused||s.result||!Number.isFinite(dt)||dt<=0)return;const before=s.time;Base.step(s,dt);const elapsed=s.time-before;if(!elapsed)return;s.units=s.units.filter(u=>u.force>0);for(const a of s.naval.ships)if(a.cargo!==null&&!s.units.some(u=>u.id===a.cargo))a.cargo=null;if(s.result&&s.result!=='defeat')return;if(s.strategy.phase==='war')invasion(s);status(s,elapsed);};
 F.homeDefenseFocus=s=>{const i=s.homefront.invasion,ship=s.naval.ships.find(a=>i.payloads.some(p=>p.shipId===a.id)),u=s.naval.ground.find(a=>a.mission==='taiwan');return ship?.tile??u?.tile??s.towns.find(t=>t.id===(i.target||'taipei')).tile;};
 F.encode=s=>JSON.stringify({...JSON.parse(Base.encode(s)),version:9,homefront:s.homefront});
 F.decode=text=>{const raw=JSON.parse(text);if(raw.version!==9)return H.init(Base.decode(text));const s=Base.decode(JSON.stringify({...raw,version:8}));s.homefront=H.validate(s,raw.homefront);return s;};
 return F;
});
