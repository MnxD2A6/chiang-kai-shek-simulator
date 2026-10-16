(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FrontConsequences=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const families=['budget','port','cable','insurance','panda','recall','karaoke','aurora'];
 const eventIds=['cargo_departure','cargo_success','cargo_failure','harbor_renewal','lab_renewal','medical_report','insurance_report'].map(k=>'consequence_'+k);
 const get=s=>s.world?.consequences;
 function init(s){s.world.consequences={version:1,invested:Object.fromEntries(families.map(k=>[k,0])),cargo:{phase:'idle',attempt:null,due:0,until:0},harbor:{until:0,renewed:false,notified:false},lab:{until:0,renewed:false,notified:false},medical:0,insurance:0,procurement:0,medicalRenewed:false,insuranceRenewed:false,pending:[]};return get(s);}
 const active=(s,key)=>(get(s)?.[key]?.until||0)>s.time;
 function bonuses(s){const c=get(s);return {income:c?.cargo.phase==='settled'&&active(s,'cargo')&&s.strategy.phase==='preparation'&&!s.world.flags.duckBlockade&&s.world.sanctions===0?2:0,technologyTime:active(s,'lab')?8:12,deliveryTime:c?.procurement>0?18:24,medicalFactor:c?.medical>0?.8:1,insuranceFactor:c?.insurance>0?.5:1};}
 function available(s,action,cost=0){const c=get(s),cargo=c?.cargo;let reason='';if(!action)return {ok:true,reason};
  if(action==='cargoSign'&&(s.strategy.phase!=='preparation'||cargo.phase!=='idle'))reason='民用订单仅在筹备期签署，每局一单';
  if(['cargoEscort','cargoCharter'].includes(action)&&(s.strategy.phase!=='preparation'||cargo.phase!=='signed'))reason='需要尚未发运的真实订单';
  if(action==='cargoEscort'&&(s.operations.active||s.world.task||!s.naval.ships.some(a=>a.faction===1&&a.kind==='destroyer')))reason='先完成当前护航请求，并保有一艘驱逐舰';
  if(action==='cargoClaim'&&cargo.phase!=='delivered')reason='货物尚未送达，不能领取结款';
  if(action==='harbor'&&c.invested.port+cost<55)reason='先前港务投入不足；可保留预算结束协调';
  if(action==='medical'&&c.invested.cable+cost<75)reason='累计支援投入需至少75；可免费结束本轮支援';
  if(action==='harborRenew'&&(!c.harbor.notified||c.harbor.renewed))reason='没有待续签的绕行合同';
  if(action==='labRenew'&&(!c.lab.notified||c.lab.renewed))reason='没有待续签的科研交流';
  if(action==='medical'&&c.medical>=2||action==='insurance'&&c.insurance>=2)reason='本项保障仍有两轮额度，无需重复购买';
  if(action==='medicalRenew'&&(!c.medicalRenewed&&c.medical>0||c.medicalRenewed))reason='现有医疗保障尚未用完，或已完成本轮续约';
  if(action==='insuranceRenew'&&(!c.insuranceRenewed&&c.insurance>0||c.insuranceRenewed))reason='现有保险尚未用完，或已完成本轮续约';
  if(action==='procurement'&&c.procurement>=2)reason='已有两次快速交付资格，无需重复申请';
  if(action==='procurement'&&c.invested.budget+cost<80)reason='本轮公开采购累计投入需至少80；可免费结束差旅';
  if(action==='procurement'&&(s.homefront?.airDefense.batteries||0)+(s.homefront?.airDefense.order?1:0)>=2)reason='防空已部署或订购满额，无需再购买快速交付资格';
  if(['lab','labRenew'].includes(action)&&(s.strategy.levels.technology>=3||s.strategy.levels.technology===2&&s.strategy.project?.key==='technology'))reason='科技已满级或最后一级已开工，无需再购买新科技工程加速';
  return {ok:!reason,reason};
 }
 function enqueue(c,id){if(!c.pending.includes(id))c.pending.push(id);}
 function apply(s,eventId,choice,api){const c=get(s),action=choice.effects.consequence,family=eventId.startsWith('story_')?eventId.split('_')[1]:null;if(families.includes(family))c.invested[family]=Math.min(9999,c.invested[family]+choice.cost);
  if(action==='cargoSign'){c.cargo.phase='signed';enqueue(c,'consequence_cargo_departure');}
  if(action==='cargoEscort'){api.startOperation(s,'escort');c.cargo.phase='escort';c.cargo.attempt=s.operations.attempts;c.cargo.due=s.operations.active.endsAt;}
  if(action==='cargoCharter'){c.cargo.phase='shipping';c.cargo.due=s.time+16;}
  if(action==='cargoClaim'){c.cargo.phase='settled';c.cargo.until=s.time+90;s.strategy.funds+=180;}
  if(action==='cargoClose'&&['signed','delivered','failed'].includes(c.cargo.phase))c.cargo.phase='cancelled';
  if(action==='harbor'){c.harbor.until=s.time+120;c.harbor.notified=false;}
  if(action==='harborRenew'){c.harbor.until=s.time+90;c.harbor.renewed=true;}
  if(action==='lab'){c.lab.until=s.time+90;c.lab.notified=false;}
  if(action==='labRenew'){c.lab.until=s.time+90;c.lab.renewed=true;}
  if(action==='medical'||action==='medicalRenew'){c.medical=2;if(action==='medicalRenew')c.medicalRenewed=true;}
  if(action==='insurance'||action==='insuranceRenew'){c.insurance=2;if(action==='insuranceRenew')c.insuranceRenewed=true;}
  if(action==='procurement')c.procurement=2-(s.homefront?.airDefense.batteries||0)-(s.homefront?.airDefense.order?1:0);
 }
 function consumeStrike(s){const c=get(s);if(!c)return;if(c.medical>0&&--c.medical===0&&!c.medicalRenewed)enqueue(c,'consequence_medical_report');if(c.insurance>0&&--c.insurance===0&&!c.insuranceRenewed)enqueue(c,'consequence_insurance_report');}
 function onWar(s){const c=get(s);if(!c)return;if(['signed','escort','shipping'].includes(c.cargo.phase)){c.cargo.phase='cancelled';c.pending=c.pending.filter(id=>!id.startsWith('consequence_cargo_'));s.world.queue=s.world.queue.filter(q=>!q.id.startsWith('consequence_cargo_'));s.world.news.unshift({text:'开战后未交付的民用订单中止，35资金备货投入不返还；已获得的医疗与保险保障保留。',kind:'diplomacy',at:s.time});s.world.news.length=Math.min(50,s.world.news.length);}}
 function tick(s,api){const c=get(s);if(!c)return;
  if(s.strategy.phase==='war')onWar(s);
  if(c.cargo.phase==='shipping'&&s.time>=c.cargo.due){c.cargo.phase='delivered';enqueue(c,'consequence_cargo_success');}
  if(c.cargo.phase==='escort'&&!s.operations.active&&s.operations.attempts===c.cargo.attempt){c.cargo.phase=s.operations.lastResult?.outcome==='success'?'delivered':'failed';enqueue(c,c.cargo.phase==='delivered'?'consequence_cargo_success':'consequence_cargo_failure');}
  for(const key of ['harbor','lab'])if(c[key].until>0&&s.time>=c[key].until&&!c[key].notified){c[key].notified=true;if(!c[key].renewed)enqueue(c,'consequence_'+key+'_renewal');}
  for(const id of [...c.pending])if(api.queue(s,id,id==='consequence_cargo_departure'?18:0).ok||s.world.active?.id===id||s.world.queue.some(q=>q.id===id))c.pending=c.pending.filter(v=>v!==id);
 }
 function summary(s){const c=get(s);if(!c)return [];const seconds=n=>Math.max(0,Math.ceil((n-s.time)/(s.campaign?.pace||.5))),rows=[];
  if(c.cargo.phase!=='idle'&&c.cargo.phase!=='cancelled')rows.push({id:'cargo',name:'民用竹子订单',detail:({signed:'已备货，等待发运选择；开战会中止',escort:'正在真实护航，补给船抵港后结款；开战会中止',shipping:'承运中，约'+seconds(c.cargo.due)+'秒后抵港；开战会中止',delivered:'货物已到，等待新闻中领取180资金',failed:'运送失败，35资金备货投入损失',settled:active(s,'cargo')?(s.strategy.phase==='war'?'战时停止民用续单':s.world.flags.duckBlockade||s.world.sanctions?'续单暂停：封锁或制裁':'已结款；民用续单收入 +'+(2*(s.campaign?.pace||.5)).toFixed(1)+'/秒')+' · 剩余'+seconds(c.cargo.until)+'秒':'订单已结清，续单期结束'})[c.cargo.phase],action:c.cargo.phase==='escort'?'escort':null});
  if(c.harbor.until)rows.push({id:'harbor',name:'港务绕行合同',detail:active(s,'harbor')?'可绕过鸭子封锁维持日本贸易；关系和制裁条件仍生效 · 剩余'+seconds(c.harbor.until)+'秒':'合同到期，封锁重新影响贸易'});
  if(c.lab.until)rows.push({id:'lab',name:'公开科研交流',detail:active(s,'lab')?'新启动科技工程用时缩短三分之一 · 剩余'+seconds(c.lab.until)+'秒':'交流到期，新工程恢复正常用时'});
  for(const [key,name,text] of [['medical','地区医疗互助','人员损失和民心损失各 −20%，不减少建筑损伤'],['insurance','城市应急保险','承担城市袭击应急支出的50%，不承担修复和补弹'],['procurement','公开采购档案','新防空订单交付由0.8周缩短至0.6周']])if(c[key]>0)rows.push({id:key,name,detail:text+' · 剩余'+c[key]+(key==='procurement'?'次采购':'轮袭击')});
  return rows;
 }
 function validate(s,value){if(value===undefined)return init(s);const c=value,bad=()=>{throw Error('国际事件后续存档无效。');},num=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b,int=(n,a,b)=>Number.isInteger(n)&&num(n,a,b);
  if(!c||c.version!==1||!c.invested||families.some(k=>!num(c.invested[k],0,9999))||!c.cargo||!['idle','signed','escort','shipping','delivered','failed','settled','cancelled'].includes(c.cargo.phase)||!num(c.cargo.due,0,s.time+60.1)||!num(c.cargo.until,0,s.time+90.1)||!(c.cargo.attempt===null||int(c.cargo.attempt,1,s.operations.attempts)))bad();
  if(c.cargo.phase==='escort'&&(c.cargo.attempt!==s.operations.attempts||s.operations.active?.kind!=='escort'))bad();
  for(const key of ['harbor','lab'])if(!c[key]||!num(c[key].until,0,s.time+(key==='harbor'?120.1:90.1))||typeof c[key].renewed!=='boolean'||typeof c[key].notified!=='boolean')bad();
  for(const key of ['medical','insurance','procurement'])if(!int(c[key],0,2))bad();
  if(typeof c.medicalRenewed!=='boolean'||typeof c.insuranceRenewed!=='boolean'||!Array.isArray(c.pending)||c.pending.length>eventIds.length||new Set(c.pending).size!==c.pending.length||c.pending.some(id=>!eventIds.includes(id)))bad();s.world.consequences=JSON.parse(JSON.stringify(c));return get(s);
 }
 return {init,active,bonuses,available,apply,consumeStrike,onWar,tick,summary,validate,eventIds};
});
