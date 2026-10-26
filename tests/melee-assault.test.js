import test from 'node:test';
import assert from 'node:assert/strict';
import {meleeAssaultGoal} from '../src/systems/formation.js';

test('frontline champions use separate assault distances',()=>{
 const target={x:700};
 assert.equal(meleeAssaultGoal({id:3,role:'vanguard',x:400},target,650),687);
 assert.equal(meleeAssaultGoal({id:6,role:'sentinel',x:420},target,650),665);
});
test('red assault mirrors blue while ranger goals remain unchanged',()=>{
 const target={x:300};
 assert.equal(meleeAssaultGoal({id:3,role:'vanguard',x:600},target,400),313);
 assert.equal(meleeAssaultGoal({id:6,role:'sentinel',x:600},target,400),335);
 assert.equal(meleeAssaultGoal({id:1,role:'ranger',x:600},target,400),400);
});
