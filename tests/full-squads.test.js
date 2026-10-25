import test from 'node:test';
import assert from 'node:assert/strict';
import {CompanionDirector} from '../src/systems/companions.js';
test('nine autonomous escorts plus champion per side and no tenth escort',()=>{
 const ai=new CompanionDirector({maxPerTeam:9});
 for(const team of ['blue','red']){
  for(let i=0;i<9;i++)assert.ok(ai.add(team,team==='blue'?70+i*31:1210-i*31,{role:['sentinel','ranger','vanguard'][i%3]}));
  assert.equal(ai.add(team,500),null);
 }
 assert.equal(ai.units.length,18);
 assert.equal(ai.units.filter(u=>u.team==='blue').length+1,10);
 assert.equal(ai.units.filter(u=>u.team==='red').length+1,10);
 const champions={blue:{team:'blue',x:220,hp:100},red:{team:'red',x:1050,hp:100}};
 const actions=ai.update(1000,16,champions);
 assert.equal(actions.filter(a=>a.type==='move').length,18);
 assert.ok(actions.every(a=>Number.isFinite(a.x??0)));
});
test('dead squad members stop acting in mass combat',()=>{
 const ai=new CompanionDirector({maxPerTeam:9});
 const unit=ai.add('blue',300);
 ai.add('red',900);
 ai.wound(unit.id,999);
 const moves=ai.update(1000,16,{blue:{team:'blue',x:220,hp:100},red:{team:'red',x:1050,hp:100}}).filter(a=>a.type==='move');
 assert.equal(moves.length,1);
});
