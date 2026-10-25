import test from 'node:test';import assert from 'node:assert/strict';
import {PlatformRoutes} from '../src/systems/platform-routes.js';
import {CompanionDirector} from '../src/systems/companions.js';
test('hunter follows connected authored landings without direct player control',()=>{
 const platforms=new PlatformRoutes([{id:'low',x:100,y:590},{id:'middle',x:240,y:510},{id:'high',x:380,y:440}],[['low','middle'],['middle','high']]);
 const ai=new CompanionDirector();
 const blue=ai.add('blue',100,{platformNode:'low'});
 ai.add('red',380,{platformNode:'high'});
 ai.command('blue','hunt');
 const champions={blue:{team:'blue',x:100,hp:100},red:{team:'red',x:950,hp:100}};
 const first=ai.update(1000,16,champions,null,platforms);
 assert.equal(first.find(x=>x.id===blue.id&&x.type==='move')?.jumping,true);
 ai.update(2000,16,champions,null,platforms);
 assert.equal(ai.units.find(x=>x.id===blue.id).platformNode,'middle');
});

test('flat arena update requires no platform map and never throws',()=>{
 const ai=new CompanionDirector();ai.add('blue',100);ai.add('red',400);
 const champions={blue:{team:'blue',x:100,hp:100},red:{team:'red',x:400,hp:100}};
 assert.doesNotThrow(()=>ai.update(1000,16,champions));
});
test('elevated enemy cannot receive impossible ground-level melee hits',()=>{
 const platforms=new PlatformRoutes([{id:'ground',x:120,y:590},{id:'high',x:130,y:420}],[]);
 const ai=new CompanionDirector();ai.add('blue',120,{platformNode:'ground'});ai.add('red',130,{platformNode:'high'});
 const champions={blue:{team:'blue',x:120,hp:0},red:{team:'red',x:130,hp:0}};
 ai.command('blue','hunt');ai.command('red','hunt');
 const actions=ai.update(1000,16,champions,null,platforms);
 assert.equal(actions.filter(a=>a.type==='attack').length,0);
});

test('ranger can shoot between nearby elevations while melee fighters cannot',()=>{
 const platforms=new PlatformRoutes([{id:'low',x:200,y:590},{id:'upper',x:205,y:485}],[]);
 const ai=new CompanionDirector({attackCooldown:850});
 const ranger=ai.add('blue',200,{role:'ranger',platformNode:'low'});
 ai.add('red',205,{role:'vanguard',platformNode:'upper'});
 const champions={blue:{team:'blue',x:200,hp:0},red:{team:'red',x:205,hp:0}};
 ai.command('blue','hunt');
 const result=ai.update(1000,16,champions,null,platforms);
 assert.ok(result.some(a=>a.type==='attack'&&a.id===ranger.id));
});

test('ground melee AI cannot hit a champion standing on a gantry above it',()=>{
 const ai=new CompanionDirector();
 const fighter=ai.add('blue',200,{role:'vanguard'});
 ai.command('blue','hunt');
 const champs={
  blue:{team:'blue',x:180,y:590,hp:0},
  red:{team:'red',x:210,y:445,hp:100,platformNode:'high'}
 };
 const actions=ai.update(1000,0,champs);
 assert.equal(actions.some(a=>a.type==='attack'&&a.id===fighter.id),false);
});
test('ranger AI can attack elevated champions inside the ranged height envelope',()=>{
 const ai=new CompanionDirector();
 const fighter=ai.add('blue',200,{role:'ranger'});
 ai.command('blue','hunt');
 const champs={
  blue:{team:'blue',x:180,y:590,hp:0},
  red:{team:'red',x:210,y:445,hp:100,platformNode:'high'}
 };
 const actions=ai.update(1000,0,champs);
 assert.equal(actions.some(a=>a.type==='attack'&&a.id===fighter.id),true);
});
