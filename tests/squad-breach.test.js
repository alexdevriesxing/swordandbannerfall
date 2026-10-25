import test from 'node:test';import assert from 'node:assert/strict';import {CompanionDirector} from '../src/systems/companions.js';import {BattlefieldCover} from '../src/systems/cover.js';
test('autonomous hunting AI attacks cover blocking its chosen target',()=>{
 const d=new CompanionDirector();d.add('blue',380,{role:'ranger'});d.command('blue','hunt');
 const cover=new BattlefieldCover([{id:'gate',x:450,width:50,hp:30}]);
 const champions={blue:{team:'blue',x:190,hp:100},red:{team:'red',x:720,hp:100}};
 const actions=d.update(1000,100,champions,cover);
 assert.equal(actions.filter(a=>a.type==='cover-attack').length,1);
 assert.equal(actions.find(a=>a.type==='cover-attack').coverId,'gate');
});
test('guard squads do not automatically destroy distant cover',()=>{
 const d=new CompanionDirector();d.add('blue',380,{role:'ranger'});
 const cover=new BattlefieldCover([{id:'gate',x:450,width:50,hp:30}]);
 const champions={blue:{team:'blue',x:190,hp:100},red:{team:'red',x:720,hp:100}};
 assert.equal(d.update(1000,100,champions,cover).filter(a=>a.type==='cover-attack').length,0);
});
