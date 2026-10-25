import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyChampionDecision} from '../src/systems/enemy-champion.js';
import {PlatformRoutes} from '../src/systems/platform-routes.js';
import {IRON_CITADEL_NODES,IRON_CITADEL_LINKS} from '../src/levels/iron-citadel.js';
const graph=new PlatformRoutes(IRON_CITADEL_NODES,IRON_CITADEL_LINKS);
const blue=(id,x,y=590,platformNode=null)=>({id,team:'blue',x,y,platformNode,hp:60});
test('enemy champion pursues surviving allies after the player champion dies',()=>{
 const result=enemyChampionDecision({x:900,y:590,blueChampion:{x:200,hp:0},blueUnits:[blue(8,650),blue(9,250)]});
 assert.equal(result.target.id,8);
 assert.equal(result.target.kind,'companion');
 assert.ok(result.velocityX<0);
});
test('no blue survivors means enemy champion stops chasing',()=>{
 const result=enemyChampionDecision({x:900,y:590,blueChampion:{x:200,hp:0},blueUnits:[{...blue(8,650),hp:0}]});
 assert.equal(result.target,null);assert.equal(result.velocityX,0);
});
test('enemy champion can engage a living hero',()=>{
 const result=enemyChampionDecision({x:900,y:590,blueChampion:{x:820,y:590,hp:100},blueUnits:[blue(5,150)]});
 assert.equal(result.target.id,'hero');
});
test('enemy champion walks through authored ground navigation toward upper enemies',()=>{
 const result=enemyChampionDecision({x:1030,y:590,blueChampion:{hp:0},blueUnits:[blue(5,350,445,'west-gantry')],platforms:graph,grounded:true});
 assert.equal(result.aimX,760);assert.ok(result.velocityX<0);assert.equal(result.jump,false);
});
test('enemy champion initiates climb from a valid platform takeoff',()=>{
 const result=enemyChampionDecision({x:250,y:590,blueChampion:{hp:0},blueUnits:[blue(5,350,445,'west-gantry')],platforms:graph,grounded:true,timeMs:2000});
 assert.equal(result.jump,true);assert.equal(result.drop,false);assert.equal(result.aimX,350);
});
test('enemy champion descends to surviving opponents below',()=>{
 const result=enemyChampionDecision({x:350,y:445,blueChampion:{hp:0},blueUnits:[blue(5,250,590,'west-foot')],platforms:graph,grounded:true,timeMs:2000});
 assert.equal(result.drop,true);assert.equal(result.jump,false);
});
test('traversal cooldown and airborne state prevent repeated jumps',()=>{
 const base={x:250,y:590,blueChampion:{hp:0},blueUnits:[blue(5,350,445,'west-gantry')],platforms:graph,timeMs:2000};
 assert.equal(enemyChampionDecision({...base,grounded:false}).jump,false);
 assert.equal(enemyChampionDecision({...base,grounded:true,nextTraversalAt:2500}).jump,false);
});

test('dead champion location never overrides a distant living survivor',()=>{
 const result=enemyChampionDecision({x:900,y:590,blueChampion:{x:880,y:590,hp:0},blueUnits:[blue(17,100)]});
 assert.equal(result.target.id,17);
 assert.equal(result.target.x,100);
 assert.ok(result.velocityX<0);
});
