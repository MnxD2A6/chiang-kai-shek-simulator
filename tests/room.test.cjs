const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function harness(){const handlers={},windowHandlers={};const ctx={fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},closePath(){}};const prompt={textContent:''};const canvas={dataset:{},getContext:()=>ctx,addEventListener(){}};const sandbox={window:{addEventListener:(k,f)=>windowHandlers[k]=f},document:{addEventListener:(k,f)=>handlers[k]=f,getElementById:()=>prompt},requestAnimationFrame:()=>1,Math};vm.runInNewContext(fs.readFileSync(require.resolve('../room.js'),'utf8'),sandbox);let blocked=false,calls=[];const room=new sandbox.window.PixelRoom(canvas,id=>calls.push(id),()=>blocked);return {room,canvas,handlers,windowHandlers,calls,block:()=>blocked=true};}
test('holding WASD moves player, while map table prevents crossing',()=>{
  const h=harness();h.handlers.keydown({key:'w',target:{tagName:'CANVAS'},preventDefault(){}});for(let t=16;t<4000;t+=16)h.room.tick(t);
  assert.ok(h.room.player.y<150);assert.ok(h.room.player.y>=118);assert.equal(h.room.nearest().id,'map');h.room.interact();assert.deepEqual(h.calls,['map']);
});
test('touch directions move, cancellation releases and a modal blocks movement',()=>{
  const h=harness();h.room.moveKey('right',true);h.room.tick(16);h.room.tick(56);const x=h.room.player.x;assert.ok(x>160);
  h.room.moveKey('right',false);h.room.tick(96);assert.equal(h.room.player.x,x);h.room.moveKey('right',true);h.block();h.room.tick(136);assert.equal(h.room.player.x,x);assert.equal(h.room.keys.size,0);
});
test('window blur clears held keys to prevent runaway movement',()=>{const h=harness();h.room.moveKey('left',true);h.windowHandlers.blur();assert.equal(h.room.keys.size,0);});
test('click navigation finds a route around furniture then interacts exactly once',()=>{const h=harness();assert.equal(h.room.walkTo(65,78,'phone'),true);for(let t=16;t<6000;t+=16)h.room.tick(t);assert.deepEqual(h.calls,['phone']);assert.ok(Math.hypot(h.room.player.x-65,h.room.player.y-78)<34);assert.equal(h.room.collides(h.room.player.x,h.room.player.y),false);});
