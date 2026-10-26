import test from 'node:test';
import assert from 'node:assert/strict';
import {TacticalBattle} from '../src/systems/tactics.js';
import {CombatDirector} from '../src/systems/combat.js';
import {protectedCompanionDamage} from '../src/systems/companion-damage.js';

// Both champion damage and companion damage run this same protection model.
function hitChampion(tactics,combat,allies,target,raw,time){
 const protectedHit=protectedCompanionDamage(tactics,allies,
  {team:'blue',x:target.x},raw,time);
 const result=combat.damage('hero',protectedHit.damage,'ranged');
 return {protectedHit,result};
}
test('champion shield absorbs shot without consuming guard ability or losing HP',()=>{
 const tactics=new TacticalBattle(),combat=new CombatDirector();
 tactics.deploy('blue','shield',300);
 const guard={id:11,team:'blue',role:'sentinel',x:310,hp:100};
 const first=hitChampion(tactics,combat,[guard],{x:310},50,1000);
 assert.deepEqual(first.protectedHit,{damage:0,absorbed:50,intercepted:false});
 assert.deepEqual(first.result,{applied:0,ko:false});
 assert.equal(combat.fighters.hero.hp,100);
 assert.equal(guard.lastIntercept,undefined);
 assert.equal(tactics.defenses[0].hp,40);
});
test('champion Sentinel blocks only remaining damage after depleted shield',()=>{
 const tactics=new TacticalBattle(),combat=new CombatDirector();
 tactics.deploy('blue','shield',300);
 const guard={id:12,team:'blue',role:'sentinel',x:310,hp:100};
 const first=hitChampion(tactics,combat,[guard],{x:310},110,1000);
 assert.deepEqual(first.protectedHit,{damage:12,absorbed:90,intercepted:true});
 assert.equal(first.result.applied,12);
 assert.equal(combat.fighters.hero.hp,88);
 assert.equal(tactics.defenses[0].hp,0);
 assert.equal(guard.lastIntercept,1000);
 const second=hitChampion(tactics,combat,[guard],{x:310},30,1001);
 assert.equal(second.protectedHit.intercepted,false);
 assert.equal(second.result.applied,30);
 assert.equal(combat.fighters.hero.hp,58);
});
test('guard stance reduces champion damage after protection but does not double-absorb',()=>{
 const tactics=new TacticalBattle(),combat=new CombatDirector();
 combat.setStance('hero','guard');
 const result=hitChampion(tactics,combat,[],{x:300},40,1000);
 assert.equal(result.protectedHit.damage,40);
 assert.equal(result.result.applied,22);
 assert.equal(combat.fighters.hero.hp,78);
});
