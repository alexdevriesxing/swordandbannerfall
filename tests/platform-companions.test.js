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

test('ground Vanguard fights reachable target even when squad focuses upper gantry',()=>{
 const ai=new CompanionDirector({maxPerTeam:5});
 const frontline=ai.add('blue',200,{role:'vanguard'});
 for(let i=0;i<3;i++)ai.add('blue',180+i*5,{role:'ranger'});
 const elevated=ai.add('red',210,{role:'vanguard'});
 const ground=ai.add('red',285,{role:'vanguard'});
 ai.units.find(u=>u.id===elevated.id).y=445;
 ai.command('blue','hunt');
 const captains={
  blue:{team:'blue',x:110,y:590,hp:0},
  red:{team:'red',x:1100,y:590,hp:0}
 };
 const actions=ai.update(1000,0,captains);
 assert.equal(ai.coordinator.targets.blue,elevated.id,
  'mixed squad should focus the nearby elevated opponent collectively');
 assert.ok(actions.some(a=>a.type==='attack'&&a.id===frontline.id&&
   a.targetId===ground.id),
  'Vanguard must attack nearby ground enemy rather than stare at a raised foe');
});

test('red frontline uses the same reachable-opponent override',()=>{
 const ai=new CompanionDirector({maxPerTeam:5});
 const frontline=ai.add('red',1000,{role:'vanguard'});
 for(let i=0;i<3;i++)ai.add('red',1020-i*5,{role:'ranger'});
 const elevated=ai.add('blue',990,{role:'vanguard'});
 const ground=ai.add('blue',915,{role:'vanguard'});
 ai.units.find(u=>u.id===elevated.id).y=445;
 ai.command('red','hunt');
 const captains={
  blue:{team:'blue',x:180,y:590,hp:0},
  red:{team:'red',x:1180,y:590,hp:0}
 };
 const actions=ai.update(1000,0,captains);
 assert.equal(ai.coordinator.targets.red,elevated.id);
 assert.ok(actions.some(a=>a.type==='attack'&&a.id===frontline.id&&
   a.targetId===ground.id),'red Vanguard must attack its reachable opponent');
});

test('a sole elevated opponent stays eligible when no other foe survives',()=>{
 const ai=new CompanionDirector();
 const unit=ai.add('blue',200,{role:'vanguard'});
 const high=ai.add('red',270,{role:'sentinel'});
 ai.units.find(u=>u.id===high.id).y=445;
 ai.command('blue','hunt');
 const captains={
  blue:{team:'blue',x:110,y:590,hp:0},
  red:{team:'red',x:1100,y:590,hp:0}
 };
 const actions=ai.update(1000,100,captains);
 assert.ok(actions.some(a=>a.id===unit.id&&a.type==='move'),
  'the last opponent must remain a pursuit target');
 assert.ok(!actions.some(a=>a.id===unit.id&&a.type==='attack'),
  'pursuit must not authorize a vertically impossible melee hit');
});
