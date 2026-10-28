import test from 'node:test';
import assert from 'node:assert/strict';
import {TacticalBattle,SHIELD_GROUND_Y,SHIELD_VERTICAL_REACH} from '../src/systems/tactics.js';
import {protectedCompanionDamage} from '../src/systems/companion-damage.js';

const ward=(team='blue',x=300)=>{
 const battle=new TacticalBattle();
 assert.equal(battle.deploy(team,'shield',x).accepted,true);
 return battle;
};
test('ground ward protects grounded blue fighter and rejects gantry at same x',()=>{
 const tactics=ward();
 assert.deepEqual(tactics.incomingDamage('blue',30,300,590),
  {absorbed:30,remaining:0});
 assert.equal(tactics.defenses[0].hp,60);
 assert.deepEqual(tactics.incomingDamage('blue',40,300,445),
  {absorbed:0,remaining:40});
 assert.equal(tactics.defenses[0].hp,60,
  'a fighter on a gantry must not spend ground ward energy');
});
test('red ground ward also cannot shield elevated champions',()=>{
 const tactics=ward('red',1000);
 assert.deepEqual(protectedCompanionDamage(tactics,[],{
  id:'enemy',team:'red',x:1000,y:445,hp:100
 },24,1000),{damage:24,absorbed:0,intercepted:false});
 assert.equal(tactics.defenses[0].hp,90);
 assert.deepEqual(protectedCompanionDamage(tactics,[],{
  id:'enemy',team:'red',x:1000,y:590,hp:100
 },24,1200),{damage:0,absorbed:24,intercepted:false});
 assert.equal(tactics.defenses[0].hp,66);
});
test('shield protection stops at a precisely documented vertical boundary',()=>{
 const tactics=ward();
 assert.equal(tactics.incomingDamage('blue',10,300,
  SHIELD_GROUND_Y-SHIELD_VERTICAL_REACH).absorbed,10);
 assert.equal(tactics.incomingDamage('blue',10,300,
  SHIELD_GROUND_Y+SHIELD_VERTICAL_REACH).absorbed,10);
 assert.deepEqual(tactics.incomingDamage('blue',10,300,
  SHIELD_GROUND_Y-SHIELD_VERTICAL_REACH-.01),{absorbed:0,remaining:10});
 assert.deepEqual(tactics.incomingDamage('blue',10,300,
  SHIELD_GROUND_Y+SHIELD_VERTICAL_REACH+.01),{absorbed:0,remaining:10});
 assert.equal(tactics.defenses[0].hp,70);
});
test('overlapping shields remain stacked for ground units, not upper lanes',()=>{
 const tactics=ward();
 assert.equal(tactics.deploy('blue','shield',400).accepted,true);
 assert.deepEqual(tactics.incomingDamage('blue',120,350,445),
  {absorbed:0,remaining:120});
 assert.deepEqual(tactics.defenses.map(s=>s.hp),[90,90]);
 assert.deepEqual(tactics.incomingDamage('blue',120,350,590),
  {absorbed:120,remaining:0});
 assert.deepEqual(tactics.defenses.map(s=>s.hp),[0,60]);
});
test('gantry casualty still receives same-height Sentinel aid after ground shield exclusion',()=>{
 const tactics=ward();
 const sentinel={id:8,team:'blue',role:'sentinel',x:300,y:445,hp:100};
 const target={id:11,team:'blue',x:320,y:445,hp:45};
 const result=protectedCompanionDamage(tactics,[sentinel],target,40,1000);
 assert.deepEqual(result,{damage:24,absorbed:0,intercepted:true});
 assert.equal(sentinel.lastIntercept,1000);
 assert.equal(tactics.defenses[0].hp,90);
});
test('ground Sentinel cannot reach upper gantry after shield is excluded',()=>{
 const tactics=ward();
 const sentinel={id:8,team:'blue',role:'sentinel',x:300,y:590,hp:100};
 const target={id:11,team:'blue',x:320,y:445,hp:45};
 assert.deepEqual(protectedCompanionDamage(tactics,[sentinel],target,40,1000),
  {damage:40,absorbed:0,intercepted:false});
 assert.equal(sentinel.lastIntercept,undefined);
 assert.equal(tactics.defenses[0].hp,90);
});
test('invalid target geometry cannot drain or corrupt ward charges',()=>{
 const tactics=ward();
 for(const [x,y] of [[NaN,590],[300,Infinity],[Infinity,445],[300,NaN]])
  assert.throws(()=>tactics.incomingDamage('blue',15,x,y),RangeError);
 assert.equal(tactics.defenses[0].hp,90);
});
test('existing horizontal-only damage calls still assume the standard ground lane',()=>{
 const tactics=ward();
 assert.deepEqual(tactics.incomingDamage('blue',22,310),
  {absorbed:22,remaining:0});
 assert.equal(tactics.defenses[0].hp,68);
});
