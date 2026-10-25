import test from 'node:test';import assert from 'node:assert/strict';import {nearestOpponent} from '../src/systems/targeting.js';
const champs={blue:{x:100,hp:100},red:{x:1000,hp:100}};
test('champion finds nearby enemy companion before distant champion',()=>{const units=[{id:7,team:'red',x:160,hp:30},{id:8,team:'blue',x:120,hp:50}];assert.equal(nearestOpponent(100,'blue',champs,units,{range:120}).id,7);});
test('dead companions, friendlies and blocked opponents are ignored',()=>{const units=[{id:1,team:'red',x:130,hp:0},{id:2,team:'red',x:170,hp:30},{id:3,team:'blue',x:105,hp:40}];assert.equal(nearestOpponent(100,'blue',champs,units,{range:200,cover:{obstruction:(a,b)=>b>=160?{}:null}}),null);});
test('returns null when no opponent in range',()=>{assert.equal(nearestOpponent(100,'blue',champs,[],{range:80}),null);});
