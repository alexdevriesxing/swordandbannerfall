import test from 'node:test';
import assert from 'node:assert/strict';
import {EnemyDefenseDirector,IRON_CITADEL_DEFENSE_PLAN} from '../src/systems/enemy-defenses.js';
import {TacticalBattle} from '../src/systems/tactics.js';

test('enemy spends its actual 100 supply on authored setup defenses',()=>{
 const tactics=new TacticalBattle(),director=new EnemyDefenseDirector();
 const placed=director.update(tactics,{phase:'setup',timeMs:200});
 assert.deepEqual(placed.map(x=>x.kind),['turret','shield']);
 assert.deepEqual(placed.map(x=>x.x),[940,1080]);
 assert.equal(tactics.supply.red,20);
 assert.equal(tactics.supply.blue,100);
 assert.equal(director.update(tactics,{phase:'setup',timeMs:500}).length,0);
});
test('no trap is spawned before its battle cooldown and paid supply cost',()=>{
 const tactics=new TacticalBattle(),director=new EnemyDefenseDirector();
 director.update(tactics,{phase:'setup',timeMs:0});
 assert.deepEqual(director.update(tactics,{phase:'fight',timeMs:1000}),[]);
 assert.deepEqual(director.update(tactics,{phase:'fight',timeMs:7000}),[]);
 assert.equal(tactics.defenses.length,2);
 tactics.grantSupply('red',15);
 const placed=director.update(tactics,{phase:'fight',timeMs:7001});
 assert.deepEqual(placed.map(x=>x.kind),['trap']);
 assert.equal(tactics.supply.red,10);
 assert.equal(director.update(tactics,{phase:'fight',timeMs:7002}).length,0);
});
test('enemy never constructs a trap directly under a living blue fighter',()=>{
 const tactics=new TacticalBattle(),director=new EnemyDefenseDirector();
 director.update(tactics,{phase:'setup',timeMs:0});
 tactics.grantSupply('red',100);
 director.update(tactics,{phase:'fight',timeMs:1000});
 const unsafe=director.update(tactics,{phase:'fight',timeMs:8000,opponents:[{x:775,hp:50}]});
 assert.equal(unsafe.length,1); // Safe reserve turret can still be planned.
 assert.equal(unsafe[0].kind,'turret');
 assert.equal(tactics.defenses.some(d=>d.kind==='trap'),false);
 const later=director.update(tactics,{phase:'fight',timeMs:16001,opponents:[]});
 assert.equal(later.length,1);
 assert.equal(later[0].kind,'trap');
});
test('enemy defenses actually target living blue fighters after a blue champion dies',()=>{
 const tactics=new TacticalBattle(),director=new EnemyDefenseDirector();
 director.update(tactics,{phase:'setup'});
 const attacks=tactics.getTargets('red',[{id:'hero',x:700,hp:0},{id:3,x:755,hp:50}],1000);
 assert.equal(attacks.length,1);
 assert.equal(attacks[0].targetId,3);
 assert.equal(attacks[0].targetTeam,'blue');
});
test('shield protects red defenders and no friendly turret attacks are generated',()=>{
 const tactics=new TacticalBattle(),director=new EnemyDefenseDirector();
 director.update(tactics,{phase:'setup'});
 assert.deepEqual(tactics.incomingDamage('red',70,1080),{absorbed:70,remaining:0});
 const attacks=tactics.getTargets('blue',[{id:'hero',x:1000,hp:100}],1000);
 assert.deepEqual(attacks,[]);
});
test('enemy cannot deploy into a finished match or without enough supply',()=>{
 const tactics=new TacticalBattle(),director=new EnemyDefenseDirector();
 assert.equal(director.update(tactics,{phase:'finished',timeMs:200}).length,0);
 tactics.supply.red=0;
 assert.deepEqual(director.update(tactics,{phase:'setup',timeMs:300}),[]);
 assert.equal(tactics.defenses.length,0);
});
test('authoring validation rejects unsupported defense types and negative time',()=>{
 assert.throws(()=>new EnemyDefenseDirector({plan:[{id:'hax',x:100,kind:'laser',phase:'setup'}]}));
 assert.throws(()=>new EnemyDefenseDirector({battleCooldownMs:-1}),RangeError);
 const director=new EnemyDefenseDirector();
 assert.throws(()=>director.update(new TacticalBattle(),{phase:'bad'}));
});
test('the four placed defenses are distinct and cost paid supply with no hidden regeneration',()=>{
 const tactics=new TacticalBattle(),director=new EnemyDefenseDirector();
 director.update(tactics,{phase:'setup'});
 tactics.grantSupply('red',80);
 director.update(tactics,{phase:'fight',timeMs:1000});
 const trap=director.update(tactics,{phase:'fight',timeMs:7001});
 const fallback=director.update(tactics,{phase:'fight',timeMs:15002});
 assert.equal(trap.length,1);assert.equal(fallback.length,1);
 assert.equal(fallback[0].kind,'turret');
 assert.equal(tactics.defenses.length,4);
 assert.equal(tactics.supply.red,100+80-45-35-25-45);
 assert.equal(new Set(tactics.defenses.map(x=>x.id)).size,4);
});

test('upper gantry combatant does not prevent safe ground trap placement',()=>{
 const tactics=new TacticalBattle(),director=new EnemyDefenseDirector();
 director.update(tactics,{phase:'setup',timeMs:0});
 tactics.grantSupply('red',50);
 director.update(tactics,{phase:'fight',timeMs:1000});
 const placed=director.update(tactics,{phase:'fight',timeMs:8000,
  opponents:[{id:7,team:'blue',x:775,y:445,hp:80}]
 });
 assert.equal(placed.length,1);
 assert.equal(placed[0].kind,'trap');
 assert.equal(placed[0].x,775);
 assert.equal(tactics.supply.red,45,'trap has paid the full supply cost');
});

test('opponent near floor still blocks placement, including a near-floor jumper',()=>{
 const tactics=new TacticalBattle(),director=new EnemyDefenseDirector();
 director.update(tactics,{phase:'setup',timeMs:0});
 tactics.grantSupply('red',50);
 director.update(tactics,{phase:'fight',timeMs:1000});
 const placed=director.update(tactics,{phase:'fight',timeMs:8000,
  opponents:[{id:9,team:'blue',x:775,y:535,hp:60}]
 });
 assert.equal(placed.length,1);
 assert.equal(placed[0].kind,'turret');
 assert.equal(tactics.defenses.some(d=>d.kind==='trap'),false);
 assert.ok(director.snapshot().waiting.includes('approach-trap'));
});

test('defeated enemies on the floor cannot permanently block paid construction',()=>{
 const tactics=new TacticalBattle(),director=new EnemyDefenseDirector();
 director.update(tactics,{phase:'setup',timeMs:0});
 tactics.grantSupply('red',50);
 director.update(tactics,{phase:'fight',timeMs:1000});
 const placed=director.update(tactics,{phase:'fight',timeMs:8000,
  opponents:[{id:9,team:'blue',x:775,y:590,hp:0}]
 });
 assert.equal(placed.length,1);
 assert.equal(placed[0].kind,'trap');
});
