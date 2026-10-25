import test from 'node:test';import assert from 'node:assert/strict';import {PlatformRoutes,platformJump,advancePlatformJump} from '../src/systems/platform-routes.js';
const g=new PlatformRoutes([{id:'ground',x:100,y:590},{id:'ramp',x:240,y:510},{id:'upper',x:390,y:440},{id:'isolated',x:800,y:400}],[['ground','ramp'],['ramp','upper']]);
test('shortest authored route connects three landings',()=>assert.deepEqual(g.route('ground','upper').map(n=>n.id),['ground','ramp','upper']));
test('disconnected platforms and unknown nodes return no route',()=>{assert.equal(g.route('ground','isolated'),null);assert.equal(g.route('missing','ground'),null);});
test('jump lands exactly on authored endpoint',()=>{const u={id:1,x:100};u.platformJump=platformJump(u,g.nodes.get('ground'),g.nodes.get('ramp'),0);assert.ok(u.platformJump);const mid=advancePlatformJump(u,400);assert.ok(mid.y<590);const end=advancePlatformJump(u,1000);assert.equal(end.x,240);assert.equal(end.y,510);assert.equal(u.platformJump,null);});
test('unreachable vertical and horizontal jumps rejected',()=>assert.equal(platformJump({x:100},{id:'a',x:100,y:590},{id:'b',x:100,y:200},0),null));

test('jump cannot originate far from the authored takeoff node',()=>{
 const unit={id:7,x:20};
 assert.equal(platformJump(unit,g.nodes.get('ground'),g.nodes.get('ramp'),1000),null);
 unit.x=85;
 assert.ok(platformJump(unit,g.nodes.get('ground'),g.nodes.get('ramp'),1000));
});
