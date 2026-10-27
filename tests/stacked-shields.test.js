import test from 'node:test';
import assert from 'node:assert/strict';
import {TacticalBattle} from '../src/systems/tactics.js';
import {protectedCompanionDamage} from '../src/systems/companion-damage.js';

function overlapping(){
 const tactics=new TacticalBattle();
 assert.equal(tactics.deploy('blue','shield',200).accepted,true);
 assert.equal(tactics.deploy('blue','shield',300).accepted,true);
 return tactics;
}
test('overlapping paid shields absorb damage across both emitters',()=>{
 const tactics=overlapping();
 const defense=tactics.defenses;
 const hit=tactics.incomingDamage('blue',120,260);
 assert.deepEqual(hit,{absorbed:120,remaining:0});
 assert.equal(defense[0].hp,60,'further shield spends only remaining damage');
 assert.equal(defense[1].hp,0,'nearest emitter takes first hit');
});
test('shields completely exhaust before direct fighter damage',()=>{
 const tactics=overlapping();
 assert.deepEqual(tactics.incomingDamage('blue',205,260),{absorbed:180,remaining:25});
 assert.equal(tactics.defenses[0].hp,0);
 assert.equal(tactics.defenses[1].hp,0);
 assert.deepEqual(tactics.incomingDamage('blue',20,260),{absorbed:0,remaining:20});
});
test('shield overlap prevents unnecessary Sentinel ability consumption',()=>{
 const tactics=overlapping();
 const sentinel={id:11,team:'blue',role:'sentinel',x:260,y:590,hp:100};
 const target={team:'blue',x:260,y:590,hp:50};
 assert.deepEqual(protectedCompanionDamage(tactics,[sentinel],target,120,1000),
  {damage:0,absorbed:120,intercepted:false});
 assert.equal(sentinel.lastIntercept,undefined);
 const spill=protectedCompanionDamage(tactics,[sentinel],target,100,1500);
 assert.deepEqual(spill,{damage:24,absorbed:60,intercepted:true});
 assert.equal(sentinel.lastIntercept,1500);
});
test('only friendly, in-range and living shield charge counts',()=>{
 const tactics=overlapping();
 assert.equal(tactics.deploy('red','shield',400).accepted,true);
 const out=tactics.incomingDamage('blue',15,410);
 assert.deepEqual(out,{absorbed:15,remaining:0});
 assert.equal(tactics.defenses[0].hp,90,'shield outside range untouched');
 assert.equal(tactics.defenses[1].hp,75,'blue shield covers 410');
 assert.equal(tactics.defenses[2].hp,90,'enemy shield untouched');
});
test('repeatable shield tie-break uses ascending ID without depending on input order',()=>{
 const tactics=overlapping();
 const shields=tactics.defenses;
 assert.deepEqual(tactics.incomingDamage('blue',95,250),{absorbed:95,remaining:0});
 assert.equal(shields[0].hp,0);
 assert.equal(shields[1].hp,85);
});
