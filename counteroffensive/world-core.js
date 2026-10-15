(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./operations-core.js'),require('./world-events.js'));else root.FrontCore=factory(root.FrontCore,root.FrontWorldEvents);})(typeof globalThis!=='undefined'?globalThis:this,function(Base,Events){
 'use strict';
 const F={...Base},countries=['usa','japan','korea','philippines','russia','northkorea'];
 const flags=['koreaWar','europeCrisis','duckBlockade','mechDeployed','treaty','ultimatumQueued'];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),yes=message=>({ok:true,message}),no=message=>({ok:false,message});
 const distance=(a,b)=>{const p=F.xy(a),q=F.xy(b);return Math.hypot(p.x-q.x,p.y-q.y);};
 F.worldEvents=Events;F.worldCountries={usa:'美国',japan:'日本',korea:'韩国',philippines:'菲律宾',russia:'俄罗斯',northkorea:'朝鲜'};
 F.worldWeek=s=>Math.floor(s.time/30)+1;
 F.worldEndings={deterrence:{title:'威慑下的停火',text:'你完成曙光计划，通过克制与谈判达成地区停火。战略储备没有被实际使用，远征在外交桌上结束。'}};
 function report(s,text,kind='info'){s.events.unshift({text,kind,t:s.time});s.events.length=Math.min(14,s.events.length);}
 function news(s,text,kind='brief'){s.world.news.unshift({text,kind,at:s.time});s.world.news.length=Math.min(50,s.world.news.length);}
 function init(s){s.world={rng:(s.seed^0x7f4a7c15)>>>0,opinion:55,tension:20,sanctions:0,relations:{usa:35,japan:30,korea:25,philippines:25,russia:-15,northkorea:-35},flags:Object.fromEntries(flags.map(k=>[k,false])),science:0,queue:[{id:'korea_rps',due:s.time+12}],active:null,seen:[],history:[],news:[],nextStory:s.time+48,nextBulletin:s.time+8,cooldowns:{press:0,talk:0,truce:0},intervention:null,interventionCount:0,task:null,ending:null,nuclear:{status:'idle',mode:'paused',progress:0,risk:0,alert:0,disclosed:false,stock:0,used:0,startedAt:null}};news(s,'架空世界通讯接入。重大新闻会暂停时间，选择后继续。');return s;}
 F.createStrategic=seed=>init(Base.createStrategic(seed));
 function random(s){s.world.rng=(Math.imul(s.world.rng,1664525)+1013904223)>>>0;return s.world.rng/4294967296;}
 F.worldPartnerAvailable=(s,key)=>countries.includes(key)&&F.strategy.support(s,key);
 function reconcile(s){s.world.opinion=clamp(s.world.opinion,0,100);s.world.tension=clamp(s.world.tension,0,100);s.world.sanctions=clamp(s.world.sanctions,0,2);s.strategy.funds=clamp(s.strategy.funds,0,99999);s.factions[1].troops=Math.min(s.factions[1].troops,Math.max(0,F.capacity(s,1)-F.deployed(s,1)));s.naval.aid=s.naval.aid.filter(a=>a.delivered||!((a.key==='northkorea'&&s.world.flags.koreaWar)||s.world.relations[a.key]>=35));}
 F.queueWorldEvent=function(s,id,delay=0){if(!Object.hasOwn(Events,id)||!Number.isFinite(delay)||delay<0||delay>120||s.result)return no('事件排程无效。');const w=s.world;if(w.active?.id===id||w.queue.some(e=>e.id===id))return no('事件已在等待处理中。');if(w.queue.length>=30)return no('事件排程已满。');w.queue.push({id,due:s.time+delay});w.queue.sort((a,b)=>a.due-b.due);return yes('后续事件已排程。');};
 function activate(s){const w=s.world,first=w.queue[0];if(w.active||!first||first.due>s.time||s.result)return false;w.queue.shift();w.active={id:first.id,token:s.serial++,at:s.time};if(!w.seen.includes(first.id))w.seen.push(first.id);s.paused=true;news(s,Events[first.id].title,'major');report(s,'国际快讯：'+Events[first.id].title);return true;}
 function completeResearch(s){const n=s.world.nuclear;if(n.status==='research'&&n.progress>=100){n.status='ready';n.mode='paused';n.progress=100;n.stock=1;F.queueWorldEvent(s,'dawn_ready',0);report(s,'曙光计划完成，战略选项已经解锁。','success');}}
 function planIntervention(s,level){const w=s.world;if(w.interventionCount>=3)return;if(w.intervention&&!w.intervention.arrived){w.intervention.level=Math.max(w.intervention.level,level);return;}w.intervention={due:s.time+30,level,arrived:false};report(s,'国际军事干预正在集结，约 30 秒后抵达。','danger');}
 function spawnMech(s){const w=s.world;if(w.flags.mechDeployed)return;w.flags.mechDeployed=true;const town=s.towns.find(t=>t.id==='shanghai');if(s.naval.ground.length<8)s.naval.ground.push({id:s.serial++,key:'russia',name:'俄方机甲纵队',tile:town.tile,force:1600,path:[],progress:0,goal:town.tile,nextOrder:s.time});report(s,'俄方机甲纵队已在上海附近出现，开战后会参与反攻。','danger');}
 function apply(s,e){const w=s.world,n=w.nuclear;s.strategy.funds+=(e.money||0);w.opinion+=(e.opinion||0);w.tension+=(e.tension||0);w.sanctions+=(e.sanctions||0);
  for(const [key,v] of Object.entries(e.relations||{}))w.relations[key]=clamp(w.relations[key]+v,-100,100);
  for(const [key,v] of Object.entries(e.flags||{}))w.flags[key]=v;
  if(e.progress){if(n.status==='research')n.progress=clamp(n.progress+e.progress,0,100);else if(n.status==='idle')w.science=clamp(w.science+e.progress,0,40);}
  if(n.status!=='idle'){n.risk=e.riskSet!==undefined?Math.min(n.risk,e.riskSet):clamp(n.risk+(e.risk||0),0,100);if(e.mode)n.mode=e.mode;if(e.alert!==undefined)n.alert=e.alert;if(e.disclose)n.disclosed=true;}
  if(e.spawnMech)spawnMech(s);if(e.weakenMech)for(const a of s.naval.ground)if(a.name.includes('机甲'))a.force*=.55;
  if(e.intervention)planIntervention(s,e.intervention);
  if(e.cancelIntervention&&!n.used&&w.intervention&&!w.intervention.arrived)w.intervention=null;
  if(e.task)w.task={kind:e.task,baseWins:s.operations.wins,endsAt:s.time+90};
  if(e.ending){w.ending=e.ending;s.result='victory';report(s,F.worldEndings[e.ending].title,'success');}
  completeResearch(s);reconcile(s);
 }
 F.worldChoiceAvailable=function(s,c){if(s.result)return {ok:false,reason:'本局已结束'};if(s.strategy.funds<c.cost)return {ok:false,reason:'需要 '+c.cost+' 资金'};if(c.requires==='deterrent'&&!(s.world.nuclear.status==='ready'&&s.world.nuclear.disclosed&&!s.world.nuclear.used))return {ok:false,reason:'需要已公开且从未使用的战略储备'};if(c.effects.task&&(s.strategy.phase!=='preparation'||s.world.task))return {ok:false,reason:s.world.task?'已有待完成的国际行动':'仅筹备期可接护航请求'};return {ok:true,reason:''};};
 F.worldChoice=function(s,token,id){const w=s.world,a=w.active;if(s.result||!a||a.token!==token)return no('这条新闻已处理或不在当前议程。');const c=Events[a.id].choices.find(c=>c.id===id);if(!c)return no('请选择一项有效回应。');const available=F.worldChoiceAvailable(s,c);if(!available.ok)return no(available.reason);
  s.strategy.funds-=c.cost;w.active=null;s.paused=false;w.history.unshift({id:a.id,choice:c.id,at:s.time,token:a.token});w.history.length=Math.min(60,w.history.length);apply(s,c.effects);for(const e of c.next)F.queueWorldEvent(s,e.id,e.delay);news(s,'你的回应：'+c.label,'choice');report(s,c.label+'：'+c.summary,'info');if(!s.result)activate(s);return yes(c.summary);
 };
 F.startResearch=function(s){const w=s.world,n=w.nuclear;if(s.result||w.active||n.status!=='idle')return no('当前无法启动新的曙光计划。');if(s.strategy.funds<100)return no('启动需要 100 资金。');s.strategy.funds-=100;n.status='research';n.mode='steady';n.progress=w.science;w.science=0;n.startedAt=s.time;news(s,'曙光计划启动：稳步投入，进度与暴露风险开始变化。','research');return yes('曙光计划已启动。可以选择稳步、加速或暂停。');};
 F.researchMode=function(s,mode){if(s.result||s.world.active||s.world.nuclear.status!=='research'||!['steady','fast','paused'].includes(mode))return no('请选择有效的研发投入档位。');s.world.nuclear.mode=mode;return yes(mode==='paused'?'研发暂停，风险会缓慢下降。':mode==='fast'?'加速投入：进度更快，经费与风险增长也更快。':'已恢复稳步研发。');};
 F.publishDeterrent=function(s){const w=s.world,n=w.nuclear;if(s.result||w.active||n.status!=='ready'||!n.stock||n.disclosed)return no('需要尚未公开的战略储备。');apply(s,{disclose:true,relations:{usa:-15,japan:-10},opinion:-8});F.queueWorldEvent(s,'dawn_negotiation',24);news(s,'曙光计划已公开：进入威慑与外交交涉阶段。','research');return yes('已公开威慑。未来空袭节奏受到影响，外交回应正在到来。');};
 F.worldAction=function(s,key,target){const w=s.world;if(s.result||w.active)return no('先处理当前重大新闻。');if(!['press','talk','truce'].includes(key))return no('无效的外交行动。');if(key==='talk'&&!countries.includes(target))return no('请选择国家。');if(s.time<w.cooldowns[key])return no('外交人员正在协调，请稍后。');const cost=key==='press'?40:key==='talk'?60:60;if(s.strategy.funds<cost)return no('需要 '+cost+' 资金。');if(key==='truce'&&!(w.nuclear.status==='ready'&&w.nuclear.disclosed&&!w.nuclear.used))return no('公开且未使用的战略储备可以作为停火谈判筹码。');s.strategy.funds-=cost;w.cooldowns[key]=s.time+(key==='truce'?90:30);
  if(key==='press')apply(s,{opinion:10,relations:{usa:5,japan:5}});if(key==='talk')apply(s,{relations:{[target]:15},opinion:3});if(key==='truce'){const pending=w.queue.find(e=>e.id==='dawn_negotiation');if(pending){pending.due=s.time;w.queue.sort((a,b)=>a.due-b.due);}else F.queueWorldEvent(s,'dawn_negotiation',0);activate(s);}news(s,key==='press'?'召开公开记者会，回应国际关切。':key==='talk'?'与'+F.worldCountries[target]+'进行外交沟通。':'主动提出停火谈判。','diplomacy');return yes(key==='press'?'国际观感改善，合作方会重新评估。':key==='talk'?'国家态度改善；支援按当前关系重新生效。':'停火交涉已经进入议程。');
 };
 F.startWar=function(s){if(s.world?.active)return no('请先处理重大新闻，再决定开战。');const r=Base.startWar(s);if(r.ok)reconcile(s);return r;};
 F.partner=function(s,key){if(!F.worldPartnerAvailable(s,key))return no('当前国际关系不支持这项合作。可在「国际 → 关系」中沟通或处理相关危机。');return Base.partner(s,key);};
 F.nuclearStrike=function(s){const w=s.world,n=w.nuclear;if(s.result||w.active||n.status!=='ready'||!n.stock)return no('没有可使用的战略储备。');if(s.strategy.phase==='preparation'){const r=F.startWar(s);if(!r.ok)return r;}const target=s.towns.find(t=>t.goal&&s.owners[t.tile]>1)||s.towns.find(t=>t.id==='shanghai'),owner=s.owners[target.tile];if(owner>1&&owner<5)s.factions[owner].troops*=.25;for(const a of s.armies)if(a.faction===owner)a.force*=.3;for(const a of s.fleets)if(a.faction===owner)a.force*=.4;for(const a of s.naval.ground)if(distance(a.tile,target.tile)<50)a.force*=.3;for(const a of s.naval.ships)if(a.faction!==1&&distance(a.tile,target.tile)<16)a.hp=Math.max(1,a.hp*.35);
  n.stock=0;n.used++;n.status='spent';n.mode='paused';n.disclosed=true;w.opinion=Math.max(0,w.opinion-70);w.tension=100;w.sanctions=2;for(const key of ['usa','japan','korea','philippines'])w.relations[key]=key==='usa'?-100:-85;planIntervention(s,2);s.naval.bursts.push({tile:target.tile,at:s.time,kind:'missile'});F.queueWorldEvent(s,'nuclear_fallout',4);news(s,'战略武器已使用。援助冻结，制裁生效，军事干预正在接近。','danger');report(s,'核打击已结算；这不是战役胜利，国际干预即将抵达。','danger');reconcile(s);return yes('储备已消耗。敌方战区受创，制裁、撤援与国际干预已经启动。');
 };
 function research(s,dt){const w=s.world,n=w.nuclear;if(n.status==='research'){
   if(n.mode==='paused')n.risk=Math.max(0,n.risk-dt*.2);
   else{const fast=n.mode==='fast',cost=(fast?3.2:1)*dt;if(s.strategy.funds+1e-9<cost){n.mode='paused';report(s,'曙光计划经费不足，已自动暂停。');}else{s.strategy.funds-=cost;n.progress=Math.min(100,n.progress+dt*(fast?.65:.3));n.risk=Math.min(100,n.risk+dt*(fast?.35:.08));completeResearch(s);}}
  }
  if(n.status!=='idle'&&!n.disclosed&&!n.used){for(const [threshold,level,id] of [[80,3,'dawn_ultimatum'],[55,2,'dawn_inspection'],[30,1,'dawn_suspicion']])if(n.risk>=threshold&&n.alert<level){n.alert=level;F.queueWorldEvent(s,id,0);break;}}
  if(n.disclosed&&!n.used&&w.relations.usa<-65&&!w.flags.ultimatumQueued){w.flags.ultimatumQueued=true;F.queueWorldEvent(s,'dawn_ultimatum',5);}
 }
 function intervention(s){const w=s.world,i=w.intervention;if(!i||i.arrived||s.time<i.due)return;i.arrived=true;w.interventionCount++;if(s.strategy.phase==='preparation')Base.startWar(s);const home=s.towns.find(t=>t.id==='taipei'),p=F.xy(home.tile);for(let j=0;j<(i.level===2?3:2)&&s.naval.ships.length<40;j++){const tile=F.seaTile(s,F.id(Math.min(F.W-1,p.x+12+j*3),p.y-4));const a=F.spawnShip(s,j===2?'missile':'destroyer',3,tile,'国际干预'+(j+1)+'号');const dest=s.naval.ships.find(v=>v.faction===1)?.tile??F.seaTile(s,home.tile);a.goal=dest;a.path=F.navalRoute(s,a.tile,dest)||[];}F.queueWorldEvent(s,'intervention_arrived',0);news(s,'国际干预舰艇已进入台海，地图上出现新的敌舰。','danger');reconcile(s);}
 const bulletins=['世界新闻正在更新，各国会按自己的局势调整立场。','国际论坛又开了一场会，会议名称比结论长。','各国媒体持续关注地区局势，公众态度会影响合作条件。','科学界提醒：异常现象未必是外星人，也可能是预算报表。','民间交流仍在继续，外交关系有修复的机会。','太平洋货运公司为“不可抗鸭”重新拟定合同。'];
 F.step=function(s,dt){if(s.paused||s.result||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.2);research(s,dt);Base.step(s,dt);if(s.result)return;const w=s.world;intervention(s);
  if(w.task){if(s.operations.wins>w.task.baseWins&&s.operations.lastResult?.kind==='escort'&&s.operations.lastResult.outcome==='success'&&s.operations.lastResult.at>=w.task.endsAt-90){w.task=null;F.queueWorldEvent(s,'duck_convoy',0);}else if(s.time>=w.task.endsAt){w.task=null;F.queueWorldEvent(s,'duck_shortage',0);}}
  if(s.time>=w.nextStory){let candidates=Object.entries(Events).filter(([id,e])=>e.starter&&(!e.requires||(w.nuclear.status==='research'&&!w.nuclear.disclosed))&&!w.seen.includes(id)&&!w.queue.some(q=>q.id===id));if(!candidates.length)candidates=Object.entries(Events).filter(([id,e])=>e.repeatable&&!w.history.slice(0,3).some(h=>h.id===id)&&!w.queue.some(q=>q.id===id));if(!candidates.length)candidates=Object.entries(Events).filter(([id,e])=>e.repeatable&&!w.queue.some(q=>q.id===id));if(candidates.length)F.queueWorldEvent(s,candidates[Math.floor(random(s)*candidates.length)][0],0);w.nextStory=s.time+34+random(s)*12;}
  if(s.time>=w.nextBulletin){news(s,bulletins[Math.floor(random(s)*bulletins.length)]);w.nextBulletin=s.time+14;}
  reconcile(s);activate(s);
 };
 F.encode=s=>JSON.stringify({...JSON.parse(Base.encode(s)),version:7,world:s.world});
 F.decode=function(text){const v=JSON.parse(text);if(v.version!==7)return init(Base.decode(text));const s=Base.decode(JSON.stringify({...v,version:6})),w=v.world,bad=()=>{throw Error('国际局势或机密项目存档数据无效。');},num=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b,int=(n,a,b)=>Number.isInteger(n)&&num(n,a,b);
  if(!w||!int(w.rng,0,4294967295)||!num(w.opinion,0,100)||!num(w.tension,0,100)||!int(w.sanctions,0,2)||!num(w.science,0,40)||!w.relations||!w.flags||!num(w.nextStory,0,s.time+180)||!num(w.nextBulletin,0,s.time+14.1)||!w.cooldowns||!int(w.interventionCount,0,3))bad();for(const key of countries)if(!num(w.relations[key],-100,100))bad();for(const key of flags)if(typeof w.flags[key]!=='boolean')bad();for(const key of ['press','talk','truce'])if(!num(w.cooldowns[key],0,s.time+90.1))bad();
  const validId=id=>typeof id==='string'&&Object.hasOwn(Events,id);
  if(!Array.isArray(w.queue)||w.queue.length>30||new Set(w.queue.map(e=>e.id)).size!==w.queue.length||w.queue.some(e=>!e||!validId(e.id)||!num(e.due,0,s.time+120.1)))bad();
  if(w.active!==null&&(!w.active||!validId(w.active.id)||!int(w.active.token,1,s.serial-1)||!num(w.active.at,0,s.time)||!v.paused||w.queue.some(e=>e.id===w.active.id)))bad();
  if(!Array.isArray(w.seen)||w.seen.length>Object.keys(Events).length||new Set(w.seen).size!==w.seen.length||w.seen.some(id=>!validId(id)))bad();
  if(!Array.isArray(w.history)||w.history.length>60||w.history.some(h=>!h||!validId(h.id)||!Events[h.id].choices.some(c=>c.id===h.choice)||!num(h.at,0,s.time)||!int(h.token,1,s.serial-1)))bad();
  if(!Array.isArray(w.news)||w.news.length>50||w.news.some(n=>!n||typeof n.text!=='string'||n.text.length>200||!['brief','major','choice','research','diplomacy','danger'].includes(n.kind)||!num(n.at,0,s.time)))bad();
  if(w.intervention!==null&&(!w.intervention||!num(w.intervention.due,0,s.time+30.1)||!int(w.intervention.level,1,2)||typeof w.intervention.arrived!=='boolean'))bad();
  if(w.task!==null&&(!w.task||w.task.kind!=='escort'||!int(w.task.baseWins,0,s.operations.wins)||!num(w.task.endsAt,s.time,s.time+90.1)))bad();
  const n=w.nuclear;if(!n||!['idle','research','ready','spent'].includes(n.status)||!['steady','fast','paused'].includes(n.mode)||!num(n.progress,0,100)||!num(n.risk,0,100)||!int(n.alert,0,3)||typeof n.disclosed!=='boolean'||!int(n.stock,0,1)||!int(n.used,0,1)||(n.startedAt!==null&&!num(n.startedAt,0,s.time)))bad();
  if(n.status==='idle'&&(n.progress!==0||n.stock||n.used||n.startedAt!==null)||n.status==='research'&&(n.progress>=100||n.stock||n.used)||n.status==='ready'&&(n.progress!==100||n.stock!==1||n.used)||n.status==='spent'&&(n.stock||n.used!==1))bad();
  if(w.ending!==null&&(w.ending!=='deterrence'||v.result!=='victory'||n.status!=='ready'||!n.disclosed||n.used||!w.flags.treaty||!w.history.some(h=>h.id==='dawn_treaty'&&h.choice==='sign')))bad();
  s.world=JSON.parse(JSON.stringify(w));if(s.factions[1].troops>F.capacity(s,1)+1)bad();if(w.ending)s.result='victory';return s;
 };
 return F;
});
