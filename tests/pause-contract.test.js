import test from 'node:test';
import assert from 'node:assert/strict';
import {canPauseMatch} from '../src/systems/pause-contract.js';
test('preparation and live battle permit tactical pause',()=>{
 for(const phase of ['setup','fight'])
  assert.equal(canPauseMatch({phase}),true);
});
test('finished match and expired demo cannot be paused into another session',()=>{
 for(const phase of ['finished','ended',null])
  assert.equal(canPauseMatch({phase}),false);
 assert.equal(canPauseMatch({phase:'fight',demoEnded:true}),false);
 assert.equal(canPauseMatch({phase:'setup',demoEnded:true}),false);
});
