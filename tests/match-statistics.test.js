import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchStatistics,matchStatSummary} from '../src/systems/match-statistics.js';
import {CombatDirector} from '../src/systems/combat.js';

test('combat totals include only applied, non-zero damage',()=>{
 const stats=new MatchStatistics();
 stats.hit('blue',21);
 stats.hit('blue',0);
 stats.hit('blue',9);
 stats.hit('red',12);
 assert.equal(stats.snapshot().blue.damageDealt,30);
 assert.equal(stats.snapshot().blue.hits,2);
 assert.equal(stats.snapshot().red.damageDealt,12);
 assert.equal(stats.snapshot().red.hits,1);
});
test('shots, cover damage and comeback choices are independent per team',()=>{
 const stats=new MatchStatistics();
 stats.shot('blue');stats.shot('blue');stats.shot('red');
 stats.breach('blue',18);stats.breach('blue',0);
 stats.card('red');
 assert.deepEqual(stats.snapshot().blue,{
  damageDealt:0,hits:0,shots:2,cards:0,coverDamage:18
 });
 assert.deepEqual(stats.snapshot().red,{
  damageDealt:0,hits:0,shots:1,cards:1,coverDamage:0
 });
});
test('snapshot cannot modify combat records',()=>{
 const stats=new MatchStatistics();
 const snap=stats.snapshot();
 snap.blue.shots=999;snap.red.hits=999;
 assert.equal(stats.snapshot().blue.shots,0);
 assert.equal(stats.snapshot().red.hits,0);
});
test('freshly started match has no statistics from previous battle',()=>{
 const old=new MatchStatistics();old.shot('red');old.hit('blue',90);
 const replay=new MatchStatistics();
 assert.equal(replay.snapshot().blue.damageDealt,0);
 assert.equal(replay.snapshot().red.shots,0);
});
test('post-match result summary is deterministic and accurate',()=>{
 const stats=new MatchStatistics();
 stats.hit('blue',19);stats.shot('blue');stats.breach('red',18);
 assert.equal(matchStatSummary(stats.snapshot()),
  'BLUE  DAMAGE 19  HITS 1  SHOTS 1  BREACH 0  CARDS 0\n'+
  'RED  DAMAGE 0  HITS 0  SHOTS 0  BREACH 18  CARDS 0');
 assert.equal(matchStatSummary(null),'');
});
test('statistics rejects invalid team and negative health or cover values',()=>{
 const stats=new MatchStatistics();
 assert.throws(()=>stats.shot('neutral'),/team/);
 assert.throws(()=>stats.card('neutral'),/team/);
 assert.throws(()=>stats.hit('blue',-1),RangeError);
 assert.throws(()=>stats.breach('red',Infinity),RangeError);
 assert.deepEqual(stats.snapshot().blue,{damageDealt:0,hits:0,shots:0,cards:0,coverDamage:0});
});

test('victory damage totals use applied HP, not nominal overkill attack damage',()=>{
 const combat=new CombatDirector();
 const stats=new MatchStatistics();
 combat.fighters.enemy.hp=4;
 const result=combat.damage('enemy',1000,'ranged');
 stats.hit('blue',result.applied);
 assert.deepEqual(result,{applied:4,ko:true});
 assert.equal(stats.snapshot().blue.damageDealt,4);
 assert.equal(stats.snapshot().blue.hits,1);
});
