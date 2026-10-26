import test from 'node:test';
import assert from 'node:assert/strict';
import {planCompanionCoverShot} from '../src/systems/companion-projectiles.js';
import {firstBattleProjectileContact} from '../src/systems/battle-projectiles.js';
import {BattlefieldCover} from '../src/systems/cover.js';

const ranger={id:1,team:'blue',role:'ranger',x:380,y:590,hp:45,range:260};
const wall={id:'gate',x:470,width:110,hp:30};

test('ranger breaching requires projectile impact before cover loses HP',()=>{
 const cover=new BattlefieldCover([wall]);
 const shot=planCompanionCoverShot({attacker:ranger,barrier:cover.intact()[0],damage:9});
 assert.ok(shot);
 assert.equal(shot.targetId,null);
 assert.equal(shot.coverDamage,9);
 assert.equal(cover.segments[0].hp,30);
 assert.ok(shot.velocity.x>0);
 const impact=firstBattleProjectileContact(shot.origin,{x:480,y:573},{
  firingTeam:'blue',cover,companions:[]
 });
 assert.equal(impact.kind,'cover');
 assert.equal(impact.id,'gate');
 assert.equal(cover.segments[0].hp,30);
 cover.damage(impact.id,shot.coverDamage);
 assert.equal(cover.segments[0].hp,21);
});

test('breaching muzzle stays outside a nearby wide barricade',()=>{
 const adjacent={...wall,x:415,width:100};
 const shot=planCompanionCoverShot({attacker:ranger,barrier:adjacent,damage:9});
 assert.ok(shot.origin.x<=ranger.x);
 assert.equal(firstBattleProjectileContact(shot.origin,{x:435,y:573},{
  firingTeam:'blue',cover:new BattlefieldCover([adjacent])
 })?.id,'gate');
});

test('mirror red-to-blue breaching and respect existing art geometry',()=>{
 const attacker={...ranger,team:'red',x:700};
 const shot=planCompanionCoverShot({attacker,barrier:wall,damage:9});
 assert.ok(shot.velocity.x<0);
 assert.ok(shot.origin.x<=attacker.x);
 const hit=firstBattleProjectileContact(shot.origin,{x:450,y:573},{
  firingTeam:'red',cover:new BattlefieldCover([wall])
 });
 assert.equal(hit?.kind,'cover');
});

test('only living ranged attackers with valid range can fire breaching shots',()=>{
 assert.equal(planCompanionCoverShot({attacker:{...ranger,role:'vanguard'},barrier:wall,damage:9}),null);
 assert.equal(planCompanionCoverShot({attacker:{...ranger,hp:0},barrier:wall,damage:9}),null);
 assert.equal(planCompanionCoverShot({attacker:ranger,barrier:{...wall,hp:0},damage:9}),null);
 assert.equal(planCompanionCoverShot({attacker:ranger,barrier:{...wall,x:800},damage:9}),null);
 assert.equal(planCompanionCoverShot({attacker:ranger,barrier:wall,damage:-1}),null);
 assert.equal(planCompanionCoverShot({attacker:ranger,barrier:null,damage:9}),null);
});

test('another enemy standing in front can intercept a breaching shot',()=>{
 const cover=new BattlefieldCover([wall]);
 const shot=planCompanionCoverShot({attacker:ranger,barrier:wall,damage:9});
 const target={id:99,team:'red',x:405,y:590,hp:25};
 const hit=firstBattleProjectileContact(shot.origin,{x:480,y:573},{
  firingTeam:'blue',cover,companions:[target]
 });
 assert.equal(hit?.kind,'unit');
 assert.equal(hit.id,99);
 assert.equal(cover.segments[0].hp,30);
});
