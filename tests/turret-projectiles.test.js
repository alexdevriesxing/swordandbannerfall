import test from 'node:test';
import assert from 'node:assert/strict';
import {planTurretShot} from '../src/systems/turret-projectiles.js';
import {firstBattleProjectileContact} from '../src/systems/battle-projectiles.js';
import {BattlefieldCover} from '../src/systems/cover.js';

const defense={id:10,team:'blue',kind:'turret',x:400,hp:65};
const target={id:5,team:'red',x:600,y:590,hp:80};

test('defense turret launches a real travelling bullet without immediate damage',()=>{
 const shot=planTurretShot({defense,target,damage:12});
 assert.equal(shot.targetId,5);
 assert.equal(shot.team,'blue');
 assert.equal(shot.coverDamage,12);
 assert.ok(Math.abs(Math.hypot(shot.velocity.x,shot.velocity.y)-650)<1e-6);
 assert.equal(target.hp,80,'planning must not mutate the target');
 const contact=firstBattleProjectileContact(shot.origin,{x:650,y:576},{
  firingTeam:'blue',companions:[target]
 });
 assert.equal(contact.kind,'unit');
 assert.equal(contact.id,5);
});

test('a nearer hostile fighter intercepts a turret shot',()=>{
 const shot=planTurretShot({defense,target,damage:12});
 const blocker={...target,id:2,x:495};
 const contact=firstBattleProjectileContact(shot.origin,{x:650,y:576},{
  firingTeam:'blue',companions:[blocker,target]
 });
 assert.equal(contact.kind,'unit');
 assert.equal(contact.id,2);
});

test('only living turrets fire at valid hostile targets',()=>{
 assert.equal(planTurretShot({defense:{...defense,kind:'trap'},target,damage:12}),null);
 assert.equal(planTurretShot({defense:{...defense,hp:0},target,damage:12}),null);
 assert.equal(planTurretShot({defense,target:{...target,team:'blue'},damage:12}),null);
 assert.equal(planTurretShot({defense,target:{...target,hp:0},damage:12}),null);
 assert.equal(planTurretShot({defense,target,damage:0}),null);
 assert.equal(planTurretShot({defense,target:{...target,x:NaN},damage:12}),null);
});

test('tactical cover blocks turret line of sight until it is destroyed',()=>{
 const cover=new BattlefieldCover([{id:'wall',x:500,width:82,hp:100}]);
 assert.equal(planTurretShot({defense,target,damage:12,cover}),null);
 cover.damage('wall',100);
 assert.ok(planTurretShot({defense,target,damage:12,cover}));
});

test('red turret firing is symmetric and never hits allied red defenders',()=>{
 const redTurret={...defense,team:'red',x:1000};
 const blueTarget={...target,team:'blue',x:800};
 const shot=planTurretShot({defense:redTurret,target:blueTarget,damage:12});
 assert.ok(shot.velocity.x<0);
 const hit=firstBattleProjectileContact(shot.origin,{x:760,y:575},{
  firingTeam:'red',companions:[{...target,team:'red',x:900},blueTarget]
 });
 assert.equal(hit.kind,'unit');
 assert.equal(hit.id,5);
});
