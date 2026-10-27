import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {reviewArtV2,ART_V2_REQUIRED,ART_V2_ALPHA} from '../scripts/review-art-v2.js';
test('a new pack has exactly seventeen non-branding isolated game textures',()=>{
 assert.equal(ART_V2_REQUIRED.length,17);
 assert.equal(ART_V2_ALPHA.length,9);
 assert.ok(ART_V2_REQUIRED.every(path=>!path.startsWith('branding/')));
 assert.ok(ART_V2_REQUIRED.includes('cards/deadeye.png'));
});
test('empty candidate never receives automatic approval or alters v1',()=>{
 const root=mkdtempSync(join(tmpdir(),'bannerfall-v2-candidate-'));
 try{
  const report=reviewArtV2(root);
  assert.equal(report.technicalPass,false);
  assert.equal(report.presentCount,0);
  assert.equal(report.issues.length,17);
  assert.ok(report.approval.startsWith('NOT APPROVED'));
  assert.deepEqual(readdirSync(root),[]);
 }finally{rmSync(root,{recursive:true,force:true});}
});
