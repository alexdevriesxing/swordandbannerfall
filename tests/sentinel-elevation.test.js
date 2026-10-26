import test from 'node:test';
import assert from 'node:assert/strict';
import {interceptDamage} from '../src/systems/abilities.js';
import {protectedCompanionDamage} from '../src/systems/companion-damage.js';
import {TacticalBattle} from '../src/systems/tactics.js';

test('a ground Sentinel cannot protect an ally on an elevated gantry',()=>{
 const guard={id:11,role:'sentinel',team:'blue',hp:100,x:400,y:590};
 const hit=interceptDamage([guard],'blue',420,30,1000,445);
 assert.deepEqual(hit,{damage:30,intercepted:false});
 assert.equal(guard.lastIntercept,undefined);
 const next=interceptDamage([guard],'blue',420,30,1010,590);
 assert.deepEqual(next,{damage:18,intercepted:true,sentinelId:11});
 assert.equal(guard.lastIntercept,1010);
});

test('gantry Sentinel protects elevated allies but not a distant ground ally',()=>{
 const guard={id:5,team:'red',role:'sentinel',hp:100,x:880,y:445};
 const elevated={team:'red',x:905,y:445,hp:60};
 const protectedHit=protectedCompanionDamage(new TacticalBattle(),[guard],elevated,40,1000);
 assert.deepEqual(protectedHit,{damage:24,absorbed:0,intercepted:true});
 assert.equal(guard.lastIntercept,1000);
 const other={id:6,team:'red',role:'sentinel',hp:100,x:875,y:445};
 const ground={team:'red',x:900,y:590,hp:60};
 const unprotected=protectedCompanionDamage(new TacticalBattle(),[other],ground,40,1000);
 assert.deepEqual(unprotected,{damage:40,absorbed:0,intercepted:false});
 assert.equal(other.lastIntercept,undefined);
});

test('edge-of-reach vertical protection obeys the melee range rule',()=>{
 const guard={id:8,team:'blue',role:'sentinel',hp:100,x:300,y:590};
 assert.equal(interceptDamage([guard],'blue',300,30,1000,525).intercepted,true);
 const distant={id:9,team:'blue',role:'sentinel',hp:100,x:300,y:590};
 assert.equal(interceptDamage([distant],'blue',300,30,1000,524).intercepted,false);
});

test('invalid explicit target elevation never consumes a Sentinel cooldown',()=>{
 const guard={id:12,team:'blue',role:'sentinel',hp:100,x:300,y:590};
 assert.throws(()=>interceptDamage([guard],'blue',300,30,1000,Infinity),RangeError);
 assert.equal(guard.lastIntercept,undefined);
});

test('legacy one-dimensional callers still receive normal horizontal interception',()=>{
 const guard={id:13,team:'blue',role:'sentinel',hp:100,x:300};
 assert.equal(interceptDamage([guard],'blue',320,30,1000).intercepted,true);
});
