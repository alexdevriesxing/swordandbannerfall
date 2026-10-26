import test from 'node:test';
import assert from 'node:assert/strict';
import {sweptCompanionHit,sweptProjectileImpact,sweptProjectileContact} from '../src/systems/projectile-impact.js';

test('fast projectile crossing between frames still hits its assigned opponent',()=>{
 const target={x:200,y:590};
 assert.equal(sweptCompanionHit({x:120,y:573},{x:300,y:573},target),true);
});
test('projectile travelling at the wrong elevation misses target',()=>{
 assert.equal(sweptCompanionHit({x:120,y:430},{x:300,y:430},{x:200,y:590}),false);
});
test('projectile moving entirely away from a target misses',()=>{
 assert.equal(sweptCompanionHit({x:260,y:573},{x:340,y:573},{x:200,y:590}),false);
});
test('stationary shots can hit a nearby opponent but not a distant one',()=>{
 assert.equal(sweptCompanionHit({x:190,y:573},{x:190,y:573},{x:200,y:590}),true);
 assert.equal(sweptCompanionHit({x:100,y:573},{x:100,y:573},{x:200,y:590}),false);
});
test('invalid projectile paths fail closed',()=>{
 assert.equal(sweptCompanionHit({x:NaN,y:0},{x:1,y:1},{x:1,y:1}),false);
 assert.equal(sweptCompanionHit({x:0,y:0},{x:1,y:1},{x:1,y:1},{radius:-1}),false);
});

test('fast shot hits barricade before a companion on the far side',()=>{
 const cover={intact:()=>[{id:'wall',x:640,width:82,hp:120}]};
 assert.equal(sweptProjectileImpact({x:500,y:573},{x:800,y:573},{x:790,y:590},cover),'cover');
});
test('fast overhead shot hits elevated companion without hitting ground barricade',()=>{
 const cover={intact:()=>[{id:'wall',x:640,width:82,hp:120}]};
 assert.equal(sweptProjectileImpact({x:500,y:428},{x:800,y:428},{x:790,y:445},cover),'unit');
});
test('nearer companion is hit before a later barricade',()=>{
 const cover={intact:()=>[{id:'wall',x:640,width:82,hp:120}]};
 assert.equal(sweptProjectileImpact({x:500,y:573},{x:800,y:573},{x:550,y:590},cover),'unit');
});
test('unreached cover and distant unit produce no impact',()=>{
 const cover={intact:()=>[{id:'wall',x:640,width:82,hp:120}]};
 assert.equal(sweptProjectileImpact({x:500,y:573},{x:550,y:573},{x:790,y:590},cover),null);
});
test('vertical shots intersect cover only after descending below its top',()=>{
 const cover={intact:()=>[{id:'wall',x:640,width:82,hp:120}]};
 assert.equal(sweptProjectileImpact({x:640,y:430},{x:640,y:590},{x:640,y:590},cover),'cover');
});

test('bullet returns first barrier ID and permits exact destructible-cover damage',()=>{
 const {BattlefieldCover}=await import('../src/systems/cover.js');
 const cover=new BattlefieldCover([
  {id:'near',x:590,width:70,hp:12},
  {id:'far',x:710,width:70,hp:40}
 ]);
 const from={x:500,y:573},to={x:800,y:573},victim={id:9,x:800,y:590};
 const first=sweptProjectileContact(from,to,victim,cover);
 assert.equal(first.kind,'cover');
 assert.equal(first.id,'near');
 assert.equal(cover.damage(first.id,12).destroyed,true);
 assert.equal(cover.segments.find(b=>b.id==='far').hp,40);
 const second=sweptProjectileContact(from,to,victim,cover);
 assert.equal(second.kind,'cover');
 assert.equal(second.id,'far');
 assert.equal(cover.damage(second.id,12).applied,12);
 assert.equal(cover.segments.find(b=>b.id==='far').hp,28);
});
test('first enemy hit wins over later cover and never damages the wall',()=>{
 const cover={intact:()=>[{id:'far-wall',x:720,width:50,hp:100}]};
 const contact=sweptProjectileContact(
  {x:500,y:573},{x:810,y:573},{id:7,x:610,y:590},cover);
 assert.deepEqual({kind:contact.kind,id:contact.id},{kind:'unit',id:7});
 assert.ok(contact.time<1);
});
test('high trajectory passes over floor barricades and hits its intended elevated target',()=>{
 const cover={intact:()=>[{id:'wall',x:640,width:82,hp:120}]};
 const contact=sweptProjectileContact(
  {x:500,y:428},{x:800,y:428},{id:8,x:790,y:445},cover);
 assert.equal(contact.kind,'unit');
 assert.equal(contact.id,8);
});
test('overlapping cover IDs resolve consistently regardless of authored array order',()=>{
 const a={id:'alpha',x:640,width:80},b={id:'beta',x:640,width:80};
 const args=[{x:500,y:573},{x:800,y:573},{id:5,x:790,y:590}];
 const first=sweptProjectileContact(...args,{intact:()=>[b,a]});
 const second=sweptProjectileContact(...args,{intact:()=>[a,b]});
 assert.equal(first.id,'alpha');
 assert.equal(second.id,'alpha');
});
test('invalid geometry or unreachable cover cannot produce spurious impacts',()=>{
 const target={id:5,x:500,y:590};
 assert.equal(sweptProjectileContact({x:0,y:0},{x:10,y:0},target,
   {intact:()=>[{id:'bad',x:NaN,width:40}]}),null);
 assert.equal(sweptProjectileContact({x:0,y:0},{x:10,y:0},target,null),null);
 assert.equal(sweptProjectileContact({x:NaN,y:0},{x:10,y:0},target,null),null);
});
