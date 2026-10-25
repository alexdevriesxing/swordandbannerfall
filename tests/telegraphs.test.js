import test from 'node:test';import assert from 'node:assert/strict';import {AttackTelegraphs,healthLabel} from '../src/systems/telegraphs.js';
test('telegraphed attack does not land before its windup',()=>{const t=new AttackTelegraphs({windupMs:400});t.schedule(100,'red-1','blue-2',15);assert.equal(t.popReady(499).length,0);assert.equal(t.popReady(500).length,1);assert.equal(t.popReady(999).length,0);});
test('cancel prevents phantom attacks from eliminated units',()=>{const t=new AttackTelegraphs();t.schedule(0,'a','b',10);t.schedule(0,'c','d',9);assert.equal(t.cancelFor('a'),1);assert.deepEqual(t.popReady(1000).map(x=>x.attacker),['c']);});
test('bounded pending attacks',()=>{const t=new AttackTelegraphs({maxPending:1});assert.ok(t.schedule(0,'a','b',10));assert.equal(t.schedule(0,'c','d',10),null);});
test('health is clamped and readable',()=>{assert.equal(healthLabel(-5,80),'0/80');assert.equal(healthLabel(14.2,80),'15/80');});
