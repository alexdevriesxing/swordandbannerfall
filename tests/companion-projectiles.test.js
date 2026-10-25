import test from 'node:test';
import assert from 'node:assert/strict';
import {planCompanionShot} from '../src/systems/companion-projectiles.js';
const ranger={id:1,team:'blue',role:'ranger',x:200,y:590,hp:45};
const raider={id:12,team:'red',x:420,y:445,hp:60};
test('ranger projectile follows correct diagonal trajectory to an upper landing',()=>{
 const shot=planCompanionShot({attacker:ranger,target:raider,damage:9});
 assert.equal(shot.targetId,12);
 assert.equal(shot.damage,9);
 assert.ok(shot.velocity.x>0&&shot.velocity.y<0);
 assert.ok(Math.abs(Math.hypot(shot.velocity.x,shot.velocity.y)-650)<0.001);
});
test('reject team mates, dead units, and invalid shot damage',()=>{
 assert.equal(planCompanionShot({attacker:ranger,target:{...raider,team:'blue'},damage:9}),null);
 assert.equal(planCompanionShot({attacker:ranger,target:{...raider,hp:0},damage:9}),null);
 assert.equal(planCompanionShot({attacker:{...ranger,hp:0},target:raider,damage:9}),null);
 assert.equal(planCompanionShot({attacker:ranger,target:raider,damage:-1}),null);
});
test('blocked lines of sight and distant floors cannot receive a shot',()=>{
 assert.equal(planCompanionShot({attacker:ranger,target:raider,damage:9,cover:{obstruction:()=>({id:'wall'})}}),null);
 assert.equal(planCompanionShot({attacker:ranger,target:{...raider,y:350},damage:9}),null);
});
test('shot can target an enemy champion and preserve the assigned target id',()=>{
 const shot=planCompanionShot({attacker:ranger,target:{...raider,id:'enemy'},damage:19});
 assert.equal(shot.targetId,'enemy');
 assert.equal(shot.damage,19);
});
