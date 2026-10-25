import test from 'node:test';
import assert from 'node:assert/strict';
import {sweptCompanionHit,sweptProjectileImpact} from '../src/systems/projectile-impact.js';

test('fast projectile crossing between frames still hits its assigned opponent',()=>{
 const target={x:200,y:590};
 assert.equal(sweptCompanionHit({x:120,y:573},{x:300,y:573},target),true);
});
test('projectile travelling at the wrong elevation misses target',()=>{
 assert.equal(sweptCompanionHit({x:120,y:430},{x:300,y:430},{x:200,y:590}),false);
});
test('projectile moving entirely away from a target misses',()=>{
 assert.equal(sweptCompanionHit({x:260,y:573},{x:340,y:573},{x:200,y:590}),false);
});
test('stationary shots can hit a nearby opponent but not a distant one',()=>{
 assert.equal(sweptCompanionHit({x:190,y:573},{x:190,y:573},{x:200,y:590}),true);
 assert.equal(sweptCompanionHit({x:100,y:573},{x:100,y:573},{x:200,y:590}),false);
});
test('invalid projectile paths fail closed',()=>{
 assert.equal(sweptCompanionHit({x:NaN,y:0},{x:1,y:1},{x:1,y:1}),false);
 assert.equal(sweptCompanionHit({x:0,y:0},{x:1,y:1},{x:1,y:1},{radius:-1}),false);
});

test('fast shot hits barricade before a companion on the far side',()=>{
 const cover={intact:()=>[{id:'wall',x:640,width:82,hp:120}]};
 assert.equal(sweptProjectileImpact({x:500,y:573},{x:800,y:573},{x:790,y:590},cover),'cover');
});
test('fast overhead shot hits elevated companion without hitting ground barricade',()=>{
 const cover={intact:()=>[{id:'wall',x:640,width:82,hp:120}]};
 assert.equal(sweptProjectileImpact({x:500,y:428},{x:800,y:428},{x:790,y:445},cover),'unit');
});
test('nearer companion is hit before a later barricade',()=>{
 const cover={intact:()=>[{id:'wall',x:640,width:82,hp:120}]};
 assert.equal(sweptProjectileImpact({x:500,y:573},{x:800,y:573},{x:550,y:590},cover),'unit');
});
test('unreached cover and distant unit produce no impact',()=>{
 const cover={intact:()=>[{id:'wall',x:640,width:82,hp:120}]};
 assert.equal(sweptProjectileImpact({x:500,y:573},{x:550,y:573},{x:790,y:590},cover),null);
});
test('vertical shots intersect cover only after descending below its top',()=>{
 const cover={intact:()=>[{id:'wall',x:640,width:82,hp:120}]};
 assert.equal(sweptProjectileImpact({x:640,y:430},{x:640,y:590},{x:640,y:590},cover),'cover');
});
