import test from 'node:test';import assert from 'node:assert/strict';
import {specialAttack,interceptDamage} from '../src/systems/abilities.js';
test('vanguard cleave adds damage with cooldown',()=>{const u={role:'vanguard'};assert.equal(specialAttack(u,1000).bonusDamage,8);assert.equal(specialAttack(u,2000),null);assert.equal(specialAttack(u,6000).ability,'cleave');});
test('ranger precision is independent of regular attacks',()=>{const u={role:'ranger',lastAttack:600};assert.equal(specialAttack(u,1000).bonusDamage,10);assert.equal(u.lastAttack,600);});
test('sentinel protects a nearby ally once per cooldown',()=>{const u={id:7,role:'sentinel',team:'blue',hp:100,x:200};assert.deepEqual(interceptDamage([u],'blue',225,30,1000),{damage:18,intercepted:true,sentinelId:7});assert.equal(interceptDamage([u],'blue',225,30,2000).damage,30);});
test('dead or distant sentinels cannot protect',()=>{const u={role:'sentinel',team:'blue',hp:0,x:200};assert.equal(interceptDamage([u],'blue',220,20,1000).damage,20);});

test('zero-damage hits do not consume Sentinel interceptions',()=>{
 const sentinel={id:11,role:'sentinel',team:'blue',hp:90,x:300};
 assert.deepEqual(interceptDamage([sentinel],'blue',315,0,1000),
  {damage:0,intercepted:false});
 assert.equal(sentinel.lastIntercept,undefined);
 assert.deepEqual(interceptDamage([sentinel],'blue',315,30,1010),
  {damage:18,intercepted:true,sentinelId:11});
});
test('negative or non-finite interception amounts are rejected without state changes',()=>{
 const sentinel={id:11,role:'sentinel',team:'blue',hp:90,x:300};
 for(const amount of [-1,NaN,Infinity]){
  assert.throws(()=>interceptDamage([sentinel],'blue',315,amount,1000),RangeError);
 }
 assert.equal(sentinel.lastIntercept,undefined);
});
