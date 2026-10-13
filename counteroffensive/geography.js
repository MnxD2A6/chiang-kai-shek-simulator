(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('./geography-data.js'));else r.FrontGeography=f(r.FrontGeographyData);})(typeof globalThis!=='undefined'?globalThis:this,function(data){
 'use strict';
 const merc=lat=>180/Math.PI*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
 const unmerc=y=>Math.atan(Math.sinh(y*Math.PI/180))*180/Math.PI;
 const grid=data.grid,W=grid.width,H=grid.height,N=W*H,top=merc(data.bounds[2]);
 const project=(lon,lat)=>({x:(lon<70?lon+360:lon)-70,y:top-merc(lat)});
 const unproject=(x,y)=>({lon:((x+70+180)%360)-180,lat:unmerc(top-y)});
 const toGrid=(lon,lat)=>({x:(lon-grid.west)/grid.cell,y:(grid.northMerc-merc(lat))/grid.cell});
 const fromGrid=(x,y)=>project(grid.west+x*grid.cell,unmerc(grid.northMerc-y*grid.cell));
 const base=new Int8Array(N);let cursor=0;for(const [value,count] of data.runs){base.fill(value,cursor,cursor+count);cursor+=count;}
 if(cursor!==N)throw Error('Invalid geographic grid');
 const land=[];for(let i=0;i<N;i++)if(base[i]>=0)land.push(i);
 const mainland=i=>base[i]===0;
 function nearestLand(x,y,owner){let best=-1,d=Infinity;for(const i of land){if(owner!==undefined&&base[i]!==owner)continue;const n=(i%W+.5-x)**2+(Math.floor(i/W)+.5-y)**2;if(n<d){d=n;best=i;}}return best;}
 const towns=data.cities.filter(c=>['fuzhou','nanjing','guangzhou','shanghai','wuhan','taipei','kaohsiung','beijing'].includes(c.id)).map(c=>{const p=toGrid(c.lon,c.lat);return {...c,...p,tile:nearestLand(p.x,p.y,c.country==='TWN'?1:0)};});
 function terrain(){const t=new Uint8Array(N);for(const i of land)t[i]=1;return t;}
 const sector=i=>{const lat=unmerc(grid.northMerc-(Math.floor(i/W)+.5)*grid.cell);return lat>31.5?2:lat>25?3:4;};
 return {data,merc,unmerc,project,unproject,toGrid,fromGrid,base,land,mainland,nearestLand,towns,terrain,sector,W,H,N,worldWidth:230,worldHeight:top-merc(-15)};
});
