(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./homefront.js'),require('./preparation.js'),require('./story-consequences.js'));else root.FrontStrategy=factory(root.FrontHomefront,root.FrontPreparation,root.FrontConsequences);})(typeof globalThis!=='undefined'?globalThis:this,function(H,P,C){
 'use strict';
 const projects={economy:{name:'经济建设',effect:'收入 +3/秒，兵力上限 +1,800'},technology:{name:'科技研发',effect:'空袭减伤 +22%，进攻损耗 −18%'},diplomacy:{name:'外交支援',effect:'援军 +700，空袭间隔 +18秒，减伤 +4%'}};
 const no=message=>({ok:false,message}),ok=message=>({ok:true,message});
 function init(s,api){
  s.strategy={phase:'preparation',funds:140,integrity:100,levels:{economy:0,technology:0,diplomacy:0},partners:{usa:false,japan:false,korea:false,philippines:false},project:null,warAt:null,nextStrike:null,warning:null,lastStrike:null,repairAt:0};
  if(api.setup)api.setup(s);else for(let i=0;i<api.N;i++)if(s.terrain[i]&&i%api.W<135){const y=Math.floor(i/api.W);api.claim(s,i,y<47?2:y<83?3:4);}
  for(let f=2;f<5;f++)s.factions[f].troops=3000;
  s.events=[];s.flashes=[];api.event(s,'先投资发展，再决定开战。推荐从经济建设开始。');return s;
 }
 const levels=s=>s.strategy?.levels||{economy:0,technology:0,diplomacy:0};
 const support=(s,key)=>!s.world||(s.world.sanctions<2&&s.world.relations[key]>-30&&!(s.world.flags.koreaWar&&['usa','korea'].includes(key))&&!(s.world.flags.duckBlockade&&key==='japan'&&!C.active(s,'harbor')));
 const partners=s=>Object.fromEntries(Object.entries(s.strategy?.partners||{}).map(([key,value])=>[key,value&&support(s,key)]));
 const deterrence=s=>!!s.world?.nuclear?.disclosed&&s.world.nuclear.stock>0&&!s.world.nuclear.used;
 const income=s=>(4+levels(s).economy*3+(partners(s).japan?2:0)+P.bonuses(s).income+C.bonuses(s).income)*(s.homefront?H.economy(s):(.4+.6*(s.strategy?.integrity??100)/100))*(s.world?(s.world.sanctions===2?.4:s.world.sanctions===1?.72:1)*(s.world.flags.europeCrisis?.9:1)*(s.world.opinion<25?.85:s.world.opinion>75?1.1:1):1);
 const bonusCap=s=>levels(s).economy*1800+levels(s).technology*700+levels(s).diplomacy*1200+(partners(s).usa?2000:0)+(partners(s).japan?1000:0)+Math.min(3,s.operations?.wins||0)*600;
 const bonusGrowth=s=>levels(s).economy*12+levels(s).diplomacy*10+(partners(s).japan?8:0);
 const protection=s=>s.homefront?H.protection(s):levels(s).technology*.22+levels(s).diplomacy*.04+(partners(s).korea?.08:0);
 const attackFactor=s=>1-levels(s).technology*.18-(partners(s).korea?.05:0);
 function partner(s,key,api){const p=s.strategy,r=api.regions.find(r=>r.id===key);
  if(s.result||!p||!r)return no('当前无法开展这项合作。');
  if(p.partners[key])return no('合作已达成，收益持续生效。');if(p.project)return no('先完成当前工程或合作。');
  if(p.funds<r.cost)return no(`这项合作需要 ${r.cost} 资金。`);
  p.funds-=r.cost;p.project={key:'partner:'+key,endsAt:s.time+12};api.event(s,`与${r.name}的合作正在推进，12 秒后生效。`);return ok('合作已投入资金，完成后获得对应收益。');
 }
 function upgrade(s,key,api){
  const p=s.strategy;if(s.result||!p||!Object.hasOwn(projects,key))return no('无法进行这项发展。');
  if(p.project)return no('当前工程正在进行，完成后再选择下一项。');
  const level=p.levels[key],cost=80+level*60;if(level>=3)return no('这条路线已满级。');
  if(p.funds<cost)return no(`还需 ${Math.ceil(cost-p.funds)} 资金，收入会自动积累。`);
  const duration=key==='technology'?C.bonuses(s).technologyTime:12;p.funds-=cost;p.project={key,endsAt:s.time+duration};api.event(s,`${projects[key].name}已投入 ${cost} 资金，${duration} 秒后完成。`);return ok('工程已开始'+(duration===8?'，公开科研交流已缩短工期。':'，地图上的时间会继续流动。'));
 }
 function startWar(s,api){
  const p=s.strategy;if(s.result||!p||p.phase!=='preparation')return no('当前无法开战。');
  p.phase='war';p.warAt=s.time;p.nextStrike=s.time+18+(deterrence(s)?20:0);s.nextAI=s.time+25;s.nextNavy=s.time+100;
  api.event(s,'战役开始。点敌方海岸派舰；首轮空袭即将进入预警。','danger');return ok('已进入战时。先点福州海岸建立据点，留意空袭预警。');
 }
 function shelter(s,api){
  const p=s.strategy;if(s.result||!p?.warning||p.warning.sheltered)return no('当前没有需要响应的新预警。');
  const cost=P.bonuses(s).shelterCost;if(p.funds<cost)return no('紧急疏散需要 '+cost+' 资金。');
  p.funds-=cost;p.warning.sheltered=true;api.event(s,s.homefront?'疏散已安排：人员损失降低 '+Math.round((1-P.bonuses(s).shelterFactor)*100)+'%，建筑和工厂仍会受损。':'紧急疏散已安排，本轮空袭损失额外降低 65%。','success');return ok(s.homefront?'疏散保人员；防空拦导弹，维修恢复生产。':'本轮空袭防护已生效。');
 }
 function repair(s,api){
  const p=s.strategy;if(s.result||!p||p.integrity>=100)return no('基础设施目前完好。');
  if(s.time<p.repairAt)return no('修复人员正在周转，请稍后。');
  if(p.funds<100)return no('修复需要 100 资金。');
  const restored=Math.min(25,100-p.integrity);p.funds-=100;p.integrity=Math.min(100,p.integrity+25);p.repairAt=s.time+15;
  api.event(s,`修复完成：基础设施恢复 ${Math.ceil(restored)} 点。`,'success');return ok('基础设施恢复，收入与补兵随之改善。');
 }
 function tick(s,dt,api){
  const p=s.strategy;if(!p)return;
  if(s.homefront)H.tick(s,api);p.funds=Math.min(99999,p.funds+income(s)*dt);
  if(p.project&&s.time>=p.project.endsAt){const key=p.project.key;p.project=null;
   if(key.startsWith('partner:')){const id=key.slice(8),r=api.regions.find(r=>r.id===id);p.partners[id]=true;if(id==='usa')s.factions[1].troops=Math.max(0,Math.min(api.capacity(s,1)-api.deployed(s,1),s.factions[1].troops+1500));api.event(s,`${r.name}合作已达成：${r.effect}。`,'success');}
   else{p.levels[key]++;if(key==='diplomacy')s.factions[1].troops=Math.max(0,Math.min(api.capacity(s,1)-api.deployed(s,1),s.factions[1].troops+700));api.event(s,`${projects[key].name}达到 ${p.levels[key]} 级：${s.homefront?(key==='technology'?'设施加固 +6%，进攻损耗 −18%':key==='diplomacy'?'援军 +700，空袭间隔 +18秒，设施加固 +2%':projects[key].effect):projects[key].effect}。`,'success');}
  }
  if(p.phase!=='war')return;
  if(!p.warning&&s.time>=p.nextStrike){const seconds=(partners(s).philippines?16:12)+P.bonuses(s).warningBonus;p.warning={startedAt:s.time,impactAt:s.time+seconds,sheltered:false};if(s.homefront)H.warn(s);api.event(s,`空袭预警：${seconds} 秒后抵达！可花 ${P.bonuses(s).shelterCost} 资金紧急疏散。`,'danger');}
  if(p.warning&&s.time>=p.warning.impactAt){
   if(s.homefront)H.strike(s,api);else{
   const factor=(1-protection(s))*(p.warning.sheltered?.35:1),damage=36*factor;
   const before=s.factions[1].troops+api.deployed(s,1);s.factions[1].troops*=1-.45*factor;
   for(const fleet of s.fleets)if(fleet.faction===1)fleet.force*=1-.6*factor;
   for(const unit of s.units||[])if(!s.terrain[unit.tile]||s.towns.some(t=>t.country==='TWN'&&Math.hypot(t.x-unit.tile%api.W,t.y-Math.floor(unit.tile/api.W))<20))unit.force*=1-(s.terrain[unit.tile]?.45:.6)*factor;
   p.integrity=Math.max(0,p.integrity-damage);p.lastStrike={at:s.time,damage,lost:Math.round(before-s.factions[1].troops-api.deployed(s,1))};
   api.event(s,`空袭造成 ${Math.ceil(damage)} 点设施损伤，损失 ${p.lastStrike.lost} 兵力。`, 'danger');
   }
   p.warning=null;p.nextStrike=s.time+Math.min(90,36+p.levels.diplomacy*18+(deterrence(s)?20:0));
   if(p.integrity<=0){s.result='defeat';api.event(s,'基础设施全面瘫痪，远征无法继续。','danger');}
  }
 }
 function validate(v,time){
  const bad=()=>{throw Error('筹备或预警存档数据无效。');},num=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
  if(!v||!['preparation','war'].includes(v.phase)||!num(v.funds,0,99999)||!num(v.integrity,0,100)||!v.levels||!num(v.repairAt,0,time+15.1))bad();
  for(const key of Object.keys(projects))if(!Number.isInteger(v.levels[key])||!num(v.levels[key],0,3))bad();
  const partners={usa:false,japan:false,korea:false,philippines:false};for(const key of Object.keys(partners)){if(v.partners){if(typeof v.partners[key]!=='boolean')bad();partners[key]=v.partners[key];}}
  if(v.project){const key=v.project.key;if(typeof key!=='string'||!num(v.project.endsAt,time,time+12.1))bad();if(key.startsWith('partner:')){if(!Object.hasOwn(partners,key.slice(8))||partners[key.slice(8)])bad();}else if(!Object.hasOwn(projects,key)||v.levels[key]>=3)bad();}
  if(v.phase==='preparation'){if(v.warAt!==null||v.nextStrike!==null||v.warning!==null||v.lastStrike!==null)bad();}
  else if(!num(v.warAt,0,time)||!num(v.nextStrike,v.warAt,time+91))bad();
  if(v.warning&&(!num(v.warning.startedAt,v.warAt,time)||!num(v.warning.impactAt,time,time+(partners.philippines?20.1:16.1))||typeof v.warning.sheltered!=='boolean'))bad();
  if(v.lastStrike&&(!num(v.lastStrike.at,v.warAt,time)||!num(v.lastStrike.damage,0,36)||!num(v.lastStrike.lost,0,1000000)))bad();
  return {phase:v.phase,funds:v.funds,integrity:v.integrity,levels:{economy:v.levels.economy,technology:v.levels.technology,diplomacy:v.levels.diplomacy},partners,project:v.project?{key:v.project.key,endsAt:v.project.endsAt}:null,warAt:v.warAt,nextStrike:v.nextStrike,warning:v.warning?{startedAt:v.warning.startedAt,impactAt:v.warning.impactAt,sheltered:v.warning.sheltered}:null,lastStrike:v.lastStrike?{at:v.lastStrike.at,damage:v.lastStrike.damage,lost:v.lastStrike.lost}:null,repairAt:v.repairAt};
 }
 return {projects,init,income,bonusCap,bonusGrowth,protection,attackFactor,partner,upgrade,startWar,shelter,repair,tick,validate,support,deterrence};
});
