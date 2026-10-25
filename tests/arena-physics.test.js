import test from 'node:test';
import assert from 'node:assert/strict';
import {
 COMPANION_HEIGHT,GROUND_ART_HEIGHT,GROUND_ART_CENTER_Y,FLOOR_TOP_Y,
 CHAMPION_HEIGHT,CHAMPION_HITBOX_HEIGHT_RATIO,championHitbox,championLandingY,
 validateGantrySurfaces,isGrounded,canDropThroughGantry
} from '../src/levels/arena-physics.js';
import {GROUND_Y} from '../src/systems/navigation.js';
import {IRON_CITADEL_GANTRIES} from '../src/levels/iron-citadel.js';

test('final ground texture and static collider align exactly with companion feet',()=>{
 assert.equal(FLOOR_TOP_Y,GROUND_Y+COMPANION_HEIGHT/2);
 assert.equal(GROUND_ART_CENTER_Y-GROUND_ART_HEIGHT/2,FLOOR_TOP_Y);
 assert.ok(FLOOR_TOP_Y<720);
});
test('champion body uses native texture dimensions under Phaser display scaling',()=>{
 const box=championHitbox(120,200);
 assert.equal(box.width,78);
 assert.equal(box.height,172);
 assert.throws(()=>championHitbox(0,100),RangeError);
 assert.throws(()=>championHitbox(100,NaN),RangeError);
});
test('grounded champion physical feet align with shared authored floor top',()=>{
 const bodyHeight=CHAMPION_HEIGHT*CHAMPION_HITBOX_HEIGHT_RATIO;
 assert.equal(championLandingY(FLOOR_TOP_Y)+bodyHeight/2,FLOOR_TOP_Y);
 assert.equal(championLandingY(FLOOR_TOP_Y),579.5);
});
test('both artist-authored gantry tops align with AI platform landing feet',()=>{
 assert.equal(validateGantrySurfaces(IRON_CITADEL_GANTRIES),true);
 assert.equal(IRON_CITADEL_GANTRIES.length,2);
});
test('misaligned elevated terrain is rejected before Phaser loads the scene',()=>{
 assert.throws(()=>validateGantrySurfaces([{id:'bad',y:490,height:24,landingY:420}]),/does not align/);
 assert.throws(()=>validateGantrySurfaces([]),/No approved/);
});

test('Arcade touching.down permits jumps even when blocked.down is false',()=>{
 assert.equal(isGrounded({blocked:{down:false},touching:{down:true}}),true);
 assert.equal(isGrounded({blocked:{down:true},touching:{down:false}}),true);
 assert.equal(isGrounded({blocked:{down:false},touching:{down:false}}),false);
 assert.equal(isGrounded(null),false);
});
test('S drops through elevated gantries, never through the solid ground',()=>{
 const gantry=IRON_CITADEL_GANTRIES[0];
 const onGantry={bottom:gantry.y-gantry.height/2,blocked:{down:false},touching:{down:true}};
 assert.equal(canDropThroughGantry(onGantry,gantry.x,IRON_CITADEL_GANTRIES),true);
 assert.equal(canDropThroughGantry({...onGantry,bottom:FLOOR_TOP_Y},gantry.x,IRON_CITADEL_GANTRIES),false);
 assert.equal(canDropThroughGantry({...onGantry,touching:{down:false}},gantry.x,IRON_CITADEL_GANTRIES),false);
 assert.equal(canDropThroughGantry(onGantry,50,IRON_CITADEL_GANTRIES),false);
});
