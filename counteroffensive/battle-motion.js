(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FrontMotion=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const pose=(time,id,moving,sea,reduced)=>reduced?{frame:0,bob:0,tilt:0}:{frame:moving?Math.floor(time*5.5+id*.37)%4:0,bob:sea?Math.sin(time*2.4+id)*.9:moving?-Math.abs(Math.sin(time*8.6+id))*1.8:0,tilt:sea?Math.sin(time*2+id)*.022:0};
 const settle=(age,reduced)=>reduced||age<0||age>.65?0:Math.sin(age/.65*Math.PI*2)*3*(1-age/.65);
 const hit=(age,reduced)=>reduced||age<0||age>.18?0:Math.sin(age/.18*Math.PI)*2.8;
 return {pose,settle,hit};
});
