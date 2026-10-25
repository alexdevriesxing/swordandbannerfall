import test from 'node:test';import assert from 'node:assert/strict';import {PreparationPhase} from '../src/systems/preparation.js';
test('setup ends on the deadline',()=>{const p=new PreparationPhase({durationMs:3000});assert.equal(p.tick(2000),false);assert.equal(p.remaining(),1);assert.equal(p.tick(1000),true);assert.equal(p.phase,'fight');});
test('player can launch immediately',()=>{const p=new PreparationPhase();assert.equal(p.launch(),true);assert.equal(p.launch(),false);p.reset();assert.equal(p.phase,'setup');});
test('invalid time rejected',()=>{const p=new PreparationPhase();assert.throws(()=>p.tick(-1));});
