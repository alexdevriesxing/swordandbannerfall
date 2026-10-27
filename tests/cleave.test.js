import test from 'node:test';
import assert from 'node:assert/strict';
import {cleaveSplashTargets,cleaveSplashDamage} from '../src/systems/cleave.js';
import {BattlefieldCover} from '../src/systems/cover.js';

const actor={id:1,role:'vanguard',team:'blue',x:400,y:590,hp:80};
const primary={id:8,team:'red',x:465,y:590,hp:70};
const other=(id,x,y=590,team='red',hp=50)=>({id,team,x,y,hp});

test('Vanguard Cleave strikes at most two living nearby hostiles beyond its primary target',()=>{
 const foes=[primary,other(9,480),other(10,490),other(11,430),other(12,510)];
 assert.deepEqual(cleaveSplashTargets(actor,primary,foes).map(u=>u.id),[9,10]);
 assert.equal(cleaveSplashDamage(19),11);
 assert.equal(cleaveSplashDamage(1),1);
});

test('a shielded champion can be a secondary Cleave target',()=>{
 const foes=[primary,{id:'enemy',team:'red',x:445,y:590,hp:100}];
 const targets=cleaveSplashTargets(actor,primary,foes);
 assert.deepEqual(targets.map(u=>u.id),['enemy']);
});

test('same-team fighters, defeated fighters and the primary never receive splash',()=>{
 const foes=[primary,other(2,455,590,'blue'),other(3,455,590,'red',0)];
 assert.deepEqual(cleaveSplashTargets(actor,primary,foes),[]);
});

test('ground Vanguard cannot Cleave fighters standing on an elevated gantry',()=>{
 const foes=[primary,other(5,455,445),other(6,450,590)];
 assert.deepEqual(cleaveSplashTargets(actor,primary,foes).map(u=>u.id),[6]);
});

test('Cleave cannot reach through a real barricade',()=>{
 const wall=new BattlefieldCover([{id:'wall',x:435,width:20,hp:40}]);
 const foes=[primary,other(3,420),other(2,470)];
 // The target in front of the wall is reachable, but the one behind is not.
 assert.deepEqual(cleaveSplashTargets(actor,primary,foes,{cover:wall}).map(u=>u.id),[3]);
});

test('splash hit resolution is stable when candidates have identical positions',()=>{
 const enemies=[primary,other(33,455),other(11,455),other(22,455)];
 assert.deepEqual(cleaveSplashTargets(actor,primary,enemies).map(u=>u.id),[11,22]);
 assert.deepEqual(cleaveSplashTargets(actor,primary,[...enemies].reverse()).map(u=>u.id),[11,22]);
});

test('only a living Vanguard with a valid attack arc may cleave',()=>{
 assert.deepEqual(cleaveSplashTargets({...actor,role:'sentinel'},primary,[other(2,450)]),[]);
 assert.deepEqual(cleaveSplashTargets({...actor,hp:0},primary,[other(2,450)]),[]);
 assert.deepEqual(cleaveSplashTargets(actor,{...primary,hp:0},[other(2,450)]),[]);
 assert.deepEqual(cleaveSplashTargets(actor,{...primary,team:'blue'},[other(2,450)]),[]);
 assert.deepEqual(cleaveSplashTargets(actor,primary,[other(2,450)],{maxExtra:0}),[]);
 assert.throws(()=>cleaveSplashDamage(0),RangeError);
});
