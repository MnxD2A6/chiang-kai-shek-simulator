# 1.5 战术指挥界面

本次按用户选定的方向重做：以《碧蓝航线》的海域地图气氛和《少女前线 2》的战术信息布局为方向。界面代码、图标组合与角色为本项目制作，没有提取或使用这些游戏的角色、截图、Logo 或界面素材。

## 地图与信息层级

- 大地图保持 Natural Earth 真实地理、城市坐标及太平洋两岸；深蓝海域、细海岸线和低饱和阵营色减少视觉干扰。
- 目标在左上，选中单位与通讯员在左下，四个常用命令在右下。发展、合作和部队列表按需展开。
- 部队与舰船统一使用 34px 图标，列表保存完整名称和状态。只有选中或悬停单位展示一个名称标牌。
- `marker-layout.js` 将所有军队与舰船一起布局，避开城市点击区域和操作面板。移位图标通过细线指向真实位置。
- 空间极端不足时图标收起，单位仍可从部队列表选择；选中单位优先放置。布局不改变单位坐标或路径。
- 点单位，再点城市或海域，即可下令；「移动 / 进攻」是提示入口，无需先按该按钮。舰船运输与附近交战继续自动执行。
- 手机使用一排四个命令，列表默认收起；保留资金、暂停、选择与命令反馈。

## 原创立绘

- 文件：`assets/operator-mio-v2.png`，1024×1536，RGBA 透明背景。
- 工具：内置 `image_gen.imagegen`，`transparent_background: true`。
- 角色：成年海军通讯员澪 / MIO。旧版 SVG 立绘仍保留。
- 立绘是栅格图，游戏 UI 的文字和按钮仍为可交互 HTML。
- 游戏运行不调用生成服务，没有 API key 或外部字体依赖。

使用的完整提示词：

```text
Create one production-quality ORIGINAL anime game character standing illustration for a tactical naval strategy game's selected-unit HUD. Adult female naval communications officer MIO, age 25, beautiful confident calm face, elegant proportions, refined silver-blue shoulder-length layered hair with delicate flowing strands and side-swept bangs, luminous blue eyes with meticulously drawn lashes, subtle warm blush. Tailored dark navy officer jacket with crisp ivory lapels, restrained brass piping and small original geometric insignia, charcoal fitted undershirt, teal silk neck scarf, communications earpiece with very fine microphone, black gloves, one hand naturally resting on a slim tactical tablet held close to waist. Three-quarter pose, looking toward viewer, slight warm competent smile. Contemporary high-end anime game character art, exquisite hand-drawn thin linework, nuanced cel shading with soft painterly gradients, polished eyes/hair/fabric details, natural folds, delicate rim light, sophisticated coherent navy/ivory/teal palette. Waist-up bust with complete shoulders, head and hair fully inside the canvas, tall portrait composition with generous clean margin, character isolated on GENUINELY TRANSPARENT background. Not chibi, not vector art, not flat geometric shapes, no text, no watermark, no frame, no UI, no scene, no weapons, no sexualized clothing. This is a wholly original character, do not copy an existing franchise character.
```

## 技术范围

继续使用原有原生 JavaScript、Canvas 与 CSS，不增加框架或运行依赖。1.5 的运行样式使用 `tactical.css`；旧样式和旧地图入口保留。规则与 v5 存档格式保持兼容。
