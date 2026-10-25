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
