import test from 'node:test';import assert from 'node:assert/strict';import {combatElevation} from '../src/systems/elevation.js';
test('ground combat remains legal',()=>assert.deepEqual(combatElevation({y:590},{y:590}),{melee:true,ranged:true}));
test('adjacent elevated platforms allow ranged but not melee',()=>assert.deepEqual(combatElevation({y:590},{y:480}),{melee:false,ranged:true}));
test('widely separated floors cannot attack each other',()=>assert.deepEqual(combatElevation({y:590},{y:330}),{melee:false,ranged:false}));
test('flat arena units use ground level by default',()=>assert.equal(combatElevation({x:100},{x:200}).melee,true));
