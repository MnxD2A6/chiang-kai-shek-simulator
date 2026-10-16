(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./preparation.js'),require('./story-consequences.js'),require('./civic.js'));else root.FrontHomefront=factory(root.FrontPreparation,root.FrontConsequences,root.FrontCivics);})(typeof globalThis!=='undefined'?globalThis:this,function(P,C,D){
 'use strict';
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n)),yes=message=>({ok:true,message}),no=message=>({ok:false,message});
 const town=(s,id)=>s.towns.find(t=>t.id===id),owned=(s,c)=>s.owners[town(s,c.id).tile]===1;
 const average=(s,key)=>s.homefront.cities.reduce((sum,c)=>sum+c[key],0)/s.homefront.cities.length;
 function init(s){const health=s.strategy.integrity;s.homefront={cities:s.towns.filter(t=>t.country==='TWN').map(t=>({id:t.id,buildings:health,industry:health,repair:null,occupied:s.owners[t.tile]!==1})),support:80,airDefense:{batteries:0,ammo:0,order:null},salvos:0,strikeTarget:null,lastStrike:null,invasion:{phase:'idle',nextAt:null,launchAt:null,target:null,payloads:[],wave:0,repelled:0,lastAction:'尚未宣布登陆行动。'},victoryHold:0,homeLost:0,defeatReason:null};if(s.strategy.warning)warn(s);return s;}
 function economy(s){const h=s.homefront,production=h.cities.reduce((n,c)=>n+(owned(s,c)?c.industry:0),0)/h.cities.length;return (.2+.8*production/100)*(.65+.35*average(s,'buildings')/100)*(.6+.5*h.support/100)*D.income(s);}
 const protection=s=>Math.min(.3,s.strategy.levels.technology*.06+s.strategy.levels.diplomacy*.02+(s.strategy.partners.korea&&s.world.sanctions<2&&s.world.relations.korea>-30&&!s.world.flags.koreaWar?.04:0));
 const interceptionCapacity=s=>s.homefront.airDefense.batteries?Math.min(5,s.homefront.airDefense.batteries*2+P.bonuses(s).interceptBonus):0;
 const permit=s=>s.world.relations.usa>=10&&s.world.sanctions===0&&!s.world.flags.koreaWar;
 function buy(s){const d=s.homefront.airDefense;if(s.result)return no('本局已结束。');if(!permit(s))return no('美国暂停军售：需美国态度至少 +10、没有制裁且半岛航路可用。');if(d.order||d.batteries>=2)return no(d.order?'防空系统正在交付，请等待。':'最多部署两套防空系统。');if(s.strategy.funds<900)return no('美国防空系统需要 900 资金。');const duration=C.bonuses(s).deliveryTime;s.strategy.funds-=900;d.order={endsAt:s.time+duration};if(s.world.consequences?.procurement>0)s.world.consequences.procurement--;return yes('已支付 900 资金。防空系统约 '+(duration/30).toFixed(1)+' 周后交付，每套每轮最多拦截两枚，弹药需另行补充。');}
 function reload(s){const d=s.homefront.airDefense;if(s.result||d.batteries===0)return no('先购买并部署防空系统。');if(!permit(s))return no('美国暂不批准拦截弹补给，请先修复外交关系。');if(d.ammo>=d.batteries*8)return no('拦截弹已满。');const count=Math.min(4,d.batteries*8-d.ammo),cost=count*40;if(s.strategy.funds<cost)return no('补充拦截弹需要 '+cost+' 资金。');s.strategy.funds-=cost;d.ammo+=count;return yes('已支付 '+cost+' 资金，补充 '+count+' 枚拦截弹。');}
 function repair(s,id,api){const c=s.homefront.cities.find(c=>c.id===id)||s.homefront.cities.filter(c=>owned(s,c)&&!c.repair).sort((a,b)=>a.industry+a.buildings-b.industry-b.buildings)[0];if(s.result||!c||!owned(s,c))return no('只能维修仍由我方控制的台湾城市。');if(c.repair)return no('这座城市正在维修。');if(c.industry>=100&&c.buildings>=100)return no('这座城市的建筑和工厂完好。');if(s.strategy.funds<160)return no('城市重建需要 160 资金。');s.strategy.funds-=160;const duration=D.repairTime(s,P.bonuses(s).repairTime);c.repair={endsAt:s.time+duration};api?.event(s,town(s,c.id).name+'开始重建：160资金，约 '+(duration/30).toFixed(2)+' 周后恢复工厂与建筑。');return yes('重建已开工。完成后工厂最多 +30、建筑最多 +24、民心 +'+P.bonuses(s).repairSupport+'；占领期间工程会暂停。');}
 function tick(s,api){const h=s.homefront,d=h.airDefense;if(d.order&&s.time>=d.order.endsAt&&permit(s)){d.batteries++;d.ammo+=8;d.order=null;api.event(s,'美国防空系统交付：自动拦截城市来袭导弹，注意剩余弹药。','success');}
  for(const c of h.cities)if(c.repair&&s.time>=c.repair.endsAt&&owned(s,c)){c.industry=clamp(c.industry+30);c.buildings=clamp(c.buildings+24);c.repair=null;const support=P.bonuses(s).repairSupport;h.support=clamp(h.support+support);api.event(s,town(s,c.id).name+'重建完成：生产恢复，民心 +'+support+'。','success');}s.strategy.integrity=average(s,'buildings');
 }
 function warn(s){const h=s.homefront,available=h.cities.filter(c=>owned(s,c)),pool=available.length?available:h.cities;h.strikeTarget=pool[h.salvos%pool.length].id;}
 function strike(s,api){const h=s.homefront,d=h.airDefense,p=s.strategy,c=h.cities.find(c=>c.id===h.strikeTarget)||h.cities[0],target=town(s,c.id),sheltered=p.warning.sheltered;
  const incoming=6,intercepted=Math.min(d.ammo,interceptionCapacity(s)),hits=incoming-intercepted;d.ammo-=intercepted;
  const prep=P.bonuses(s),effects=C.bonuses(s),before=p.integrity,oldBuildings=c.buildings,oldIndustry=c.industry,factor=(1-protection(s))*prep.damageFactor,personnel=hits*.045*(sheltered?prep.shelterFactor:1)*(1-p.levels.technology*.03)*prep.regionalFactor*effects.medicalFactor;
  const troops=s.factions[1].troops+api.deployed(s,1);s.factions[1].troops*=1-personnel;
  for(const u of s.units||[])if(s.terrain[u.tile]&&Math.hypot(target.x-u.tile%api.W,target.y-Math.floor(u.tile/api.W))<9)u.force*=1-personnel;
  c.buildings=clamp(c.buildings-hits*6*factor);c.industry=clamp(c.industry-hits*10*factor);
  const supportLoss=Math.min(h.support,(4+hits*(sheltered?.65:2.3))*(sheltered?prep.civilSupportFactor:1)*effects.medicalFactor);h.support-=supportLoss;
  const bill=Math.min(p.funds,hits*35*effects.insuranceFactor);p.funds-=bill;p.integrity=average(s,'buildings');C.consumeStrike(s);
  const lost=Math.max(0,Math.round(troops-s.factions[1].troops-api.deployed(s,1)));
  h.lastStrike={at:s.time,city:c.id,incoming,intercepted,hits,sheltered,buildingDamage:oldBuildings-c.buildings,industryDamage:oldIndustry-c.industry,supportLoss,bill,lost};h.salvos++;
  if(s.naval&&intercepted)s.naval.bursts.push({tile:target.tile-api.W,at:s.time,kind:'intercept'});
  p.lastStrike={at:s.time,damage:before-p.integrity,lost};api.event(s,`${target.name}遭导弹袭击：${intercepted} 枚拦截 / ${hits} 枚命中，工厂 −${Math.ceil(h.lastStrike.industryDamage)}，民心 −${Math.ceil(supportLoss)}，应急支出 ${Math.floor(bill)}。`,'danger');
 }
 function validate(s,v){const bad=()=>{throw Error('城市、防空或登陆行动存档无效。');},num=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b,int=(n,a,b)=>Number.isInteger(n)&&num(n,a,b),ids=s.towns.filter(t=>t.country==='TWN').map(t=>t.id);
  if(!v||!Array.isArray(v.cities)||v.cities.length!==ids.length||new Set(v.cities.map(c=>c?.id)).size!==ids.length||!num(v.support,0,100)||!int(v.salvos,0,10000)||!(v.strikeTarget===null||ids.includes(v.strikeTarget))||!num(v.victoryHold,0,30.1)||!num(v.homeLost,0,15.1)||![null,'support','cities','infrastructure'].includes(v.defeatReason))bad();
  for(const c of v.cities)if(!c||!ids.includes(c.id)||!num(c.buildings,0,100)||!num(c.industry,0,100)||typeof c.occupied!=='boolean'||c.repair!==null&&(!c.repair||!num(c.repair.endsAt,0,s.time+12.1)))bad();
  if(Math.abs(v.cities.reduce((n,c)=>n+c.buildings,0)/v.cities.length-s.strategy.integrity)>1e-5)bad();
  const d=v.airDefense;if(!d||!int(d.batteries,0,2)||!int(d.ammo,0,d.batteries*8)||d.order!==null&&(!d.order||d.batteries>=2||!num(d.order.endsAt,0,s.time+24.1)))bad();
  const i=v.invasion;if(!i||!['idle','assembling','sailing','landed','repelled'].includes(i.phase)||!int(i.wave,0,10000)||!(i.target===null||ids.includes(i.target))||!Array.isArray(i.payloads)||i.payloads.length>2||new Set(i.payloads.map(p=>p?.shipId)).size!==i.payloads.length||typeof i.lastAction!=='string'||i.lastAction.length>200||!(i.nextAt===null||num(i.nextAt,0,s.time+90.1))||!(i.launchAt===null||num(i.launchAt,0,s.time+18.1)))bad();
  if(!int(i.repelled,0,i.wave)||i.phase==='assembling'&&(i.launchAt===null||!ids.includes(i.target))||i.phase==='sailing'&&(!i.payloads.length||!ids.includes(i.target))||i.phase!=='sailing'&&i.payloads.length)bad();
  for(const p of i.payloads)if(!p||!int(p.force,1,1800)||!ids.includes(p.target)||!s.naval.ships.some(a=>a.id===p.shipId&&a.faction===3&&a.kind==='transport'))bad();
  const r=v.lastStrike;if(r!==null&&(!r||!num(r.at,0,s.time)||!ids.includes(r.city)||r.incoming!==6||!int(r.intercepted,0,5)||r.hits!==6-r.intercepted||typeof r.sheltered!=='boolean'||!num(r.buildingDamage,0,36)||!num(r.industryDamage,0,60)||!num(r.supportLoss,0,30)||!num(r.bill,0,210)||!num(r.lost,0,1000000)))bad();
  return JSON.parse(JSON.stringify(v));
 }
 return {init,economy,protection,permit,buy,reload,repair,tick,warn,strike,validate,average,interceptionCapacity};
});
