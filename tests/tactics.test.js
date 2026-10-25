import test from 'node:test';
import assert from 'node:assert/strict';
import {TacticalBattle} from '../src/systems/tactics.js';
test('10 reserve combatants per team; knockout advances exactly once',()=>{
 const battle=new TacticalBattle();
 for(let i=0;i<9;i++){const r=battle.knockout('red');assert.equal(r.accepted,true);assert.equal(r.remaining,9-i);}
 assert.equal(battle.current('red').id,'red-10');
 const last=battle.knockout('red');
 assert.equal(last.remaining,0);assert.equal(last.winner,'blue');
 assert.equal(battle.knockout('red').accepted,false);
});
test('defenses enforce supply, valid territory and spacing',()=>{
 const b=new TacticalBattle();
 assert.equal(b.deploy('blue','turret',320).accepted,true);
 assert.equal(b.supply.blue,55);
 assert.equal(b.deploy('red','trap',320).reason,'enemy-territory');
 assert.equal(b.deploy('blue','trap',325).reason,'blocked');
 assert.equal(b.deploy('blue','turret',430).accepted,true);
 assert.equal(b.deploy('blue','trap',500).reason,'insufficient-supply');
});
test('turret fire respects range and cooldown',()=>{
 const b=new TacticalBattle();b.deploy('blue','turret',300);
 assert.equal(b.getTargets('blue',500,0).length,1);
 assert.equal(b.getTargets('blue',500,100).length,0);
 assert.equal(b.getTargets('blue',900,1100).length,0);
 assert.equal(b.getTargets('blue',500,1100).length,1);
});
test('trap detonates once',()=>{
 const b=new TacticalBattle();b.deploy('blue','trap',300);
 assert.equal(b.getTargets('blue',300,0)[0].damage,30);
 assert.equal(b.getTargets('blue',300,2000).length,0);
});
test('shield consumes health before fighter health',()=>{
 const b=new TacticalBattle();b.deploy('blue','shield',300);
 assert.deepEqual(b.incomingDamage('blue',50,310),{absorbed:50,remaining:0});
 assert.deepEqual(b.incomingDamage('blue',60,310),{absorbed:40,remaining:20});
});
test('reject invalid orders and supply',()=>{
 const b=new TacticalBattle();assert.throws(()=>b.order('blue','charge'));
 assert.throws(()=>b.grantSupply('red',-3));
 assert.throws(()=>b.deploy('blue','trap',1300));
});
