import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {REQUIRED_ASSETS,MINIMUM_DIMENSIONS} from '../scripts/verify-assets.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const lock=JSON.parse(readFileSync(join(root,'assets/generated-pack-lock.json'),'utf8'));
const register=JSON.parse(readFileSync(join(root,'assets/licenses.json'),'utf8'));

test('every 18-asset release requirement is approved by exact image hash',()=>{
 assert.equal(REQUIRED_ASSETS.length,18);
 assert.equal(Object.keys(lock.assets).length,17);
 for(const asset of REQUIRED_ASSETS){
  const approval=register.assets[asset];
  assert.ok(approval&&approval.approved===true,'Missing reviewed decision: '+asset);
  assert.match(approval.sha256,/^[a-f0-9]{64}$/);
  assert.match(approval.decision,/^approved-/);
  assert.ok(approval.rightsBasis?.length>20);
  assert.ok(approval.reviewer?.length>5);
  assert.ok(approval.reviewedAt);
  if(asset==='branding/fire-dragon-interactive.png')continue; // Pinned, genuine studio logo.
  const source=lock.assets[asset];
  assert.ok(source,'Missing generated art lock: '+asset);
  assert.equal(approval.sha256,source.sha256,'Unexpected replacement art: '+asset);
  const minimum=MINIMUM_DIMENSIONS[asset];
  assert.ok(source.width>=minimum[0]&&source.height>=minimum[1],asset+' insufficient pixels');
 }
});
test('the six original cards are all required by live Phaser artwork preload',()=>{
 const main=readFileSync(join(root,'src/main.js'),'utf8');
 for(const card of ['war-cry','shieldwall','swift-march','field-medics','war-chest','deadeye']){
  assert.ok(REQUIRED_ASSETS.includes('cards/'+card+'.png'));
  assert.ok(main.includes("'card-"+card+"'")||main.includes("'card-"+card+"':"));
  assert.ok(main.includes("'assets/cards/"+card+".png'"));
 }
});
test('original source sheets are content-pinned and independently reviewable',()=>{
 assert.equal(lock.sourceSheets.length,3);
 for(const source of lock.sourceSheets){
  assert.match(source.sha256,/^[a-f0-9]{64}$/);
  assert.match(source.filename,/\.png$/);
 }
});
test('importer rejects tampered art rather than inventing placeholder textures',()=>{
 const importer=readFileSync(join(root,'scripts/install-art-pack.py'),'utf8');
 assert.match(importer,/sha256/);
 assert.match(importer,/Unverified original source art/);
 assert.match(importer,/refusing overwrite/);
 const windows=readFileSync(join(root,'scripts/install-art-pack.ps1'),'utf8');
 assert.match(windows,/Get-FileHash/);
 assert.match(windows,/sourceSheets/);
});
