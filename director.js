(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GameDirector=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function guide(s,f){if(!f.active||s.over)return null;
  if(s.turn>0)return {id:'complete',number:6,title:'你已经学会一轮怎么玩了',text:'上海现在出现进攻预告。打开地图，看看守备能否挡住压力；电话、方针和后勤也都已开放。',button:'开始自由指挥',target:'#viewMap'};
  if(!s.eventDone)return {id:'phone',number:1,title:'先接起电话，处理来电',text:'你每回合先做一项事件决定。这一步免费，不会用掉三个行动点。',button:'接听来电',target:'#phoneBtn'};
  if(!f.mapOpened)return {id:'map',number:2,title:'走到地图桌，或直接打开战略图',text:'按 W / ↑ 向前走，靠近地图桌后按 E。也可以点击下面的按钮用鼠标继续。',button:'打开战略图',target:'#room'};
  if(!f.citySelected)return {id:'city',number:3,title:'选择重庆，建设后方',text:'点击地图上的「重庆」。城市被选中后，下方的命令会作用于这座城市。',button:'选择重庆',target:'[data-city="chongqing"]'};
  if(s.industry<5&&(s.ap===0||s.treasury<16))return {id:'settle',number:5,title:'本轮行动或资金已不足，仍可继续',text:'你的其他命令用掉了部分预算。本轮任务不强制完成，可以先结束回合，再根据战报调整下一轮。',button:'结束回合，看看结果',target:'#endTurnBtn'};
  if(s.industry<5)return {id:'industry',number:4,title:`在重庆建设工业（${Math.min(2,Math.max(0,(s.industry-1)/2))} / 2）`,text:'点击「发展工业」两次。每次消耗 16 国库与 1 行动，工业 +2；以后每轮都会增加收入和粮食生产。',button:'在重庆发展工业',target:'[data-action="industry"]'};
  return {id:'settle',number:5,title:'本轮任务完成，看看结算',text:s.ap>0?`你还剩 ${s.ap} 个行动，可以自己试试其他命令，也可以结束回合。没有用完的行动不会累计。`:'三个行动已用完。结束回合，看城市、工业和资源怎样结算。',button:'结束回合，查看战报',target:'#endTurnBtn'};
 }
 function initialView(s,f){const step=guide(s,f);return step&&['city','industry','settle','complete'].includes(step.id)?'map':'room';}
 return {guide,initialView};
});
