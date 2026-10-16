(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FrontConsequenceEvents=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const c=(id,label,cost,summary,consequence)=>({id,label,cost,summary,effects:consequence?{consequence}:{},next:[]});
 const e=(chapter,title,body,illustration,choices)=>({chapter,country:'国际民用协调 / 架空后续',tag:'兑现与后果',title,body,illustration,choices});
 return {
  consequence_cargo_departure:e('竹子订单 / 真正发运','竹子备好了，货主问：谁来负责把它送到？','35资金只是备货投入，尚未获得回款。亲自护航会开启一场地图上的护送行动，补给船必须实际抵港；也可以支付70资金委托承运，等待交付。提前开战会取消未交付订单，备货投入不返还。','duck_convoy',[
   c('escort','派舰队亲自护航',0,'立即开启真实护送行动。成功后领取订单180资金，另有行动本身的奖励。','cargoEscort'),
   c('charter','委托民用承运',70,'约0.53周后交货，再领取180资金；省去手动护航。','cargoCharter'),
   c('cancel','取消这笔订单',0,'损失已投入的35资金，无新增支出，也没有回款。','cargoClose')
  ]),
  consequence_cargo_success:e('竹子订单 / 到港结算','货物安全到港，收货人正在清点第九千根竹子','货物完成了真实交付，结款已经可以领取。随后三周可取得小额民用续单收入；封锁、制裁会暂停续单，开战后停止。订单结款只能领取一次。','trade_review',[
   c('claim','领取货款，接受三周续单',0,'领取180资金；未来3周民用续单 +2/模拟秒，受封锁、制裁与战争影响。','cargoClaim'),
   c('close','放弃结款，结束订单',0,'不领取180资金，不接受续单。','cargoClose')
  ]),
  consequence_cargo_failure:e('竹子订单 / 运输失败','货主收到了海水样本，没有收到竹子','护送行动未能完成。订单不会产生货款，已投入的35资金不返还。舰队可以休整，其他发展路线仍可继续。','duck_shortage',[
   c('close','关闭订单，保留其他预算',0,'结束本单，没有额外扣款。','cargoClose'),
   c('record','记录损失，准备其他路线',0,'保留舰队和发展进度，不发放虚构货款。','cargoClose')
  ]),
  consequence_harbor_renewal:e('港务协议 / 到期续签','鸭子的工卡到期了，绕行泊位也一起到期','前期签下的港务绕行合同已经到期，鸭子封锁重新影响日本贸易。追加80资金可以再保留三周绕行能力；也可以等待正常港口恢复。此项合同只续签一次，不会自动扣钱。','duck_blockade',[
   c('renew','续租三周绕行泊位',80,'再绕过鸭子封锁3周；仍需日本合作、关系和制裁条件允许。','harborRenew'),
   c('close','停止续租，使用正常航路',0,'保留资金；现有封锁继续影响日本贸易。')
  ]),
  consequence_lab_renewal:e('科研交流 / 到期续签','联合观测结题，科学家想把便当望远镜留下','公开科研交流期结束，新启动的科技工程恢复原本用时。已经开工的工程保持原定完成时间。追加40资金可续期三周，也可以结束交流，不影响已获得的科技等级。','moon_answer',[
   c('renew','再支持三周公开交流',40,'未来3周新启动的科技工程用时缩短三分之一。','labRenew'),
   c('close','结束交流，保留已有成果',0,'科技等级与工程进度保留，不再享受新工程加速。')
  ]),
  consequence_medical_report:e('医疗互助 / 战地回访','医疗队发来报告：泡面终于不再充当医疗物资','地区医疗互助已经保护了两轮城市袭击。人员和民心的损失确实减少，但建筑仍需修复。追加90资金可再保障两轮；也可以让医疗队返航。此次续约不会重复出现。','relief_thanks',[
   c('renew','补充两轮医疗物资',90,'再降低两轮袭击的人员、民心损失各20%。','medicalRenew'),
   c('close','感谢医疗队，让其返航',0,'已有减伤保留为历史记录，后续袭击不再享受本项保障。')
  ]),
  consequence_insurance_report:e('应急保险 / 理赔回访','保险公司承认：导弹损伤不能写成竹子划痕','已投保的两轮城市应急支出均按50%减免结算。保单不承担城市重建、拦截弹和疏散费用。追加70资金可再保障两轮，也可以停止续保；不会自动收费。','trade_review',[
   c('renew','续保两轮城市应急支出',70,'再减免两轮袭击应急支出的50%，其余费用照常承担。','insuranceRenew'),
   c('close','结束保单，自留后续风险',0,'保留预算；后续城市应急支出恢复全额。')
  ])
 };
});
