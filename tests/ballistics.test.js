import test from 'node:test';
import assert from 'node:assert/strict';
import {aimVelocity,overlapsCompanion} from '../src/systems/ballistics.js';
test('shots aimed at raised platforms travel upward',()=>{
 const v=aimVelocity({x:200,y:570},{x:400,y:428});
 assert.ok(v.x>0&&v.y<0);
 assert.ok(Math.abs(Math.hypot(v.x,v.y)-650)<0.0001);
});
test('horizontal shots have zero vertical drift',()=>{
 const v=aimVelocity({x:600,y:570},{x:200,y:570});
 assert.ok(v.x<0);assert.equal(v.y,0);
});
test('projectile must actually reach the target elevation',()=>{
 const upper={id:7,x:400,y:445};
 assert.equal(overlapsCompanion({x:400,y:563},upper),false);
 assert.equal(overlapsCompanion({x:400,y:428},upper),true);
});
test('invalid trajectory inputs are rejected',()=>{
 assert.throws(()=>aimVelocity({x:0,y:0},{x:Infinity,y:1}),RangeError);
 assert.equal(overlapsCompanion({x:0,y:0},{x:0,y:NaN}),false);
});
