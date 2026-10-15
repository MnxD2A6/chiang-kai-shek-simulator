(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./world-events.js'));else root.FrontPreparationEvents=factory(root.FrontWorldEvents);})(typeof globalThis!=='undefined'?globalThis:this,function(Base){
 'use strict';
 const action=(project,stage,route)=>({project,stage,route});
 const choice=(id,label,cost,summary,project,stage,route,extra={})=>({id,label,cost,summary,effects:{...extra,preparation:action(project,stage,route)},next:[]});
 return {...Base,
  prep_industry_offer:{preparation:true,illustration:'trade_review',chapter:'产线订单 / 签约',country:'日本 / 产业协调组',tag:'战前发展',title:'日本订单来了：出口，还是先加固自己的工厂？',body:'承包商把“战略储备”误写成了“巨型饭团”，但产线用途由你决定。一次投入100资金，达标并筹备约0.8周后验收。开战会中止未兑现项目，投入不返还。',choices:[
   choice('exports','签出口长单',100,'完成经济2级和日本合作后，出口税收 +3/模拟秒；日本贸易受阻时暂停。','industry','enroll','exports'),
   choice('resilience','建设本地韧性产线',100,'完成经济2级后，城市建筑与工厂的导弹物理损伤 −20%。','industry','enroll','resilience'),
   choice('decline','稍后再议，先保留预算',0,'暂不投入资金，可在发展面板重新洽谈。','industry','defer',null)
  ]},
  prep_industry_delivery:{preparation:true,illustration:'duck_convoy',chapter:'产线订单 / 验收',country:'日本 / 高雄工厂',tag:'兑现项目',title:'第一批产线验收完成，海关终于确认它不是饭团',body:'工厂已完成你要求的改造。协调员把早前的合同、升级记录和运输安排逐一对上，项目现在可以兑现。只能领取签约时选择的路线收益。',choices:[
   choice('exports','交付出口项目',0,'出口税收 +3/模拟秒；受日本合作、关系、制裁与封锁状态影响。','industry','complete','exports'),
   choice('resilience','启用城市韧性产线',0,'今后城市导弹造成的建筑与工厂物理损伤降低20%，人员仍需疏散。','industry','complete','resilience'),
   choice('cancel','取消验收，回收部分器材',0,'返还40资金，放弃本项目收益。','industry','cancel',null,{money:40})
  ]},
  prep_defense_offer:{preparation:true,illustration:'dawn_inspection',chapter:'防卫合作 / 选择',country:'美国 / 台湾工程组',tag:'战前发展',title:'美国送来联合防空演训方案，还附了三本预算问卷',body:'美方愿意协助校准防空，也希望了解更多预算。你可以接受联合方案，或培训本地抢修队。一次投入120资金，达标并筹备0.8周后验收；提前开战会中止，投入不返还。',choices:[
   choice('joint','接受联合校准',120,'需科技2级和美国合作；预警 +4模拟秒、防空每轮多拦1枚；秘密科研初始风险至少8。','defense','enroll','joint'),
   choice('domestic','培训本地抢修队',120,'需科技2级；重建仍花160资金，用时由12缩短至8模拟秒，不增加科研风险。','defense','enroll','domestic'),
   choice('decline','稍后再议，保留方案',0,'暂不投入资金，可在发展面板重新洽谈。','defense','defer',null)
  ]},
  prep_defense_delivery:{preparation:true,illustration:'korea_peace',chapter:'防卫合作 / 验收',country:'联合观察组 / 城市应急队',tag:'兑现项目',title:'演训验收结束，防空校准与抢修班准备上岗',body:'经过真实的科技投入和协调，你选定的方案已经可以部署。联合方案会增加外部对科研预算的关注；本地方案把资源集中在受损后的恢复。签约路线在此次验收中保持不变。',choices:[
   choice('joint','启用联合预警与校准',0,'美国合作有效时，预警 +4模拟秒，每轮额外拦1枚，最高5枚；隐秘科研风险至少8。','defense','complete','joint'),
   choice('domestic','启用城市抢修班',0,'每次160资金重建仅需8模拟秒；恢复量保持不变。','defense','complete','domestic'),
   choice('cancel','停止部署，退回部分器材',0,'返还40资金，放弃此项收益。','defense','cancel',null,{money:40})
  ]},
  prep_diplomacy_offer:{preparation:true,illustration:'mech_union',chapter:'机甲售后 / 争议',country:'俄罗斯 / 机甲工会',tag:'荒诞筹备',title:'俄方机甲拒绝登船：保修单上把它写成了电饭煲',body:'机甲被当成家电，工会拒绝登船。你可以协调售后以推迟军援，或公开维修争议削弱装备。达标并筹备0.8周后兑现；提前开战会中止，投入不返还。',choices:[
   choice('delay','出资协调售后与工会',90,'俄罗斯态度达到0后，可使其常规援军出发和抵达延后一周。','diplomacy','enroll','delay',{relations:{russia:5}}),
   choice('expose','整理并公开维修争议',80,'国际观感达到65后，俄方援军与机甲兵力 −25%；公开结论会增加紧张。','diplomacy','enroll','expose'),
   choice('decline','稍后再议，先保留资源',0,'暂不投入资金，可在发展面板重新洽谈。','diplomacy','defer',null)
  ]},
  prep_diplomacy_delivery:{preparation:true,illustration:'mech_breakdown',chapter:'机甲售后 / 结果',country:'俄罗斯 / 国际观察团',tag:'兑现项目',title:'售后窗口终于叫到号，援军排期与检修结果出炉',body:'你此前的投入和外交行动形成了可执行结果。协调路线换来额外准备时间；公开调查路线会压低俄方装备与远征军的可用兵力，但也让各方更紧张。已完成项目会在开战后继续影响实际援军。',choices:[
   choice('delay','确认延后俄方军援排期',0,'俄罗斯常规援军延后1周；已抵达的剧情部队保持原状。','diplomacy','complete','delay'),
   choice('expose','发布公开检修结论',0,'俄方常规援军及机甲兵力 −25%；地区紧张 +10、俄罗斯态度 −15。','diplomacy','complete','expose',{tension:10,relations:{russia:-15}}),
   choice('cancel','撤回协调，回收部分资源',0,'返还40资金，不再改变俄方增援。','diplomacy','cancel',null,{money:40})
  ]}
 };
});
