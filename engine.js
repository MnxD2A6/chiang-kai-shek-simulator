(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./content.js'));else root.GameCore=factory(root.GameContent);})(typeof globalThis!=='undefined'?globalThis:this,function(content){
  'use strict';
  const caps={treasury:250,supplies:100,army:100,morale:100,diplomacy:100,inflation:100,industry:20,peace:12};
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const contacts={military:['callMilitary','fortify'],diplomacy:['callDiplomacy','diplomacy'],finance:['callFinance','reform'],logistics:['callLogistics','farm'],switchboard:['callSwitchboard']};
  const contactFor=id=>Object.keys(contacts).find(k=>contacts[k][0]===id);
  function note(s,text,type='info'){s.log.unshift({text,type,turn:s.turn});s.log=s.log.slice(0,80);}
  function effects(s,e){for(const [k,v] of Object.entries(e)){if(k==='defenseAll'||k==='stabilityAll'){const field=k==='defenseAll'?'defense':'stability';s.cities.filter(c=>c.held).forEach(c=>c[field]=clamp(c[field]+v,0,100));}else if(k in caps)s[k]=clamp(s[k]+v,0,caps[k]);}}
  function newGame(seed=Date.now()%4294967296,drama=true){
    const s={version:1,seed:Math.floor(seed)>>>0,drama:Boolean(drama),turn:0,ap:3,eventDone:false,treasury:82,supplies:68,army:58,morale:64,diplomacy:26,inflation:16,industry:1,peace:0,capital:'nanjing',starvation:0,cities:content.cities.map(c=>({...c,held:true})),log:[],over:false,result:null,decisions:[]};
    Object.assign(s,{doctrine:'balanced',policyChanged:false,relations:Object.fromEntries(Object.keys(contacts).map(k=>[k,50])),called:[],missions:[]});s.cities.forEach(c=>c.factories=0);
    note(s,'你的指挥部已就绪。本轮任务：先接电话，再在重庆建设两次工业。');return s;
  }
  function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
  function fail(message){return {ok:false,message};}
  function canAct(s,id,cityId){
    if(s.over)return fail('本局已经结束。');const a=content.actions[id];if(!a)return fail('未知命令。');
    if(s.ap<1)return fail('行动点已用完，请处理事件并结束回合。');
    if(a.drama&&!s.drama)return fail('这条线路仅在戏剧模式开放。');
    const c=s.cities.find(c=>c.id===cityId);
    if(a.city&&!c)return fail('先在地图上选择城市。');
    if(a.city&&Boolean(a.enemy)===c.held)return fail(a.enemy?'这座城市仍在控制中。':'这座城市已失守，可先组织反攻。');
    if(id==='relocate'&&s.capital===cityId)return fail('指挥部已在这座城市。');
    if(id==='recover'&&s.army<35)return fail('反攻需要至少 35 军备。');
    if(id==='industry'&&(s.industry>=20||c.factories>=3))return fail(s.industry>=20?'总工业已达上限。':'这座城市的三个工业建设位置已用满，请选择其他城市。');
    if(a.policy&&(s.policyChanged||s.doctrine===a.policy))return fail(s.policyChanged?'本轮已经更换方针，下轮再调整。':'当前已经采用这项方针。');
    if(a.phone&&s.called.includes(contactFor(id)))return fail('本轮已向这位联系人下达过请求，下轮可以再次联络。');
    for(const [k,v] of Object.entries(a.cost))if(s[k]<v)return fail(`${content.resources[k]}不足，需要 ${v}。`);
    return {ok:true,message:''};
  }
  function act(s,id,cityId){const check=canAct(s,id,cityId);if(!check.ok)return check;
    const a=content.actions[id],c=s.cities.find(c=>c.id===cityId);for(const [k,v] of Object.entries(a.cost))s[k]-=v;s.ap--;effects(s,a.effect);
    let msg=`${a.name}${a.city?' · '+c.name:''}。`;
    if(id==='reinforce')c.defense=clamp(c.defense+16,0,100);
    if(id==='fortify')c.defense=clamp(c.defense+22,0,100);
    if(id==='relief')c.stability=clamp(c.stability+12,0,100);
    if(id==='relocate')s.capital=c.id;
    if(id==='industry')c.factories++;
    if(a.policy){s.doctrine=a.policy;s.policyChanged=true;}
    if(a.phone)recordCall(s,contactFor(id));
    if(id==='recover'){
      const chance=clamp((s.army+20-c.defense)/100,0.2,0.9);
      if(random(s)<chance){c.held=true;c.defense=42;c.stability=40;effects(s,{morale:8});msg=`${c.name}恢复控制，继续安置民生。`;}
      else{effects(s,{army:-9,morale:-3});msg=`${c.name}反攻未果，军备 −9、民心 −3。`;}
    }
    note(s,msg,id==='recover'&&!c.held?'danger':'good');return {ok:true,message:msg};
  }
  function recordCall(s,contact){s.called.push(contact);s.relations[contact]=clamp(s.relations[contact]+7,0,100);if(s.relations[contact]>=75){const bonus={military:{army:3},diplomacy:{diplomacy:3},finance:{treasury:4},logistics:{supplies:4},switchboard:{morale:2}}[contact];effects(s,bonus);note(s,'顾问信任带来额外协调成果。','good');}}
  function phoneRequest(s,contact,id,city){if(!contacts[contact]?.includes(id))return fail('这条线路不能执行该请求。');if(s.called.includes(contact))return fail('本轮已向这位联系人下达过请求。');const result=act(s,id,city);if(result.ok&&!content.actions[id].phone)recordCall(s,contact);return result;}
  function mission(s){const m=content.missions[s.turn];const c=m.city?s.cities.find(c=>c.id===m.city):null;const value=c?c[m.metric]:s[m.metric];return {...m,value,done:(!c||c.held)&&(m.below?value<=m.target:value>=m.target),reward:{treasury:12,supplies:8,morale:3}};}
  function choose(s,index){
    if(s.over)return fail('本局已经结束。');if(s.eventDone)return fail('本轮电报已处理。');
    const e=content.events[s.turn],c=e&&e.choices[index];if(!Number.isInteger(index)||!c||(!s.drama&&c.drama))return fail('无效决策。');
    for(const [k,v] of Object.entries(c.effects))if(['treasury','supplies'].includes(k)&&v<0&&s[k]<-v)return fail(`${content.resources[k]}不足，无法执行这个决定。`);
    effects(s,c.effects);s.eventDone=true;s.decisions.push({turn:s.turn,index});note(s,`${e.title}：${c.label}${c.drama?'（架空）':''}。`,'good');return {ok:true,message:'电报已处理。现在安排本轮行动。'};
  }
  function defense(s,c){return Math.round(c.defense*0.58+s.army*0.34+c.stability*0.1+(s.supplies>=20?9:-9))+(s.doctrine==='defense'?8:0);}
  function forecast(s){
    if(s.over||s.turn===0||s.turn===8)return null;
    const route=['shanghai','nanjing','wuhan','changsha','guilin','kunming','chongqing','chengdu','xian'];
    const held=route.map(id=>s.cities.find(c=>c.id===id)).filter(c=>c.held);if(!held.length)return null;
    const post=s.turn>=9;const index=post?(s.turn-9)%held.length:0;const city=held[index];
    const strength=clamp(45+s.turn*4+(post?7:0)-s.peace*(post?5:0),20,92);
    return {city,strength,defense:defense(s,city),era:post?'内战压力':'日军攻势',safe:defense(s,city)>=strength};
  }
  function income(s){return s.cities.filter(c=>c.held).reduce((n,c)=>n+c.income,0)+s.industry*2;}
  function economy(s){const aid=s.diplomacy>=50&&s.turn>=5?Math.floor(s.diplomacy/10):0;return {income:income(s),netTreasury:income(s)-20-Math.floor(s.inflation/12)-(s.doctrine==='defense'?8:s.doctrine==='welfare'?10:0),foodIn:8+s.industry+aid+(s.doctrine==='welfare'?3:0),foodOut:12+Math.floor(s.army/18)+(s.doctrine==='mobilize'?4:0),aid};}
  function ending(s,reason){
    const controlled=s.cities.filter(c=>c.held).length;
    const score=clamp(Math.round(controlled*45+s.morale*3+s.diplomacy*1.5+s.industry*10+(100-s.inflation)*2+s.peace*15),0,1200);
    if(reason)return {id:'collapse',title:'失序的指挥桌',subtitle:reason==='food'?'连续两轮断粮，后勤体系崩溃。':reason==='morale'?'民心归零，命令失去了执行基础。':'只剩一座城市，指挥体系无法维持。',text:'地图不能替代粮食，命令不能替代信任。下一局可以更早投资生产、守备和民生。',score,controlled};
    if(s.peace>=6&&s.morale>=55&&s.inflation<55&&(s.missions.length<s.turn+1||s.missions.filter(m=>m.success).length>=7))return {id:'peace',title:'未曾发生的和解',subtitle:'架空结局 · 协商为重建打开了一扇门',text:'你把协商与民生带到了终章。这不是现实历史的重演，而是这张指挥桌上的另一种可能。',score,controlled};
    if(controlled>=6&&s.morale>=65&&s.inflation<40)return {id:'reconstruction',title:'艰难的重建',subtitle:'架空结局 · 秩序、生产与信任得到延续',text:'工厂和粮仓仍在运作，多数城市保持秩序。接下来要解决的问题，依然远比地图上的箭头复杂。',score,controlled};
    if(controlled<=3)return {id:'retreat',title:'退守与余烬',subtitle:'架空结局 · 保存了力量，失去了大片控制区',text:'最后的电报抵达后方。你保存下来的不只是部队，还有仍然等待安置的人。',score,controlled};
    return {id:'fragile',title:'摇晃的平衡',subtitle:'架空结局 · 撑到了终章，危机仍未解除',text:'指挥桌上的灯没有熄灭，但账本、民心和战线还在拉扯。坚持下来，是重建的起点。',score,controlled};
  }
  function endTurn(s){
    if(s.over)return fail('本局已经结束。');if(!s.eventDone)return fail('请先处理本轮电报。');
    const before=Object.fromEntries(Object.keys(caps).map(k=>[k,s[k]])),turn=s.turn,goal=mission(s),f=forecast(s),battle=f?{city:f.city.name,cityId:f.city.id,strength:f.strength,defense:f.defense,held:f.safe}:null;
    if(f){
      if(f.safe){f.city.defense=clamp(f.city.defense-9,0,100);effects(s,{army:-3,morale:3});note(s,`${f.city.name}守住防线（我方 ${f.defense} / 压力 ${f.strength}）。`,'good');}
      else{f.city.held=false;effects(s,{army:-6,morale:-9});note(s,`${f.city.name}失守（我方 ${f.defense} / 压力 ${f.strength}）。可在后续回合组织反攻。`,'danger');if(s.capital===f.city.id){const rear=s.cities.filter(c=>c.held).sort((a,b)=>b.defense-a.defense)[0];if(rear){s.capital=rear.id;effects(s,{treasury:-8,morale:-4});note(s,`指挥部紧急迁至${rear.name}，国库 −8、民心 −4。`,'danger');}}}
    }
    if(s.turn===8){s.cities.forEach(c=>{if(!c.held){c.held=true;c.defense=35;c.stability=42;}});note(s,'对日战争结束，失守城市恢复管理；战后重建与协商开始。','good');}
    const taskSuccess=goal.done&&(!goal.city||s.cities.find(c=>c.id===goal.city).held);s.missions.push({turn:s.turn,success:taskSuccess});if(taskSuccess){effects(s,goal.reward);note(s,`本轮任务完成：${goal.title}。奖励国库 +12、粮秣 +8、民心 +3。`,'good');}else note(s,`本轮任务未完成：${goal.title}。没有任务奖励，时间线继续。`);
    const eco=economy(s),revenue=eco.income,aid=eco.aid;
    const foodCost=eco.foodOut,production=eco.foodIn;
    const available=s.supplies+production;const shortage=available<foodCost;
    effects(s,{treasury:eco.netTreasury,supplies:production-foodCost,army:aid>0?2:0});
    if(s.doctrine==='mobilize')effects(s,{army:5,morale:-4});if(s.doctrine==='welfare')effects(s,{morale:4});
    s.starvation=shortage?s.starvation+1:0;if(shortage){effects(s,{morale:-10,army:-7});note(s,'本轮粮秣不足，军备 −7、民心 −10。连续两轮断粮会结束游戏。','danger');}
    if(s.inflation>=50)effects(s,{morale:-Math.floor((s.inflation-40)/10)});
    if(s.treasury===0){effects(s,{morale:-5});note(s,'国库见底，公共服务停摆，民心 −5。','danger');}
    s.cities.filter(c=>c.held).forEach(c=>{c.stability=clamp(c.stability+(s.morale>=60?2:-2),0,100);});
    if(s.army<25)s.relations.military=clamp(s.relations.military-5,0,100);if(s.inflation>=50)s.relations.finance=clamp(s.relations.finance-8,0,100);if(s.supplies<25)s.relations.logistics=clamp(s.relations.logistics-6,0,100);if(s.morale<40)s.relations.diplomacy=clamp(s.relations.diplomacy-5,0,100);
    note(s,`回合结算：国库 ${eco.netTreasury>=0?'+':''}${eco.netTreasury}，粮秣 ${production-foodCost>=0?'+':''}${production-foodCost}${aid?'，援助已到达':''}。`);
    const held=s.cities.filter(c=>c.held).length;const reason=s.morale<=0?'morale':held<=1?'cities':s.starvation>=2?'food':null;
    if(reason||s.turn===content.events.length-1){s.over=true;s.result=ending(s,reason);note(s,`本局结束：${s.result.title}。`);}
    else{s.turn++;s.ap=3;s.eventDone=false;s.policyChanged=false;s.called=[];note(s,`${content.events[s.turn].date}：新的电报已到达。`);}
    return {ok:true,message:s.over?'时间线已结束。':'进入下一回合。',report:{turn,before,after:Object.fromEntries(Object.keys(caps).map(k=>[k,s[k]])),battle,mission:{title:goal.title,success:taskSuccess,reward:goal.reward},doctrine:s.doctrine,next:forecast(s)}};
  }
  function encode(s){return JSON.stringify(s);}
  function decode(raw){
    let s;try{s=JSON.parse(raw);}catch{throw Error('存档不是有效的 JSON。');}
    const error=()=>{throw Error('存档版本或内容无效，请选择本游戏导出的完整存档。');};
    const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
    if(!s||typeof s!=='object'||s.version!==1||!int(s.seed,0,4294967295)||!int(s.turn,0,11)||!int(s.ap,0,3)||!int(s.starvation,0,2)||typeof s.drama!=='boolean'||typeof s.eventDone!=='boolean'||typeof s.over!=='boolean')error();
    for(const [k,max] of Object.entries(caps))if(!int(s[k],0,max))error();
    if(!Array.isArray(s.cities)||s.cities.length!==9)error();
    const fresh=content.cities.map(original=>{const c=s.cities.find(c=>c&&c.id===original.id);if(!c||typeof c.held!=='boolean'||!int(c.defense,0,100)||!int(c.stability,0,100)||c.factories!==undefined&&!int(c.factories,0,3))error();return {...original,held:c.held,defense:c.defense,stability:c.stability,factories:c.factories??0};});
    if(!fresh.some(c=>c.id===s.capital&&c.held))error();
    if(!Array.isArray(s.log)||s.log.length>80||s.log.some(l=>!l||typeof l.text!=='string'||l.text.length>600||!['info','good','danger'].includes(l.type)||!int(l.turn,0,11)))error();
    if(!Array.isArray(s.decisions)||s.decisions.length>12||s.decisions.some(d=>!d||!int(d.turn,0,s.turn)||!int(d.index,0,3)))error();
    if(new Set(s.decisions.map(d=>d.turn)).size!==s.decisions.length||s.decisions.length!==s.turn+(s.eventDone?1:0))error();
    for(let t=0;t<s.turn;t++)if(!s.decisions.some(d=>d.turn===t))error();
    if(!s.eventDone&&s.decisions.some(d=>d.turn===s.turn))error();
    if(s.eventDone&&!s.decisions.some(d=>d.turn===s.turn))error();
    const clean={version:1,seed:s.seed,drama:s.drama,turn:s.turn,ap:s.ap,eventDone:s.eventDone};
    for(const k of Object.keys(caps))clean[k]=s[k];Object.assign(clean,{capital:s.capital,starvation:s.starvation,cities:fresh,log:s.log.map(l=>({text:l.text,type:l.type,turn:l.turn})),over:s.over,result:null,decisions:s.decisions.map(d=>({turn:d.turn,index:d.index}))});
    if(s.doctrine!==undefined&&!['balanced','defense','mobilize','welfare'].includes(s.doctrine)||s.policyChanged!==undefined&&typeof s.policyChanged!=='boolean')error();
    const relations=s.relations??Object.fromEntries(Object.keys(contacts).map(k=>[k,50]));for(const k of Object.keys(contacts))if(!int(relations[k],0,100))error();
    const called=s.called??[];if(!Array.isArray(called)||called.length>5||new Set(called).size!==called.length||called.some(k=>!Object.hasOwn(contacts,k)))error();
    const missions=s.missions??[];if(!Array.isArray(missions)||missions.length>12||missions.some(m=>!m||!int(m.turn,0,s.turn)||typeof m.success!=='boolean')||new Set(missions.map(m=>m.turn)).size!==missions.length)error();
    Object.assign(clean,{doctrine:s.doctrine??'balanced',policyChanged:s.policyChanged??false,relations:Object.fromEntries(Object.keys(contacts).map(k=>[k,relations[k]])),called:[...called],missions:missions.map(m=>({turn:m.turn,success:m.success}))});
    if(s.over){const reasons=['morale','cities','food'];const reason=reasons.find(r=>r==='food'?s.starvation>=2:r==='morale'?s.morale<=0:fresh.filter(c=>c.held).length<=1);if(!reason&&s.turn!==11)error();clean.result=ending(clean,reason);}
    return clean;
  }
  return {content,newGame,act,canAct,choose,endTurn,forecast,defense,income,economy,mission,phoneRequest,ending,encode,decode,caps};
});
