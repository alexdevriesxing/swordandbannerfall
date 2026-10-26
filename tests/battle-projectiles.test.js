import test from 'node:test';
import assert from 'node:assert/strict';
import { firstBattleProjectileContact } from '../src/systems/battle-projectiles.js';
import { BattlefieldCover } from '../src/systems/cover.js';

const travel=(start=300,end=900,y=573)=>[{x:start,y},{x:end,y}];
const red=(id,x,y=590,hp=45)=>({id,team:'red',x,y,hp});
const blue=(id,x,y=590,hp=45)=>({id,team:'blue',x,y,hp});
const hit=(a,b,options)=>firstBattleProjectileContact(a,b,{
 firingTeam:'blue',champions:{blue:null,red:null},
 companions:[],cover:null,...options
});

test('a bullet hits the first living enemy rather than its previously chosen target',()=>{
 const [a,b]=travel();
 const companions=[red(44,800),red(12,450)];
 assert.deepEqual(hit(a,b,{companions}),{
  kind:'unit',id:12,targetKind:'companion',time:108/600
 });
 // Results must not depend on roster iteration order.
 assert.deepEqual(hit(a,b,{companions:[...companions].reverse()}),
  hit(a,b,{companions}));
});

test('a barricade shields fighters standing behind it',()=>{
 const [a,b]=travel();
 const cover=new BattlefieldCover([{id:'wall',x:550,width:80,hp:90}]);
 const contact=hit(a,b,{cover,companions:[red(10,750)]});
 assert.equal(contact.kind,'cover');
 assert.equal(contact.id,'wall');
 assert.equal(cover.segments[0].hp,90,'collision planning must not mutate the world');
});

test('a nearby enemy is struck before the bullet reaches a distant barricade',()=>{
 const [a,b]=travel();
 const cover=new BattlefieldCover([{id:'wall',x:750,width:80,hp:90}]);
 const contact=hit(a,b,{cover,companions:[red(7,450)]});
 assert.equal(contact.kind,'unit');
 assert.equal(contact.id,7);
});

test('ignore friendlies, defeated opponents and enemies at another elevation',()=>{
 const [a,b]=travel();
 const companions=[blue(1,400),red(2,425,590,0),red(3,450,445),red(4,600)];
 assert.equal(hit(a,b,{companions}).id,4);
 assert.equal(hit(a,b,{companions:companions.slice(0,3)}),null);
});

test('champions participate in first-hit selection',()=>{
 const [a,b]=travel();
 const champions={blue:{team:'blue',x:410,y:590,hp:100},
  red:{team:'red',x:480,y:590,hp:100}};
 assert.deepEqual(hit(a,b,{champions}),{
  kind:'unit',id:'enemy',targetKind:'champion',time:138/600
 });
});

test('the second human faction uses the same symmetric collision rules',()=>{
 const contact=firstBattleProjectileContact(
  {x:900,y:573},{x:300,y:573},{
   firingTeam:'red',
   companions:[blue(2,720),red(3,800),blue(1,500)]
  });
 assert.equal(contact.kind,'unit');
 assert.equal(contact.id,2);
});

test('cover-only shots still damage the first wall without a living target',()=>{
 const cover=new BattlefieldCover([{id:'west',x:550,width:80,hp:50},
  {id:'east',x:750,width:80,hp:60}]);
 const [a,b]=travel();
 assert.equal(hit(a,b,{cover}).id,'west');
});

test('invalid projectile geometry and invalid firing teams fail closed',()=>{
 assert.equal(hit({x:NaN,y:573},{x:900,y:573},{companions:[red(1,500)]}),null);
 assert.equal(firstBattleProjectileContact(...travel(),{firingTeam:'invalid',
  companions:[red(1,500)]}),null);
});

test('same-position hostile units produce deterministic ID ordering',()=>{
 const [a,b]=travel();
 assert.equal(hit(a,b,{companions:[red(22,500),red(11,500)]}).id,11);
 assert.equal(hit(a,b,{companions:[red(11,500),red(22,500)]}).id,11);
});
