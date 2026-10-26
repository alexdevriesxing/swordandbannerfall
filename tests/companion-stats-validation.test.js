import test from 'node:test';
import assert from 'node:assert/strict';
import { CompanionDirector } from '../src/systems/companions.js';

test('invalid companion statistics do not enter the active roster', () => {
 const director = new CompanionDirector({maxPerTeam:9});
 for(const stats of [{hp:0},{hp:Infinity},{damage:0},{damage:NaN},{speed:-1},{speed:Infinity}]) {
  assert.throws(() => director.add('blue',200,stats), RangeError);
 }
 assert.equal(director.units.length,0);
 assert.equal(director.add('blue',200,{role:'sentinel'}).hp,100);
});
