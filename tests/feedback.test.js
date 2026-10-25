import test from 'node:test';import assert from 'node:assert/strict';import {CombatFeed,BattlePacing} from '../src/systems/feedback.js';
test('event feed is bounded and expires',()=>{const f=new CombatFeed({maxEntries:2,lifetimeMs:1000});f.push(0,'A');f.push(10,'B');f.push(20,'C');assert.deepEqual(f.lines(20),['B','C']);assert.deepEqual(f.lines(1020),[]);});
test('pacing increases after lull and resets on hit',()=>{const p=new BattlePacing({staleMs:1000,boostMs:600});assert.equal(p.update(500,true),1);assert.equal(p.update(1000,true),1.25);p.impact(1100);assert.equal(p.update(1200,true),1);});
test('pacing does not boost during setup',()=>{const p=new BattlePacing({staleMs:100});assert.equal(p.update(999,false),1);});
