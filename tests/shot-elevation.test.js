import test from 'node:test';
import assert from 'node:assert/strict';
import {BattlefieldCover,shotObstruction} from '../src/systems/cover.js';
import {planCompanionShot} from '../src/systems/companion-projectiles.js';
import {nearestOpponent} from '../src/systems/targeting.js';
import {validImpact} from '../src/systems/impact.js';

const cover=()=>new BattlefieldCover([{id:'gate',x:640,width:82,hp:120}]);
const point=(x,y)=>({x,y});
const ranger=(x,y,team='blue')=>({id:1,team,role:'ranger',x,y,hp:45});
const enemy=(x,y)=>({id:2,team:'red',x,y,hp:80});

test('ground bullets are blocked by cover while overhead bullets pass',()=>{
 const c=cover();
 assert.equal(shotObstruction(c,point(550,573),point(740,573))?.id,'gate');
 assert.equal(shotObstruction(c,point(550,428),point(740,428)),null);
 assert.equal(c.obstruction(550,740)?.id,'gate'); // Ground travel remains blocked
});
test('shots crossing downward into a barricade are intercepted at its edge',()=>{
 const c=cover();
 assert.equal(shotObstruction(c,point(550,428),point(740,573))?.id,'gate');
 assert.equal(shotObstruction(c,point(740,573),point(550,428))?.id,'gate');
});
test('obstruction ordering is directional when crossing multiple intact barriers',()=>{
 const c=new BattlefieldCover([{id:'west',x:460,width:50,hp:100},{id:'east',x:820,width:50,hp:100}]);
 assert.equal(shotObstruction(c,point(200,573),point(1000,573))?.id,'west');
 assert.equal(shotObstruction(c,point(1000,573),point(200,573))?.id,'east');
});
test('AI ranged shots clear low cover only when shooter and target are elevated',()=>{
 const c=cover();
 assert.ok(planCompanionShot({attacker:ranger(550,445),target:enemy(740,445),damage:9,cover:c}));
 assert.equal(planCompanionShot({attacker:ranger(550,590),target:enemy(740,590),damage:9,cover:c}),null);
});
test('champion targeting distinguishes overhead shots from ground cover',()=>{
 const c=cover();
 const foes=[enemy(740,445)];
 assert.equal(nearestOpponent(550,'blue',{blue:{hp:0},red:{hp:0}},foes,{range:260,fromY:445,attackMode:'ranged',cover:c})?.id,2);
 assert.equal(nearestOpponent(550,'blue',{blue:{hp:0},red:{hp:0}},[enemy(740,590)],{range:260,fromY:590,attackMode:'ranged',cover:c}),null);
});
test('telegraphed elevated ranged attacks clear low cover, but not ground ones',()=>{
 const c=cover();
 assert.equal(validImpact({attacker:ranger(550,445),target:enemy(740,445),range:260,cover:c}),true);
 assert.equal(validImpact({attacker:ranger(550,590),target:enemy(740,590),range:260,cover:c}),false);
});
