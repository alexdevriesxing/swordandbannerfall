import test from 'node:test';
import assert from 'node:assert/strict';
import {readGamepadState,GamepadEdgeTracker,GAMEPAD_BUTTONS} from '../src/systems/gamepad-controls.js';
const pad=(indices=[],stick=0)=>({connected:true,buttons:Array.from({length:16},(_,i)=>({pressed:indices.includes(i),value:indices.includes(i)?1:0})),leftStick:{x:stick,y:0}});
test('absent and disconnected controllers do not claim inputs',()=>{
 assert.deepEqual(readGamepadState(null),readGamepadState({connected:false}));
 const t=new GamepadEdgeTracker();assert.equal(t.read(null).pressed.jump,false);
});
test('left stick has a deadzone and analog values are clamped',()=>{
 assert.equal(readGamepadState(pad([], .2)).axis,0);
 assert.equal(readGamepadState(pad([],-.75)).axis,-.75);
 assert.equal(readGamepadState(pad([],1.3)).axis,1);
 assert.equal(readGamepadState({...pad([],1),left:true}).axis,-1);
});
test('standard A/B/X/Y controls map to jump, shooting, melee, and squad orders',()=>{
 const s=readGamepadState(pad([0,1,2,3]));
 assert.deepEqual([s.jump,s.shoot,s.melee,s.order],[true,true,true,true]);
 assert.deepEqual([s.card1,s.card2,s.card3],[true,true,true]);
});
test('shoulders and triggers map to guard and all three defense choices',()=>{
 const s=readGamepadState(pad([4,5,6,7]));
 assert.equal(s.guard,true);assert.equal(s.turret,true);
 assert.equal(s.trap,true);assert.equal(s.shield,true);
 assert.equal(GAMEPAD_BUTTONS.confirm,9);
});
test('start and back are distinct confirmation and pause actions',()=>{
 const s=readGamepadState(pad([8,9]));
 assert.equal(s.pause,true);assert.equal(s.confirm,true);
});
test('one press stays one press when a held button is read on subsequent frames',()=>{
 const t=new GamepadEdgeTracker();const p=pad([0,3]);
 assert.equal(t.read(p).pressed.jump,true);
 assert.equal(t.read(p).pressed.jump,false);
 assert.equal(t.read(p).pressed.order,false);
 t.read(pad());
 assert.equal(t.read(p).pressed.order,true);
});
test('a disconnected controller releases controls without sticking',()=>{
 const t=new GamepadEdgeTracker();
 assert.equal(t.read(pad([4])).held.guard,true);
 assert.equal(t.read(null).held.guard,false);
 assert.equal(t.read(pad([4])).pressed.guard,true);
});
test('D-pad and left stick vertical directions support drop and jump',()=>{
 const up=readGamepadState({...pad(),up:true});
 const down=readGamepadState({...pad(),down:true});
 assert.equal(up.up,true);
 assert.equal(down.down,true);
 assert.equal(readGamepadState({...pad(),leftStick:{x:0,y:-.8}}).up,true);
});
test('reset restores fresh-controller input edge semantics',()=>{
 const t=new GamepadEdgeTracker();
 t.read(pad([8]));assert.equal(t.read(pad([8])).pressed.pause,false);
 t.reset();assert.equal(t.read(pad([8])).pressed.pause,true);
});
test('older or nonstandard pads missing mappings fail neutral for missing buttons',()=>{
 const p={connected:true,buttons:[],leftStick:{}};
 assert.equal(readGamepadState(p).melee,false);
 assert.equal(readGamepadState(p).axis,0);
});
