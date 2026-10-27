import test from 'node:test';import assert from 'node:assert/strict';import {nearestOpponent} from '../src/systems/targeting.js';
import {BattlefieldCover} from '../src/systems/cover.js';
const champs={blue:{x:100,hp:100},red:{x:1000,hp:100}};
test('champion finds nearby enemy companion before distant champion',()=>{const units=[{id:7,team:'red',x:160,hp:30},{id:8,team:'blue',x:120,hp:50}];assert.equal(nearestOpponent(100,'blue',champs,units,{range:120}).id,7);});
test('dead companions, friendlies and blocked opponents are ignored',()=>{const units=[{id:1,team:'red',x:130,hp:0},{id:2,team:'red',x:170,hp:30},{id:3,team:'blue',x:105,hp:40}];assert.equal(nearestOpponent(100,'blue',champs,units,{range:200,cover:{obstruction:(a,b)=>b>=160?{}:null}}),null);});
test('returns null when no opponent in range',()=>{assert.equal(nearestOpponent(100,'blue',champs,[],{range:80}),null);});

test('champion melee cannot reach enemy above the gantry',()=>{
 const enemy=[{id:12,team:'red',x:150,y:445,hp:45}];
 assert.equal(nearestOpponent(100,'blue',champs,enemy,{range:120,fromY:590,attackMode:'melee'}),null);
});
test('champion ranged attack can select a vertically reachable gantry enemy',()=>{
 const enemy=[{id:12,team:'red',x:150,y:445,hp:45}];
 assert.equal(nearestOpponent(100,'blue',champs,enemy,{range:250,fromY:590,attackMode:'ranged'})?.id,12);
});

test('elevated champion melee can hit same-height enemy above intact ground cover',()=>{
 const cover=new BattlefieldCover([{id:'barricade',x:600,width:82,hp:120}]);
 const units=[{id:7,team:'red',x:635,y:445,hp:40}];
 const champions={blue:{x:555,y:445,hp:100},red:{x:1000,y:590,hp:100}};
 const candidate=nearestOpponent(555,'blue',champions,units,{
  range:112,fromY:445,attackMode:'melee',cover
 });
 assert.equal(candidate?.id,7);
 assert.equal(cover.intact().length,1,'barrier is still physically present below the fighters');
});
test('the same champion melee cannot strike a ground target through intact barricade',()=>{
 const cover=new BattlefieldCover([{id:'barricade',x:600,width:82,hp:120}]);
 const units=[{id:7,team:'red',x:635,y:590,hp:40}];
 const champions={blue:{x:555,y:590,hp:100},red:{x:1000,y:590,hp:100}};
 assert.equal(nearestOpponent(555,'blue',champions,units,{
  range:112,fromY:590,attackMode:'melee',cover
 }),null);
});
