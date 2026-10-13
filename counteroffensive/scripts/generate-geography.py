"""Generate offline geography from Natural Earth 1:50m GeoJSON (public domain).
Usage: python scripts/generate-geography.py /path/to/raw-data-directory
"""
import hashlib, json, math, sys
from pathlib import Path

raw = Path(sys.argv[1])
root = Path(__file__).resolve().parents[1]
merc = lambda lat: math.degrees(math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))
WEST, EAST, NORTH, SOUTH = 70, 300, 72, -15
GX, GY, CELL, W, H = 72, merc(56), .2, 320, 272

def clip(poly, axis, boundary, greater):
    result = []
    for a, b in zip(poly, poly[1:] + poly[:1]):
        ina, inb = (a[axis] >= boundary) if greater else (a[axis] <= boundary), (b[axis] >= boundary) if greater else (b[axis] <= boundary)
        if ina: result.append(a)
        if ina != inb:
            t = (boundary - a[axis]) / (b[axis] - a[axis])
            result.append([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
    return result

countries = json.loads((raw/'ne_50m_admin_0_countries.geojson').read_text(encoding='utf-8'))
features, owners = [], [-1] * (W * H)
for f in countries['features']:
    code = f['properties']['ADM0_A3']
    polys = f['geometry']['coordinates'] if f['geometry']['type'] == 'MultiPolygon' else [f['geometry']['coordinates']]
    rings = []
    for poly in polys:
        outer = []
        for lon, lat, *_ in poly[0]:
            if outer:
                while lon - outer[-1][0] > 180: lon -= 360
                while lon - outer[-1][0] < -180: lon += 360
            outer.append([lon, lat])
        for shift in [-360, 0, 360]:
            ring = [[x + shift, y] for x, y in outer]
            for axis, boundary, greater in [(0,WEST,True),(0,EAST,False),(1,SOUTH,True),(1,NORTH,False)]:
                if ring: ring = clip(ring, axis, boundary, greater)
            if len(ring) < 3: continue
            ring = [[round(x,4),round(y,4)] for x,y in ring]
            rings.append(ring)
            if any(GX <= x <= GX+W*CELL and 14 <= y <= 56 for x,y in ring) or code in ['CHN','TWN']:
                points = [[(x-GX)/CELL,(GY-merc(y))/CELL] for x,y in ring]
                # Scanline fill keeps compilation dependency-free and deterministic.
                for y in range(max(0,int(min(p[1] for p in points))),min(H,math.ceil(max(p[1] for p in points)))):
                    line=y+.5
                    xs=sorted(a[0]+(line-a[1])*(b[0]-a[0])/(b[1]-a[1]) for a,b in zip(points,points[1:]+points[:1]) if (a[1]>line)!=(b[1]>line))
                    for left,right in zip(xs[::2],xs[1::2]):
                        for x in range(max(0,math.ceil(left-.5)),min(W,math.ceil(right-.5))):
                            if code in ['CHN','TWN'] or owners[y*W+x]<0: owners[y*W+x]=1 if code=='TWN' else 0 if code=='CHN' else 9
    if rings: features.append({'code':code,'rings':rings})

city_names={'Fuzhou':('fuzhou','福州',True),'Nanjing':('nanjing','南京',True),'Guangzhou':('guangzhou','广州',True),'Shanghai':('shanghai','上海',False),'Wuhan':('wuhan','武汉',False),'Taipei':('taipei','台北',False),'Kaohsiung':('kaohsiung','高雄',False),'Beijing':('beijing','北京',False),'Tokyo':('tokyo','东京',False),'Osaka':('osaka','大阪',False),'Seoul':('seoul','首尔',False),'Manila':('manila','马尼拉',False),'Washington, D.C.':('washington','华盛顿',False),'Los Angeles':('losangeles','洛杉矶',False),'San Francisco':('sanfrancisco','旧金山',False),'Seattle':('seattle','西雅图',False),'Honolulu':('honolulu','檀香山',False),'Naha':('naha','那霸',False)}
cities=[]
places=[]
for f in json.loads((raw/'ne_50m_populated_places.geojson').read_text(encoding='utf-8'))['features']:
    p=f['properties']; name=p['NAMEASCII']; lon,lat=f['geometry']['coordinates'][:2]
    if p['ADM0_A3'] in ['CHN','TWN','JPN','KOR','USA','PHL'] and name not in city_names:
        places.append({'id':'place-'+str(p.get('GEONAMEID',len(places))),'name':p.get('NAME_ZH') or name,'lon':lon,'lat':lat,'population':p['POP_MAX']})
    if name not in city_names or (name=='Los Angeles' and p['ADM0_A3']!='USA'): continue
    key,label,goal=city_names[name]
    cities.append({'id':key,'name':label,'lon':lon,'lat':lat,'goal':goal,'country':p['ADM0_A3']})
runs=[]
for v in owners:
    if runs and runs[-1][0]==v: runs[-1][1]+=1
    else: runs.append([v,1])
data={'bounds':[WEST,EAST,NORTH,SOUTH],'grid':{'west':GX,'northMerc':GY,'cell':CELL,'width':W,'height':H},'features':features,'cities':cities,'places':places,'runs':runs}
text=json.dumps(data,ensure_ascii=False,separators=(',',':'))
(root/'geography-data.js').write_text('(function(r,d){if(typeof module==="object"&&module.exports)module.exports=d;else r.FrontGeographyData=d;})(typeof globalThis!=="undefined"?globalThis:this,'+text+');\n',encoding='utf-8')
print('features',len(features),'cities',len(cities),'additional places',len(places),'mainland tiles',owners.count(0),'Taiwan tiles',owners.count(1),'bytes',len(text.encode()))
for p in raw.glob('*.geojson'): print(p.name,hashlib.sha256(p.read_bytes()).hexdigest())
