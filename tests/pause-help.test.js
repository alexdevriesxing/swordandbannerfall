import test from 'node:test';
import assert from 'node:assert/strict';
import {pauseHelp} from '../src/systems/pause-help.js';

test('default paused VS AI scene explains real blue keyboard controls',()=>{
 const text=pauseHelp();
 for(const label of ['A / D','W / SPACE','J  melee','K  ranged',
  'L  guard','E  squad order','F / G / H','1 / 2 / 3'])
  assert.ok(text.includes(label),label+' missing');
 assert.ok(text.includes('VS AI'));
 assert.ok(text.includes('press P'));
 assert.ok(text.includes('ESC OR CONTROLLER BACK'));
 assert.equal(text.includes('RED CHAMPION'),false);
});
test('paused local two-player mode explains complete red bindings',()=>{
 const text=pauseHelp({localTwoPlayer:true});
 for(const label of ['RED CHAMPION','LEFT / RIGHT','UP  jump',
  'DOWN  drop','U  melee','I  ranged','O  guard',
  'R  squad order','V / B / N','Q / T / Y'])
  assert.ok(text.includes(label),label+' missing');
 assert.equal(text.includes('VS AI —'),false);
});
test('control reference has predictable text for repeated pause launches',()=>{
 assert.equal(pauseHelp({localTwoPlayer:true}),pauseHelp({localTwoPlayer:true}));
 assert.equal(pauseHelp(),pauseHelp({localTwoPlayer:false}));
});
