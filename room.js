(function(root){
  'use strict';
  class PixelRoom{
    constructor(canvas,onInteract,blocked){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onInteract=onInteract;this.blocked=blocked;this.keys=new Set();this.player={x:160,y:222};this.time=0;this.active=true;this.frame=null;this.last=0;this.moving=false;
      this.stations=[{id:'map',name:'战略地图',x:159,y:104},{id:'military',name:'军事顾问',x:70,y:150},{id:'finance',name:'财政顾问',x:258,y:142},{id:'diplomacy',name:'外交顾问',x:257,y:202},{id:'phone',name:'电话总机',x:65,y:78}];
      this.solids=[{x:108,y:67,w:104,h:46},{x:29,y:54,w:71,h:34},{x:241,y:63,w:52,h:47},{x:34,y:187,w:53,h:29}];
      document.addEventListener('keydown',e=>{if(this.blocked()||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){e.preventDefault();this.keys.add(e.key.toLowerCase());}if(e.key.toLowerCase()==='e'&&!e.repeat){e.preventDefault();this.interact();}});
      document.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>this.keys.clear());document.addEventListener('visibilitychange',()=>{this.keys.clear();this.last=0;});
      canvas.addEventListener('pointerdown',e=>{if(this.blocked())return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*256/r.height;const station=this.stations.find(s=>Math.hypot(s.x-x,s.y-y)<28);this.walkTo(station?station.x:x,station?station.y:y,station?.id);canvas.focus({preventScroll:true});});
      this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick);
    }
    nearest(){let found=null,distance=Infinity;for(const s of this.stations){const d=Math.hypot(s.x-this.player.x,s.y-this.player.y);if(d<distance){distance=d;found=s;}}return distance<55?found:null;}
    interact(){if(this.blocked())return;const s=this.nearest();if(s)this.onInteract(s.id);else this.onInteract('none');}
    moveKey(direction,down){const map={up:'arrowup',left:'arrowleft',down:'arrowdown',right:'arrowright'};if(down)this.keys.add(map[direction]);else this.keys.delete(map[direction]);}
    collides(x,y){return this.solids.some(r=>x+5>r.x&&x-5<r.x+r.w&&y+1>r.y&&y-6<r.y+r.h);}
    walkTo(x,y,station){
      const start=[Math.round(this.player.x/8)*8,Math.round(this.player.y/8)*8],key=p=>p.join(','),queue=[start],visited=new Set([key(start)]),parents=new Map();let end=null;
      for(let head=0;head<queue.length;head++){const p=queue[head];if(Math.hypot(p[0]-x,p[1]-y)<(station?33:9)){end=p;break;}for(const d of [[8,0],[-8,0],[0,8],[0,-8]]){const n=[p[0]+d[0],p[1]+d[1]],k=key(n);if(n[0]<22||n[0]>298||n[1]<53||n[1]>240||visited.has(k)||this.collides(...n))continue;visited.add(k);parents.set(k,p);queue.push(n);}}
      if(!end)return false;const path=[];let p=end;while(key(p)!==key(start)){path.unshift(p);p=parents.get(key(p));}path.unshift(start);this.navPath=path;this.navStation=station;return true;
    }
    tick(now){const dt=Math.min((now-(this.last||now))/1000,.04);this.last=now;this.time=now/1000;let dx=0,dy=0;
      if(!this.blocked()){if(this.keys.has('w')||this.keys.has('arrowup'))dy--;if(this.keys.has('s')||this.keys.has('arrowdown'))dy++;if(this.keys.has('a')||this.keys.has('arrowleft'))dx--;if(this.keys.has('d')||this.keys.has('arrowright'))dx++;}else this.keys.clear();
      if(dx||dy)this.navPath=null;if(this.blocked()){this.navPath=null;this.navStation=null;}
      this.moving=Boolean(dx||dy||this.navPath?.length);const scale=dx&&dy?.7071:1,speed=83*dt*scale;const px=Math.max(22,Math.min(298,this.player.x+dx*speed)),py=Math.max(53,Math.min(240,this.player.y+dy*speed));if(!this.collides(px,this.player.y))this.player.x=px;if(!this.collides(this.player.x,py))this.player.y=py;
      if(this.navPath?.length){const p=this.navPath[0],vx=p[0]-this.player.x,vy=p[1]-this.player.y,d=Math.hypot(vx,vy);if(d<=83*dt){this.player.x=p[0];this.player.y=p[1];this.navPath.shift();if(!this.navPath.length&&this.navStation){const target=this.navStation;this.navStation=null;this.onInteract(target);}}else{this.player.x+=vx/d*83*dt;this.player.y+=vy/d*83*dt;}}
      this.draw();this.canvas.dataset.playerX=this.player.x.toFixed(1);this.canvas.dataset.playerY=this.player.y.toFixed(1);const s=this.nearest();document.getElementById('roomPrompt').textContent=s?'E · '+s.name:'WASD 移动 · 点击顾问互动';this.frame=requestAnimationFrame(this.tick);
    }
    rect(x,y,w,h,color){this.ctx.fillStyle=color;this.ctx.fillRect(Math.round(x),Math.round(y),w,h);}
    sprite(x,y,kind,walk=false){const r=(dx,dy,w,h,c)=>this.rect(x+dx,y+dy,w,h,c),step=walk?Math.floor(this.time*9)%2:0;
      r(-8,0,17,4,'#202a2280');r(-5,-5,4,7,'#232a22');r(2,-5+step,4,7-step,'#232a22');r(-7,-21,15,16,kind==='player'?'#76845a':kind==='finance'?'#7d7a66':'#596c50');r(-9,-19,3,11,'#d0bc8e');r(8,-19,3,11,'#d0bc8e');r(-5,-20,11,2,'#b6b385');r(-6,-8,13,3,'#3b4830');r(0,-17,2,8,'#aeb88b');r(-5,-33,11,12,'#d9c195');r(-7,-29,2,6,'#c5a77c');r(6,-29,2,6,'#c5a77c');r(-3,-28,2,2,'#423b2d');r(3,-28,2,2,'#423b2d');r(-1,-25,3,2,'#b5956d');r(-3,-23,7,1,kind==='player'?'#534b34':'#aa8d65');
      if(kind==='player'){r(-5,-32,2,5,'#7a7050');r(4,-32,2,5,'#7a7050');r(-3,-35,7,2,'#dfcc9e');}else if(kind==='diplomacy'){r(-6,-34,13,5,'#373f34');r(6,-29,3,11,'#373f34');r(-8,-28,3,8,'#373f34');}else{r(-7,-35,15,5,'#526547');r(-8,-30,16,2,'#36492f');r(-1,-34,3,2,'#c3cdaa');}
    }
    text(text,x,y,color='#b9c19d',size=8){const c=this.ctx;c.font=`${size}px "Microsoft YaHei",sans-serif`;c.fillStyle=color;c.textAlign='center';c.fillText(text,x,y);}
    draw(){const c=this.ctx;c.imageSmoothingEnabled=false;this.rect(0,0,320,256,'#263126');
      this.rect(10,10,300,239,'#555d3e');this.rect(14,45,292,200,'#79724b');
      for(let y=46;y<244;y+=17){this.rect(15,y,290,1,'#655f40');for(let x=15+((y/17|0)%2)*28;x<305;x+=56)this.rect(x,y,1,17,'#6b6544');}
      this.rect(14,39,292,6,'#2f3d2b');this.rect(18,13,284,25,'#44573c');for(let x=26;x<296;x+=23)this.rect(x,14,1,22,'#4f6445');
      for(const x of [37,121,207]){this.rect(x,14,48,24,'#b5c4a2');this.rect(x+3,17,42,17,'#80947b');this.rect(x+23,15,2,21,'#536c48');this.rect(x+2,25,44,2,'#536c48');this.rect(x+6,28,13,6,'#617956');this.rect(x+27,27,15,7,'#617956');}
      this.rect(99,11,13,28,'#394834');this.rect(184,11,13,28,'#394834');
      this.rect(273,15,20,20,'#243526');this.rect(276,18,14,14,'#d0d3b1');this.rect(282,20,2,7,'#4d6243');this.rect(283,26,5,2,'#4d6243');
      this.rect(29,52,71,37,'#373e2a');this.rect(31,54,67,29,'#8c7850');this.rect(31,55,67,3,'#a28e60');this.rect(35,81,61,2,'#655235');
      this.rect(45,60,22,7,'#223327');this.rect(49,66,16,10,'#25392a');this.rect(51,63,13,3,'#647653');this.rect(42,57,29,4,'#293f2d');this.rect(43,57,3,7,'#283b29');this.rect(67,57,3,7,'#283b29');this.rect(55,68,6,5,'#9eb785');
      c.strokeStyle='#2b412e';c.lineWidth=2;c.beginPath();c.moveTo(66,74);for(let i=0;i<9;i++)c.lineTo(71+i*2,72+i%2*4);c.stroke();
      this.rect(76,61,15,15,'#b9c5a0');this.rect(77,64,11,1,'#6e835c');this.rect(77,67,11,1,'#6e835c');
      this.rect(108,67,104,49,'#384330');this.rect(110,67,100,40,'#928153');this.rect(113,68,94,3,'#b09f6a');this.rect(121,74,76,27,'#bdc7a0');
      c.strokeStyle='#7d9569';c.lineWidth=1;c.beginPath();c.moveTo(125,83);c.lineTo(135,76);c.lineTo(145,79);c.lineTo(156,85);c.lineTo(171,79);c.lineTo(187,89);c.lineTo(178,97);c.lineTo(151,94);c.lineTo(137,97);c.closePath();c.stroke();for(const p of [[140,83],[162,86],[176,89],[154,92]])this.rect(...p,3,3,'#657d4d');
      this.rect(116,113,8,9,'#464631');this.rect(198,113,8,9,'#464631');this.rect(142,116,35,10,'#493f2b');this.rect(147,119,26,5,'#776541');
      this.rect(239,56,54,56,'#2a3829');for(let y=60;y<108;y+=16){this.rect(243,y,46,11,'#526748');for(let x=246;x<286;x+=7){this.rect(x,y+1,4,9,(x%3===0)?'#b1b68a':'#809472');}this.rect(243,y+11,46,2,'#8f8358');}
      this.rect(34,187,53,33,'#363e2a');this.rect(36,188,49,26,'#8d7a50');this.rect(41,193,29,16,'#475542');this.rect(44,194,23,3,'#c7c9a0');this.rect(41,207,30,3,'#263a2c');for(let x=45;x<67;x+=5)this.rect(x,200,3,3,'#9da582');this.rect(73,195,8,12,'#d1cba1');
      this.rect(125,146,70,64,'#536544');this.rect(128,149,64,58,'#697a4d');this.rect(133,154,54,48,'#465f3b');this.rect(138,159,44,38,'#6e8050');this.rect(143,164,34,28,'#50683e');
      this.rect(25,111,17,15,'#736741');this.rect(28,101,11,20,'#355037');this.rect(22,105,11,11,'#536846');this.rect(34,102,9,13,'#4b6540');
      this.rect(284,208,17,15,'#786e47');this.rect(287,198,11,20,'#3e573b');this.rect(280,201,10,12,'#566d46');
      this.rect(137,240,46,16,'#31402e');this.rect(140,241,40,9,'#beb587');this.rect(145,243,30,1,'#6b7251');
      if(this.targetStation==='map'){for(let y=151;y<224;y+=12)this.rect(159,y,2,4,'#c9db8a');}
      if(this.navPath)for(const p of this.navPath.filter((p,i)=>i%2===0))this.rect(p[0]-1,p[1]-1,2,2,'#bace80');
      const actors=[{x:70,y:150,kind:'military'},{x:258,y:142,kind:'finance'},{x:257,y:202,kind:'diplomacy'},{x:this.player.x,y:this.player.y,kind:'player'}].sort((a,b)=>a.y-b.y);for(const a of actors)this.sprite(a.x,a.y+(a.kind!=='player'&&Math.floor(this.time*1.5)%3===0?1:0),a.kind,a.kind==='player'&&this.moving);
      if(this.targetStation){const t=this.stations.find(s=>s.id===this.targetStation);if(t){const lift=Math.sin(this.time*3)*2;this.rect(t.x-11,t.y-50+lift,23,15,'#d5df93');this.text('点击',t.x,t.y-39+lift,'#334927',8);}}
      this.text('参谋',70,166);this.text('财政',258,157);this.text('外交',257,217);this.text('电话',64,97,'#d9dfb4');this.text('地图桌',160,63,'#d9dfb4');
      const near=this.nearest();if(near&&!this.blocked()){const y=near.y-46;this.rect(near.x-8,y,16,13,'#c2d48c');this.text('E',near.x,y+10,'#364e2c',10);}
    }
  }
  root.PixelRoom=PixelRoom;
})(window);
