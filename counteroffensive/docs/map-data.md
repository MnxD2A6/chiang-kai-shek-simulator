# 地图数据来源

1.2 使用 Natural Earth 1:50m 数据生成随游戏发布的静态底图，不加载在线地图、不需要密钥。海岸线保持数据本身的概化精度；不是街道地图或卫星影像。城市点位为数据集中的城市代表点。

- [Natural Earth Countries](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/)
- [海岸与区域 GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson)
- [城市 GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_populated_places.geojson)
- [Public domain 使用条款](https://www.naturalearthdata.com/about/terms-of-use/)

获取日期：2026-10-13。原始文件 SHA-256：

```
ne_50m_admin_0_countries.geojson
3e458fc036ad0a66411f2c1e6cac49c5d7bfb81cb1123bc513b22511a2b7fdeb
ne_50m_populated_places.geojson
da4662b7bbfeb897d02f228c5839131dce27acff5717630f91ccff4f67828ee7
```

在上述文件所在目录运行 `python scripts/generate-geography.py <原始数据目录>` 生成 geography-data.js。使用太平洋中心 Mercator 投影，范围为 70°E 至 60°W、15°S 至 72°N；日期线两侧连续。全图保留 98 个相交区域、18 个精选城市及 225 个按缩放显示的城市地标。游戏战场另以 0.2° 投影单位栅格化，用真实海岸裁剪领土颜色，城市文字保持原坐标。

Mercator 投影在高纬度存在面积变形。国界、海岸和城市是地理参考；阵营分区、战争、外交效果、人口及兵力不代表现实情况。
