(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FrontMarkerLayout=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const overlaps=(a,b,pad=0)=>a.x<b.x+b.w+pad&&a.x+a.w+pad>b.x&&a.y<b.y+b.h+pad&&a.y+a.h+pad>b.y;
 const box=(x,y,size)=>({x:x-size/2,y:y-size/2,w:size,h:size});
 // One layout pass for ALL unit types. City targets and HUD areas are obstacles.
 function place(items,width,height,obstacles=[],selected=null,size=34){
  const used=obstacles.map(o=>({...o})),output=[],offsets=[[0,0]];
  for(const radius of [40,64,88,116,148])for(let n=0;n<16;n++){const a=-Math.PI/2+n*Math.PI/8;offsets.push([Math.cos(a)*radius,Math.sin(a)*radius]);}
  const sorted=[...items].sort((a,b)=>Number(b.id===selected)-Number(a.id===selected)||a.id-b.id);
  for(const item of sorted){let point=null;
   for(const [dx,dy] of offsets){const x=item.x+dx,y=item.y+dy,b=box(x,y,size);
    if(b.x<8||b.y<8||b.x+b.w>width-8||b.y+b.h>height-8||used.some(o=>overlaps(b,o,5)))continue;
    point={...item,x,y,anchorX:item.x,anchorY:item.y,hidden:false};used.push(b);break;
   }
   output.push(point||{...item,anchorX:item.x,anchorY:item.y,hidden:true});
  }
  return output;
 }
 function callout(marker,width,height,obstacles=[],markers=[],w=132,h=29){
  if(!marker||marker.hidden)return null;
  for(const [dx,dy] of [[24,-14],[-w-24,-14],[-w/2,-54],[-w/2,27]]){
   const b={x:marker.x+dx,y:marker.y+dy,w,h};
   if(b.x<8||b.y<8||b.x+w>width-8||b.y+h>height-8||obstacles.some(o=>overlaps(b,o,4))||markers.some(m=>!m.hidden&&overlaps(b,box(m.x,m.y,34),4)))continue;
   return b;
  }
  return null;
 }
 return {place,callout,overlaps};
});
