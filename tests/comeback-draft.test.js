import test from 'node:test';
import assert from 'node:assert/strict';
import {ComebackDraft,COMEBACK_CARDS} from '../src/systems/comeback-draft.js';

test('first casualty offers three unique tactical cards but never respawns anyone',()=>{
 const draft=new ComebackDraft();
 const offer=draft.casualty('blue',{remaining:9});
 assert.equal(offer.team,'blue');assert.equal(offer.options.length,3);
 assert.equal(new Set(offer.options.map(x=>x.id)).size,3);
 assert.equal(draft.snapshot().losses.blue,1);
 assert.equal(draft.snapshot().claims.blue,0);
 assert.equal(draft.offer('red'),null);
 assert.equal(COMEBACK_CARDS.length,6);
});
test('War Cry increases team damage and cannot be selected twice from one offer',()=>{
 const draft=new ComebackDraft();draft.casualty('blue',{remaining:9});
 const card=draft.choose('blue',0);
 assert.equal(card.id,'war-cry');assert.equal(draft.damage('blue',10),12);
 assert.equal(draft.damage('red',10),10);
 assert.equal(draft.choose('blue',0),null);
 assert.equal(draft.snapshot().claims.blue,1);
});
test('Shieldwall limits incoming damage while living enemies remain unaffected',()=>{
 const draft=new ComebackDraft();draft.casualty('red',{remaining:9});
 assert.equal(draft.choose('red',0).id,'shieldwall');
 assert.equal(draft.incoming('red',100),86);
 assert.equal(draft.incoming('blue',100),100);
});
test('Swift March changes movement multiplier, but not raw damage',()=>{
 const draft=new ComebackDraft();draft.casualty('red',{remaining:9});
 assert.equal(draft.choose('red',1).id,'swift-march');
 assert.equal(draft.speed('red'),1.18);
 assert.equal(draft.damage('red',12),12);
});
test('medics and supply choices return immediate, finite rewards',()=>{
 const draft=new ComebackDraft();draft.casualty('red',{remaining:9});
 const medic=draft.choose('red',2);assert.equal(medic.heal,14);assert.equal(medic.supply,0);
 draft.casualty('red',{remaining:8});draft.casualty('red',{remaining:7});
 const cache=draft.choose('red',1);assert.equal(cache.supply,55);assert.equal(cache.heal,0);
 assert.equal(draft.snapshot().claims.red,2);
});
test('Deadeye only strengthens ranged attacks',()=>{
 const draft=new ComebackDraft();draft.casualty('red',{remaining:9});draft.choose('red',2);
 draft.casualty('red',{remaining:8});draft.casualty('red',{remaining:7});
 assert.equal(draft.choose('red',2).id,'deadeye');
 assert.equal(draft.damage('red',10,'melee'),10);
 assert.equal(draft.damage('red',10,'ranged'),12);
});
test('repeated casualties and same-event retries cannot stack options',()=>{
 const draft=new ComebackDraft();
 draft.casualty('blue',{remaining:9});
 const before=draft.offer('blue');
 draft.casualty('blue',{remaining:8});
 assert.deepEqual(draft.offer('blue'),before);
 assert.equal(draft.snapshot().losses.blue,2);
 draft.choose('blue',0);
 draft.casualty('blue',{remaining:7});
 assert.equal(draft.offer('blue').atLoss,3);
});
test('team wipe and postmatch knockouts cannot offer cards',()=>{
 const draft=new ComebackDraft();
 assert.equal(draft.casualty('red',{remaining:0,ended:true}),null);
 assert.equal(draft.casualty('blue',{remaining:9,ended:true}),null);
 assert.equal(draft.offer('blue'),null);
 assert.equal(draft.offer('red'),null);
});
test('card options and effect snapshots are immutable copies',()=>{
 const draft=new ComebackDraft();
 const offer=draft.casualty('blue',{remaining:9});
 offer.options[0].id='fake';
 assert.equal(draft.offer('blue').options[0].id,'war-cry');
 draft.choose('blue',0);
 const snap=draft.snapshot();snap.effects.blue.power=10;
 assert.equal(draft.damage('blue',10),12);
});
test('third choice is final and all outgoing effects have hard caps',()=>{
 const draft=new ComebackDraft();
 for(let loss=1;loss<=9;loss++){
  const o=draft.casualty('blue',{remaining:10-loss});
  if(o)draft.choose('blue',0);
 }
 assert.equal(draft.snapshot().claims.blue,3);
 assert.equal(draft.offer('blue'),null);
 assert.equal(draft.damage('blue',10,'ranged')>=10,true);
});
test('invalid team, reward index and negative damage fail closed',()=>{
 const draft=new ComebackDraft();
 assert.throws(()=>draft.casualty('alien',{remaining:9}),/Invalid draft team/);
 assert.throws(()=>draft.casualty('blue',{remaining:-1}),RangeError);
 assert.equal(draft.choose('red',8),null);
 draft.casualty('blue',{remaining:9});assert.throws(()=>draft.choose('blue',8),RangeError);
 assert.throws(()=>draft.damage('blue',-3),RangeError);
});

test('rapid back-to-back losses queue, rather than discard, unclaimed card offers',()=>{
 const draft=new ComebackDraft();
 draft.casualty('blue',{remaining:9});
 draft.casualty('blue',{remaining:8});
 draft.casualty('blue',{remaining:7});
 draft.casualty('blue',{remaining:6});
 draft.casualty('blue',{remaining:5});
 assert.equal(draft.snapshot().unlocked.blue,3);
 assert.equal(draft.snapshot().queued.blue,2);
 assert.equal(draft.offer('blue').atLoss,1);
 assert.equal(draft.choose('blue',0).id,'war-cry');
 assert.equal(draft.offer('blue').atLoss,3);
 assert.equal(draft.snapshot().queued.blue,1);
 assert.equal(draft.choose('blue',1).id,'field-medics');
 assert.equal(draft.offer('blue').atLoss,5);
 assert.equal(draft.choose('blue',2).id,'war-cry');
 assert.equal(draft.offer('blue'),null);
 assert.equal(draft.snapshot().claims.blue,3);
});
test('queued offers have no effect before the player actually chooses',()=>{
 const draft=new ComebackDraft();
 for(let n=1;n<=5;n++)draft.casualty('blue',{remaining:10-n});
 assert.equal(draft.damage('blue',10),10);
 assert.equal(draft.speed('blue'),1);
 assert.equal(draft.snapshot().claims.blue,0);
});
