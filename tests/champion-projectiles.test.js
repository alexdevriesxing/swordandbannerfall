import test from 'node:test';
import assert from 'node:assert/strict';
import { planChampionShot } from '../src/systems/champion-projectiles.js';
import { sweptProjectileContact } from '../src/systems/projectile-impact.js';
import { BattlefieldCover } from '../src/systems/cover.js';

const attacker={team:'blue',x:430,y:590};
const enemy={id:'enemy',team:'red',x:1000,y:590,hp:100};

test('a champion fires a travelling bullet at an in-range opponent',()=>{
 const planned=planChampionShot({attacker,target:enemy,cover:new BattlefieldCover([])});
 assert.equal(planned.targetId,'enemy');
 assert.equal(planned.team,'blue');
 assert.equal(planned.damage,12);
 assert.equal(planned.coverDamage,18);
 assert.ok(planned.velocity.x>0);
 assert.ok(Math.abs(Math.hypot(planned.velocity.x,planned.velocity.y)-650)<1e-6);
});

test('firing does not immediately damage a barricade; projectile contact does',()=>{
 const cover=new BattlefieldCover([{id:'wall',x:620,width:82,hp:60}]);
 const before=cover.segments[0].hp;
 const planned=planChampionShot({attacker,target:enemy,cover});
 assert.equal(cover.segments[0].hp,before);
 const contact=sweptProjectileContact(planned.origin,{x:700,y:573},enemy,cover);
 assert.equal(contact.kind,'cover');
 assert.equal(contact.id,'wall');
 assert.equal(cover.segments[0].hp,before);
 cover.damage(contact.id,planned.coverDamage);
 assert.equal(cover.segments[0].hp,before-18);
});

test('cover-only shots work when living enemy fighters are out of range',()=>{
 const cover=new BattlefieldCover([{id:'near',x:600,width:82,hp:75}]);
 const planned=planChampionShot({attacker,target:null,lookToward:{x:1200,y:590},cover});
 assert.equal(planned.targetId,null);
 assert.ok(planned.velocity.x>0);
 assert.equal(sweptProjectileContact(planned.origin,{x:680,y:573},null,cover).id,'near');
 assert.equal(cover.segments[0].hp,75);
});

test('muzzle does not spawn behind solid cover close to the shooter',()=>{
 const shooter={...attacker,x:430};
 const cover=new BattlefieldCover([{id:'near',x:465,width:60,hp:60}]);
 const planned=planChampionShot({attacker:shooter,target:enemy,cover});
 assert.ok(planned.origin.x<435,'muzzle stays ahead of the near barricade');
 assert.equal(sweptProjectileContact(planned.origin,{x:490,y:573},enemy,cover).kind,'cover');
});

test('free fire launches a real bolt without inventing target damage',()=>{
 const empty=new BattlefieldCover([]);
 const remote=new BattlefieldCover([{id:'far',x:1140,width:80,hp:100}]);
 for(const cover of [empty,remote]){
  const shot=planChampionShot({attacker,lookToward:{x:1200,y:590},cover});
  assert.ok(shot,'player shoot input should not silently fail with no acquired enemy');
  assert.equal(shot.targetId,null,'free fire does not fabricate a hit target');
  assert.equal(shot.damage,12);
  assert.ok(shot.velocity.x>0&&shot.velocity.y===0);
  assert.equal(shot.origin.y,573);
  assert.equal(sweptProjectileContact(shot.origin,{x:950,y:573},null,cover),null);
 }
 assert.equal(remote.segments[0].hp,100,'launch must never damage distant walls');
});

test('free fire is symmetric for blue and red champions and empty sight is safe',()=>{
 const empty=new BattlefieldCover([]);
 const cases=[
  [{team:'blue',x:430,y:590},{x:1000,y:590},1],
  [{team:'red',x:900,y:590},{x:300,y:590},-1]
 ];
 for(const [shooter,sight,dir] of cases){
  const shot=planChampionShot({attacker:shooter,lookToward:sight,cover:empty});
  assert.ok(shot);
  assert.ok(shot.velocity.x*dir>0);
  assert.equal(shot.team,shooter.team);
  assert.equal(shot.targetId,null);
  assert.ok(Math.abs(Math.hypot(shot.velocity.x,shot.velocity.y)-650)<1e-6);
 }
 assert.equal(planChampionShot({attacker,cover:empty}),null);
 assert.equal(planChampionShot({attacker,lookToward:{x:NaN},cover:empty}),null);
 assert.equal(planChampionShot({attacker,target:{...enemy,team:'blue'},cover:empty}),null);
 assert.equal(planChampionShot({attacker,target:{...enemy,hp:0},cover:empty}),null);
});

test('free-fire arrow can later hit a moving enemy through actual swept collision',()=>{
 const cover=new BattlefieldCover([]);
 const shot=planChampionShot({attacker,lookToward:{x:1100,y:590},cover});
 const crossed=sweptProjectileContact(shot.origin,
  {x:800,y:573},{id:13,team:'red',x:650,y:590,hp:40},cover);
 assert.equal(crossed?.kind,'unit');
 assert.equal(crossed?.id,13);
});

test('elevated shots clear a ground barricade without registering a false hit',()=>{
 const cover=new BattlefieldCover([{id:'wall',x:620,width:82,hp:60}]);
 const elevated={...attacker,y:435};
 const upEnemy={...enemy,y:435};
 const planned=planChampionShot({attacker:elevated,target:upEnemy,cover});
 assert.equal(sweptProjectileContact(planned.origin,{x:1080,y:418},upEnemy,cover)?.kind,'unit');
});

test('close blue and red champion shots never spawn past the opposing fighter',()=>{
 for(const [team,x,targetX,sign] of [
  ['blue',400,413,1],['red',500,489,-1]
 ]){
  const attacker={team,x,y:590};
  const opponent={id:team==='blue'?'enemy':'hero',
   team:team==='blue'?'red':'blue',x:targetX,y:590,hp:30};
  const shot=planChampionShot({attacker,target:opponent});
  assert.ok(shot,'close-range shot is available');
  assert.ok(sign*(shot.origin.x-x)>=0);
  assert.ok(sign*(targetX-shot.origin.x)>0,
   'muzzle must stay in front of shooter but before target');
  assert.ok(sign*shot.velocity.x>0,
   'a close-range shot must never travel backwards');
 }
});
test('overlapping target does not produce a stationary champion projectile',()=>{
 const attacker={team:'blue',x:400,y:590};
 const target={id:'enemy',team:'red',x:400,y:590,hp:100};
 const shot=planChampionShot({attacker,target});
 assert.ok(shot);
 assert.equal(shot.origin.x,400);
 assert.ok(shot.velocity.x>0);
 assert.ok(Math.hypot(shot.velocity.x,shot.velocity.y)>0);
});
