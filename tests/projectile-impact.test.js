import test from 'node:test';
import assert from 'node:assert/strict';
import {sweptCompanionHit} from '../src/systems/projectile-impact.js';

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
