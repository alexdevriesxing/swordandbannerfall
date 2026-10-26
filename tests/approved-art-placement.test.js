import test from 'node:test';
import assert from 'node:assert/strict';
import {APPROVED_ALPHA_BOUNDS,fitPaintedSilhouette,gantryPaintingPlacement} from '../src/levels/approved-art-placement.js';
import {IRON_CITADEL_GANTRIES} from '../src/levels/iron-citadel.js';
import {BattlefieldCover} from '../src/systems/cover.js';

const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,
  'Expected '+expected+', got '+actual);
test('barricade silhouette exactly matches the authored collider without PNG transparency margins',()=>{
 const b=APPROVED_ALPHA_BOUNDS.barricade;
 for(const cover of new BattlefieldCover().snapshot()){
  const p=fitPaintedSilhouette(b,{x:cover.x,y:580,visibleWidth:cover.width,visibleHeight:125});
  const sx=p.displayWidth/b.textureWidth,sy=p.displayHeight/b.textureHeight;
  close((b.right-b.left)*sx,cover.width);
  close((b.bottom-b.top)*sy,125);
  close(p.x+(b.left+b.right-b.textureWidth)*sx/2,cover.x);
  close(p.y+(b.top+b.bottom-b.textureHeight)*sy/2,580);
  assert.ok(p.displayWidth>cover.width,
    'Source alpha margins must stay outside the collider');
 }
});
test('mossy gantry painting preserves source aspect ratio and touches its solid top',()=>{
 const b=APPROVED_ALPHA_BOUNDS.gantry;
 for(const platform of IRON_CITADEL_GANTRIES){
  const p=gantryPaintingPlacement(platform);
  const scale=p.displayWidth/b.textureWidth;
  close(scale,p.displayHeight/b.textureHeight);
  close((b.right-b.left)*scale,platform.width);
  close(p.x+(b.left+b.right-b.textureWidth)*scale/2,platform.x);
  close(p.y-p.displayHeight/2+b.top*scale,platform.y-platform.height/2);
  assert.ok((b.bottom-b.top)*scale>platform.height,
    'The original undistorted painted stonehang is taller than the walkable ledge');
 }
});
test('art placement validates native alpha bounds and desired world dimensions',()=>{
 const b=APPROVED_ALPHA_BOUNDS.barricade;
 assert.throws(()=>fitPaintedSilhouette(b,{x:640,y:580,visibleWidth:0,visibleHeight:125}),RangeError);
 assert.throws(()=>fitPaintedSilhouette(b,{x:NaN,y:580,visibleWidth:82,visibleHeight:125}),RangeError);
 assert.throws(()=>fitPaintedSilhouette({...b,right:999},{x:640,y:580,visibleWidth:82,visibleHeight:125}),RangeError);
 assert.throws(()=>gantryPaintingPlacement({x:350,y:490,width:-5,height:24}),RangeError);
});
test('approved art dimensions match locked original texture exports, not synthetic artwork',()=>{
 const b=APPROVED_ALPHA_BOUNDS.barricade,g=APPROVED_ALPHA_BOUNDS.gantry;
 assert.deepEqual([b.textureWidth,b.textureHeight],[160,280]);
 assert.deepEqual([g.textureWidth,g.textureHeight],[380,135]);
 assert.deepEqual([b.left,b.top,b.right,b.bottom],[40,61,120,218]);
 assert.deepEqual([g.left,g.top,g.right,g.bottom],[74,26,305,109]);
});
