import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchControlMode,MATCH_CONTROL_MODES} from '../src/systems/match-control-mode.js';
test('the default experience is a complete 10v10 VS AI battle',()=>{
 const mode=new MatchControlMode();
 assert.deepEqual(MATCH_CONTROL_MODES,['vs-ai','local-2p']);
 assert.deepEqual(mode.snapshot(),{mode:'vs-ai',localTwoPlayer:false,locked:false});
});
test('player can choose a second human champion in preparation only',()=>{
 const mode=new MatchControlMode();
 assert.equal(mode.toggle(),true);
 assert.equal(mode.localTwoPlayer,true);
 assert.equal(mode.toggle(),true);
 assert.equal(mode.localTwoPlayer,false);
 mode.toggle();
 assert.equal(mode.begin(),true);
 assert.equal(mode.toggle(),false);
 assert.equal(mode.mode,'local-2p');
 assert.equal(mode.begin(),false);
});
test('new scene starts with default AI controls and no previous match state',()=>{
 const prior=new MatchControlMode();prior.toggle();prior.begin();
 const replay=new MatchControlMode();
 assert.equal(prior.mode,'local-2p');
 assert.equal(replay.mode,'vs-ai');
 assert.equal(replay.locked,false);
});
