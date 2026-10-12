/* Original procedural pixel art. No external assets or services. */
(function(root){
 'use strict';
 class FrontlineView{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');}
  rect(x,y,w,h,color){const c=this.ctx;c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
  text(s,x,y,color='#eee9c5',size=10){const c=this.ctx;c.fillStyle=color;c.font=`${size}px "Microsoft YaHei",sans-serif`;c.textAlign='center';c.fillText(s,x,y);}
  line(points,color,width=1){const c=this.ctx;c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
  actor(x,y,kind,t,walk=false,small=false){
   const r=(a,b,w,h,c)=>this.rect(x+a,y+b,w,h,c),step=walk?Math.floor(t*9)%2*2:0,color=kind==='red'?'#a65748':kind==='player'?'#c9b27a':kind==='diplomacy'||kind==='medic'?'#e0d9ad':kind==='finance'?'#647187':'#647e50';
   r(-8,0,17,3,'#23332255');r(-5,-7+step,4,8-step,'#26372f');r(2,-7,4,8-step,'#26372f');r(-7,-21,15,15,color);r(-9,-18,3,10,'#c7aa81');r(8,-18,3,10,'#c7aa81');r(-6,-9,13,2,'#443f2c');r(-5,-33,11,12,'#dec598');r(-7,-29,2,6,'#bd9a6c');r(6,-29,2,6,'#bd9a6c');r(-3,-27,2,2,'#353b2d');r(3,-27,2,2,'#353b2d');r(-2,-23,5,1,'#94794f');
   if(kind==='player'){r(-4,-35,8,3,'#e6cfa0');r(-5,-32,2,5,'#696143');r(4,-32,2,5,'#696143');r(-2,-18,4,2,'#ede0a9');}
   else if(kind==='diplomacy'){r(-6,-34,13,5,'#353d32');r(6,-30,3,13,'#353d32');r(-8,-28,3,8,'#353d32');}
   else{r(-7,-35,15,5,kind==='red'?'#773b32':'#405b39');r(-9,-30,18,2,'#314132');r(-1,-34,3,2,'#c9d5ac');}
   if(kind==='medic'){r(-2,-19,5,9,'#b95e4c');r(-4,-17,9,4,'#b95e4c');}if(small)r(10,-17,3,17,'#4a3c2e');
  }
  tree(x,y,t=0){this.rect(x-2,y-6,5,15,'#6b6441');this.rect(x-10,y-22,22,19,'#344d37');this.rect(x-15,y-18,28,11,'#45603d');this.rect(x-8,y-27,18,17,'#5b754b');this.rect(x-6+Math.sin(t)*1,y-24,11,4,'#6d8150');}
  house(x,y,w,h,color='#9c8859'){
   this.rect(x,y,w,h,color);this.rect(x-3,y-7,w+6,11,'#584e38');this.rect(x+3,y-12,w-6,7,'#6b5a3b');this.rect(x+8,y+7,15,14,'#bcd0ad');this.rect(x+14,y+7,2,14,'#53664a');this.rect(x+w-25,y+h-23,15,23,'#494a35');this.rect(x+w-21,y+h-15,2,2,'#c4b783');this.rect(x,y+h-2,w,3,'#6e6442');
  }
  tent(x,y,w,h){this.rect(x,y+4,w,h-4,'#586a45');this.rect(x-4,y,w+8,10,'#728055');this.rect(x+8,y-7,w-16,8,'#8b9563');this.rect(x+w/2-9,y+h-21,18,21,'#2e4130');this.rect(x+w/2-2,y+h-21,3,21,'#a6ae72');this.line([[x-5,y+10],[x-8,y+h+6]],'#d6c99a');this.line([[x+w+5,y+10],[x+w+8,y+h+6]],'#d6c99a');}
  world(s,state,path,time,moving){
   const c=this.ctx;c.setTransform(2,0,0,2,0,0);c.imageSmoothingEnabled=false;const r=this.rect.bind(this);r(0,0,320,256,s.palette[0]);r(12,43,296,203,s.palette[1]);
   for(let y=47;y<245;y+=13)for(let x=16;x<305;x+=19){const n=((x*17+y*31)%11);r(x+n,y+n/3,2,1,s.palette[2]+'55');}
   r(15,199,290,29,'#ac9a6c');r(144,47,32,184,'#ac9a6c');for(let i=0;i<12;i++)r(18+i*24,201,12,1,'#c0b082');
   if(state.scene==='hq'){
    r(12,9,296,34,'#43553d');r(17,38,286,5,'#283e2c');for(let x=30;x<275;x+=82){r(x,14,45,21,'#bccba3');r(x+3,17,39,15,'#809575');r(x+21,14,2,21,'#3d5435');}
    r(110,70,100,47,'#4b462e');r(110,70,100,37,'#a58c59');r(121,75,78,26,'#d1d6ac');this.line([[128,86],[147,77],[161,85],[185,80],[194,94],[154,99],[128,86]],'#687e57');r(25,55,70,30,'#8a734f');r(37,60,27,6,'#243f31');r(39,66,22,12,'#2c4936');r(48,69,6,5,'#a9b992');for(let y=55;y<111;y+=16){r(245,y,45,15,'#354b36');for(let x=249;x<286;x+=7)r(x,y+2,4,10,'#9ba979');}
    r(120,147,76,43,'#627445');r(125,152,66,33,'#7c8a56');r(130,156,56,24,'#4d6840');this.text('作战桌',160,64,'#ede2b0',8);
   }else if(state.scene==='camp'){
    this.tent(30,65,65,45);this.tent(220,65,65,45);this.tent(120,55,70,35);r(130,150,60,4,'#5b6d40');r(130,170,60,4,'#5b6d40');for(let x=136;x<190;x+=17){r(x,132,2,23,'#846d42');r(x-7,139,16,3,'#846d42');}r(176,188,17,10,'#494834');r(181,185,6,11,Math.floor(time*4)%2?'#d9984b':'#daae62');r(196,176,17,16,'#9f8d57');
   }else if(state.scene==='depot'){
    this.house(30,62,84,50,'#7b8361');for(let y=48;y<79;y+=14){r(12,y,296,3,'#485346');for(let x=20;x<306;x+=14)r(x,y+3,3,8,'#726b46');}r(134,63,52,33,'#6f8350');r(134,67,52,3,'#a4a87a');r(138,90,12,9,'#293e2c');r(171,90,12,9,'#293e2c');r(217,77,65,28,'#4d6542');r(220,82,28,14,'#aac0a0');r(251,83,27,15,'#728954');r(224,101,12,6,'#263d2d');r(265,101,12,6,'#263d2d');for(let x=132;x<204;x+=24){r(x,140,19,17,'#9e8a58');r(x+2,144,15,2,'#c7b886');r(x+8,140,2,17,'#675a37');}r(159,164,25,14,'#d5d2a9');r(169,166,5,10,'#ac604e');r(166,169,11,4,'#ac604e');
   }else if(state.scene==='village'){
    r(12,13,296,31,'#577f74');for(let x=15;x<307;x+=19)r(x,21+Math.sin(time+x)*3,12,1,'#8aa797');this.house(35,64,75,55,'#c0a66b');this.house(210,65,75,55,'#a28b58');r(135,78,48,28,'#837952');r(140,82,38,19,'#344f43');r(132,77,54,4,'#d2c18b');r(145,63,3,18,'#6c6040');r(173,63,3,18,'#6c6040');r(150,62,23,3,'#786542');for(let x=130;x<210;x+=18){r(x,171,3,18,'#8b7a4b');r(x,177,19,3,'#8b7a4b');}this.tree(37,191,time);this.tree(292,172,time);
   }else{
    r(12,28,296,15,'#3d5037');for(let x=20;x<304;x+=18){r(x,25,2,17,'#a39463');this.line([[x,30],[x+18,36]],'#a39463');}this.tent(30,67,74,35);this.tent(216,64,70,45);r(128,73,63,30,'#897d51');r(138,79,40,18,'#c7cba0');for(let x=128;x<192;x+=14){r(x,163,12,8,'#b0a073');r(x+3,161,9,3,'#c9b989');}this.tree(37,180,time);this.tree(286,184,time);r(152,124,3,39,'#b9c8a1');r(154,125,24,13,'#547866');r(155,126,8,7,'#eee8c0');
   }
   if(path)for(const p of path.filter((_,i)=>i%2===0))r(p.x-1,p.y-1,2,2,'#e3da99');
   for(const e of s.exits){r(e.x-12,e.y-4,24,7,'#d2d5a0');this.text(e.name,e.x,e.y+12,'#f6edc7',7);}
   const actors=[...s.npcs.map(n=>({...n,...root.FrontlineWorld.people.find(p=>p.id===n.id)})),{id:'hero',x:state.hero.x,y:state.hero.y,kind:'player'}].sort((a,b)=>a.y-b.y);
   for(const a of actors){this.actor(a.x,a.y,a.kind,time,a.id==='hero'&&moving);if(a.id!=='hero'){r(a.x-20,a.y+5,40,10,'#273d2bd0');this.text(a.name,a.x,a.y+13,'#f2e4ba',7);}}this.text('你',state.hero.x,state.hero.y-42,'#fff0b6',8);c.setTransform(1,0,0,1,0,0);
  }
  battle(b,time){
   const c=this.ctx;c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;this.rect(0,0,720,420,'#657e4e');
   for(let y=0;y<420;y+=30)for(let x=0;x<720;x+=30){this.rect(x,y,29,29,(x+y)%60?'#6c8352':'#708557');if((x*3+y)%120===0)this.rect(x+4,y+13,5,2,'#879661');}
   this.rect(0,185,720,50,'#b4a271');this.rect(0,315,720,30,'#af9c6e');
   if(b.mission===0){this.rect(360,0,30,420,'#547f79');for(let y=0;y<420;y+=20)this.rect(366,Math.round(y+Math.sin(time*2+y)*3),12,2,'#81a599');this.rect(351,150,48,120,'#a5966c');for(let y=154;y<270;y+=10)this.rect(351,y,48,2,'#766e50');this.rect(350,148,3,122,'#c1ba88');this.rect(398,148,3,122,'#c1ba88');this.text('桥',375,138,'#efdfae',13);}
   if(b.mission===1&&b.campaign?.terrain!=='plain'){for(let y=120;y<270;y+=30){this.tree(344,y+23,time);this.tree(374,y+23,time);}if(!b.campaign)this.text('粮车终点 →',657,373,'#f0e4b1',13);}
   if(b.mission===2){this.house(330,22,85,125,'#c1a06b');this.house(330,300,85,113,'#9b8459');this.house(90,22,85,90,'#b19860');this.rect(242,153,72,12,'#b9a97b');this.rect(242,254,72,12,'#b9a97b');}
   for(const p of [[240,150],[240,285]]){for(let i=0;i<4;i++)this.rect(p[0]+i*10-15,p[1],9,8,'#c8b584');this.text('掩体',p[0],p[1]+24,'#cfdaa2',10);}
   for(const p of [[42,54],[58,385],[638,41],[692,376]])this.tree(...p,time);
   const selected=b.units.find(u=>u.id===b.selected&&u.hp>0);if(selected){c.strokeStyle='#c8dfb15c';c.setLineDash([3,5]);c.beginPath();c.arc(selected.x,selected.y,selected.range,0,Math.PI*2);c.stroke();c.setLineDash([]);if(selected.path.length){this.line([[selected.x,selected.y],...selected.path.map(p=>[p.x,p.y])],'#d5e8a6',2);for(const p of selected.path.filter((_,i)=>i%2===0))this.rect(p.x-2,p.y-2,4,4,'#e4ecc3');}}
   const o=b.objective;this.rect(o.x-3,o.y-24,3,29,'#d2c99b');this.rect(o.x,o.y-24,24,13,b.capture>0?'#76af75':'#c4a271');this.text(b.campaign?(b.campaign.type==='attack'?'城中旗帜':'守城阵地'):b.mission===0?'占住旗帜':b.mission===2?'村口阵地':'终点',o.x+8,o.y+30,'#f0e6b9',11);
   for(const u of [...b.units].sort((a,d)=>a.y-d.y)){if(u.hp<=0){this.rect(u.x-9,u.y-3,19,5,'#394b3980');continue;}if(u.kind==='fort'){this.rect(u.x-25,u.y-33,50,35,u.team==='red'?'#9d7e65':'#6e8060');for(let i=0;i<4;i++)this.rect(u.x-25+i*14,u.y-40,9,10,'#c8baa0');this.rect(u.x-5,u.y-22,13,22,'#394c3a');this.rect(u.x+2,u.y-29,32,5,'#303f31');}else if(u.kind==='truck'){this.rect(u.x-17,u.y-24,33,21,'#8fa475');this.rect(u.x-13,u.y-20,12,10,'#bfd4b5');this.rect(u.x-21,u.y-2,10,6,'#2b3b2d');this.rect(u.x+10,u.y-2,10,6,'#2b3b2d');}else{
     const kind=u.team==='red'?'red':u.kind==='medic'?'medic':'military';this.actor(u.x-10,u.y+5,kind,time,u.path.length>0,true);this.actor(u.x+12,u.y+10,kind,time,u.path.length>0,true);
     if(u.kind==='artillery'){this.rect(u.x-15,u.y-11,34,8,'#394c37');this.rect(u.x+7,u.y-17,24,5,'#a5ae78');this.rect(u.x-10,u.y-4,9,10,'#28372c');this.rect(u.x+11,u.y-4,9,10,'#28372c');}
    }
    this.rect(u.x-4,u.y+17,8,4,u.team==='blue'?'#76b8d0':'#d9826e');this.rect(u.x-21,u.y-48,42,5,'#263e2c');this.rect(u.x-20,u.y-47,40*u.hp/u.maxHp,3,u.team==='blue'?'#bddb8f':'#dc9780');if(u.id===b.selected){this.rect(u.x-25,u.y+15,50,2,'#ecf0ac');this.text('▼',u.x,u.y-58,'#f3ebb2',15);}this.text(u.kind==='fort'?'城防堡垒':u.kind==='truck'?'粮车':u.team==='red'?'敌军':u.name.replace('一连','').replace('二连',''),u.x,u.y+27,u.team==='blue'?'#f0edbc':'#efd0b0',10);
   }
   for(const s of b.shots){this.line([[s.x,s.y-18],[s.tx,s.ty-18]],s.team==='heal'?'#dbe8b4':s.team==='blue'?'#ede0a1':'#eeb097',s.artillery?4:2);this.rect(s.tx-4,s.ty-22,8,8,s.team==='heal'?'#c9dc9c':'#e5bf71');}
   this.rect(15,13,115,24,'#243b2ac7');this.text('我方 · 蓝色标记',73,29,'#e5ebba',11);this.rect(566,13,139,24,'#543d32c7');this.text('敌军 · 红色标记',635,29,'#f2ccab',11);
  }
 }
 root.FrontlineView=FrontlineView;
})(window);
