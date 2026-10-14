const test=require('node:test'),assert=require('node:assert/strict'),L=require('../marker-layout.js');
test('co-located army and naval icons remain individually clickable without covering cities or HUD',()=>{for(const [width,height] of [[1280,660],[390,786]]){const obstacles=[{x:width/2-10,y:height*.45-15,w:85,h:34},{x:8,y:height-178,w:Math.min(310,width-16),h:170}];const items=Array.from({length:14},(_,i)=>({id:i+1,x:width/2+(i%3),y:height*.45+(i%2)}));const placed=L.place(items,width,height,obstacles,8);assert.equal(placed.filter(m=>!m.hidden).length,14);assert.equal(placed[0].id,8);for(let i=0;i<placed.length;i++){const a=placed[i],b={x:a.x-17,y:a.y-17,w:34,h:34};assert.ok(!obstacles.some(o=>L.overlaps(b,o)));assert.ok(a.x>=25&&a.x<=width-25);for(const other of placed.slice(i+1))assert.ok(!L.overlaps(b,{x:other.x-17,y:other.y-17,w:34,h:34}));}}});
test('labels only occupy genuinely free space; blocked maps omit icons rather than overlap controls',()=>{const m={id:1,x:50,y:50,hidden:false};const obstacles=[{x:0,y:0,w:200,h:200}];assert.equal(L.callout(m,200,200,obstacles,[m]),null);assert.equal(L.place([{id:1,x:50,y:50}],200,200,obstacles)[0].hidden,true);assert.ok(L.callout(m,500,500,[],[m]));});
test('placement remains deterministic after changing viewport and while anchors move',()=>{const items=[{id:1,x:100,y:110},{id:2,x:102,y:110}];assert.deepEqual(L.place(items,400,600),L.place(items,400,600));for(const dx of [0,40,100]){const p=L.place(items.map(m=>({...m,x:m.x+dx})),390,700);assert.ok(!L.overlaps({x:p[0].x-17,y:p[0].y-17,w:34,h:34},{x:p[1].x-17,y:p[1].y-17,w:34,h:34}));}});

test('larger illustrated units and their callouts keep the full sprite footprint clear',()=>{
  for(const [width,height] of [[1280,660],[390,788]]){
    const obstacles=[{x:10,y:height-260,w:width-20,h:250},{x:10,y:15,w:280,h:90}];
    const items=Array.from({length:14},(_,i)=>({id:i+1,x:width/2+i%2,y:height*.42}));
    const markers=L.place(items,width,height,obstacles,1,56);
    assert.ok(markers.filter(m=>!m.hidden).length>=6);
    for(const a of markers.filter(m=>!m.hidden)){
      const footprint={x:a.x-28,y:a.y-28,w:56,h:56};
      assert.ok(!obstacles.some(o=>L.overlaps(footprint,o)));
      for(const b of markers.filter(b=>!b.hidden&&b.id!==a.id))assert.ok(!L.overlaps(footprint,{x:b.x-28,y:b.y-28,w:56,h:56}));
    }
  }
  const m={id:1,x:150,y:150,hidden:false};
  const label=L.callout(m,600,500,[],[m],132,29,56);
  assert.ok(label);
  assert.ok(!L.overlaps(label,{x:122,y:122,w:56,h:56}), 'name label must not cover illustrated unit');
});
