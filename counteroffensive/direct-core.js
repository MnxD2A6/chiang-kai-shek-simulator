(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./geo-core.js'));
  else root.FrontCore=factory(root.FrontCore);
})(typeof globalThis!=='undefined'?globalThis:this,function(Base){
  'use strict';
  const F={...Base}, valid=i=>Number.isInteger(i)&&i>=0&&i<F.N;
  const no=message=>({ok:false,message}), yes=message=>({ok:true,message});
  const distance=(a,b)=>{const p=F.xy(a),q=F.xy(b);return Math.abs(p.x-q.x)+Math.abs(p.y-q.y);};
  function log(s,text,kind='info'){s.events.unshift({text,kind,t:s.time});s.events.length=Math.min(14,s.events.length);}
  function make(s,tile,force,name){return {id:s.serial++,faction:1,name,force,tile,goal:tile,path:[],progress:0,status:'guard'};}
  function init(s){
    s.units=[];
    for(const [id,amount,name] of [['taipei',600,'第一军'],['kaohsiung',400,'第二军']]){
      const town=s.towns.find(t=>t.id===id);const force=Math.min(amount,s.factions[1].troops);
      if(force>=1&&s.owners[town.tile]===1){s.units.push(make(s,town.tile,force,name));s.factions[1].troops-=force;}
    }
    return s;
  }
  F.createStrategic=seed=>init(Base.createStrategic(seed));
  // Four-neighbour BFS yields a continuous route across actual land and sea.
  // Prefer a land route on the same landmass before considering transport.
  function route(s,from,to,landOnly=false){
    const prev=new Int32Array(F.N).fill(-2),queue=new Int32Array(F.N);let read=0,write=0;
    queue[write++]=from;prev[from]=-1;
    while(read<write){const i=queue[read++];if(i===to)break;
      for(const n of F.neighbors(i))if(prev[n]===-2&&s.owners[n]<=4&&(!landOnly||s.terrain[n])&&(s.strategy.phase==='war'||s.owners[n]===1)){
        prev[n]=i;queue[write++]=n;
      }
    }
    if(prev[to]===-2)return null;const path=[];for(let i=to;i!==from;i=prev[i])path.push(i);return path.reverse();
  }
  F.unitPosition=u=>{const p=F.xy(u.tile),q=F.xy(u.path[0]??u.tile);return {x:p.x+(q.x-p.x)*u.progress+.5,y:p.y+(q.y-p.y)*u.progress+.5};};
  F.unitStatus=(s,u)=>u.status==='guard'?'驻守':u.status==='waiting'?'等待运输舰':u.status==='blocked'?'兵力不足':!s.terrain[u.tile]?'渡海中':u.path.length&&s.owners[u.path[0]]!==1&&s.terrain[u.path[0]]?'交战中':'行军中';
  F.order=function(s,id,tile){
    if(s.result)return no('本局已结束。');const u=s.units.find(a=>a.id===id);
    if(!u)return no('先点地图上的蓝色军队，再点一座城市。');
    if(!valid(tile)||!s.terrain[tile]||s.owners[tile]>4)return no('请选择我方或敌方的陆地城市。');
    if(s.strategy.phase==='preparation'&&s.owners[tile]!==1)return no('筹备期可以调动我方军队；进攻前先在「发展」中决定开战。');
    if(tile===u.tile){u.path=[];u.progress=0;u.goal=tile;u.status='guard';return yes(u.name+'已在此驻守。');}
    const path=(s.terrain[u.tile]?route(s,u.tile,tile,true):null)||route(s,u.tile,tile);
    if(!path)return no('没有可通行的路线。');
    u.path=path;u.progress=0;u.goal=tile;u.status='moving';
    const town=s.towns.find(t=>t.tile===tile),name=town?.name||'指定位置';
    const text=u.name+' → '+name+' · '+(s.owners[tile]===1?'抵达后驻守':'自动进攻，夺取后驻守');log(s,text);return yes(text);
  };
  F.hold=function(s,id){const u=s.units.find(a=>a.id===id);if(!u||s.result)return no('请选择可指挥的部队。');u.path=[];u.progress=0;u.goal=u.tile;u.status='guard';return yes(u.name+(s.terrain[u.tile]?'已停止行军，原地驻守。':'已停止航行，可重新选择城市。'));};
  F.reinforce=function(s,id){const u=s.units.find(a=>a.id===id);if(!u||s.result)return no('请选择部队。');if(!s.terrain[u.tile]||s.owners[u.tile]!==1)return no('进入我方陆地后才能补充兵力。');const n=Math.min(500,Math.floor(s.factions[1].troops));if(n<1)return no('预备兵正在恢复。');u.force+=n;s.factions[1].troops-=n;return yes(u.name+'补充 '+n+' 人。');};
  F.recruit=function(s){if(s.result)return no('本局已结束。');if(s.units.length>=6)return no('最多同时指挥 6 支军队。');const town=s.towns.find(t=>t.id==='taipei'&&s.owners[t.tile]===1)||s.towns.find(t=>s.owners[t.tile]===1);if(!town||s.factions[1].troops<250)return no('需要我方城市和 250 名预备兵。');const u=make(s,town.tile,250,'第'+s.serial+'军');s.units.push(u);s.factions[1].troops-=250;return {...yes(u.name+'已在'+town.name+'集结。'),id:u.id};};
  function march(s,u,dt){
    if(!u.path.length)return;u.progress+=dt*(!s.terrain[u.tile]?3.8:2.8);
    while(u.progress>=1&&u.path.length){
      const tile=u.path[0];
      if(s.naval&&(!s.terrain[tile]||!s.terrain[u.tile])){
        const carrier=s.naval.ships.find(a=>a.id===u.transport&&a.hp>0)||s.naval.ships.find(a=>a.kind==='transport'&&a.faction===1&&a.hp>0&&a.cargo===null&&distance(a.tile,u.tile)<12);
        if(!carrier){u.progress=0;u.status='waiting';return;}
        u.transport=carrier.id;carrier.cargo=u.id;carrier.path=[];carrier.progress=0;u.status='moving';
        if(!s.terrain[tile])carrier.tile=tile;
        else{carrier.cargo=null;delete u.transport;}
      }
      if(s.owners[tile]>4){u.path=[];u.progress=0;u.status='blocked';return;}
      if(s.terrain[tile]&&s.owners[tile]!==1){
        const loss=F.cost(s,tile)*F.strategy.attackFactor(s)*(!s.terrain[u.tile]?2:1);
        if(u.force<=loss+10){u.path=[];u.progress=0;u.status='blocked';log(s,u.name+'兵力不足，已停止推进。','danger');return;}
        u.force-=loss;F.claim(s,tile,1);
        // A narrow corridor remains connected to the unit, never a remote front.
        for(const n of F.neighbors(tile))if(!s.towns.some(t=>t.tile===n)&&s.terrain[n]&&s.owners[n]>=0&&s.owners[n]<5&&s.owners[n]!==1){const price=F.cost(s,n)*F.strategy.attackFactor(s);if(u.force>price+20){u.force-=price;F.claim(s,n,1);}}
      }
      u.tile=tile;u.path.shift();u.progress-=1;
      if(!u.path.length){u.progress=0;u.status='guard';log(s,u.name+'抵达'+(s.towns.find(t=>t.tile===u.tile)?.name||'目的地')+'，开始驻守。','success');}
    }
  }
  F.step=function(s,dt){
    if(s.paused||s.result||!Number.isFinite(dt)||dt<=0)return;
    dt=Math.min(.2,dt);for(const u of s.units)march(s,u,dt);
    Base.step(s,dt);s.units=s.units.filter(u=>u.force>0);
    if(!s.result&&s.towns.filter(t=>t.goal).every(t=>s.owners[t.tile]===1)){s.result='victory';log(s,'福州、南京、广州已全部控制，战役胜利！','success');}
  };
  F.encode=s=>JSON.stringify({...JSON.parse(Base.encode(s)),version:4,units:s.units});
  F.decode=function(text){
    const raw=JSON.parse(text),version=raw?.version;
    if(version!==3&&version!==4)throw Error('请使用新版地图存档。');
    const s=Base.decode(JSON.stringify({...raw,version:3}));s.units=[];
    if(version===3){
      for(const a of s.armies.filter(a=>a.faction===1))s.units.push({id:a.id,faction:1,name:'远征军 '+a.id,force:a.force,tile:a.source,goal:a.source,path:[],progress:0,status:'guard'});
      for(const a of s.fleets.filter(a=>a.faction===1)){const tile=a.path[Math.min(a.path.length-1,Math.floor(a.progress))];s.units.push({id:a.id,faction:1,name:'远征军 '+a.id,force:a.force,tile,goal:tile,path:[],progress:0,status:'guard'});}
      s.armies=s.armies.filter(a=>a.faction!==1);s.fleets=s.fleets.filter(a=>a.faction!==1);if(!s.units.length)init(s);
      log(s,'旧版进度已保留；军队停在原位置，点选后可重新下令。');return s;
    }
    const bad=()=>{throw Error('军队存档数据无效。');},ids=new Set([...s.armies,...s.fleets].map(a=>a.id));
    if(!Array.isArray(raw.units)||raw.units.length>100)bad();
    for(const u of raw.units){
      if(!u||!Number.isInteger(u.id)||u.id<1||u.id>=s.serial||ids.has(u.id)||u.faction!==1||typeof u.name!=='string'||u.name.length>30||!Number.isFinite(u.force)||u.force<=0||u.force>1e6||!valid(u.tile)||s.owners[u.tile]>4||!valid(u.goal)||s.owners[u.goal]>4||!Number.isFinite(u.progress)||u.progress<0||u.progress>=1||!['guard','moving','blocked','waiting'].includes(u.status)||!Array.isArray(u.path)||u.path.length>F.N)bad();
      ids.add(u.id);let prev=u.tile;for(const tile of u.path){if(!valid(tile)||s.owners[tile]>4||!F.neighbors(prev).includes(tile))bad();prev=tile;}
      if(u.path.length?(u.path.at(-1)!==u.goal||!['moving','waiting'].includes(u.status)):u.progress!==0||u.status==='moving')bad();
      s.units.push({...u,path:[...u.path]});
    }
    if(raw.result==='victory')s.result=s.towns.filter(t=>t.goal).every(t=>s.owners[t.tile]===1)?'victory':null;
    return s;
  };
  return F;
});
