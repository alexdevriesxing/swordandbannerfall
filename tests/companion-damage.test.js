import test from 'node:test';
import assert from 'node:assert/strict';
import {protectedCompanionDamage} from '../src/systems/companion-damage.js';
import {TacticalBattle} from '../src/systems/tactics.js';

test('shield absorbs full hit without consuming Sentinel cooldown',()=>{
 const tactics=new TacticalBattle();
 assert.equal(tactics.deploy('blue','shield',300).accepted,true);
 const sentinel={id:1,team:'blue',role:'sentinel',x:305,hp:100};
 const target={team:'blue',x:310,hp:80};
 const blocked=protectedCompanionDamage(tactics,[sentinel],target,50,1000);
 assert.deepEqual(blocked,{damage:0,absorbed:50,intercepted:false});
 assert.equal(sentinel.lastIntercept,undefined);
 assert.equal(tactics.defenses[0].hp,40);
});
test('Sentinel protects only residual damage after shield is exhausted',()=>{
 const tactics=new TacticalBattle();
 tactics.deploy('blue','shield',300);
 const sentinel={id:1,team:'blue',role:'sentinel',x:305,hp:100};
 const target={team:'blue',x:310,hp:80};
 const hit=protectedCompanionDamage(tactics,[sentinel],target,110,1000);
 assert.deepEqual(hit,{damage:12,absorbed:90,intercepted:true});
 assert.equal(tactics.defenses[0].hp,0);
 assert.equal(sentinel.lastIntercept,1000);
 const next=protectedCompanionDamage(tactics,[sentinel],target,30,1200);
 assert.deepEqual(next,{damage:30,absorbed:0,intercepted:false});
});
test('all combat paths can share the same intercept once per cooldown',()=>{
 const tactics=new TacticalBattle();
 const sentinel={id:1,team:'red',role:'sentinel',x:400,hp:90};
 const target={team:'red',x:440,hp:80};
 assert.deepEqual(protectedCompanionDamage(tactics,[sentinel],target,30,1000),{damage:18,absorbed:0,intercepted:true});
 assert.deepEqual(protectedCompanionDamage(tactics,[sentinel],target,30,1001),{damage:30,absorbed:0,intercepted:false});
 assert.deepEqual(protectedCompanionDamage(tactics,[sentinel],target,30,7500),{damage:18,absorbed:0,intercepted:true});
});
test('zero damage does not consume shields or Sentinel abilities',()=>{
 const tactics=new TacticalBattle();tactics.deploy('blue','shield',300);
 const sentinel={id:1,team:'blue',role:'sentinel',x:300,hp:100};
 assert.deepEqual(protectedCompanionDamage(tactics,[sentinel],{team:'blue',x:300},0,1000),{damage:0,absorbed:0,intercepted:false});
 assert.equal(tactics.defenses[0].hp,90);
 assert.equal(sentinel.lastIntercept,undefined);
});
test('invalid amounts or targets do not mutate defenses',()=>{
 const tactics=new TacticalBattle();tactics.deploy('blue','shield',300);
 const args=[tactics,[],{team:'blue',x:300},-1,0];
 assert.throws(()=>protectedCompanionDamage(...args),RangeError);
 assert.throws(()=>protectedCompanionDamage(tactics,[],{team:'none',x:300},10,0),RangeError);
 assert.equal(tactics.defenses[0].hp,90);
});
