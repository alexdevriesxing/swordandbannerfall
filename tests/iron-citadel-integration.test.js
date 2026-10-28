import test from 'node:test';
import assert from 'node:assert/strict';
import {CompanionDirector} from '../src/systems/companions.js';
import {PlatformRoutes} from '../src/systems/platform-routes.js';
import {IRON_CITADEL_GANTRIES,IRON_CITADEL_NODES,IRON_CITADEL_LINKS,validateIronCitadel} from '../src/levels/iron-citadel.js';
const arena=()=>new PlatformRoutes(IRON_CITADEL_NODES,IRON_CITADEL_LINKS);
test('authored gantry visuals match the AI landing centers',()=>{
 assert.equal(validateIronCitadel(),true);
 assert.equal(IRON_CITADEL_GANTRIES.length,2);
 for(const gantry of IRON_CITADEL_GANTRIES){
  const landing=arena().nodes.get(gantry.id);
  assert.equal(landing.y,gantry.landingY);
  assert.equal(landing.width,gantry.width);
 }
});
test('AI route spans both elevated platforms using connected ground waypoints',()=>{
 const route=arena().route('west-gantry','east-gantry');
 assert.deepEqual(route?.map(n=>n.id),['west-gantry','west-foot','west-cross','east-cross','east-foot','east-gantry']);
});
test('autonomous hunter descends from elevated gantry onto authored ground landing',()=>{
 const ai=new CompanionDirector();
 const blue=ai.add('blue',350,{role:'ranger',platformNode:'west-gantry'});
 ai.add('red',1030,{platformNode:'east-foot'});
 ai.command('blue','hunt');
 const champions={blue:{team:'blue',x:220,y:590,hp:0},red:{team:'red',x:1030,y:590,hp:0}};
 const start=ai.update(1000,16,champions,null,arena());
 assert.ok(start.some(a=>a.type==='move'&&a.id===blue.id&&a.jumping===true));
 ai.update(2000,16,champions,null,arena());
 assert.equal(ai.units.find(u=>u.id===blue.id).platformNode,'west-foot');
});
test('same-height waypoint traversals walk instead of jumping',()=>{
 const ai=new CompanionDirector();const blue=ai.add('blue',250,{role:'vanguard',platformNode:'west-foot'});
 ai.add('red',1030,{platformNode:'east-foot'});
 ai.command('blue','hunt');
 const champions={blue:{team:'blue',x:250,hp:0},red:{team:'red',x:1030,hp:0}};
 ai.update(1000,100,champions,null,arena());
 const actor=ai.units.find(u=>u.id===blue.id);
 assert.ok(actor.x>250);
 assert.equal(actor.platformJump,undefined);
});
test('units assigned to a gantry cannot walk past the platform edge',()=>{
 const ai=new CompanionDirector();const blue=ai.add('blue',350,{role:'ranger',platformNode:'west-gantry'});
 ai.add('red',1200,{role:'vanguard'});
 ai.command('blue','guard');
 const champions={blue:{team:'blue',x:1200,hp:100},red:{team:'red',x:1200,hp:100}};
 ai.update(1000,10000,champions,null,arena());
 assert.ok(ai.units.find(u=>u.id===blue.id).x<=454);
});

test('Iron Citadel ground ranger does not stall behind an ally on a raised gantry',()=>{
 const ai=new CompanionDirector({maxPerTeam:3});
 const ranger=ai.add('blue',200,{role:'ranger',platformNode:'west-foot'});
 const upper=ai.add('blue',350,{role:'vanguard',platformNode:'west-gantry'});
 ai.command('blue','hunt');
 const champions={
  blue:{team:'blue',x:150,y:590,hp:0},
  red:{team:'red',x:900,y:590,hp:100}
 };
 const actions=ai.update(1000,1000,champions,null,arena());
 const actual=ai.units.find(u=>u.id===ranger.id);
 assert.equal(actual.y,590);
 assert.ok(actual.x>310,
  'ranger should advance along the ground, independent of gantry allies');
 assert.equal(ai.units.find(u=>u.id===upper.id).y,445);
 assert.ok(actions.some(a=>a.type==='move'&&a.id===ranger.id&&a.x===actual.x));
});
test('the same Iron Citadel elevation separation works for the red faction',()=>{
 const ai=new CompanionDirector({maxPerTeam:3});
 const ranger=ai.add('red',1000,{role:'ranger',platformNode:'east-foot'});
 const upper=ai.add('red',930,{role:'sentinel',platformNode:'east-gantry'});
 ai.command('red','hunt');
 const champions={
  blue:{team:'blue',x:200,y:590,hp:100},
  red:{team:'red',x:1100,y:590,hp:0}
 };
 ai.update(1000,1000,champions,null,arena());
 assert.ok(ai.units.find(u=>u.id===ranger.id).x<900);
 assert.equal(ai.units.find(u=>u.id===upper.id).y,445);
});
