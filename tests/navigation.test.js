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
