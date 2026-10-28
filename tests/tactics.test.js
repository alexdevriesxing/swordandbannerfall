import test from 'node:test';
import assert from 'node:assert/strict';
import {TacticalBattle} from '../src/systems/tactics.js';
import {BattlefieldCover} from '../src/systems/cover.js';
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

test('turret automatically retargets surviving companions after enemy champion dies',()=>{
 const battle=new TacticalBattle();battle.deploy('blue','turret',320);
 const survivors=[{id:'enemy',x:350,hp:0},{id:17,x:400,hp:50},{id:18,x:510,hp:70}];
 const first=battle.getTargets('blue',survivors,1000);
 assert.equal(first.length,1);assert.equal(first[0].targetId,17);
 assert.equal(battle.getTargets('blue',survivors,1500).length,0);
 assert.equal(battle.getTargets('blue',survivors.filter(x=>x.id!==17),2100)[0].targetId,18);
});
test('defenses ignore dead fighters and choose nearest live opponent',()=>{
 const b=new TacticalBattle();b.deploy('blue','turret',320);
 const choices=[{id:'enemy',x:310,hp:0},{id:7,x:590,hp:15},{id:8,x:350,hp:35}];
 assert.equal(b.getTargets('blue',choices,0)[0].targetId,8);
});
test('traps are not consumed against eliminated or out-of-range fighters',()=>{
 const b=new TacticalBattle();b.deploy('blue','trap',300);
 const dead=[{id:'enemy',x:300,hp:0},{id:1,x:900,hp:40}];
 assert.equal(b.getTargets('blue',dead,1000).length,0);
 assert.equal(b.defenses[0].hp,35);
 const hit=b.getTargets('blue',[{id:2,x:330,hp:40}],1100);
 assert.equal(hit.length,1);assert.equal(hit[0].targetId,2);
 assert.equal(b.defenses[0].hp,0);
});
test('defense cooldown only begins when a living enemy is actually in range',()=>{
 const b=new TacticalBattle();b.deploy('blue','turret',350);
 assert.equal(b.getTargets('blue',[{id:'enemy',x:1000,hp:100}],1200).length,0);
 assert.equal(b.getTargets('blue',[{id:7,x:430,hp:35}],1250).length,1);
});

test('ground trap cannot damage blue fighters on an elevated gantry',()=>{
 const tactics=new TacticalBattle();
 assert.equal(tactics.deploy('red','trap',780).accepted,true);
 const elevated=[{id:7,x:790,y:445,hp:80}];
 assert.equal(tactics.getTargets('red',elevated,1000).length,0);
 assert.equal(tactics.defenses[0].hp,35);
 assert.equal(tactics.getTargets('red',[{...elevated[0],y:590}],1100).length,1);
 assert.equal(tactics.defenses[0].hp,0);
});
test('turret cannot fire through solid ground cover but may aim above it',()=>{
 const tactics=new TacticalBattle();
 tactics.deploy('red','turret',940);
 const cover=new BattlefieldCover([{id:'gate',x:820,width:60,hp:100}]);
 const target={id:7,x:700,y:590,hp:80};
 assert.equal(tactics.getTargets('red',[target],1000,{cover}).length,0);
 const upper={...target,y:445};
 assert.equal(tactics.getTargets('red',[upper],1100,{cover}).length,1);
 assert.equal(tactics.getTargets('red',[upper],1500,{cover}).length,0);
});
test('destroyed barricade opens a ground turret firing lane',()=>{
 const tactics=new TacticalBattle();
 tactics.deploy('red','turret',940);
 const cover=new BattlefieldCover([{id:'gate',x:820,width:60,hp:90}]);
 const target={id:'hero',x:700,y:590,hp:100};
 assert.equal(tactics.getTargets('red',[target],1000,{cover}).length,0);
 cover.damage('gate',90);
 const attack=tactics.getTargets('red',[target],1100,{cover})[0];
 assert.equal(attack.targetId,'hero');
 assert.equal(attack.targetTeam,'blue');
});

test('blue turret ignores tagged friendly champions and escorts in mixed rosters',()=>{
 const battle=new TacticalBattle();
 battle.deploy('blue','turret',300);
 const friends=[
  {id:'hero',team:'blue',x:300,y:590,hp:100},
  {id:2,team:'blue',x:310,y:590,hp:45}
 ];
 const foe={id:'enemy',team:'red',x:415,y:590,hp:100};
 const attacks=battle.getTargets('blue',[...friends,foe],1000);
 assert.equal(attacks.length,1);
 assert.equal(attacks[0].targetId,'enemy');
 assert.equal(attacks[0].targetTeam,'red');
});
test('friendly only mixed roster does not spend turret shot cooldown',()=>{
 const battle=new TacticalBattle();
 battle.deploy('red','turret',900);
 const friendly={id:6,team:'red',x:905,y:590,hp:80};
 assert.deepEqual(battle.getTargets('red',[friendly],1000),[]);
 assert.equal(battle.defenses[0].lastFired,-Infinity);
 const foe={id:7,team:'blue',x:950,y:590,hp:60};
 const shot=battle.getTargets('red',[friendly,foe],1001);
 assert.equal(shot.length,1);
 assert.equal(shot[0].targetId,7);
});
test('ground trap is not consumed by friendly fighter in mixed roster',()=>{
 const battle=new TacticalBattle();
 battle.deploy('blue','trap',300);
 assert.deepEqual(battle.getTargets('blue',[
  {id:'hero',team:'blue',x:301,y:590,hp:100}
 ],1000),[]);
 assert.equal(battle.defenses[0].hp,35);
 const hits=battle.getTargets('blue',[
  {id:'hero',team:'blue',x:301,y:590,hp:100},
  {id:'enemy',team:'red',x:320,y:590,hp:100}
 ],1100);
 assert.equal(hits.length,1);
 assert.equal(hits[0].targetId,'enemy');
 assert.equal(battle.defenses[0].hp,0);
});
