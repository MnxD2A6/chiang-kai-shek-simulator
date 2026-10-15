(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FrontWorldEvents=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const c=(id,label,cost,summary,effects={},next=[])=>({id,label,cost,summary,effects,next});
 const next=(id,delay=28)=>({id,delay});
 return {
  korea_rps:{starter:true,chapter:'半岛猜拳危机',country:'朝鲜 / 韩国',tag:'荒诞突发',title:'将军猜拳输了，半岛进入战备',body:'一场原定增进友谊的石头剪刀布直播，以金正恩连续出布三次告终。朝方宣布“对手使用了战略性剪刀”，开始集结部队。韩国来电请求各方表态。',choices:[
   c('mediate','派观察团调停',60,'韩国态度 +15、国际观感 +8；等待会谈结果。',{relations:{korea:15,usa:5},opinion:8},[next('korea_summit',24)]),
   c('support','公开支持韩国',30,'美韩态度改善、半岛紧张上升；朝方会回应。',{relations:{usa:12,korea:18,northkorea:-20},tension:12},[next('korea_war',24)]),
   c('watch','保持中立，继续观察',0,'保留资金；半岛双方会自行行动。',{},[next('korea_war',20)])]},
  korea_summit:{chapter:'半岛猜拳危机',country:'半岛会谈',tag:'后续',title:'会谈卡在“剪刀到底算不算武器”',body:'观察团找到降温机会，双方同意换成掷硬币，但谁来提供硬币又成了争议。韩国愿意重开技术合作，前提是你支持一个体面的退场安排。',choices:[
   c('host','资助中立停战会谈',70,'半岛降温，恢复被牵走的援助；获得外交口碑。',{flags:{koreaWar:false},relations:{usa:10,korea:15},opinion:12,tension:-15},[next('korea_peace',32)]),
   c('wait','让双方自己谈',0,'避免额外支出；会谈仍有破裂风险。',{opinion:2},[next('korea_war',28)])]},
  korea_war:{chapter:'半岛猜拳危机',country:'朝鲜 / 韩国',tag:'局势升级',title:'半岛交火，美日韩重新分配援助',body:'猜拳争端已经变成真实交火。美国将一部分支援转向韩国，朝鲜也把尚未出发的大陆增援留在半岛。你的合作合同仍在，但部分收益暂时中断。',choices:[
   c('relief','提供人道援助',65,'国际观感 +12、韩美关系改善；随后有停战机会。',{flags:{koreaWar:true},relations:{korea:12,usa:8},opinion:12},[next('korea_refugees',30)]),
   c('neutral','保持中立，调整自己的计划',0,'美韩合作暂时受限；朝鲜未抵达的大陆援军被取消。',{flags:{koreaWar:true},tension:15},[next('korea_refugees',35)]),
   c('mediate','呼吁双方停火',25,'国际观感 +6；尝试重启会谈。',{flags:{koreaWar:true},opinion:6},[next('korea_summit',32)])]},
  korea_refugees:{chapter:'半岛猜拳危机',country:'人道协调',tag:'后续',title:'停战热线接通，首先讨论的是晚饭',body:'双方后勤都要求停止把食堂预算用于猜拳研究。国际协调组提出一份临时停火方案，也请求你承担一小笔救济费用。',choices:[
   c('help','支援救济并支持停火',60,'结束半岛支援转移，美韩关系与观感改善。',{flags:{koreaWar:false},relations:{usa:12,korea:15},opinion:10,tension:-12},[next('korea_peace',26)]),
   c('statement','支持停火，不追加预算',0,'双方逐步降温；韩国对你的支持仍有保留。',{flags:{koreaWar:false},relations:{korea:-5},tension:-8},[next('korea_peace',35)])]},
  korea_peace:{chapter:'半岛猜拳危机',country:'朝鲜 / 韩国',tag:'阶段结局',title:'停战协议附录：领导人禁止直播猜拳',body:'半岛暂时恢复平静，先前转移的合作支援可以恢复。协议的最后一页写着：今后体育争端不得由总参谋部判罚。各国开始重新审视你在危机中的表现。',choices:[
   c('cooperate','推动后续民间交流',40,'韩国态度 +12、国际观感 +7。',{relations:{korea:12},opinion:7,flags:{koreaWar:false}}),
   c('return','把精力转回本岛',0,'半岛危机结束，援助恢复正常条件。',{flags:{koreaWar:false},tension:-5})]},
  hitler_return:{starter:true,chapter:'欧洲复活风波',country:'德国 / 欧洲',tag:'荒诞突发',title:'柏林出现自称“复活的希特勒”的人',body:'一段诡异影像传遍全球。德国政府紧急封锁现场，反法西斯团体要求查清身份并阻止极端主义动员。欧洲盟友正在组织联合回应。',choices:[
   c('condemn','支持反法西斯联合声明',35,'国际观感 +10、美日态度改善；欧洲进入应急状态。',{opinion:10,relations:{usa:8,japan:5},flags:{europeCrisis:true}},[next('europe_identity',30)]),
   c('investigate','支持独立身份调查',65,'观感 +6；调查结果会影响欧洲局势。',{opinion:6,flags:{europeCrisis:true}},[next('europe_identity',24)]),
   c('reserve','先核实消息，暂不表态',0,'保留预算；国际观感略降。',{opinion:-5,flags:{europeCrisis:true}},[next('europe_identity',32)])]},
  europe_identity:{chapter:'欧洲复活风波',country:'欧洲联合调查',tag:'后续',title:'架空档案确认：他真的复活了，但忘了密码',body:'调查组确认这不是演员。他试图登录一个已经不存在的宣传账号，被德国警方带走。极端主义追随者仍在组织骚乱，欧洲要求各方支持维护民主秩序。',choices:[
   c('support','支持欧洲维护民主秩序',50,'观感 +12、美国态度 +10；后续进行审判。',{opinion:12,relations:{usa:10}},[next('europe_trial',35)]),
   c('aid','提供民用应急援助',80,'观感 +15；贸易扰动稍后缓解。',{opinion:15,money:25},[next('europe_trial',28)]),
   c('local','优先保障本岛，发布简短声明',0,'观感 -4；欧洲仍会自行处理骚乱。',{opinion:-4},[next('europe_trial',40)])]},
  europe_trial:{chapter:'欧洲复活风波',country:'欧洲法庭',tag:'阶段结局',title:'复活者被送上法庭，复活不构成免责',body:'欧洲秩序逐步恢复。法庭宣布，历史罪行不会因为死亡后重新出现而被一笔勾销。应急贸易限制开始解除，国际社会记下了各方在危机中的立场。',choices:[
   c('statement','支持审判与历史教育',25,'国际观感 +8，欧洲危机结束。',{opinion:8,flags:{europeCrisis:false}}),
   c('restore','恢复日常经贸联系',0,'欧洲危机结束，贸易环境恢复。',{flags:{europeCrisis:false},money:40})]},
  russia_robot:{starter:true,chapter:'远东钢铁来客',country:'俄罗斯',tag:'荒诞突发',title:'俄罗斯一辆坦克站了起来，要求加入工会',body:'远东试验场的一辆装甲车突然变形成双足机器人，自称不再接受“停车位待遇”。俄罗斯宣布这是新装备演示，大陆则提出邀请其前往沿海参加联合训练。',choices:[
   c('observe','共享观察情报，提醒周边国家',30,'美日态度 +8；后续关注机甲去向。',{relations:{usa:8,japan:8,russia:-8}},[next('mech_landing',30)]),
   c('contact','尝试与机器人直接对话',55,'科研进度 +8、俄罗斯态度 +8；机器人将提出条件。',{progress:8,relations:{russia:8}},[next('mech_union',26)]),
   c('ignore','按异常装备处理，继续观察',0,'不支出预算；机甲会按俄方安排行动。',{},[next('mech_landing',34)])]},
  mech_union:{chapter:'远东钢铁来客',country:'机甲通讯频道',tag:'后续',title:'机甲要求每周两天假，以及不被当船运',body:'机器人愿意提供公开的非军事研究资料，条件是各方承认它不是一辆普通货车。俄方认为这是外交干涉，仍决定把一支机甲纵队派往大陆。',choices:[
   c('rights','支持和平科研与劳动待遇',70,'科研 +12、观感 +8；俄方机甲纵队仍会抵达。',{progress:12,opinion:8,relations:{russia:-8}},[next('mech_landing',28)]),
   c('withdraw','结束通讯，避免外交争端',0,'俄罗斯态度 +5；等待机甲抵达消息。',{relations:{russia:5}},[next('mech_landing',30)])]},
  mech_landing:{chapter:'远东钢铁来客',country:'俄罗斯 / 大陆',tag:'地图变化',title:'俄方机甲纵队抵达上海近郊',body:'这次不是新闻标题里的比喻。机甲纵队已进入大陆战区，会在开战后向你的据点推进。俄方称其为“有自主意见的支援部队”。',choices:[
   c('contain','协调周边国家监控局势',45,'机甲成为实际敌军；美日态度 +10、国际观感 +5。',{spawnMech:true,relations:{usa:10,japan:10},opinion:5},[next('mech_breakdown',42)]),
   c('prepare','记录其位置，调整部署',0,'机甲成为实际敌军；保留资金准备应对。',{spawnMech:true,tension:8},[next('mech_breakdown',48)])]},
  mech_breakdown:{chapter:'远东钢铁来客',country:'远东钢铁来客',tag:'后续',title:'机甲纵队因加班问题发生内部争吵',body:'一部分机器人拒绝连续值勤。俄方请求外界不要把劳动仲裁当作军事情报，但机甲纵队的实际兵力已经受到影响。',choices:[
   c('mediate','支持公开的劳动调解',50,'现存机甲纵队兵力降低，俄罗斯态度 -8。',{weakenMech:true,relations:{russia:-8},opinion:5}),
   c('watch','观察，不介入内部争议',0,'机甲自行磨合，国际紧张略降。',{tension:-5})]},
  duck_blockade:{starter:true,chapter:'黄色海上巨物',country:'日本 / 太平洋航道',tag:'荒诞突发',title:'巨型橡皮鸭堵住港口，保险公司宣布不可抗鸭',body:'一只没有人认领的巨型橡皮鸭卡在主要航道。日本贸易收益受到扰动，各国请求护送绕行的民用补给船。鸭子目前没有发表政治立场。',choices:[
   c('escort','安排一次舰队护航',0,'接下 90 秒护航请求；完成海峡护航会触发后续。',{flags:{duckBlockade:true},task:'escort'}),
   c('pay','出资协调民用运输',90,'立即缓解贸易扰动，日本态度 +15。',{flags:{duckBlockade:false},relations:{japan:15}},[next('duck_resolution',30)]),
   c('wait','等待其他国家处理',0,'贸易收入暂时受损，稍后有后续消息。',{flags:{duckBlockade:true},opinion:-3},[next('duck_shortage',40)])]},
  duck_convoy:{chapter:'黄色海上巨物',country:'护航回报',tag:'行动后续',title:'补给船成功靠港，船员带回一只小黄鸭',body:'你的护航行动让受阻的物资重新流动。日本主动提供后续贸易支持；那只小黄鸭被摆在指挥室里，目前仍未变形成机器人。',choices:[
   c('share','分享航道协调成果',0,'解除贸易扰动，资金 +90、日本态度 +15、观感 +8。',{flags:{duckBlockade:false},money:90,relations:{japan:15},opinion:8},[next('duck_resolution',30)]),
   c('supply','优先补充自己的库存',0,'解除贸易扰动，资金 +130，科研进度 +5。',{flags:{duckBlockade:false},money:130,progress:5},[next('duck_resolution',35)])]},
  duck_shortage:{chapter:'黄色海上巨物',country:'航道协调',tag:'后续',title:'鸭子还在，但港口账单已经来了',body:'运输中断开始影响民用物资。邻国提出共同承担拖离费用；也可以继续等待，不过贸易收益会保持折扣。',choices:[
   c('share','分担拖离费用',70,'解除贸易扰动，日本态度 +10。',{flags:{duckBlockade:false},relations:{japan:10}},[next('duck_resolution',25)]),
   c('wait','继续等待协调结果',0,'贸易扰动继续，稍后由国际联合队处理。',{},[next('duck_resolution',45)])]},
  duck_resolution:{chapter:'黄色海上巨物',country:'国际航道',tag:'阶段结局',title:'橡皮鸭终于离港，目的地填的是“自由”',body:'多国联合拖带队清理了航道。贸易恢复，保险公司正在争论保单里该不该增加“巨型浴室用品”一项。',choices:[
   c('normal','恢复正常航运',0,'贸易扰动结束，国际紧张 -4。',{flags:{duckBlockade:false},tension:-4}),
   c('research','资助海洋异常现象研究',50,'科研 +7、国际观感 +6。',{flags:{duckBlockade:false},progress:7,opinion:6})]},
  moon_rabbit:{starter:true,chapter:'月面兔子电台',country:'国际科学界',tag:'荒诞突发',title:'月面电台播出兔子天气预报',body:'多个国家收到同一段来自月面的广播，内容却是“胡萝卜价格与月面降雨”。科学界请求联合验证，阴谋论节目已经播了三个特别篇。',choices:[
   c('science','加入公开联合验证',65,'科研 +12、观感 +8，美方态度改善。',{progress:12,opinion:8,relations:{usa:6}},[next('moon_answer',32)]),
   c('broadcast','呼吁冷静，避免炒作',20,'观感 +7，国际紧张下降。',{opinion:7,tension:-6},[next('moon_answer',38)]),
   c('wait','继续监听公开消息',0,'保留资金，等待科学界结论。',{},[next('moon_answer',42)])]},
  moon_answer:{chapter:'月面兔子电台',country:'国际科学界',tag:'后续',title:'兔子没有降落，地球的发布会先吵起来了',body:'信号被确认来自一台失控的旧探测器。它把儿童节目当成了科学数据。国际合作项目因此获得支持，公众也开始要求科研机构提高透明度。',choices:[
   c('open','支持科研公开规范',0,'观感 +8、美日态度 +5；秘密项目受到少量额外关注。',{opinion:8,relations:{usa:5,japan:5},risk:5}),
   c('local','把成果用于本岛科研',35,'科研 +10，保持现有外交立场。',{progress:10})]},
  penguin_diplomat:{starter:true,chapter:'企鹅大使事件',country:'联合国',tag:'荒诞突发',title:'一只企鹅坐上代表席，翻译系统自动鼓掌',body:'一场国际会议被误接入动物纪录片。自动翻译把企鹅叫声译成了完整的停火倡议，并获得多国转发。现在没人愿意承认自己刚刚赞同了一只企鹅。',choices:[
   c('peace','顺势支持和平倡议',20,'国际观感 +12、紧张 -10。',{opinion:12,tension:-10},[next('penguin_follow',30)]),
   c('verify','要求核实会议记录',0,'美方态度 +6、观感 +4。',{relations:{usa:6},opinion:4},[next('penguin_follow',36)])]},
  penguin_follow:{chapter:'企鹅大使事件',country:'联合协调组',tag:'后续',title:'企鹅获得荣誉观察员资格，会议首次准点结束',body:'各方决定保留这次误会带来的沟通窗口。一份适用于当前地区紧张局势的交流提案被送到你的指挥室。',choices:[
   c('dialogue','接受多边沟通安排',50,'各合作方态度 +8，观感 +8。',{relations:{usa:8,japan:8,korea:8,philippines:8},opinion:8}),
   c('decline','感谢提议，暂不加入',0,'保留资源，国际紧张 -3。',{tension:-3})]},
  satellite_glare:{starter:true,requires:'research',chapter:'轨道监测风波',country:'国际监测机构',tag:'国际关注',title:'轨道监测报告出现一张模糊截图',body:'一份无法辨认内容的监测图像引发媒体猜测。美国要求说明本岛新增科研支出的用途。画面里的东西可能只是反光，但预算变化确实引来了关注。',choices:[
   c('review','暂停敏感项目，接受外部审查',0,'科研暂停、暴露风险降至 15，美方态度 +12。',{mode:'paused',riskSet:15,alert:0,relations:{usa:12},opinion:6}),
   c('talk','启动外交沟通',60,'美方态度 +8、风险 -12；科研可继续。',{relations:{usa:8},risk:-12},[next('dawn_suspicion',35)]),
   c('continue','继续项目，承担进一步质询',0,'暴露风险 +12、美方态度 -10。',{risk:12,relations:{usa:-10}})]},
  relief_call:{starter:true,chapter:'海上救援请求',country:'菲律宾',tag:'地区事务',title:'风暴过境，菲律宾请求民用救援支援',body:'风暴损坏沿海设施。菲律宾请求物资和救援资金。援助会占用你的筹备预算，也可能改善周边国家对你未来行动的看法。',choices:[
   c('aid','派出民用救援物资',80,'菲律宾态度 +20、国际观感 +14。',{relations:{philippines:20,usa:5},opinion:14},[next('relief_thanks',32)]),
   c('limited','提供有限援助',35,'菲律宾态度 +10、国际观感 +6。',{relations:{philippines:10},opinion:6},[next('relief_thanks',38)]),
   c('decline','表达慰问，保留预算',0,'菲律宾态度 -8。',{relations:{philippines:-8}})]},
  relief_thanks:{chapter:'海上救援请求',country:'救援回报',tag:'后续',title:'救援队归来，邻国提出共享预警信息',body:'救援行动获得民间好评。菲律宾愿意把这次合作扩展到公开预警与民用科研，但需要一笔后续协调经费。',choices:[
   c('expand','扩大公开合作',55,'科研 +8、菲律宾态度 +12、观感 +5。',{progress:8,relations:{philippines:12},opinion:5}),
   c('finish','完成本次救援，暂不追加',0,'资金 +35，菲律宾态度 +5。',{money:35,relations:{philippines:5}})]},
  press_debate:{starter:true,repeatable:true,chapter:'国际舆论场',country:'国际媒体',tag:'舆论',title:'国际直播连线：你的下一步究竟是什么？',body:'主持人把援助、军事筹备和科研预算放在同一张图上。各国公众希望听到一个明确解释。回应会影响合作条件，也会限制你之后的政治空间。',choices:[
   c('civil','强调民生与区域稳定',40,'国际观感 +10，美日态度 +7。',{opinion:10,relations:{usa:7,japan:7}}),
   c('transparent','接受公开预算质询',0,'国际观感 +6；秘密科研受到额外关注。',{opinion:6,risk:8}),
   c('hard','宣布保持战略自主',0,'国际紧张 +10，俄罗斯态度 +8、美方态度 -8。',{tension:10,relations:{russia:8,usa:-8}})]},
  trade_review:{starter:true,repeatable:true,chapter:'合作条件变化',country:'经贸协调组',tag:'外交',title:'合作方要求重新讨论援助条件',body:'一些支持者希望你作出更多公开承诺，另一些则担心被卷入地区战争。你可以投入外交资源争取理解，也可以保留自主权并接受冷淡回应。',choices:[
   c('negotiate','投入外交协调',65,'所有合作方态度 +10、观感 +6。',{relations:{usa:10,japan:10,korea:10,philippines:10},opinion:6}),
   c('limited','接受有限合作安排',0,'资金 +50；美日态度各 -5。',{money:50,relations:{usa:-5,japan:-5}})]},
  dawn_suspicion:{chapter:'曙光计划',country:'国际监测 / 美方交涉',tag:'机密关注',title:'你的秘密科研进入了国际议程',body:'预算与科研进展引来质询。外界尚未掌握完整情况，但美国要求解释，媒体开始追问。继续加速会让下一轮调查更难处理。',choices:[
   c('freeze','暂停计划，接受初步审查',0,'科研暂停、风险降至 15，改善美方态度；项目进度保留。',{mode:'paused',riskSet:15,alert:0,relations:{usa:10},opinion:5}),
   c('dialogue','继续研发，同时进行外交沟通',60,'风险 -8、美方态度 +5；进度继续。',{risk:-8,relations:{usa:5}}),
   c('defy','继续项目，拒绝进一步说明',0,'风险 +12、美方态度 -18、观感 -8。',{risk:12,relations:{usa:-18},opinion:-8})]},
  dawn_inspection:{chapter:'曙光计划',country:'多国调查组',tag:'升级',title:'多国要求正式调查曙光计划',body:'初步质询已经变成正式交涉。合作方开始讨论暂停支援。你可以冻结研究争取恢复信任，也可以公开项目，或继续承受调查与制裁风险。',choices:[
   c('cooperate','冻结计划并接受调查',0,'进度回退 10、风险降至 15；制裁降低，美方态度 +18。',{mode:'paused',progress:-10,riskSet:15,alert:0,sanctions:-1,relations:{usa:18},opinion:8}),
   c('public','公开项目，寻求谈判',0,'项目公开，美日态度下降；研发成果可转入威慑与交涉。',{disclose:true,relations:{usa:-15,japan:-10},opinion:-8},[next('dawn_negotiation',25)]),
   c('defy','拒绝调查，继续承担压力',0,'制裁升级、观感 -15，进入最后通牒阶段。',{risk:18,sanctions:1,relations:{usa:-25,japan:-15},opinion:-15})]},
  dawn_ultimatum:{chapter:'曙光计划',country:'国际联合声明',tag:'最后通牒',title:'最后通牒：冻结项目，否则考虑军事介入',body:'部分国家已开始准备干预。项目仍可暂停，但先前失去的信任需要时间恢复。若选择继续，地图上可能出现实际的国际干预舰队。',choices:[
   c('freeze','冻结项目，接受外交安排',0,'科研暂停、风险降至 15；取消尚未抵达的干预，关系有所恢复。',{mode:'paused',riskSet:15,alert:0,sanctions:-1,cancelIntervention:true,relations:{usa:15,japan:10},opinion:6}),
   c('negotiate','公开项目并要求紧急谈判',90,'项目公开、暂缓干预；进入谈判后续。',{disclose:true,cancelIntervention:true,risk:-20,relations:{usa:5}},[next('dawn_negotiation',24)]),
   c('reject','拒绝通牒，承担军事风险',0,'30 秒后可能出现干预舰队；制裁升级。',{disclose:true,intervention:1,sanctions:1,relations:{usa:-25},opinion:-15})]},
  dawn_ready:{chapter:'曙光计划',country:'指挥部机密',tag:'科研完成',title:'曙光计划完成，一份战略储备已就绪',body:'这项成果可以继续保留，也可以公开形成威慑，或者作为谈判筹码。实际使用会重创敌方战区，同时引发严重且持续的国际后果。你的选择会改变后面的整局。',choices:[
   c('secret','保留储备，暂不公开',0,'保留所有战略选项；国际社会尚未正式确认。',{}),
   c('deter','公开威慑并寻求沟通',0,'威慑延后游戏中的空袭；美日态度下降，随后进入谈判。',{disclose:true,relations:{usa:-15,japan:-10},opinion:-8},[next('dawn_negotiation',24)]),
   c('talk','主动提出有限冻结换停火',40,'公开项目并改善沟通条件，进入谈判。',{disclose:true,relations:{usa:8,japan:5},opinion:5},[next('dawn_negotiation',20)])]},
  dawn_negotiation:{chapter:'曙光计划',country:'紧急外交会谈',tag:'谈判',title:'各方愿意谈，但要求你先作出让步',body:'一份框架摆上桌面：保持克制、冻结新的研发，换取逐步缓解制裁和地区停火讨论。完成的战略储备仍在；签署最终协议与否由你决定。',choices:[
   c('framework','接受有限冻结，推进停火框架',60,'研发暂停、关系改善、制裁降低；成果完成后可讨论停火结局。',{mode:'paused',sanctions:-1,relations:{usa:18,japan:12},opinion:12,cancelIntervention:true},[next('dawn_treaty',30)]),
   c('counter','保留自主权，继续交涉',0,'保留项目，国际紧张 +8；稍后再谈。',{tension:8},[next('dawn_treaty',45)]),
   c('walk','结束会谈，维持现有部署',0,'美日态度下降；继续自由战役。',{relations:{usa:-12,japan:-8},tension:12})]},
  dawn_treaty:{chapter:'曙光计划',country:'停火框架',tag:'结局选择',title:'停火框架已经送达，你要在这里收手吗？',body:'各方提出一份停止升级的框架。若曙光计划已经完成且从未实际使用，可以签署威慑停火协议，结束本局；也可以只缓和关系，继续自己的战役。',choices:[
   {...c('sign','签署威慑停火协议，结束本局',0,'达成“威慑下的停火”结局，不需要占领三座城市。',{ending:'deterrence',flags:{treaty:true}}),requires:'deterrent'},
   c('continue','接受降温安排，继续自由战役',0,'美日态度 +10、制裁降低，继续游戏。',{relations:{usa:10,japan:10},opinion:8,sanctions:-1,cancelIntervention:true}),
   c('refuse','拒绝框架，保持战略自主',0,'国际紧张 +10；继续承担现有后果。',{tension:10})]},
  nuclear_fallout:{chapter:'核使用后的世界',country:'全球紧急会议',tag:'严重后果',title:'世界进入紧急状态，干预舰队开始集结',body:'战略武器已经被使用。各国谴责造成的伤亡与地区灾难，现有援助全面冻结，金融制裁生效。军事干预正在接近。战役仍在继续，后果不会随下一条新闻消失。',choices:[
   c('ceasefire','宣布停止进一步使用，寻求停火',0,'风险下降，略微改善沟通；已启动的干预仍会抵达。',{mode:'paused',riskSet:25,relations:{usa:8,japan:8},opinion:5},[next('nuclear_aftermath',35)]),
   c('relief','投入灾后救援与公开调查',140,'国际观感 +12、关系有所改善；无法抹去已发生的核使用。',{opinion:12,relations:{usa:10,japan:10}},[next('nuclear_aftermath',30)]),
   c('continue','继续行动，承受全面对抗',0,'干预升级，国际紧张 +20。',{intervention:2,tension:20},[next('nuclear_aftermath',28)])]},
  nuclear_aftermath:{chapter:'核使用后的世界',country:'国际干预协调组',tag:'持续后果',title:'前线仍在交火，外交条件已经改变',body:'你仍能调兵、守城和继续战役，但军事干预与长期制裁将持续存在。部分国家愿意接受新的降温措施，前提是你承担政治与经济代价。',choices:[
   c('concessions','接受监督与长期降温措施',100,'部分缓解经济制裁、改善国际观感；干预舰艇仍需在地图上应对。',{sanctions:-1,relations:{usa:12,japan:12},opinion:10,mode:'paused'}),
   c('hold','维持现有立场，继续作战',0,'保留资金，国际紧张 +10。',{tension:10})]},
  intervention_arrived:{chapter:'国际军事介入',country:'台海',tag:'地图变化',title:'国际干预舰艇进入台海',body:'国际压力已经变成地图上的实际舰艇。它们会攻击附近的我方舰船；驱逐舰、导弹和运输路线都需要重新安排。仍可通过外交改善长期处境，但已经抵达的军力不会凭空消失。',choices:[
   c('talk','保持沟通，同时应对舰队',50,'美方态度 +8、国际紧张 -6。',{relations:{usa:8},tension:-6}),
   c('defend','集中精力指挥防御',0,'返回地图，继续调兵与海战。',{})]}
 };
});
