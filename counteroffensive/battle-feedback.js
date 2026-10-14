(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.FrontFeedback=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Observe simulation edges once. Rendering and sound consume the same events.
  return class Feedback{
    constructor(core){this.core=core;this.reset();}
    reset(){this.ready=false;this.lastTime=-1;this.cooldowns=new Map();this.missiles=new Set();this.bursts=new Map();this.towns=new Map();this.rifles=new Map();}
    read(s){
      const F=this.core,naval=s.naval||{ships:[],missiles:[],bursts:[]},events=[];
      const prime=!this.ready||s.time<this.lastTime||s.seed!==this.seed||s.time-this.lastTime>5;
      if(s.paused&&!prime)return [];
      if(prime)this.reset();
      const emit=e=>{if(!prime&&!s.paused)events.push({...e,at:e.at??s.time});};
      const live=new Set(naval.ships.map(a=>a.id));
      for(const a of naval.ships){
        const old=this.cooldowns.get(a.id),delay=a.cooldown-s.time;
        if(!prime&&(old===undefined||a.cooldown>old+.01)&&delay>0&&delay<=1.6&&F.shipTypes[a.kind].damage){
          const p=F.shipPosition(a),enemies=naval.ships.filter(b=>b.faction!==a.faction).sort((b,c)=>{const q=F.shipPosition(b),r=F.shipPosition(c);return Math.hypot(q.x-p.x,q.y-p.y)-Math.hypot(r.x-p.x,r.y-p.y);});
          const enemy=enemies[0],hit=naval.bursts.find(e=>e.kind==='gun'&&Math.abs(e.at-s.time)<.12);
          if(enemy||hit)emit({type:'gun',id:a.id,from:a.tile,to:enemy?.tile??hit.tile,targetId:enemy?.id,tile:a.tile});
        }
        this.cooldowns.set(a.id,a.cooldown);
      }
      for(const id of this.cooldowns.keys())if(!live.has(id))this.cooldowns.delete(id);
      const activeMissiles=new Set();
      for(const m of naval.missiles){activeMissiles.add(m.id);if(!this.missiles.has(m.id))emit({type:'launch',id:m.id,tile:m.from,from:m.from,to:m.to,at:m.launched});}
      this.missiles=activeMissiles;
      for(const e of naval.bursts){const key=e.kind+':'+e.tile+':'+e.at;if(!this.bursts.has(key))emit({type:'impact',...e});this.bursts.set(key,e.at);}
      for(const [key,t] of this.bursts)if(s.time-t>5)this.bursts.delete(key);
      for(const town of s.towns){const owner=s.owners[town.tile],old=this.towns.get(town.id);if(old!==undefined&&old!==owner)emit({type:owner===1?'capture':'loss',tile:town.tile,name:town.name});this.towns.set(town.id,owner);}
      const warning=s.strategy?.warning,warningAt=warning?.startedAt??null,strikeAt=s.strategy?.lastStrike?.at??null;
      if(warningAt!==null&&warningAt!==this.warningAt)emit({type:'warning',at:warningAt});
      if(strikeAt!==null&&strikeAt!==this.strikeAt)emit({type:'airstrike',at:strikeAt,tile:s.towns.find(t=>t.id==='taipei').tile});
      if(s.result&&s.result!==this.result)emit({type:s.result});
      for(const u of s.units||[]){const next=u.path[0],fighting=next!==undefined&&s.terrain[next]&&s.owners[next]!==1&&s.strategy.phase==='war',bucket=Math.floor(s.time*1.8+u.id*.3);if(fighting&&this.rifles.get(u.id)!==bucket)emit({type:'rifle',id:u.id,tile:u.tile,to:next});this.rifles.set(u.id,bucket);}
      const units=new Set((s.units||[]).map(u=>u.id));for(const id of this.rifles.keys())if(!units.has(id))this.rifles.delete(id);
      this.warningAt=warningAt;this.strikeAt=strikeAt;this.result=s.result;this.seed=s.seed;this.lastTime=s.time;this.ready=true;
      return events;
    }
  };
});
