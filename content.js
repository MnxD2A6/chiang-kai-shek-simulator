(function(root,factory){const value=factory();if(typeof module==='object'&&module.exports)module.exports=value;else root.GameContent=value;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const cities=[
    {id:'xian',name:'西安',x:345,y:205,defense:46,stability:64,income:3,kind:'西北门户'},
    {id:'chengdu',name:'成都',x:250,y:345,defense:48,stability:76,income:4,kind:'后方粮仓'},
    {id:'chongqing',name:'重庆',x:363,y:366,defense:54,stability:74,income:4,kind:'山城枢纽'},
    {id:'wuhan',name:'武汉',x:545,y:316,defense:44,stability:65,income:5,kind:'江汉枢纽'},
    {id:'nanjing',name:'南京',x:672,y:251,defense:50,stability:68,income:6,kind:'行政中心'},
    {id:'shanghai',name:'上海',x:772,y:289,defense:34,stability:62,income:7,kind:'沿海工业'},
    {id:'changsha',name:'长沙',x:544,y:418,defense:48,stability:68,income:4,kind:'南方屏障'},
    {id:'guilin',name:'桂林',x:444,y:516,defense:42,stability:72,income:3,kind:'南方交通'},
    {id:'kunming',name:'昆明',x:238,y:506,defense:46,stability:74,income:4,kind:'援助通道'}
  ];
  const choice=(label,detail,effects,drama=false)=>({label,detail,effects,drama});
  const events=[
    {date:'1936.12',era:'危局与谈判',title:'西安的电报',history:'1936 年西安事变成为国共关系转变的重要节点。',text:'一封急电改变了所有人的日程。参谋在桌前等你：先争取谈判空间，还是继续整顿指挥链？',choices:[choice('争取谈判','先让分歧回到谈判桌上。',{morale:8,diplomacy:8,army:-4}),choice('整顿指挥链','投入资源，让各部协同。',{treasury:-10,army:12,morale:-3}),choice('暂缓争议，优先筹粮','留足后勤，为下一轮做准备。',{supplies:14,diplomacy:-5}),choice('让所有人先吃一碗面','架空：会议改成饭局，议程暂时消失。',{treasury:-4,morale:5,supplies:5},true)]},
    {date:'1937.07',era:'全面战争',title:'战云逼近',history:'1937 年七七事变后，中日战争全面扩大。',text:'沿海的电报越来越急。纸上的箭头还很细，粮车与工厂的去留却已迫在眉睫。',choices:[choice('组织民众互助','维持社会支持，避免无序恐慌。',{morale:10,army:3}),choice('优先整备部队','消耗国库，提升整体军备。',{treasury:-12,army:16}),choice('优先转移物资','把后勤储备留在手中。',{supplies:18,morale:-4}),choice('禁止参谋再画第八根箭头','架空：地图终于看得清，军备略有改善。',{army:6,diplomacy:-3},true)]},
    {date:'1937.11',era:'全面战争',title:'守住，还是保存？',history:'1937 年日军沿海推进，上海与南京接连面临严峻战局。',text:'上海防线承压。坚持固守可鼓舞人心，但转移设备能让后方继续生产。你必须取舍。',choices:[choice('优先疏散与保存工业','给后方建设留下余地。',{industry:2,morale:6,army:-6}),choice('集中力量加强防御','增加守备，消耗战略储备。',{supplies:-14,army:12,defenseAll:5}),choice('争取国际关注','外交突破不会立即改变前线。',{diplomacy:15,army:-5}),choice('把作战桌搬到走廊','架空：空间变大，命令却多走了十米。',{morale:5,army:-3},true)]},
    {date:'1938.10',era:'持久与后方',title:'山城里的灯',history:'武汉在 1938 年陷落，重庆在战争期间成为重要政治与军事中心。',text:'后方城市的办公室彻夜亮灯。将有限资源放在道路、工厂还是城市生活上？',choices:[choice('恢复道路与运输','保持物资流动。',{supplies:16,morale:2}),choice('扩建后方工厂','用今天的国库换取未来产出。',{treasury:-15,industry:3}),choice('建设防御设施','所有仍控制的城市增加守备。',{treasury:-12,defenseAll:10}),choice('给所有电报加上“速办”','架空：每封都速办，反而谁也不急。',{diplomacy:-3,morale:4,treasury:5},true)]},
    {date:'1939.09',era:'持久与后方',title:'漫长的相持',history:'本节点以抗战相持阶段为背景，具体事件为游戏创作。',text:'消耗正在成为比地图更难的敌人。财政官带来账本，第一页就写着：不能只靠借钱。',choices:[choice('节约行政开支','缓解国库压力，但军备进度放慢。',{treasury:18,army:-5,inflation:-3}),choice('增加民生投入','先稳住人心和后方。',{treasury:-12,morale:15,stabilityAll:6}),choice('发行战时公债','今天获得现金，明天承担通胀。',{treasury:30,inflation:14}),choice('没收办公室的第九套茶具','架空：官员很不高兴，账本终于少一项。',{treasury:10,morale:3},true)]},
    {date:'1941.12',era:'国际援助',title:'远方的盟友',history:'1941 年 12 月美国参战，中美形成战时军事同盟。',text:'新的国际局势带来合作机会。援助要经过运输，也要经过谈判；名义上的资源还不在仓库里。',choices:[choice('争取后勤援助','外交越稳，后续结算获得的援助越多。',{diplomacy:15,supplies:10}),choice('争取军备与训练','把窗口期用在部队能力上。',{army:17,diplomacy:4}),choice('保持自主筹措','不等待援助，先稳定财粮。',{treasury:12,supplies:8,diplomacy:-6}),choice('把英文电报交给最会唱歌的人','架空：语调很好，内容需要重译。',{morale:6,diplomacy:-5},true)]},
    {date:'1942.07',era:'国际援助',title:'最后一辆粮车',history:'此节点为架空后勤危机，表现战争中的运输和补给压力。',text:'运输官要求你决定有限粮秣的分配。仓库数字不是全部：每一次拖延都在消耗城市的信任。',choices:[choice('公开账本，组织互助','提升民心，但暂缓军队补给。',{morale:10,army:-4}),choice('采购与修复运输','花钱补足缺口。',{treasury:-14,supplies:22}),choice('压缩行政配给','减少非必要消耗。',{supplies:13,morale:3}),choice('要求官员自己扛文件箱','架空：运输车终于腾出一格。',{supplies:7,army:2},true)]},
    {date:'1943.11',era:'国际援助',title:'桌子的另一端',history:'1943 年开罗会议讨论了对日战争与战后安排。',text:'外交官准备新的谈判材料。盟友希望知道：你的承诺能够落实到多少粮车、多少道路、多少城市？',choices:[choice('务实协调援助','用可执行的计划建立信任。',{diplomacy:16,supplies:8}),choice('优先争取经济支持','降低通胀，补充国库。',{treasury:20,inflation:-6,diplomacy:3}),choice('强调军事协作','协调训练与运输。',{army:14,supplies:8}),choice('把会场座椅排得更整齐','架空：礼仪满分，援助不加分。',{morale:5,diplomacy:2},true)]},
    {date:'1945.08',era:'战后抉择',title:'战争之后',history:'1945 年日本宣布投降，中国进入战后重建与政治协商的关键时期。',text:'前线的枪声暂歇，新的账单却到了。复员、重建和协商都需要钱，也需要相信明天的人。',choices:[choice('优先复员与重建','减少民生压力，投入生产。',{morale:14,industry:2,army:-8,peace:1}),choice('推进政治协商','争取长期稳定，降低后续冲突压力。',{diplomacy:10,morale:6,peace:2}),choice('继续维持军事整备','投入资源准备不确定的未来。',{treasury:-16,army:20,morale:-6}),choice('给所有办公室放半天假','架空：第一次没有人递交加急电报。',{morale:8,treasury:-5},true)]},
    {date:'1946.06',era:'战后抉择',title:'未完成的协议',history:'战后国共谈判未能避免内战，冲突在 1946 年扩大。',text:'协议纸上留下许多空白。你可以继续缩小分歧，也可以以军事力量争取主动。',choices:[choice('继续协商并保障民生','积累协商进度，降低冲突压力。',{peace:2,morale:7,army:-4}),choice('集中部署','部队更强，财政和民心更紧张。',{treasury:-12,army:20,morale:-6}),choice('先处理地方治理','改善城市稳定与币值。',{stabilityAll:9,inflation:-7,morale:4}),choice('要求争论双方用铅笔签字','架空：协议擦得掉，分歧擦不掉。',{diplomacy:3,morale:3},true)]},
    {date:'1948.08',era:'终局前夜',title:'币值的裂缝',history:'战后通货膨胀与治理问题削弱了国民政府的支持。',text:'钱印得比物资来得快。财政官停在门边，等待一个没有轻松答案的决定。',choices:[choice('削减开支，整顿财政','币值稍稳，军备暂缓。',{inflation:-18,army:-8,treasury:8}),choice('发行更多货币','短期现金增加，社会承担通胀。',{treasury:40,inflation:24,morale:-8}),choice('反腐与救济并行','改善信任，花费国库。',{treasury:-14,morale:16,inflation:-10}),choice('给印钞机发一张休假条','架空：纸张省下来了，问题还在。',{inflation:-8,morale:4},true)]},
    {date:'1949.01',era:'终局前夜',title:'另一条时间线',history:'1949 年内战结局改变了中国的政治格局。游戏结局取决于玩家，均为架空。',text:'最后一份决策放在桌上。地图、账本和人心留下了你所有选择的痕迹。怎样给这段时间线收尾？',choices:[choice('把民生放在最后一道命令里','保护秩序，让城市继续运转。',{morale:12,stabilityAll:8,peace:1}),choice('做最后一次军事整备','尝试稳住仍控制的城市。',{supplies:-12,army:16,defenseAll:6}),choice('推动重建与协商','争取一个冲突更少的结局。',{diplomacy:10,peace:2,morale:5}),choice('宣布今天不再收加急电报','架空：窗外的风终于盖过了打字机。',{morale:7,inflation:-4},true)]}
  ];
  const actions={
    reinforce:{name:'整备守军',icon:'⚑',detail:'军备 +7 · 本城守备 +16',cost:{treasury:12,supplies:8},effect:{army:7},city:true},
    fortify:{name:'修筑工事',icon:'▥',detail:'本城守备 +22',cost:{treasury:10},effect:{},city:true},
    relief:{name:'民生救济',icon:'♡',detail:'民心 +9 · 本城民生 +12',cost:{treasury:8,supplies:4},effect:{morale:9},city:true},
    industry:{name:'发展工业',icon:'⚒',detail:'工业 +2 · 每轮国库收入 +4',cost:{treasury:16},effect:{industry:2},city:true},
    farm:{name:'筹措粮秣',icon:'♧',detail:'粮秣 +20 · 民心 −2',cost:{treasury:7},effect:{supplies:20,morale:-2},city:true},
    reform:{name:'财政整顿',icon:'◎',detail:'通胀 −12 · 民心 +4',cost:{treasury:8},effect:{inflation:-12,morale:4},city:false},
    diplomacy:{name:'外交斡旋',icon:'↗',detail:'外交 +14 · 外交 50 起有定期援助',cost:{treasury:10},effect:{diplomacy:14},city:false},
    bonds:{name:'发行公债',icon:'¤',detail:'国库 +26 · 通胀 +10 · 民心 −3',cost:{},effect:{treasury:26,inflation:10,morale:-3},city:false},
    recover:{name:'组织反攻',icon:'⚔',detail:'成功率看军备与守备；失败损失军备',cost:{treasury:16,supplies:12},effect:{},city:true,enemy:true},
    relocate:{name:'迁移指挥部',icon:'⌂',detail:'把指挥部迁至本城 · 民心 −2',cost:{treasury:8},effect:{morale:-2},city:true},
    callMilitary:{name:'电话协调训练',icon:'☎',detail:'军备 +10',cost:{treasury:6},effect:{army:10},city:false,phone:true},
    callDiplomacy:{name:'电话联络援助',icon:'☎',detail:'外交 +10',cost:{treasury:5},effect:{diplomacy:10},city:false,phone:true},
    callFinance:{name:'电话筹措公债',icon:'☎',detail:'国库 +20 · 通胀 +6',cost:{},effect:{treasury:20,inflation:6},city:false,phone:true},
    callLogistics:{name:'电话调运粮车',icon:'☎',detail:'粮秣 +16',cost:{treasury:5},effect:{supplies:16},city:false,phone:true},
    callSwitchboard:{name:'电话慰问总机',icon:'☎',detail:'民心 +6 · 戏剧模式专属',cost:{treasury:2},effect:{morale:6},city:false,phone:true,drama:true},
    policyBalanced:{name:'均衡方针',icon:'◈',detail:'恢复均衡：无额外加成或支出',cost:{treasury:8},effect:{},policy:'balanced'},
    policyDefense:{name:'守势方针',icon:'▥',detail:'持续战力 +8 · 每轮国库 −8',cost:{treasury:8},effect:{},policy:'defense'},
    policyMobilize:{name:'全面动员',icon:'⚑',detail:'每轮军备 +5 · 粮秣 −4 · 民心 −4',cost:{treasury:8},effect:{},policy:'mobilize'},
    policyWelfare:{name:'民生优先',icon:'♡',detail:'每轮民心 +4 · 粮秣 +3 · 国库 −10',cost:{treasury:8},effect:{},policy:'welfare'}
  };
  const missions=[
    {title:'后方要有自己的工厂',text:'选择重庆，建设两次工业。把总工业提升到 5，下一轮的财政和粮秣都会更从容。',metric:'industry',target:5},
    {title:'给上海一条更稳的防线',text:'把上海守备提高至 56，并在本轮守住这座城市。',metric:'defense',city:'shanghai',target:56},
    {title:'把储备留在手中',text:'结束回合前，粮秣至少保持 55。筹粮或致电运输办公室都能帮助你。',metric:'supplies',target:55},
    {title:'让后方继续生产',text:'将总工业提升到 8。每座城市最多建设三次，选择稳固的后方城市。',metric:'industry',target:8},
    {title:'别让币值吃掉信任',text:'把通胀降到 30 以下。财政整顿比一味发行公债更稳妥。',metric:'inflation',target:30,below:true},
    {title:'援助要靠协调',text:'把外交提升至 55，让援助能够持续到达。',metric:'diplomacy',target:55},
    {title:'让粮车按时到库',text:'在结算前保持至少 45 粮秣。',metric:'supplies',target:45},
    {title:'训练和装备都要落实',text:'将军备提升到 70。军事顾问可以协调训练。',metric:'army',target:70},
    {title:'战争之后，要有新的办法',text:'积累至少 2 点协商进度。它会降低战后冲突压力。',metric:'peace',target:2},
    {title:'让未完成的协议往前走',text:'将协商进度推进至 4。',metric:'peace',target:4},
    {title:'给印钞机踩刹车',text:'把通胀控制在 30 以下。',metric:'inflation',target:30,below:true},
    {title:'给最后一道命令留住人心',text:'保持至少 70 民心，完成这条时间线。',metric:'morale',target:70}
  ];
  return {cities,events,actions,missions,resources:{treasury:'国库',supplies:'粮秣',army:'军备',morale:'民心',diplomacy:'外交',inflation:'通胀',industry:'工业',peace:'协商',defenseAll:'各城守备',stabilityAll:'各城民生'}};
});
