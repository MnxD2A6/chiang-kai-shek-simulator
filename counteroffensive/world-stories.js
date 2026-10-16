(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FrontWorldStories=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const c=(id,label,cost,summary,effects={},follow,delay=28)=>({id,label,cost,summary,effects,next:follow?[{id:follow,delay}]:[]});
 const e=(chapter,country,tag,title,body,illustration,choices,extra={})=>({chapter,country,tag,title,body,illustration,choices,...extra});
 return {
  story_budget_start:e('第七份预算附件','美国 / 国会听证','合作条件','美国听证会开到一半，打印机宣布预算不足','议员把防空采购、产业补助和咖啡预算装进了同一个文件夹。美方要求解释合作经费的用途。支持者愿意争取军售，但要求你回应公开监督；拒绝会先损伤关系，甚至暂停采购。','press_debate',[
   c('audit','提交公开合作账目',45,'美国态度 +8、国际观感 +6；已启动科研风险 +4。',{relations:{usa:8},opinion:6,risk:4},'story_budget_audit',24),
   c('lobby','派代表解释军售用途',65,'美国态度 +12、日本态度 +4，进入附加条件谈判。',{relations:{usa:12,japan:4}},'story_budget_pressure',28),
   c('refuse','拒绝补交材料',0,'美国态度 −15，可能低于军售所需的+10；后续继续交涉。',{relations:{usa:-15},opinion:-3},'story_budget_pressure',22)
  ],{starter:true,requires:'usa_cooperation'}),
  story_budget_audit:e('第七份预算附件','美国 / 审计组','后续','审计员找到了第七份附件：一整年的奶茶','账目核对完成。民用合作经费没有失踪，问题出在代表团把奶茶列为“高强度谈判冷却剂”。审计组要求选择下一轮公开程度，军售仍按当前关系与制裁条件办理。','trade_review',[
   c('publish','公开合作采购摘要',35,'美国态度 +10、观感 +7；已启动科研风险 +5。',{relations:{usa:10},opinion:7,risk:5},'story_budget_finish'),
   c('limit','只提供合作项目摘要',0,'保留预算，国际观感 +2；美国态度 −4。',{opinion:2,relations:{usa:-4}},'story_budget_finish',34)
  ]),
  story_budget_pressure:e('第七份预算附件','美国 / 谈判代表','后续','附加条件长到需要一辆运输车','双方把合作文件压缩成了三页，随后又附上九十页“三页文件解释”。美方代表希望你公开承诺优先处理民生与预警需求，否则愿意支持采购的议员很难继续发言。','trade_review',[
   c('explain','说明防御与民生用途',60,'美国态度 +12、国际观感 +5，争取恢复采购条件。',{relations:{usa:12},opinion:5},'story_budget_finish',25),
   c('independent','接受有限支持，保留自主权',0,'保留现有资金，美国态度 −6；军售仍可能暂停。',{relations:{usa:-6}},'story_budget_finish',32)
  ]),
  story_budget_finish:e('第七份预算附件','美国 / 合作办公室','阶段结局','预算案通过了，打印机获准休息两天','听证结束，合作档案已送回执行部门。没有免费防空从天而降：系统仍需你按正常价格采购，已经支付的订单也要满足军售条件才能交付。公开采购累计投入达标后，可建立快速交付档案；价格仍为每套900资金。','press_debate',[
   c('thanks','落实公开采购档案',20,'需本轮累计投入至少80；美国态度+6、观感+5；尚未订购的防空交付缩短至0.6周，最多两次。',{relations:{usa:6},opinion:5,consequence:'procurement'}),
   c('close','结束代表团差旅',0,'保留现有资金，不增加采购条件；本轮听证结束。',{})
  ]),

  story_port_start:e('港口加班协议','日本 / 港口工会','产业风波','港口工会要求：先把巨型鸭子算成一件货物','港务系统把巨型浴室用品记成八万件普通货物，排班表因此排到明年。工会准备集体休假，日本伙伴希望你承担一部分协调费用。此次争议会改变日本态度，从而影响已有贸易与出口项目。','duck_blockade',[
   c('mediate','资助工会与港务会谈',55,'日本态度 +10、观感 +5，进入劳资协商。',{relations:{japan:10},opinion:5},'story_port_mediate',24),
   c('detour','临时租用民用绕行仓库',80,'日本态度 +7、公开科研 +4，调查替代运输安排。',{relations:{japan:7},progress:4},'story_port_detour',25),
   c('wait','不承担协调费用',0,'日本态度 −12；港口继续寻找替代办法。',{relations:{japan:-12}},'story_port_detour',32)
  ],{starter:true}),
  story_port_mediate:e('港口加班协议','日本 / 劳资会谈','后续','工会提出最后一项要求：鸭子也要刷工卡','主要条款已接近一致。谈判卡在巨型货物的夜间值班费：港务局坚持它不会动，工人坚持它每天都占着泊位。你可以支付收尾费用，或者让日本方面继续协商。','duck_shortage',[
   c('negotiate','承担最后一轮协调',40,'日本态度 +16、国际观感 +5；关系改善可恢复受限出口。',{relations:{japan:16},opinion:5},'story_port_finish',22),
   c('patient','让双方继续协商',0,'日本态度 +3，保留资金；较晚收到结果。',{relations:{japan:3}},'story_port_finish',40)
  ]),
  story_port_detour:e('港口加班协议','日本 / 民用航运','后续','绕行仓库开门后，发现里面全是鸭子周边','替代仓库确实有容量，只是货架上摆满了纪念品。承运人愿意清出空间，但要求有人支付搬运费。拒绝不会额外扣钱，日本伙伴则会记下你在这次合作中的态度。','duck_convoy',[
   c('clear','支付民用清仓费用',60,'日本态度 +12，国际观感 +4。',{relations:{japan:12},opinion:4},'story_port_finish',24),
   c('pass','把仓储问题交回日本',0,'日本态度 −5，保留重建和军备预算。',{relations:{japan:-5}},'story_port_finish',34)
  ]),
  story_port_finish:e('港口加班协议','日本 / 经贸协调','阶段结局','新排班表生效，鸭子的工号是00001','港口争议告一段落。日本贸易与出口项目继续依据当前合作、关系、封锁和制裁计算；这份排班协议不会自动解除其他事件造成的封锁。港务局提出将经验带入下一轮民用合作。','duck_resolution',[
   c('exchange','签署四周绕行港务合同',35,'需累计港务投入至少55；未来4周可绕过鸭子封锁，维持已有日本贸易；科研+6、日本态度+5。',{progress:6,relations:{japan:5},consequence:'harbor'}),
   c('normal','恢复日常合作',0,'国际紧张 −3；不再追加费用，也不签署绕行合同。',{tension:-3})
  ]),

  story_cable_start:e('海底光缆与泡面','菲律宾 / 灾害协调','地区事务','台风损坏海底光缆，第一条求援写着“泡面没了”','菲律宾沿海设施与通信同时受损。救援队需要物资，工程师需要民用替换设备。你可以支持联合抢修，也可以分享已有公开资料；选择会影响邻国态度与科研积累。','relief_call',[
   c('repair','派民用抢修支援队',75,'菲律宾态度 +16、国际观感 +10，进入联合抢修。',{relations:{philippines:16},opinion:10},'story_cable_repair',24),
   c('data','共享公开气象资料',30,'菲律宾态度 +7、公开科研 +5，采用临时通信方案。',{relations:{philippines:7},progress:5},'story_cable_route',28),
   c('reserve','表达慰问，保留预算',0,'菲律宾态度 −8，等待当地恢复消息。',{relations:{philippines:-8}},'story_cable_route',35)
  ],{starter:true}),
  story_cable_repair:e('海底光缆与泡面','菲律宾 / 民用工程队','后续','抢修船找到了断点，也找到了三箱失踪泡面','工程人员确认设施受损来自风暴。当地居民提出先恢复医院和学校，供应商则催促支付替换设备尾款。按民用优先安排可获得更好的国际评价，代价是继续投入预算。','relief_thanks',[
   c('civil','优先恢复医院与学校',55,'观感 +10、菲律宾态度 +10、公开科研 +5。',{opinion:10,relations:{philippines:10},progress:5},'story_cable_finish',23),
   c('basic','完成基本抢修，不追加',0,'菲律宾态度 +4、公开科研 +3。',{relations:{philippines:4},progress:3},'story_cable_finish',32)
  ]),
  story_cable_route:e('海底光缆与泡面','菲律宾 / 临时通信网','后续','临时频道终于接通，播音员先报了库存','居民恢复了最基本的联系，全面维修仍需时间。菲律宾请求赞助公开的预警资料交换，也允许你把本次支援停在这里。共享研究成果会进入你的公开科研积累，或推进已经启动的抽象科研项目。','relief_call',[
   c('share','参加民用预警资料交换',40,'公开科研 +8、菲律宾态度 +8。',{progress:8,relations:{philippines:8}},'story_cable_finish',26),
   c('finish','到此为止，保留资金',0,'国际观感 +1，等待恢复通报。',{opinion:1},'story_cable_finish',36)
  ]),
  story_cable_finish:e('海底光缆与泡面','菲律宾 / 恢复通报','阶段结局','线路恢复，感谢信比求援信长了十二页','修复工作进入日常维护。菲律宾按照你实际作出的支援重新评估合作；已经签署的地区合作仍按当前外交条件生效，不会自动免费获得。救援队准备返航。','relief_thanks',[
   c('meeting','把救援合作转为医疗互助',25,'需累计支援投入至少75；后两轮城市袭击的人员、民心损失各−20%；菲律宾态度+8、观感+5。',{relations:{philippines:8},opinion:5,consequence:'medical'}),
   c('return','结束支援，保留预算',0,'地区紧张 −3；没有未投入资金的返还，也不获得医疗保障。',{tension:-3})
  ]),

  story_insurance_start:e('不可抗鸭附加险','国际航运保险组','贸易争议','保险公司把“天降机甲”和“不可抗鸭”分开收费','航运风险会上写满了各类异常事件。保险商提出新的核验费用，合作方正在观察你会怎样回应。认真处理会花掉筹备资金；选择对抗则可能让本已紧张的贸易与外交环境继续恶化。','trade_review',[
   c('audit','参加公开风险核验',50,'国际观感 +7、美日态度各 +5，进入保单审查。',{opinion:7,relations:{usa:5,japan:5}},'story_insurance_audit',26),
   c('own','接受有限保险，自留风险',35,'日本态度 +4，改谈自担费用方案。',{relations:{japan:4}},'story_insurance_own',24),
   c('accuse','公开指责所有合作方敲诈',0,'观感 −10、美日态度各 −8，进入紧张交涉。',{opinion:-10,relations:{usa:-8,japan:-8}},'story_insurance_own',22)
  ],{starter:true}),
  story_insurance_audit:e('不可抗鸭附加险','国际航运保险组','后续','审查员承认：保单里确实没写会走路的坦克','双方同意区分正常航运与架空异常事故。保险组要求提供公开民用货物清单，也可以只采用有限核验。更公开的合作有利于观感，但已经启动的秘密科研可能因此受到关注。','dawn_inspection',[
   c('open','提交公开民用清单',35,'国际观感 +8、美日态度各 +5；已启动科研风险 +6。',{opinion:8,relations:{usa:5,japan:5},risk:6},'story_insurance_finish',24),
   c('limited','接受有限核验',0,'观感 +2，保留预算与现有风险。',{opinion:2},'story_insurance_finish',34)
  ]),
  story_insurance_own:e('不可抗鸭附加险','国际贸易协调','后续','争议升级，有代表提议连救生圈也暂停出口','合作方要求你在互相指责和恢复谈判之间选一个方向。争议本身尚未制造新制裁；继续升级则会令制裁增加一级，直接削减收入。即使如此也始终可以选择免费保持现状。','trade_review',[
   c('compromise','支付协调费，恢复谈判',65,'观感 +7、美日态度各 +10。',{opinion:7,relations:{usa:10,japan:10}},'story_insurance_finish',24),
   c('hold','停止争论，保持现状',0,'国际紧张 −2；本轮不新增制裁。',{tension:-2},'story_insurance_finish',34),
   c('escalate','公开升级贸易对抗',0,'制裁 +1级、观感 −12；收入会进一步下降。',{sanctions:1,opinion:-12},'story_insurance_finish',22)
  ]),
  story_insurance_finish:e('不可抗鸭附加险','国际贸易协调','阶段结局','新条款落地：鸭子不再与航空母舰共用分类','保险争议进入执行阶段，先前的态度与制裁变化继续影响合作。国际协调组提出一份整改方案；如果你愿意承担费用，可以争取解除一级制裁。也可以结束这轮谈判，接受现状。','trade_review',[
   c('comply','落实公开贸易整改',90,'制裁 −1级、观感 +6、美日态度各 +6。',{sanctions:-1,opinion:6,relations:{usa:6,japan:6}}),
   c('cover','投保两轮城市应急支出',55,'后两轮城市袭击应急支出−50%，不承担重建、疏散、补弹费用；用完后收到续保询问。',{consequence:'insurance'}),
   c('close','接受现有条款',0,'保留预算，不获得保险；已有制裁不会自动消失。',{})
  ]),

  story_panda_start:e('两岸货单乌龙','大陆 / 民用货运','海峡风波','大陆货运单写着“熊猫”，开箱后全是竹子','一批民用货物在海峡两岸引起猜测。大陆发言人要求澄清用途，商人则坚持这只是一笔写错品名的订单。你可以通过民用渠道核对，或者把这次风波变成一场公开口水战。','trade_review',[
   c('hotline','通过民用渠道核对',40,'国际紧张 −10、观感 +5，等待商贸核验。',{tension:-10,opinion:5},'story_panda_customs',23),
   c('public','公开要求共同说明',20,'观感 +4、美日态度各 +3，双方准备公开回应。',{opinion:4,relations:{usa:3,japan:3}},'story_panda_press',27),
   c('shout','宣布这是“战略竹子行动”',0,'紧张 +14、观感 −6；合作方开始担心升级。',{tension:14,opinion:-6},'story_panda_press',22)
  ],{starter:true}),
  story_panda_customs:e('两岸货单乌龙','民用贸易核验','后续','货主证实没有熊猫，但竹子真的付过钱了','货单与付款记录对上了。商人提议由你先接下一笔正常民用订单，支付备货投入并安排真实交付，平息这场风波。你也可以到此停止介入，保留原本的筹备方向。此次核验不会撤回大陆已部署的军队。','trade_review',[
   c('order','接下真实民用货运订单',35,'先花35备货，后续选择亲自护航或70资金承运；交货后结款180，未交货前开战会取消。',{opinion:3,tension:-5,consequence:'cargoSign'},'story_panda_finish',26),
   c('record','公布核验结果，不接订单',0,'观感 +6、紧张 −4。',{opinion:6,tension:-4},'story_panda_finish',31)
  ]),
  story_panda_press:e('两岸货单乌龙','两岸 / 国际媒体','后续','两边发言人同时举起一根竹子，直播画面左右对称','公开回应比查货单更热闹。美日代表希望你给出可以核对的说明，以免继续影响援助讨论。已有大陆部署继续执行；新闻回应可以修复关系，却不能凭空移走军队。','press_debate',[
   c('correct','更正消息，提供民用凭证',45,'美日态度各 +8、观感 +7、紧张 −8。',{relations:{usa:8,japan:8},opinion:7,tension:-8},'story_panda_finish',24),
   c('quiet','停止直播，交给货主处理',0,'美日态度各 −3，紧张 −2。',{relations:{usa:-3,japan:-3},tension:-2},'story_panda_finish',35)
  ]),
  story_panda_finish:e('两岸货单乌龙','民用商贸协会','阶段结局','误会解除了，仓库多了十吨没人认领的竹子','商贸协会把这次经历列入货单填写培训。关系和舆论变化已经计入局势，大陆仍按扩军、合作、科研与战争情况安排后续反应。剩余物资可以公益处理，也能按普通货物清算。','trade_review',[
   c('donate','捐给民用公益项目',20,'国际观感 +9、紧张 −5。',{opinion:9,tension:-5}),
   c('sell','结束货单核验',0,'观感 +1；已签的运输订单需另行交付，核验本身不产生货款。',{opinion:1})
  ]),

  story_recall_start:e('机甲召回通知','俄罗斯 / 装备售后','装备风波','俄方发布召回公告：机甲的“休息”键接成了“进军”','一支已在地图上的机甲部队被列入召回争议。制造商承认说明书的第一页装反了，但拒绝承担全部费用。你可以支持公开技术核验，也可以争取由俄方自行处理。','mech_breakdown',[
   c('inspect','支持公开民用安全核验',55,'国际观感 +7、俄罗斯态度 −6，进入召回听证。',{opinion:7,relations:{russia:-6}},'story_recall_hearing',25),
   c('contact','与俄方沟通售后责任',45,'俄罗斯态度 +12，进入技术和解。',{relations:{russia:12}},'story_recall_contact',24),
   c('watch','保留记录，暂不介入',0,'保留资金，等待俄方回应。',{},'story_recall_contact',34)
  ],{starter:true,requires:'mech'}),
  story_recall_hearing:e('机甲召回通知','国际安全核验组','后续','机甲出席听证，第一句是“请报销我的船票”','机甲代表提供了公开安全记录，并坚持它与普通装甲车不同。核验组希望你继续承担协调费用，否则只会发布一份不具约束力的摘要。真正的兵力削弱要等最后达成召回和解。','mech_union',[
   c('support','承担公开听证费用',40,'公开科研 +8、国际观感 +6。',{progress:8,opinion:6},'story_recall_finish',24),
   c('summary','只接收安全摘要',0,'公开科研 +3，保留预算。',{progress:3},'story_recall_finish',34)
  ]),
  story_recall_contact:e('机甲召回通知','俄罗斯 / 售后热线','后续','售后客服要求：请先确认机甲没有插反插头','俄方没有同意立刻撤军，但愿意讨论一次公开协调。你可以改善与俄方的关系，争取其按现有规则重新评估尚未抵达的常规援助；已经抵达的部队不会因为一句好话消失。','russia_robot',[
   c('talk','继续外交沟通',60,'俄罗斯态度 +15、观感 +3；态度达到+35可取消未抵达援军。',{relations:{russia:15},opinion:3},'story_recall_finish',26),
   c('end','结束售后通话',0,'俄罗斯态度 −3，保留资金。',{relations:{russia:-3}},'story_recall_finish',32)
  ]),
  story_recall_finish:e('机甲召回通知','机甲 / 公开协调组','阶段结局','召回和解摆上桌面，机甲要求纸质保修卡','最终方案可以让现存机甲纵队把一部分力量转去检修。该方案要支付一次高额协调费，只削弱地图上现存的机甲，不影响普通俄军与舰船。拒绝后本轮争议结束。','mech_breakdown',[
   {...c('settle','促成一次召回与检修',110,'现存机甲兵力减少45%；俄罗斯态度 −8。',{weakenMech:true,relations:{russia:-8}}),requires:'mech'},
   c('close','不追加支出，结束协调',0,'国际紧张 −3，现存部队保持原兵力。',{tension:-3})
  ]),

  story_karaoke_start:e('半岛歌唱风波','朝鲜 / 韩国','荒诞突发','将军的歌曲只得了59分，评分机被列为敌对势力','一次歌唱比赛的评分意外传遍半岛。朝方要求检测评分机，韩国主持人坚称“升调并不等于升级战备”。双方准备发表声明，尚未改变既有战况；你的表态会影响观感与关系。','korea_rps',[
   c('judge','建议由中立音乐团复核',35,'韩朝态度各 +8、国际观感 +6。',{relations:{korea:8,northkorea:8},opinion:6},'story_karaoke_judge',24),
   c('exchange','赞助一次民间音乐交流',55,'韩朝态度各 +12、国际紧张 −6。',{relations:{korea:12,northkorea:12},tension:-6},'story_karaoke_concert',26),
   c('laugh','转发59分截图',0,'观感 −6、朝鲜态度 −12、紧张 +10。',{opinion:-6,relations:{northkorea:-12},tension:10},'story_karaoke_judge',22)
  ],{starter:true}),
  story_karaoke_judge:e('半岛歌唱风波','中立音乐评审团','后续','复核结果：不是唱错，是机器还停在前奏','评审团解释评分机在正式演唱前已经结算。朝方要求补发证书，韩国希望不要再把麦克风接进战备广播。你可以帮助发布更正，也可以把争议留给当事人。','korea_summit',[
   c('correct','协助发布公开更正',40,'朝鲜态度 +18、韩国态度 +6、紧张 −8。',{relations:{northkorea:18,korea:6},tension:-8},'story_karaoke_finish',24),
   c('pass','请双方自行解释',0,'国际紧张 −3，保留资金。',{tension:-3},'story_karaoke_finish',34)
  ]),
  story_karaoke_concert:e('半岛歌唱风波','半岛 / 民间乐团','后续','联合音乐会排练中，鼓手要求先签停奏协议','民间交流的反响不错，各方仍对政治表态保持戒心。乐团希望追加一小笔交通费，也允许你把本轮合作停在彩排阶段。这次文化交流不会自动终止其他故事导致的半岛战争。','korea_refugees',[
   c('fund','支付民间乐团交通费',45,'韩朝态度各 +10、观感 +8。',{relations:{korea:10,northkorea:10},opinion:8},'story_karaoke_finish',25),
   c('rehearsal','只分享公开彩排',0,'韩国态度 +3、观感 +3。',{relations:{korea:3},opinion:3},'story_karaoke_finish',34)
  ]),
  story_karaoke_finish:e('半岛歌唱风波','国际文化协调组','阶段结局','评分机获准退休，半岛暂时改用掌声','这场文化争议告一段落。韩朝关系的变化已经生效：朝鲜态度足够友好时，未抵达的大陆援军可能被取消；已经到达的部队与其他半岛战事依旧按各自状态处理。','korea_peace',[
   c('exchange','继续小规模民间交流',30,'韩朝态度各 +8、国际观感 +5。',{relations:{korea:8,northkorea:8},opinion:5}),
   c('return','把注意力转回本岛',0,'保留预算、国际紧张 −3；韩朝关系变化继续影响尚未抵达的援军。',{tension:-3})
  ]),

  story_aurora_start:e('极光与失眠的卫星','太平洋 / 科学界','异常天象','强太阳风暴来袭，卫星拍到了指挥部的晚饭','多个民用观测站报告通信与图像异常。媒体拿一张模糊的餐盘截图猜测新增科研预算。科学界希望联合核验，你也可以先采用地面通信、控制已经启动项目的风险。','satellite_glare',[
   c('observe','参加公开联合观测',60,'公开科研 +10、美国态度 +6；已启动科研风险 +5。',{progress:10,relations:{usa:6},risk:5},'story_aurora_orbit',25),
   c('ground','协调地面通信与说明',35,'观感 +5；已启动科研风险 −6。',{opinion:5,risk:-6},'story_aurora_ground',26),
   c('wait','不参加观测，等待报告',0,'保留资金；已启动科研风险 +4。',{risk:4},'story_aurora_ground',34)
  ],{starter:true}),
  story_aurora_orbit:e('极光与失眠的卫星','国际公开观测组','后续','观测站确认异常，餐盘被正式归类为圆形物体','观测数据说明部分图像受到了干扰，媒体仍然想看你的预算说明。公开科研成果能提高国际评价，也会增加对秘密项目的关注；你可以只保留民用数据交换。','moon_answer',[
   c('open','发布民用观测成果',30,'公开科研 +8、观感 +7；已启动科研风险 +6。',{progress:8,opinion:7,risk:6},'story_aurora_finish',24),
   c('data','只接收民用数据',0,'公开科研 +4，保留现有外交立场。',{progress:4},'story_aurora_finish',34)
  ]),
  story_aurora_ground:e('极光与失眠的卫星','本岛 / 国际联络','后续','地面线路接通，第一条消息是“不要再传真便当”','地面联络足以完成本次说明。科研人员提出利用这段时间暂停敏感支出，也有人建议参加公开说明会修复美方关系。风险降低不等于撤回已发出的调查，待决新闻仍需回应。','dawn_suspicion',[
   c('quiet','暂停敏感投入，整理民用记录',0,'已启动科研暂停、暴露风险 −10；保留研究进度。',{mode:'paused',risk:-10},'story_aurora_finish',32),
   c('explain','举行公开民用说明会',45,'美国态度 +10、观感 +7；已启动科研风险 −5。',{relations:{usa:10},opinion:7,risk:-5},'story_aurora_finish',24)
  ]),
  story_aurora_finish:e('极光与失眠的卫星','国际科学通讯','阶段结局','太阳风暴减弱，大家终于确认那只是晚饭','本轮异常天象结束，科学资料与外交回应的效果保留。公开研究积累可以用于尚未启动的曙光计划，或推进已经在研的抽象项目；先前增加的关注也不会自动归零。','moon_answer',[
   c('research','支持三周公开科研交流',35,'未来3周新启动的科技工程用时缩短三分之一；公开科研+7、国际观感+4。',{progress:7,opinion:4,consequence:'lab'}),
   c('close','结束特别联络',0,'保留预算、国际紧张 −4，不获得科技工程加速。',{tension:-4})
  ])
 };
});
