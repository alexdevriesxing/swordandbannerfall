import test from 'node:test';
import assert from 'node:assert/strict';
import {interceptDamage} from '../src/systems/abilities.js';
import {protectedCompanionDamage} from '../src/systems/companion-damage.js';
import {TacticalBattle} from '../src/systems/tactics.js';

test('a lone Sentinel never intercepts its own wounds',()=>{
 const guard={id:10,role:'sentinel',team:'blue',x:400,y:590,hp:100};
 const result=interceptDamage([guard],'blue',400,30,1000,590,10);
 assert.deepEqual(result,{damage:30,intercepted:false});
 assert.equal(guard.lastIntercept,undefined);
});

test('a second Sentinel can protect the targeted Sentinel',()=>{
 const victim={id:10,role:'sentinel',team:'blue',x:400,y:590,hp:100};
 const ally={id:11,role:'sentinel',team:'blue',x:420,y:590,hp:100};
 const hit=interceptDamage([victim,ally],'blue',400,30,1000,590,10);
 assert.deepEqual(hit,{damage:18,intercepted:true,sentinelId:11});
 assert.equal(victim.lastIntercept,undefined);
 assert.equal(ally.lastIntercept,1000);
});

test('real damage pipeline excludes self while applying active allied shields',()=>{
 const game=new TacticalBattle();
 game.deploy('blue','shield',400);
 const victim={id:10,role:'sentinel',team:'blue',x:400,y:590,hp:100};
 const first=protectedCompanionDamage(game,[victim],victim,95,1000);
 assert.deepEqual(first,{damage:5,absorbed:90,intercepted:false});
 assert.equal(victim.lastIntercept,undefined);
 const second=protectedCompanionDamage(game,[victim],victim,30,2000);
 assert.deepEqual(second,{damage:30,absorbed:0,intercepted:false});
});

test('other-team Sentinels cannot intercept and cooldowns do not cross teams',()=>{
 const attackerSide={id:8,role:'sentinel',team:'red',x:400,y:590,hp:100};
 const defender={id:10,role:'sentinel',team:'blue',x:400,y:590,hp:100};
 const result=interceptDamage([defender,attackerSide],'blue',400,30,1000,590,10);
 assert.deepEqual(result,{damage:30,intercepted:false});
 assert.equal(attackerSide.lastIntercept,undefined);
});
