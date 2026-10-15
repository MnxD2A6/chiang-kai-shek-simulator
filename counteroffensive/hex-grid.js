(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('./geography.js'));else r.HexGrid=f(r.FrontGeography);})(typeof globalThis!=='undefined'?globalThis:this,function(G){
 'use strict';
 const R=.6,SQ=Math.sqrt(3),cache=new Map(),dirs=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
 const key=(q,r)=>q+','+r;
 function parse(k){if(typeof k!=='string'||!/^[-]?\d+,[-]?\d+$/.test(k))return null;const [q,r]=k.split(',').map(Number);return Number.isSafeInteger(q)&&Number.isSafeInteger(r)?{q,r}:null;}
 function point(k){const a=parse(k);return a?{x:R*SQ*(a.q+a.r/2),y:R*1.5*a.r}:null;}
 function atPoint(x,y){const q=(SQ*x/3-y/3)/R,r=y*2/3/R;let a=Math.round(q),b=Math.round(r),c=Math.round(-q-r);const da=Math.abs(a-q),db=Math.abs(b-r),dc=Math.abs(c+q+r);if(da>db&&da>dc)a=-b-c;else if(db>dc)b=-a-c;return key(a,b);}
 const at=(lon,lat)=>{const p=G.project(lon,lat);return atPoint(p.x,p.y);};
 const features=G.data.features.map(f=>({...f,rings:f.rings.map(ring=>ring.map(([lon,lat])=>G.project(lon,lat)))})).map(f=>({...f,x0:Math.min(...f.rings.flat().map(p=>p.x)),x1:Math.max(...f.rings.flat().map(p=>p.x)),y0:Math.min(...f.rings.flat().map(p=>p.y)),y1:Math.max(...f.rings.flat().map(p=>p.y))}));
 function inside(p,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
 const towns=G.data.cities.map(t=>({...t,key:at(t.lon,t.lat)})),cityCodes=new Map(towns.map(t=>[t.key,t.country]));
 function cell(k){if(cache.has(k))return cache.get(k);const p=point(k),a=parse(k);if(!p||p.x<0||p.x>G.worldWidth||p.y<0||p.y>G.worldHeight)return null;let country=cityCodes.get(k)||'SEA';if(country==='SEA')for(const f of features){if(p.x<f.x0||p.x>f.x1||p.y<f.y0||p.y>f.y1)continue;if(f.rings.some(r=>inside(p,r))){country=f.code;break;}}const ll=G.unproject(p.x,p.y),v={key:k,...a,...p,...ll,country,sea:country==='SEA'};cache.set(k,v);return v;}
 const neighbors=k=>{const a=parse(k);return a?dirs.map(([q,r])=>key(a.q+q,a.r+r)).filter(k=>cell(k)):[];};
 const distance=(a,b)=>{const p=parse(a),q=parse(b);return p&&q?Math.max(Math.abs(p.q-q.q),Math.abs(p.r-q.r),Math.abs(p.q+p.r-q.q-q.r)):Infinity;};
 function route(from,to,allowed){if(!cell(from)||!cell(to)||!allowed(cell(to)))return null;if(from===to)return [];const open=[from],prev=new Map([[from,null]]),cost=new Map([[from,0]]);let count=0;while(open.length&&count++<10000){let best=0;for(let i=1;i<open.length;i++)if(cost.get(open[i])+distance(open[i],to)<cost.get(open[best])+distance(open[best],to))best=i;const k=open.splice(best,1)[0];if(k===to){const out=[];for(let n=to;n!==from;n=prev.get(n))out.push(n);return out.reverse();}for(const n of neighbors(k)){if(!allowed(cell(n)))continue;const c=cost.get(k)+1;if(c<(cost.get(n)??Infinity)){cost.set(n,c);prev.set(n,k);if(!open.includes(n))open.push(n);}}}return null;}
 function nearestSea(k){if(cell(k)?.sea)return k;let edge=[k],seen=new Set(edge);for(let i=0;i<8;i++){const next=[];for(const a of edge)for(const n of neighbors(a))if(!seen.has(n)){if(cell(n).sea)return n;seen.add(n);next.push(n);}edge=next;}return null;}
 function disk(k,radius){const a=parse(k),out=[];if(!a)return out;for(let q=-radius;q<=radius;q++)for(let r=Math.max(-radius,-q-radius);r<=Math.min(radius,-q+radius);r++){const n=key(a.q+q,a.r+r);if(cell(n))out.push(n);}return out;}
 return {R,SQ,G,towns,features,key,parse,point,atPoint,at,cell,neighbors,distance,route,nearestSea,disk};
});
