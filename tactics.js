(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Tactics=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const width=720,height=420,tile=30,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const missions=[
  {name:'桥头夺控',subtitle:'让步兵穿过桥，击退守军，占住旗帜。',goal:'占领东岸旗帜 6 秒',scene:'front',objective:{x:450,y:210},duration:0},
  {name:'粮车穿过山路',subtitle:'跟着粮车走，清除路旁敌军，把补给送到东侧。',goal:'保护粮车抵达右侧出口',scene:'depot',objective:{x:660,y:330},duration:0},
  {name:'村庄防线',subtitle:'守住村口 50 秒。将机枪留在掩体，步兵拦截侧翼。',goal:'守住村口，至少一支部队存活',scene:'village',objective:{x:300,y:210},duration:50}
 ];
 const kinds={infantry:{name:'步兵一连',hp:180,speed:52,range:110,damage:14,delay:.8,ammo:90},machine:{name:'机枪二连',hp:165,speed:40,range:158,damage:19,delay:1,ammo:85},artillery:{name:'炮兵排',hp:125,speed:34,range:238,damage:35,delay:2.2,ammo:32},medic:{name:'救护队',hp:120,speed:50,range:110,damage:0,delay:1,ammo:60},enemy:{name:'敌军步兵',hp:80,speed:25,range:98,damage:7,delay:1.2,ammo:100},raider:{name:'侧翼敌军',hp:90,speed:32,range:92,damage:9,delay:1.3,ammo:100},truck:{name:'补给车',hp:170,speed:18,range:0,damage:0,delay:1,ammo:0}};
 function unit(id,team,kind,x,y){return {id,team,kind,x,y,home:{x,y},...kinds[kind],maxHp:kinds[kind].hp,order:'hold',path:[],target:null,cooldown:0};}
 function create(index=0,options={}){
  if(!Number.isInteger(index)||index<0||index>=missions.length)throw Error('未知战斗。');
  const b={mission:index,time:0,paused:false,result:null,selected:'b1',units:[],shots:[],supports:[],capture:0,spawns:0,orders:0,tutorial:index===0?'select':null,objective:{...missions[index].objective}};
  const offset=index===2?120:0;b.units=[unit('b1','blue','infantry',105+offset,210),unit('b2','blue','machine',135+offset,270),unit('b3','blue','artillery',75+offset,150)];
  if(options.medics)b.units.push(unit('b4','blue','medic',90+offset,300));
  const spots=index===0?[[525,210],[555,270],[615,150]]:index===1?[[465,330],[585,270],[555,90]]:[[555,210],[615,330],[585,90],[675,180]];
  spots.forEach((p,i)=>{const u=unit('r'+i,'red',i%2?'raider':'enemy',...p);u.order='advance';b.units.push(u);});
  if(index===1){const u=unit('truck','blue','truck',105,330);u.order='escort';b.units.push(u);}
  if(options.prepared){b.units.filter(u=>u.team==='blue').forEach(u=>{u.maxHp+=25;u.hp+=25;u.damage*=1.12;});}return b;
 }
 kinds.fort={name:'城防堡垒',hp:160,speed:0,range:165,damage:6,delay:1.5,ammo:180};
 function createCampaign(e){const index=e.terrain==='river'?0:e.terrain==='town'?2:1,b=create(index);b.campaign={...e};b.tutorial=null;b.units=b.units.filter(u=>u.kind!=='truck');b.objective={x:e.type==='attack'?555:255,y:210};b.units=b.units.filter(u=>u.team==='blue');const scale=Math.max(.35,Math.min(2.7,e.bluePower/90));b.units.forEach(u=>{u.hp=u.maxHp=Math.round(u.hp*scale);u.campaignOriginal=true;});const count=Math.max(2,Math.min(7,Math.ceil(e.redPower/28))),enemyScale=e.redPower/(count*24);for(let i=0;i<count;i++){const u=unit('r'+i,'red',i%2?'raider':'enemy',555+(i%3)*45,150+Math.floor(i/3)*60);u.hp=u.maxHp=Math.round(u.hp*enemyScale);u.order=e.type==='defense'?'advance':'hold';b.units.push(u);}if(e.fort>0){const u=unit('fort',e.type==='attack'?'red':'blue','fort',e.type==='attack'?555:255,e.type==='attack'?270:330);u.hp=u.maxHp=80+e.fort*40;u.campaignOriginal=u.team==='blue';b.units.push(u);}return b;}
 function survival(b){const all=b.units.filter(u=>u.team==='blue'&&u.campaignOriginal);return all.length?all.reduce((n,u)=>n+Math.max(0,u.hp),0)/all.reduce((n,u)=>n+u.maxHp,0):1;}
 function blocked(b,x,y){if(x<15||y<15||x>705||y>405)return true;if(b.campaign?.terrain==='plain')return false;if(b.mission===0)return x>=360&&x<390&&(y<150||y>=270);if(b.mission===2)return (x>=330&&x<420&&(y<150||y>=300))||(x>=90&&x<180&&y<120);return x>=330&&x<390&&y>=120&&y<270;}
 function route(b,start,goal){
  if(blocked(b,goal.x,goal.y))return null;
  const cell=p=>[clamp(Math.floor(p.x/tile),0,23),clamp(Math.floor(p.y/tile),0,13)],key=p=>p.join(','),a=cell(start),z=cell(goal),q=[a],seen=new Set([key(a)]),prev=new Map();let end=null;
  for(let i=0;i<q.length;i++){const p=q[i];if(key(p)===key(z)){end=p;break;}for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){const n=[p[0]+d[0],p[1]+d[1]],k=key(n);if(seen.has(k)||blocked(b,n[0]*tile+15,n[1]*tile+15))continue;seen.add(k);prev.set(k,p);q.push(n);}}
  if(!end)return null;const path=[{x:goal.x,y:goal.y}];let p=end;while(key(p)!==key(a)){path.unshift({x:p[0]*tile+15,y:p[1]*tile+15});p=prev.get(key(p));}return path;
 }
 function order(b,id,type,x,y,target){
  if(b.result)return {ok:false,message:'战斗已经结束。'};const u=b.units.find(u=>u.id===id&&u.team==='blue'&&u.kind!=='truck'&&u.hp>0);if(!u)return {ok:false,message:'先选中一支存活的部队。'};
  if(!['move','attack','hold','retreat','follow'].includes(type))return {ok:false,message:'未知命令。'};
  const enemy=type==='attack'?b.units.find(e=>e.id===target&&e.team==='red'&&e.hp>0):null;if(type==='attack'&&!enemy)return {ok:false,message:'请选择存活的敌军。'};
  const truck=type==='follow'?b.units.find(e=>e.id===target&&e.kind==='truck'&&e.hp>0):null;if(type==='follow'&&!truck)return {ok:false,message:'没有可护送的粮车。'};
  const goal=type==='retreat'?u.home:type==='hold'?{x:u.x,y:u.y}:truck?{x:Math.max(30,truck.x-40),y:300}:enemy||{x,y};if(!Number.isFinite(goal.x)||!Number.isFinite(goal.y))return {ok:false,message:'目标无效。'};
  const path=type==='hold'?[]:route(b,u,goal);if(!path)return {ok:false,message:'这里不能通行，请选择道路或桥面。'};
  u.order=type;u.target=enemy?.id||truck?.id||null;u.path=path;b.orders++;if(b.tutorial==='select')b.tutorial='move';if(type==='move'&&b.tutorial==='move')b.tutorial='attack';if(type==='attack')b.tutorial=null;return {ok:true,message:type==='follow'?'正在跟随粮车，沿路自动迎击敌军。':type==='hold'?'原地驻守，进入射程自动开火。':type==='retreat'?'部队正在退回集结位置。':type==='attack'?'部队会接近目标并开火。':'已下达移动命令。'};
 }
 function damageAt(b,u,amount){const cover=(u.x>=210&&u.x<=285&&(u.y<180||u.y>255))||(b.mission===2&&u.x>=240&&u.x<=315);return amount*(cover?.55:1);}
 function move(b,u,dt){if(!u.path.length)return;const p=u.path[0],d=distance(u,p),speed=u.speed*dt;if(d<=speed){u.x=p.x;u.y=p.y;u.path.shift();}else{const x=u.x+(p.x-u.x)/d*speed,y=u.y+(p.y-u.y)/d*speed;if(!blocked(b,x,y)){u.x=x;u.y=y;}else u.path=route(b,u,p)||[];}}
 function support(b,id){
  if(b.result||!['medic','reinforce','ammo'].includes(id)||b.supports.includes(id))return {ok:false,message:'这项支援本场已使用，或战斗已结束。'};
  b.supports.push(id);if(id==='reinforce'){const u=unit('reinforcement','blue','infantry',105,240);u.name='增援步兵';b.units.push(u);}if(id==='medic')b.units.filter(u=>u.team==='blue'&&u.hp>0).forEach(u=>u.hp=Math.min(u.maxHp,u.hp+65));if(id==='ammo')b.units.filter(u=>u.team==='blue').forEach(u=>u.ammo+=30);return {ok:true,message:id==='reinforce'?'增援步兵已抵达西侧集结点。':id==='medic'?'救护车抵达，存活部队恢复生命。':'弹药已送到，各部补充 30 发。'};
 }
 function step(b,dt){
  if(b.result||b.paused||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.1);b.time+=dt;b.shots=b.shots.map(s=>({...s,life:s.life-dt})).filter(s=>s.life>0);
  if(!b.campaign&&b.mission===2&&b.time>20&&b.spawns===0){b.spawns++;for(let i=0;i<2;i++){const u=unit('wave'+i,'red','raider',675,270+i*60);u.order='advance';b.units.push(u);}}
  for(const u of b.units){if(u.hp<=0)continue;u.cooldown-=dt;
   const foes=b.units.filter(e=>e.team!==u.team&&e.hp>0),preferred=foes.find(e=>e.id===u.target),nearest=foes.sort((a,c)=>distance(u,a)-distance(u,c))[0];
   const enemy=preferred||nearest;
   if(u.kind==='truck'){if(!u.path.length)u.path=route(b,u,{x:675,y:330})||[];move(b,u,dt);continue;}
   if(u.kind==='medic'){const ally=b.units.filter(e=>e.team==='blue'&&e.id!==u.id&&e.hp>0&&e.hp<e.maxHp&&distance(u,e)<u.range).sort((a,c)=>a.hp-c.hp)[0];if(ally&&u.cooldown<=0){ally.hp=Math.min(ally.maxHp,ally.hp+12);u.cooldown=1;b.shots.push({x:u.x,y:u.y,tx:ally.x,ty:ally.y,team:'heal',life:.35});}move(b,u,dt);continue;}
   const inRange=enemy&&distance(u,enemy)<=u.range;
   if(inRange&&u.cooldown<=0&&u.ammo>0){enemy.hp=Math.max(0,enemy.hp-damageAt(b,enemy,u.damage));u.ammo--;u.cooldown=u.delay;b.shots.push({x:u.x,y:u.y,tx:enemy.x,ty:enemy.y,team:u.team,artillery:u.kind==='artillery',life:.22});}
   if((u.team==='red'&&u.kind!=='fort'&&(!b.campaign||u.order==='advance'))||u.order==='attack'){
    if(!inRange&&enemy){if(!u.path.length||u.cooldown<=-.7){u.path=route(b,u,enemy)||[];u.cooldown=Math.max(u.cooldown,-.3);}move(b,u,dt);}else u.path=[];
   }else{if(u.order==='follow'){const truck=b.units.find(e=>e.id===u.target&&e.hp>0);if(truck&&!u.path.length)u.path=route(b,u,{x:Math.max(30,truck.x-40),y:300})||[];}move(b,u,dt);}
  }
  const blue=b.units.filter(u=>u.team==='blue'&&u.kind!=='truck'&&u.hp>0),red=b.units.filter(u=>u.team==='red'&&u.hp>0);if(!blue.length){b.result='defeat';return;}
  if(b.campaign){if(b.campaign.type==='defense'){if(!red.length)b.result='victory';}else{const occupation=blue.some(u=>u.kind!=='fort'&&distance(u,b.objective)<72),contested=red.some(u=>distance(u,b.objective)<135);b.capture=occupation&&!contested?b.capture+dt:0;if(b.capture>=3)b.result='victory';}return;}
  if(b.mission===0){const occupation=blue.some(u=>distance(u,b.objective)<72),contested=red.some(u=>distance(u,b.objective)<135);b.capture=occupation&&!contested?b.capture+dt:Math.max(0,b.capture-dt*.3);if(b.capture>=6)b.result='victory';}
  if(b.mission===1){const truck=b.units.find(u=>u.kind==='truck');if(truck.hp<=0)b.result='defeat';else if(truck.x>=660)b.result='victory';}
  if(b.mission===2&&b.time>=50)b.result=blue.some(u=>distance(u,b.objective)<145)?'victory':'defeat';
 }
 return {missions,kinds,width,height,create,createCampaign,survival,blocked,route,order,step,support,damageAt};
});
