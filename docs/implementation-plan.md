# 蒋介石模拟器实施计划

**Goal:** 交付三种玩法结合的可玩网页游戏及 GitHub Pages 发布包。
**Architecture:** 纯状态机 + 数据内容 + SVG 地图 + Canvas 像素房间 + DOM 操作。
**Tech Stack:** HTML/CSS/JavaScript，Node 内置测试、HTTP 与文件模块。
**Spec:** docs/design.md

全局约束：零付费生成；无运行时依赖；支持双击运行和仓库子路径；中文；全部创作数据标为架空；仅本地交付。

Review Focus：坏存档、耗尽行动、双击事件、键盘在弹窗中移动、移动端地图和触屏输入。

## Task 1 状态机
- [x] 建立 tests/engine.test.cjs，检查输入拒绝、不可透支、单次事件、终局、可重复战斗、存档 schema；运行观察缺少模块导致失败。
- [x] content.js 提供 12 事件、9 城市和行动描述；engine.js 提供 newGame(seed, drama)、act(state,id,city)、choose(state,index)、endTurn(state)、forecast(state)、encode/decode、ending。
- [x] 运行 node --test，校准多种策略能通关，失败策略能提前结束。

## Task 2 可玩界面
- [x] index.html/styles.css 创建作战室、地图、战报、资源、命令、教程、结局。
- [x] room.js 实现人物移动/碰撞/键盘与触屏；app.js 接入状态机、存档、音效、事件、重开。
- [x] 用户追加电话：接听事件、主动联络五条线路、一次请求耗一个行动、架空对白与程序铃声。
- [x] 浏览器验证上述交互与响应式布局；修复发现的错误。

## Task 3 发布交付
- [x] package.json/scripts 提供 npm start/test/build；GitHub Pages workflow 测试后发布 dist。
- [x] README、LICENSE、历史背景说明、验收证据；构建与子路径预览；打包 source ZIP。

执行：本会话直接实现。独立子目录无需移动或复制原工作区；公开发布未授权。
