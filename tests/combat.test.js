import test from 'node:test';
import assert from 'node:assert/strict';
import {CombatDirector,SeededRandom} from '../src/systems/combat.js';

test('deterministic random sequence',()=>{
 const a=new SeededRandom(123),b=new SeededRandom(123);
 for(let i=0;i<100;i++)assert.equal(a.next(),b.next());
});
test('guard reduces incoming attack damage',()=>{
 const open=new CombatDirector(),guard=new CombatDirector();
 guard.setStance('hero','guard');
 assert.ok(open.damage('hero',40).applied>guard.damage('hero',40).applied);
});
test('winner gets a score and advances without cards',()=>{
 const game=new CombatDirector({roundLimit:10});
 game.damage('enemy',100);
 assert.equal(game.finishRound().message,'BLUE TEAM WINS THE ROUND');
 assert.equal(game.score.blue,1);
 assert.equal(game.phase,'intermission');
 game.startRound();assert.equal(game.round,2);
 assert.equal(game.fighters.enemy.hp,100);
});
test('losing opens cards; upgrade persists between rounds',()=>{
 const game=new CombatDirector();
 game.damage('hero',100);
 game.finishRound();
 assert.equal(game.phase,'cards');
 assert.equal(game.selectCard(0),'iron-heart');
 game.startRound();
 assert.equal(game.fighters.hero.maxHp,125);
 assert.equal(game.fighters.hero.hp,125);
});
test('10 rounds end match and prevent an eleventh',()=>{
 const game=new CombatDirector();
 for(let i=1;i<=10;i++){
  game.damage('enemy',100);game.finishRound();
  if(i<10)game.startRound();
 }
 assert.equal(game.phase,'finished');
 assert.equal(game.score.blue,10);
 assert.equal(game.round,10);
 assert.throws(()=>game.startRound());
});
test('cannot finish without knockout or start without intermission',()=>{
 const game=new CombatDirector();
 assert.throws(()=>game.finishRound());
 assert.throws(()=>game.startRound());
 assert.throws(()=>game.selectCard(0));
});
test('guard, patrol, hunt rotate',()=>{
 const game=new CombatDirector();
 assert.equal(game.fighters.hero.command,'guard');
 game.cycleCommand('hero');assert.equal(game.fighters.hero.command,'patrol');
 game.cycleCommand('hero');assert.equal(game.fighters.hero.command,'hunt');
 game.cycleCommand('hero');assert.equal(game.fighters.hero.command,'guard');
});

test('finishing hit reports only actual champion HP removed',()=>{
 const game=new CombatDirector();
 game.fighters.hero.hp=3;
 assert.deepEqual(game.damage('hero',100,'melee'),{applied:3,ko:true});
 assert.equal(game.fighters.hero.hp,0);
 assert.deepEqual(game.damage('hero',100,'melee'),{applied:0,ko:false});
});
test('overkill is symmetric and works after armor and guard mitigation',()=>{
 const game=new CombatDirector();
 game.fighters.enemy.hp=6;
 game.setStance('enemy','guard');
 assert.deepEqual(game.damage('enemy',100,'ranged'),{applied:6,ko:true});
 assert.equal(game.fighters.enemy.hp,0);
});
test('zero damage never knocks out or consumes a champion HP',()=>{
 const game=new CombatDirector();
 game.fighters.hero.hp=1;
 assert.deepEqual(game.damage('hero',0),{applied:0,ko:false});
 assert.equal(game.fighters.hero.hp,1);
});
test('multiple nonlethal hits report actual damage and do not alter opponent',()=>{
 const game=new CombatDirector();
 assert.deepEqual(game.damage('hero',17,'ranged'),{applied:17,ko:false});
 assert.equal(game.fighters.hero.hp,83);
 assert.equal(game.fighters.enemy.hp,100);
});
