import test from 'node:test';import assert from 'node:assert/strict';import {jumpPlan,advanceJump,GROUND_Y} from '../src/systems/navigation.js';import {BattlefieldCover} from '../src/systems/cover.js';
test('hunter can arc over a short obstacle after approaching it',()=>{const c=new BattlefieldCover([{id:'crate',x:400,width:60,hp:40}]);const u={id:1,x:300};const plan=jumpPlan(u,500,c,{timeMs:1000});assert.ok(plan);u.jump=plan;const mid=advanceJump(u,1425);assert.ok(mid.y<GROUND_Y);const end=advanceJump(u,1850);assert.equal(end.y,GROUND_Y);assert.equal(end.jumping,false);assert.equal(u.jump,null);});
test('tall-width obstacles must be breached, not jumped',()=>{const c=new BattlefieldCover([{id:'wall',x:400,width:180,hp:90}]);assert.equal(jumpPlan({x:240},700,c,{timeMs:1000}),null);});
test('jump cooldown prevents repeated crossing',()=>{const c=new BattlefieldCover([{id:'crate',x:400,width:60,hp:40}]);assert.equal(jumpPlan({x:300,nextJumpAt:6000},500,c,{timeMs:4000}),null);});

test('a hop on an elevated lane starts and finishes at that lane, not ground level',()=>{
 const cover=new BattlefieldCover([{id:'upper-wall',x:620,width:82,hp:80,topY:420}]);
 const unit={id:12,x:550,y:445};
 const plan=jumpPlan(unit,750,cover,{timeMs:1000});
 assert.ok(plan,'authored raised cover should be hop-able');
 assert.equal(plan.startY,445);
 unit.jump=plan;
 const start=advanceJump(unit,1000);
 assert.equal(start.y,445,'jump may not snap down to the ground when it starts');
 unit.y=start.y;
 const mid=advanceJump(unit,1425);
 assert.ok(mid.y<445,'hop must rise from the elevated platform');
 unit.y=mid.y;
 const end=advanceJump(unit,1850);
 assert.equal(end.y,445,'fighter should land at original authored elevation');
 assert.equal(end.jumping,false);
 assert.equal(unit.jump,null);
});
test('a ground hop retains its ground floor baseline even without a y field',()=>{
 const cover=new BattlefieldCover([{id:'low-wall',x:620,width:82,hp:80}]);
 const unit={id:2,x:550};
 const plan=jumpPlan(unit,750,cover,{timeMs:1000});
 assert.equal(plan.startY,GROUND_Y);
 unit.jump=plan;
 assert.equal(advanceJump(unit,1000).y,GROUND_Y);
 assert.equal(advanceJump(unit,1850).y,GROUND_Y);
});
test('invalid fighter elevation fails closed rather than propagating NaN motion',()=>{
 const cover=new BattlefieldCover([{id:'wall',x:620,width:82,hp:80}]);
 assert.equal(jumpPlan({x:550,y:NaN},750,cover,{timeMs:1000}),null);
 assert.equal(jumpPlan({x:550,y:Infinity},750,cover,{timeMs:1000}),null);
});

test('the authored jump clears both physical wall edges, not merely its apex',()=>{
 const wall={id:'barricade',x:620,width:82,hp:90};
 const cover=new BattlefieldCover([wall]);
 const unit={id:9,x:550,y:590};
 const plan=jumpPlan(unit,750,cover,{timeMs:1000});
 assert.ok(plan,'standard floor barricade is traversable');
 assert.ok(plan.jumpHeight>115,'a shallow fixed hop would clip into the near wall');
 unit.jump=plan;
 for(const x of [wall.x-wall.width/2,wall.x+wall.width/2]){
  const t=(x-plan.startX)/(plan.endX-plan.startX);
  const flight=advanceJump(unit,1000+850*t);
  assert.ok(flight.y+32.5<=(wall.topY??517.5)-5,
   'feet must clear the wall edge at x='+x);
 }
});

test('reject too-tall authored walls if no safe arc is possible',()=>{
 const tall=new BattlefieldCover([{id:'fortress',x:620,width:82,hp:90,topY:300}]);
 assert.equal(jumpPlan({id:2,x:550,y:445},750,tall,{timeMs:1000}),null,
  'no fictional super-jump from an elevated platform');
 const highGround=new BattlefieldCover([{id:'high-fence',x:620,width:82,hp:90,topY:490}]);
 assert.equal(jumpPlan({id:2,x:550,y:590},750,highGround,{timeMs:1000}),null,
  'too-tall ground wall requires a breach rather than clipping');
});
