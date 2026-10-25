import test from 'node:test';
import assert from 'node:assert/strict';
import {EliminationMatch} from '../src/systems/elimination.js';
import {CompanionDirector} from '../src/systems/companions.js';
import {nearestOpponent} from '../src/systems/targeting.js';
import {PreparationPhase} from '../src/systems/preparation.js';
import {BattlefieldCover} from '../src/systems/cover.js';

test('complete preparation to 10v10 victory without respawns',()=>{
 const match=new EliminationMatch();
 const companions=new CompanionDirector({maxPerTeam:9});
 const prep=new PreparationPhase({durationMs:1000});
 match.register('blue','hero');match.register('red','enemy');
 for(const team of ['blue','red']){
  for(let i=0;i<9;i++){
   const unit=companions.add(team,team==='blue'?90+i*24:1190-i*24,{role:['sentinel','ranger','vanguard'][i%3]});
   assert.ok(unit);match.register(team,'ai-'+unit.id);
  }
 }
 assert.equal(prep.tick(1000),true);match.begin();
 assert.deepEqual(match.snapshot().remaining,{blue:10,red:10});
 const targets=companions.units.filter(u=>u.team==='red');
 for(const unit of targets){
  const hit=companions.wound(unit.id,unit.hp);
  assert.equal(hit.ko,true);
  const result=match.eliminate('ai-'+unit.id);
  assert.equal(result.accepted,true);
 }
 assert.equal(match.remaining('red'),1);
 assert.equal(match.eliminate('enemy').winner,'blue');
 assert.equal(match.phase,'finished');
 assert.equal(match.eliminate('enemy').accepted,false);
 assert.equal(match.remaining('blue'),10);
});
test('player can target hostile companions after hostile champion is eliminated',()=>{
 const ai=new CompanionDirector({maxPerTeam:9});
 const foe=ai.add('red',180,{role:'vanguard'});
 const champions={blue:{x:100,hp:100},red:{x:1000,hp:0}};
 const chosen=nearestOpponent(100,'blue',champions,ai.units,{range:112});
 assert.equal(chosen?.id,foe.id);
 assert.equal(chosen?.kind,'companion');
});
test('destroyed cover opens a previously blocked squad target',()=>{
 const cover=new BattlefieldCover([{id:'wall',x:140,width:30,hp:20}]);
 const foe={id:1,team:'red',x:180,hp:50};
 const champions={blue:{x:100,hp:100},red:{x:1000,hp:100}};
 assert.equal(nearestOpponent(100,'blue',champions,[foe],{range:100,cover}),null);
 cover.damage('wall',20);
 assert.equal(nearestOpponent(100,'blue',champions,[foe],{range:100,cover})?.id,1);
});
