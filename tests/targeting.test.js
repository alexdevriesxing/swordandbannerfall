import test from 'node:test';import assert from 'node:assert/strict';import {nearestOpponent} from '../src/systems/targeting.js';
import {BattlefieldCover} from '../src/systems/cover.js';
import {IRON_CITADEL_GANTRIES} from '../src/levels/iron-citadel.js';
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

test('blue champion cannot melee through the stone edge between near-elevation fighters',()=>{
 const champions={blue:{x:300,y:530,hp:100},red:{x:1030,y:590,hp:100}};
 const enemies=[{id:7,team:'red',x:355,y:468,hp:80}];
 const cfg={range:112,fromY:530,attackMode:'melee'};
 assert.equal(nearestOpponent(300,'blue',champions,enemies,cfg)?.id,7,
  'the fighters are close enough vertically without a physical platform');
 assert.equal(nearestOpponent(300,'blue',champions,enemies,{
  ...cfg,gantries:IRON_CITADEL_GANTRIES
 }),null,'stone gantry blocks the strike');
});

test('red champion obeys the same physical stone-platform melee rules',()=>{
 const champions={blue:{x:100,y:590,hp:100},red:{x:355,y:468,hp:100}};
 const enemies=[{id:12,team:'blue',x:300,y:530,hp:80}];
 const cfg={range:112,fromY:468,attackMode:'melee'};
 assert.equal(nearestOpponent(355,'red',champions,enemies,cfg)?.id,12);
 assert.equal(nearestOpponent(355,'red',champions,enemies,{
  ...cfg,gantries:IRON_CITADEL_GANTRIES
 }),null);
});

test('champion still hits unobstructed fighters on either side of a gantry',()=>{
 const champions={blue:{x:300,y:530,hp:100},red:{x:1030,y:590,hp:100}};
 const cfg={range:112,fromY:530,attackMode:'melee',
  gantries:IRON_CITADEL_GANTRIES};
 const ground=[{id:9,team:'red',x:355,y:530,hp:80}];
 assert.equal(nearestOpponent(300,'blue',champions,ground,cfg)?.id,9);
 const overhead=[{id:11,team:'red',x:355,y:445,hp:80}];
 assert.equal(nearestOpponent(300,'blue',champions,overhead,{
  ...cfg,fromY:445
 })?.id,11);
});

test('ranged champion retains physical fire into stone while melee is blocked',()=>{
 const champions={blue:{x:300,y:530,hp:100},red:{x:1030,y:590,hp:100}};
 const enemies=[{id:7,team:'red',x:355,y:468,hp:80}];
 assert.equal(nearestOpponent(300,'blue',champions,enemies,{
  range:650,fromY:530,attackMode:'ranged',gantries:IRON_CITADEL_GANTRIES
 })?.id,7,'projectile collision, not target selection, decides the blocked shot');
});
