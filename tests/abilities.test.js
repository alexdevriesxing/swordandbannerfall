import test from 'node:test';import assert from 'node:assert/strict';
import {specialAttack,interceptDamage} from '../src/systems/abilities.js';
test('vanguard cleave adds damage with cooldown',()=>{const u={role:'vanguard'};assert.equal(specialAttack(u,1000).bonusDamage,8);assert.equal(specialAttack(u,2000),null);assert.equal(specialAttack(u,6000).ability,'cleave');});
test('ranger precision is independent of regular attacks',()=>{const u={role:'ranger',lastAttack:600};assert.equal(specialAttack(u,1000).bonusDamage,10);assert.equal(u.lastAttack,600);});
test('sentinel protects a nearby ally once per cooldown',()=>{const u={role:'sentinel',team:'blue',hp:100,x:200};assert.deepEqual(interceptDamage([u],'blue',225,30,1000),{damage:18,intercepted:true,sentinelId:undefined===u.id?undefined:u.id});assert.equal(interceptDamage([u],'blue',225,30,2000).damage,30);});
test('dead or distant sentinels cannot protect',()=>{const u={role:'sentinel',team:'blue',hp:0,x:200};assert.equal(interceptDamage([u],'blue',220,20,1000).damage,20);});
