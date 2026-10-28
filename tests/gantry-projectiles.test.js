import test from 'node:test';
import assert from 'node:assert/strict';
import {sweptGantryContact} from '../src/systems/gantry-projectiles.js';
import {firstBattleProjectileContact} from '../src/systems/battle-projectiles.js';
import {IRON_CITADEL_GANTRIES} from '../src/levels/iron-citadel.js';
const collision=(a,b,more={})=>firstBattleProjectileContact(a,b,{
 firingTeam:'blue',companions:[],champions:null,gantries:IRON_CITADEL_GANTRIES,...more
});
test('stone platform intercepts a high-speed horizontal shot at its first edge',()=>{
 const hit=sweptGantryContact({x:100,y:490},{x:600,y:490},IRON_CITADEL_GANTRIES);
 assert.deepEqual(hit,{kind:'terrain',terrainKind:'gantry',id:'west-gantry',time:130/500});
});
test('a ground-level horizontal arrow travels underneath the stone gantry',()=>{
 assert.equal(collision({x:100,y:573},{x:600,y:573}),null);
});
test('an elevated horizontal arrow travels above the stone gantry',()=>{
 assert.equal(collision({x:100,y:428},{x:600,y:428}),null);
});
test('a vertical projectile is intercepted by the walkable platform body',()=>{
 const hit=collision({x:350,y:410},{x:350,y:560});
 assert.equal(hit?.kind,'terrain');
 assert.equal(hit?.id,'west-gantry');
 assert.ok(Math.abs(hit.time-68/150)<1e-9);
});
test('a bolt from below cannot hit a fighter beyond the gantry stonework',()=>{
 const contact=collision({x:200,y:573},{x:350,y:428},{
  companions:[{id:7,team:'red',x:350,y:445,hp:80}]
 });
 assert.equal(contact?.kind,'terrain');
 assert.equal(contact?.id,'west-gantry');
});
test('same elevated opponent is hittable if the shot avoids stone geometry',()=>{
 const contact=collision({x:600,y:428},{x:350,y:428},{
  companions:[{id:7,team:'red',x:350,y:445,hp:80}]
 });
 assert.equal(contact?.kind,'unit');
 assert.equal(contact?.id,7);
});
test('a fighter closer than terrain intercepts an otherwise blocked shot',()=>{
 const contact=collision({x:100,y:490},{x:600,y:490},{
  companions:[{id:19,team:'red',x:165,y:507,hp:80}]
 });
 assert.equal(contact?.kind,'unit');
 assert.equal(contact?.id,19);
});
test('shots from the east mirror the same stone obstruction rules',()=>{
 const hit=collision({x:1180,y:490},{x:670,y:490},{
  firingTeam:'red',companions:[{id:1,team:'blue',x:800,y:507,hp:100}]
 });
 assert.equal(hit?.kind,'terrain');
 assert.equal(hit?.id,'east-gantry');
});
test('terrain collision does not alter enemy health or original platform geometry',()=>{
 const before=JSON.stringify(IRON_CITADEL_GANTRIES);
 const fighter={id:7,team:'red',x:350,y:445,hp:80};
 const contact=collision({x:200,y:573},{x:350,y:428},{companions:[fighter]});
 assert.equal(contact.kind,'terrain');
 assert.equal(fighter.hp,80);
 assert.equal(JSON.stringify(IRON_CITADEL_GANTRIES),before);
});
test('invalid authored geometry is ignored and tie breaks are deterministic',()=>{
 const a={id:'alpha',x:300,y:490,width:100,height:24};
 const b={id:'beta',x:300,y:490,width:100,height:24};
 const bad={id:'invalid',x:NaN,y:490,width:100,height:24};
 const start={x:100,y:490},end={x:500,y:490};
 assert.equal(sweptGantryContact(start,end,[bad,b,a])?.id,'alpha');
 assert.equal(sweptGantryContact(start,end,[a,b,bad])?.id,'alpha');
 assert.equal(sweptGantryContact({x:NaN,y:490},end,[a]),null);
 assert.equal(sweptGantryContact(start,end,null),null);
});
