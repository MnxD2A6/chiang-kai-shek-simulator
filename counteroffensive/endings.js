(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./preparation.js'),require('./government.js'));else root.FrontEndings=factory(root.FrontPreparation,root.FrontGovernment);})(typeof globalThis!=='undefined'?globalThis:this,function(P,G){
 'use strict';
 const entry=(title,text,illustration,result='victory',kind='发展收官')=>({title,text,illustration,result,kind});
 const catalog={
  kmt_compact:entry('蓝色内阁：海峡保全协定','选票让国民党内阁取得任期，军备政策也经过了实际验收。你把准备好的防卫能力用于有监督的海峡安排，承担协调预算后结束这场架空危机。整军花的钱、未扩大的战线和兑现的民生账目一起留在记录中。','civic_budget','victory','国民党执政结局'),
  dpp_compact:entry('绿色内阁：民生新约','民进党赢得本局选举，商贸或重建政策通过了实际验收。恢复的设施、保住的民心与合作预算成为这份新约的基础。你选择在登陆命令之前收官，让内阁为这届任期兑现的生活安排负责。','civic_recovery_check','victory','民进党执政结局'),
  kmt_military:entry('蓝色内阁：整军凯旋','国民党在选举中取得执政权，重点政策真正兑现，前线守住三城，后方也扛过两轮空袭与两次登陆。整军的代价没有消失，战后的恢复预算仍需交给下一班人。','prep_industry_delivery','victory','国民党军事结局'),
  dpp_military:entry('绿色内阁：韧性守成','民进党在选举中执政，政策经实际验收后，联合指挥部仍完成了三城军事目标并保住本岛。贸易或民生路线没有替代防卫，持续修复和守军投入共同支撑了这场代价真实的胜利。','consequence_medical_report','victory','民进党军事结局'),
  military:entry('三城守住，远征落定','福州、南京、广州的驻军熬过了后续反击，台湾后方仍在运转。军事目标已经完成，留下的伤亡、账单与外交裂痕也需要面对。你可以选择已完成路线对应的战后方向。','prep_industry_delivery','victory','军事结局'),
  deterrence:entry('威慑下的停火','你完成曙光计划，通过克制与谈判达成地区停火。战略储备没有被实际使用，远征在外交桌上结束。','dawn_treaty','victory','威慑结局'),
  trade:entry('海峡商路，重新开张','长期出口、稳定生产与国际口碑换来一份民用合作框架。六周的筹备没有走向登陆命令，第一批新货船在监督下离港。你用贸易安排结束了这场架空危机。','story_port_finish'),
  naval:entry('航路自主','真实护航行动和自有运输、驱逐舰队让航路恢复了秩序。你把后勤投入变成可持续的海上存在，选择在跨海进攻前签署航路安排。货船重新按班表启航，驱逐舰在航道外侧护送。','consequence_cargo_success'),
  regional:entry('地区共同保证','与俄朝的沟通、地区伙伴的支持和国际观感，最终变成一份各方愿意执行的降温保证。电报比炮声先到，你在开战前选择了外交收官。已有让步与协调支出保留在本局记录里。','prep_diplomacy_delivery'),
  reconstruction:entry('灯火重建，守岛停火','两轮导弹和两次实际登陆没有击垮后方。城市恢复生产，台湾两城安全守满一周。你把预算交给重建者，签署防御停火，停止继续扩大远征。新的钢梁运进街区，医院与工厂的灯光重新亮起。','consequence_medical_report'),
  nuclear_ceasefire:entry('灰烬中的停火','战略武器已经被使用，伤亡与核使用记录无法撤销。你经历了反击和国际干预，恢复部分民心与国际沟通，再承担恢复与监督预算，才换来这份脆弱停火。制裁、关系损伤和城市代价仍留在战果中。','nuclear_aftermath','victory','代价沉重的核后结局'),
  nuclear_military:entry('蘑菇云后的残局','三城和台湾后方最终守住，国际干预也已被实际应对。核使用让这场军事胜利背负长期隔离与灾难记录；夺取城市没有让代价消失。没有未使用储备的停火，也没有普通路线的庆典。','nuclear_fallout','victory','代价沉重的核后结局'),
  support_collapse:entry('民心散尽','持续的损伤与战争负担耗尽了公众对继续作战的支持。指挥部失去继续远征的政治基础，战役结束。街头的停战呼声最终盖过了指挥部的动员，军队停止继续远征。','press_debate','defeat','失败结局'),
  infrastructure_collapse:entry('城市熄灯','设施和工厂的连续损伤最终让后方无法继续运转。剩余部队仍在地图上，支撑它们的城市却已瘫痪。防空、维修和预算不足共同留下这份战役记录。','nuclear_aftermath','defeat','失败结局'),
  home_lost:entry('本岛失守','台北与高雄都被占领，救援窗口内未能夺回任何一城。远征部队的地图目标仍在，后方却已无法维持。港口与通讯站相继中断，收复后方的最后一道命令没能兑现。','intervention_arrived','defeat','失败结局'),
  nuclear_collapse:entry('核后孤岛','使用战略武器后，制裁、撤援与战争损伤最终耗尽了继续作战的条件。储备已经消耗，灾难记录和国际后果无法用下一条新闻抹去。战役以核后的崩溃结束。','nuclear_fallout','defeat','核后失败结局'),
  defeat:entry('远征中止','部队与据点的损失让远征无法继续。地图上还留着未能完成的航线，部队等待撤回，港口清点最后一批物资。','trade_review','defeat','失败结局'),
  legacy_military:entry('原版本的战役记录','这是旧版已经完成的军事战果，进度与结局保留。新发展收官、核后条件和一次战后选择从新版新局开始计算。','prep_industry_delivery','victory','旧版战果')
 };
 const epilogues={
  exports:entry('商路重启','你选择把战后的产业预算放回出口订单。港口重新按民用班表工作，贸易仍受国际关系和制裁约束。夺取城市之外，这局留下了一条依靠外部市场的恢复道路。','story_port_finish'),
  resilience:entry('废墟上的新城','本地韧性产线把损失压低，战后的第一批钢梁也继续留在城市里。你选择加固与重建作为这场远征的收尾：疏散过的家庭回家，仍然受损的工厂开始恢复。','prep_industry_delivery'),
  logistics:entry('海峡航路','运输后勤的投入最后变成一张可靠的航运时刻表。你选择让舰队转向接运、护航与补给，而不是继续延长进攻箭头。真正存活的船和完成的行动写进战果。','consequence_cargo_success'),
  joint:entry('联防时代','你接受联合防空带来的保护，也接受它留下的合作条件与外部关注。战后方向交给联合预警和制度化协调，防空的漏弹与消耗则继续提醒人们保护有其成本。','prep_defense_delivery'),
  domestic:entry('重建者的胜利','抢修班在战争后仍然忙碌。你选择把本地恢复能力作为收官方向：工具车驶向工厂，重建进度取代进攻路线。被修复的街区是这条路线真正的奖章。','consequence_medical_report'),
  civil:entry('灯火未熄','民防演练最终保护的是城市里具体的人。你选择以平民的安全和对继续战争的克制作收尾，保留下来的民心与无法避免的物理损伤一起写进记录。','story_cable_finish'),
  delay:entry('赢来的时间','售后与工会争议换来的准备时间没有被浪费。你选择把延后军援的协调经验带入停火安排，结束这场架空远征，而不是把拖延本身误写成敌军凭空消失。','story_recall_contact'),
  expose:entry('保修单上的停火','公开检修把真实可用的俄方兵力压低，也付出了关系和紧张代价。你选择保留公开核验作为战后方向：那张荒诞保修单最终被放进正式停火档案。','story_recall_finish'),
  regional:entry('医船驶向明天','地区医疗互助在袭击中保护人员，在重建时恢复民心。你选择让医船与救援人员承担战后的第一班航次，以实际发生的互助为远征收尾。','story_cable_finish')
 };
 const completed=(s,key,route)=>s.world.preparation.projects[key]?.phase==='complete'&&(!route||s.world.preparation.projects[key].route===route);
 const ownedHome=s=>s.homefront.cities.every(c=>s.owners[s.towns.find(t=>t.id===c.id).tile]===1);
 const average=(s,key)=>s.homefront.cities.reduce((n,c)=>n+c[key],0)/s.homefront.cities.length;
 const landing=s=>['assembling','sailing','landed'].includes(s.homefront.invasion.phase)||s.homefront.invasion.payloads.length>0||s.naval.ground.some(a=>a.mission==='taiwan');
 const safe=s=>ownedHome(s)&&!s.strategy.warning&&!landing(s);
 const retaliationResolved=s=>s.world.interventionCount>=1&&!!s.world.intervention?.arrived&&!s.naval.ships.some(a=>a.faction!==1&&a.name.startsWith('国际干预'));
 const defensive=s=>completed(s,'industry','resilience')||['domestic','civil'].some(r=>completed(s,'defense',r))||completed(s,'diplomacy','regional');
 const costs={trade:600,naval:300,regional:500,reconstruction:400,nuclear_ceasefire:1000,kmt_compact:400,dpp_compact:400};
 function evaluate(s,id,extraFunds=0){const w=s.world,h=s.homefront,p=s.strategy,levels=p.levels,funds=p.funds+extraFunds,check=(label,ok)=>({label,ok:!!ok}),conditions=[];
  const add=(label,ok)=>conditions.push(check(label,ok));
  if(id==='kmt_compact'||id==='dpp_compact'){
   conditions.push(...G.conditions(s,id));add('资金至少1200；确认支出400',funds>=1200);
  }else if(id==='trade'){
   add('筹备期，出口长单已兑现',p.phase==='preparation'&&completed(s,'industry','exports'));add('经济3级、外交2级',levels.economy>=3&&levels.diplomacy>=2);add('日本贸易有效',P.tradeOpen(s));add('国际观感至少75',w.opinion>=75);add('两城建筑、工厂平均至少85',ownedHome(s)&&average(s,'buildings')>=85&&average(s,'industry')>=85);add('资金至少1800；确认支出600',funds>=1800);add('筹备至少6周',s.time>=180);
  }else if(id==='naval'){
   const fleet=s.naval.ships.filter(a=>a.faction===1&&a.id!==s.operations.active?.convoyId);add('筹备期，运输后勤已兑现',p.phase==='preparation'&&completed(s,'industry','logistics'));add('经济与科技达到2级',levels.economy>=2&&levels.technology>=2);add('至少2次真实海峡行动胜利',s.operations.wins>=2);add('保有3艘正式运输舰、2艘驱逐舰',fleet.filter(a=>a.kind==='transport').length>=3&&fleet.filter(a=>a.kind==='destroyer').length>=2);add('民心至少70，两城仍在',h.support>=70&&ownedHome(s));add('资金至少800；确认支出300',funds>=800);add('筹备至少5周',s.time>=150);
  }else if(id==='regional'){
   add('筹备期，外交议程已兑现',p.phase==='preparation'&&completed(s,'diplomacy'));add('外交3级、国际观感至少80',levels.diplomacy>=3&&w.opinion>=80);add('俄朝态度各至少+35',w.relations.russia>=35&&w.relations.northkorea>=35);add('至少两项有效地区合作',Object.entries(p.partners).filter(([key,value])=>value&&w.relations[key]>-30&&w.sanctions<2&&!(w.flags.koreaWar&&['usa','korea'].includes(key))&&!(key==='japan'&&!P.tradeOpen(s))).length>=2);add('紧张不超过40，两城仍在',w.tension<=40&&ownedHome(s));add('资金至少1200；确认支出500',funds>=1200);add('筹备至少6周',s.time>=180);
  }else if(id==='reconstruction'){
   add('战时，至少一项后方防卫路线兑现',p.phase==='war'&&defensive(s));add('实际抵御两轮空袭、击退两次登陆',h.salvos>=2&&h.invasion.repelled>=2);add('台湾安全，当前无导弹或登陆威胁',safe(s));add('两城安全守满一周',s.finale.secured>=30);add('民心60、工厂80、建筑75',h.support>=60&&average(s,'industry')>=80&&average(s,'buildings')>=75);add('资金至少800；确认支出400',funds>=800);
  }else if(id==='nuclear_ceasefire'){
   add('实际使用过战略储备',p.phase==='war'&&w.nuclear.used===1);add('国际干预已真实抵达并被应对',retaliationResolved(s));add('实际抵御两轮空袭、击退两次登陆',h.salvos>=2&&h.invasion.repelled>=2);add('台湾安全，当前无导弹或登陆威胁',safe(s));add('民心35、国际观感30、工厂50',h.support>=35&&w.opinion>=30&&average(s,'industry')>=50);add('制裁已降到1级或以下',w.sanctions<=1);add('恢复与监督预算1000',funds>=1000);
  }else return null;
  if(id!=='nuclear_ceasefire')add('从未实际使用战略储备',w.nuclear.used===0);
  return {id,...catalog[id],cost:costs[id],conditions,ready:conditions.every(c=>c.ok)};
 }
 function options(s){const ids=s.world.nuclear.used?['nuclear_ceasefire']:[];if(!s.world.nuclear.used){if(s.government)ids.push(s.government.party+'_compact');if(completed(s,'industry','exports'))ids.push('trade');if(completed(s,'industry','logistics'))ids.push('naval');if(completed(s,'diplomacy'))ids.push('regional');if(defensive(s))ids.push('reconstruction');}return ids.map(id=>evaluate(s,id));}
 function failure(s){if(s.world.nuclear.used)return 'nuclear_collapse';return {support:'support_collapse',infrastructure:'infrastructure_collapse',cities:'home_lost'}[s.homefront.defeatReason]||'defeat';}
 return {catalog,epilogues,costs,evaluate,options,completed,safe,retaliationResolved,failure};
});
