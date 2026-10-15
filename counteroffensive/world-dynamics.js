(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./world-core.js'));else root.FrontCore=factory(root.FrontCore);})(typeof globalThis!=='undefined'?globalThis:this,function(Base){
 'use strict';
 const F={...Base},kinds=['watch','trade','diplomatic','scrutiny','mobilize','patrol','counter'];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),yes=message=>({ok:true,message}),no=message=>({ok:false,message});
 const random=s=>{s.world.rng=(Math.imul(s.world.rng,1664525)+1013904223)>>>0;return s.world.rng/4294967296;};
 const force=s=>s.units.reduce((n,u)=>n+u.force,0)+s.factions[1].troops;
 function init(s,fresh){
  s.campaign={pace:.5,nextReaction:s.time+32+random(s)*18,alert:18,posture:'观察',lastAction:'沿海保持观察，尚未宣布新的部署。',pending:null,history:[],talkAt:0,restraintUntil:0,landingSeen:false};
  if(fresh){const pool=Object.entries(F.worldEvents).filter(([,e])=>e.starter&&!e.requires);const id=pool[Math.floor(random(s)*pool.length)][0];s.world.queue=[{id,due:s.time+12+random(s)*12}];s.world.nextStory=s.time+48+random(s)*24;}
  return s;
 }
 F.createStrategic=seed=>init(Base.createStrategic(seed),true);
 F.realSeconds=(s,seconds)=>Math.max(0,Math.ceil((seconds-1e-8)/(s.campaign?.pace||.5)));
 F.displayRate=(s,rate)=>rate*(s.campaign?.pace||.5);
 F.worldWeek=s=>Math.floor((s.time+1e-8)/30)+1;
 F.weekProgress=s=>{const elapsed=s.time%30;return {week:Math.floor((s.time+1e-8)/30)+1,ratio:elapsed<30-1e-7?elapsed/30:0,remaining:F.realSeconds(s,elapsed<30-1e-7?30-elapsed:30)};};
 F.setPace=(s,pace)=>{if(![.5,1].includes(pace))return no('只能选择 1× 或 2×。');s.campaign.pace=pace;return yes(pace===.5?'已切换 1×：每周约 60 秒，随时可暂停。':'已切换 2×：每周约 30 秒。');};
 function record(s,text,kind){const c=s.campaign;c.lastAction=text;c.history.unshift({kind,at:s.time,text});c.history.length=Math.min(12,c.history.length);s.world.news.unshift({text:'大陆动态：'+text,kind:kind==='watch'?'brief':'danger',at:s.time});s.world.news.length=Math.min(50,s.world.news.length);s.events.unshift({text,kind:kind==='watch'?'info':'danger',t:s.time});s.events.length=Math.min(14,s.events.length);}
 function posture(s){const c=s.campaign,n=s.world.nuclear;c.alert=clamp(18+Math.max(0,force(s)-1200)/180+s.units.length*2+Object.values(s.strategy.partners).filter(Boolean).length*5+n.risk*.2+(s.strategy.phase==='war'?30:0)-(s.time<c.restraintUntil?22:0),5,100);c.posture=s.strategy.phase==='war'?'战时反制':c.alert>=55?'沿海戒备':c.alert>=30?'密切关注':'观察';}
 function intent(s){if(s.strategy.phase==='war')return s.units.some(u=>F.geography.mainland(u.tile))?'counter':'patrol';if(s.world.nuclear.status==='research'&&s.world.nuclear.risk>=15)return 'scrutiny';if(Object.values(s.strategy.partners).some(Boolean))return 'diplomatic';if(force(s)>2200||s.units.length>2||s.naval.ships.filter(a=>a.faction===1).length>4)return 'mobilize';if(s.strategy.levels.economy>0)return 'trade';return 'watch';}
 const notices={watch:'大陆正在重新评估局势',trade:'大陆将调整区域贸易报价',diplomatic:'大陆正在向合作方施加外交压力',scrutiny:'大陆将公开质疑新增科研支出',mobilize:'大陆沿海部队开始集结',patrol:'大陆沿海舰艇准备出港',counter:'大陆准备反击登陆部队'};
 function announce(s,kind=intent(s)){const c=s.campaign;c.pending={kind,due:s.time+6+random(s)*6};record(s,notices[kind]+'，部署将在约 '+F.realSeconds(s,c.pending.due-s.time)+' 秒后落实。',kind);c.nextReaction=s.time+36+random(s)*24;posture(s);}
 function muster(s,counter){
  const existing=s.naval.ground.filter(a=>a.key==='china'&&a.mission!=='taiwan');if(existing.length>=2){for(const a of existing)a.force=Math.min(1800,a.force+350);return '大陆沿海守备队获得补充，现有部队继续执行任务。';}
  const target=s.units.find(u=>F.geography.mainland(u.tile)),p=target?F.xy(target.tile):{x:245,y:190};
  const town=s.towns.filter(t=>t.country==='CHN'&&s.owners[t.tile]!==1&&!existing.some(a=>a.tile===t.tile)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
  if(!town||s.naval.ground.length>=8)return '大陆沿海驻军进入戒备，现有反击力量保持待命。';
  const a={id:s.serial++,key:'china',name:counter?'大陆反击纵队':'大陆沿海守备队',tile:town.tile,force:counter?900:650,path:[],progress:0,goal:town.tile,nextOrder:s.time};s.naval.ground.push(a);
  return town.name+'出现'+a.name+'（'+a.force+'人），'+(counter?'正在向登陆部队推进。':'开战后会参与反击。');
 }
 function resolve(s){const c=s.campaign,p=c.pending;if(!p||s.time+1e-8<p.due)return;c.pending=null;let text;
  if(p.kind==='mobilize'||p.kind==='counter')text=muster(s,p.kind==='counter');
  else if(p.kind==='patrol'){
   const town=s.towns.find(t=>t.country==='CHN'&&s.owners[t.tile]!==1),count=s.naval.ships.filter(a=>a.faction!==1).length;
   if(town&&count<12){const a=F.spawnShip(s,'destroyer',3,town.tile,'大陆沿海巡防舰');const own=s.naval.ships.find(a=>a.faction===1);if(own){a.goal=own.tile;a.path=F.navalRoute(s,a.tile,a.goal)||[];}text='大陆巡防舰已出港，地图上出现新的敌舰。';}else text='大陆巡防舰队保持现有部署。';
  }else if(p.kind==='diplomatic'){s.world.relations.usa=clamp(s.world.relations.usa-6,-100,100);s.world.relations.japan=clamp(s.world.relations.japan-4,-100,100);text='大陆施加外交压力：美国态度 −6，日本态度 −4。可通过外交沟通修复关系。';}
  else if(p.kind==='scrutiny'){const n=s.world.nuclear;if(n.status==='research'&&!n.disclosed){n.risk=clamp(n.risk+6,0,100);text='大陆公开质疑科研预算，项目暴露风险 +6；可暂停投入降低风险。';}else text='大陆对科研支出的质疑未形成新的调查依据。';}
  else if(p.kind==='trade'){const loss=Math.min(40,Math.floor(s.strategy.funds));s.strategy.funds-=loss;text='大陆下调区域贸易报价，临时订单流失 '+loss+' 资金；这次损失已结算。';}
  else{s.world.tension=Math.max(0,s.world.tension-3);text='大陆暂缓升级部署，地区紧张 −3。筹备期仍由你决定何时开战。';}
  record(s,text,p.kind);posture(s);
 }
 F.mainlandTalk=s=>{const c=s.campaign;if(s.result||s.world.active||s.strategy.phase!=='preparation')return no('筹备期且没有待决新闻时可以缓和局势。');if(s.time<c.talkAt)return no('沟通正在协调，请稍后。');if(s.strategy.funds<50)return no('沟通需要 50 资金。');s.strategy.funds-=50;c.talkAt=s.time+30;c.restraintUntil=s.time+60;c.pending=null;c.nextReaction=Math.max(c.nextReaction,s.time+36);s.world.tension=Math.max(0,s.world.tension-8);record(s,'已通过沟通取消本轮大陆部署，紧张 −8；缓和效果持续两周。','watch');posture(s);return yes('本轮部署已取消，争取到了更多筹备时间。');};
 F.startWar=s=>{const r=Base.startWar(s);if(r.ok){s.campaign.pending=null;s.campaign.nextReaction=s.time;posture(s);}return r;};
 F.missile=(s,target,shipId=null)=>{const r=Base.missile(s,target,shipId);if(r.ok)r.message='导弹已发射，约 '+F.realSeconds(s,4)+' 秒抵达。';return r;};
 F.worldChoice=(s,token,id)=>{const before=new Set(s.world.queue.map(q=>q.id)),r=Base.worldChoice(s,token,id);if(r.ok){for(const q of s.world.queue)if(!before.has(q.id)&&q.due>s.time)q.due=s.time+clamp((q.due-s.time)*(.8+random(s)*.55),10,120);s.world.queue.sort((a,b)=>a.due-b.due);}return r;};
 F.step=function(s,dt){if(s.paused||s.result||!Number.isFinite(dt)||dt<=0)return;const oldStory=s.world.nextStory;Base.step(s,Math.min(.2,dt)*(s.campaign?.pace||.5));if(s.result)return;if(s.world.nextStory!==oldStory)s.world.nextStory=s.time+42+random(s)*30;if(s.paused)return;const c=s.campaign;if(s.strategy.phase==='war'&&!c.landingSeen&&s.units.some(u=>F.geography.mainland(u.tile))){c.landingSeen=true;announce(s,'counter');}resolve(s);if(s.time>=c.nextReaction&&!c.pending)announce(s);};
 F.encode=s=>JSON.stringify({...JSON.parse(Base.encode(s)),version:8,campaign:s.campaign});
 F.decode=function(text){const raw=JSON.parse(text);if(raw.hexVersion)throw Error('这是六角格版本的存档，请从六角格存档入口继续。');if(raw.version!==8){const s=Base.decode(text),rng=s.world.rng;init(s,false);s.world.rng=rng;return s;}
  const s=Base.decode(JSON.stringify({...raw,version:7})),c=raw.campaign,num=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b,bad=()=>{throw Error('每周进度或大陆动态存档无效。');};
  if(!c||![.5,1].includes(c.pace)||!num(c.nextReaction,0,s.time+90)||!num(c.alert,0,100)||!['观察','密切关注','沿海戒备','战时反制'].includes(c.posture)||typeof c.lastAction!=='string'||c.lastAction.length>200||!num(c.talkAt,0,s.time+30.1)||!num(c.restraintUntil,0,s.time+60.1)||(c.landingSeen!==undefined&&typeof c.landingSeen!=='boolean'))bad();
  if(c.pending!==null&&(!c.pending||!kinds.includes(c.pending.kind)||!num(c.pending.due,0,s.time+12.1)))bad();
  if(!Array.isArray(c.history)||c.history.length>12||c.history.some(e=>!e||!kinds.includes(e.kind)||!num(e.at,0,s.time)||typeof e.text!=='string'||e.text.length>200))bad();
  s.campaign={pace:c.pace,nextReaction:c.nextReaction,alert:c.alert,posture:c.posture,lastAction:c.lastAction,pending:c.pending?{kind:c.pending.kind,due:c.pending.due}:null,history:c.history.map(e=>({kind:e.kind,at:e.at,text:e.text})),talkAt:c.talkAt,restraintUntil:c.restraintUntil,landingSeen:c.landingSeen??false};return s;
 };
 return F;
});
