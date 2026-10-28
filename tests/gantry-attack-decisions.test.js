import test from 'node:test';
import assert from 'node:assert/strict';
import {CompanionDirector} from '../src/systems/companions.js';
import {validImpact} from '../src/systems/impact.js';
import {PlatformRoutes} from '../src/systems/platform-routes.js';
import {IRON_CITADEL_GANTRIES,IRON_CITADEL_NODES,IRON_CITADEL_LINKS} from '../src/levels/iron-citadel.js';

const fallen=()=>({
 blue:{team:'blue',x:100,y:590,hp:0},
 red:{team:'red',x:1130,y:590,hp:0}
});
function obstructedShot(team='blue') {
 const ai=new CompanionDirector();
 const isBlue=team==='blue';
 const shooter=ai.add(team,isBlue?200:1080,{role:'ranger'});
 const victim=ai.add(isBlue?'red':'blue',isBlue?350:930,{role:'vanguard'});
 ai.units.find(u=>u.id===victim.id).y=445;
 ai.command(team,'hunt');
 return {ai,shooter,victim};
}

test('blue ranger does not burn a cooldown on a shot through the west gantry',()=>{
 const {ai,shooter}=obstructedShot();
 const actions=ai.update(1000,0,fallen(),null,null,null,IRON_CITADEL_GANTRIES);
 assert.equal(actions.some(a=>a.type==='attack'&&a.id===shooter.id),false);
 const ranger=ai.units.find(u=>u.id===shooter.id);
 assert.equal(ranger.lastAttack,-Infinity);
 assert.equal(ranger.lastAbility,undefined,'blocked precision shot must not activate');
});

test('red ranger obeys same no-shot rule at the east stone gantry',()=>{
 const {ai,shooter}=obstructedShot('red');
 const actions=ai.update(1000,0,fallen(),null,null,null,IRON_CITADEL_GANTRIES);
 assert.equal(actions.some(a=>a.type==='attack'&&a.id===shooter.id),false);
 assert.equal(ai.units.find(u=>u.id===shooter.id).lastAttack,-Infinity);
});

test('the same ranged targets remain valid in a flat level without gantries',()=>{
 const {ai,shooter,victim}=obstructedShot();
 const actions=ai.update(1000,0,fallen());
 assert.ok(actions.some(a=>a.type==='attack'&&a.id===shooter.id&&
  a.targetId===victim.id));
});

test('a ranger on an upper walkway may still shoot along its clear overhead lane',()=>{
 const platforms=new PlatformRoutes(IRON_CITADEL_NODES,IRON_CITADEL_LINKS);
 const ai=new CompanionDirector();
 const ranger=ai.add('blue',350,{role:'ranger',platformNode:'west-gantry'});
 const enemy=ai.add('red',440,{role:'vanguard',platformNode:'west-gantry'});
 ai.command('blue','hunt');
 const moves=ai.update(1000,0,fallen(),null,platforms,null,IRON_CITADEL_GANTRIES);
 assert.ok(moves.some(a=>a.type==='attack'&&a.id===ranger.id&&a.targetId===enemy.id));
});

test('delayed precision impact must recheck stone gantry obstruction at release',()=>{
 const attacker={id:2,team:'blue',role:'ranger',x:200,y:590,hp:45};
 const target={id:7,team:'red',x:350,y:445,hp:80};
 const params={attacker,target,range:260,gantries:IRON_CITADEL_GANTRIES};
 assert.equal(validImpact(params),false);
 assert.equal(validImpact({...params,gantries:[]}),true);
 // Target moved to the same ground lane before the telegraph ended.
 assert.equal(validImpact({...params,target:{...target,y:590}}),true);
});

test('melee windups also reject solid stone platforms when geometry is provided',()=>{
 const attacker={id:2,team:'blue',role:'vanguard',x:270,y:505,hp:80};
 const target={id:7,team:'red',x:340,y:445,hp:80};
 const params={attacker,target,range:90,gantries:IRON_CITADEL_GANTRIES};
 assert.equal(validImpact(params),false);
 assert.equal(validImpact({...params,gantries:[]}),true);
});
