import test from 'node:test';
import assert from 'node:assert/strict';
import {CompanionDirector} from '../src/systems/companions.js';
import {BattlefieldCover} from '../src/systems/cover.js';
const champions={blue:{team:'blue',x:190,hp:100},red:{team:'red',x:720,hp:100}};
test('full four-companion groups are accepted but fifth is refused',()=>{
 const d=new CompanionDirector({maxPerTeam:4});
 for(let i=0;i<4;i++)assert.ok(d.add('blue',90+i*20));
 assert.equal(d.add('blue',200),null);
 for(let i=0;i<4;i++)assert.ok(d.add('red',1000+i*20));
 assert.equal(d.snapshot().units.length,8);
});
test('cover blocks pursuit and attacks until destroyed',()=>{
 const cover=new BattlefieldCover([{id:'b',x:450,width:100,hp:30}]);
 const d=new CompanionDirector();
 const u=d.add('blue',380,{role:'ranger'});
 d.command('blue','hunt');
 const first=d.update(1000,1000,champions,cover);
 assert.equal(first.some(a=>a.type==='attack'),false);
 assert.ok(d.units.find(x=>x.id===u.id).x<=365);
 cover.damage('b',30);
 const second=d.update(2100,1500,champions,cover);
 assert.ok(d.units.find(x=>x.id===u.id).x>365);
 assert.ok(second.some(a=>a.type==='attack'));
});
