import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkPlacementLock} from '../scripts/check-placement-lock.js';
import {placementCandidateFromAlpha} from '../scripts/review-art-v2.js';
import {APPROVED_ALPHA_BOUNDS,fitPaintedSilhouette} from '../src/levels/approved-art-placement.js';

const repoLock=JSON.parse(readFileSync(new URL('../assets/placement-lock.json',import.meta.url)));
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'bannerfall-placement-'));
 mkdirSync(join(root,'assets'),{recursive:true});
 writeFileSync(join(root,'assets/placement-lock.json'),JSON.stringify(repoLock));
 return root;
}
test('existing original art is locked to both documented dimensions and pixel SHA-256',()=>{
 const root=fixture();
 try{
  assert.deepEqual(checkPlacementLock({root}),[]);
  const v1=repoLock.textures['arena/destructible-barricade.png'];
  assert.equal(v1.sha256,'4246eca164eccb9f519ec234a697401b26842a4e250b48a58940935118cec448');
  assert.deepEqual(v1.bounds,APPROVED_ALPHA_BOUNDS.barricade);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('a new v2 image hash cannot silently keep the old collider geometry',()=>{
 const root=fixture();
 try{
  const mismatch={assets:{
   'arena/destructible-barricade.png':{sha256:'f'.repeat(64)},
   'arena/iron-citadel-gantry.png':{sha256:repoLock.textures['arena/iron-citadel-gantry.png'].sha256}
  }};
  writeFileSync(join(root,'assets/licenses.json'),JSON.stringify(mismatch));
  assert.deepEqual(checkPlacementLock({root}),[
   'collider placement lock differs from approved art checksum: arena/destructible-barricade.png'
  ]);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('edited PNG bytes cannot match an unchanged placement lock',()=>{
 const root=fixture();
 try{
  mkdirSync(join(root,'public/assets/arena'),{recursive:true});
  writeFileSync(join(root,'public/assets/arena/iron-citadel-gantry.png'),Buffer.from('wrong PNG bytes'));
  assert.ok(checkPlacementLock({root}).some(s=>s.includes('actual texture bytes: arena/iron-citadel-gantry.png')));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('any unapproved source art silhouette adjustment invalidates locked placement',()=>{
 const root=fixture();
 try{
  const altered={...APPROVED_ALPHA_BOUNDS,
   gantry:{...APPROVED_ALPHA_BOUNDS.gantry,top:22}};
  assert.ok(checkPlacementLock({root,bounds:altered}).some(s=>s.includes('unreviewed or mismatched collider silhouette: arena/iron-citadel-gantry.png')));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('missing, malformed and incomplete placement locks fail closed',()=>{
 const root=mkdtempSync(join(tmpdir(),'bannerfall-placement-empty-'));
 try{
  assert.ok(checkPlacementLock({root})[0].includes('missing'));
  mkdirSync(join(root,'assets'),{recursive:true});
  writeFileSync(join(root,'assets/placement-lock.json'),'{{');
  assert.ok(checkPlacementLock({root})[0].includes('invalid'));
  writeFileSync(join(root,'assets/placement-lock.json'),JSON.stringify({...repoLock,textures:{}}));
  assert.equal(checkPlacementLock({root}).length,2);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('v2 candidate provides exact exclusive alpha bounds, never instant approval',()=>{
 const sha='a'.repeat(64);
 const measured={ok:true,width:300,height:420,
  bounds:{left:60,top:35,right:240,bottom:335}};
 const out=placementCandidateFromAlpha(measured,sha);
 assert.equal(out.sha256,sha);
 assert.deepEqual([out.left,out.top,out.right,out.bottom],[60,35,241,336]);
 assert.deepEqual([out.textureWidth,out.textureHeight],[300,420]);
 assert.match(out.status,/manual/i);
 const fitted=fitPaintedSilhouette(out,{x:640,y:580,visibleWidth:82,visibleHeight:125});
 const sx=fitted.displayWidth/out.textureWidth,sy=fitted.displayHeight/out.textureHeight;
 assert.ok(Math.abs((out.right-out.left)*sx-82)<1e-9);
 assert.ok(Math.abs((out.bottom-out.top)*sy-125)<1e-9);
 assert.equal(placementCandidateFromAlpha({...measured,ok:false},sha),null);
 assert.equal(placementCandidateFromAlpha(measured,'invalid'),null);
});
