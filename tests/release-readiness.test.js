import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {releaseReadiness} from '../scripts/release-readiness.js';
test('release fails when art and license records have not been delivered',()=>{
 const root=mkdtempSync(join(tmpdir(),'bannerfall-release-'));
 try {const status=releaseReadiness({root});assert.equal(status.ready,false);assert.ok(status.issues.some(s=>s.includes('missing asset')));assert.ok(status.issues.some(s=>s.includes('rights register')));}
 finally{rmSync(root,{force:true,recursive:true});}
});
test('malformed licensing JSON blocks a release',()=>{
 const root=mkdtempSync(join(tmpdir(),'bannerfall-release-'));
 try{mkdirSync(join(root,'assets'));writeFileSync(join(root,'assets/licenses.json'),'{broken');assert.ok(releaseReadiness({root}).issues.includes('invalid asset rights register'));}
 finally{rmSync(root,{force:true,recursive:true});}
});

test('empty or whitespace license metadata cannot pass approval',()=>{
 const root=mkdtempSync(join(tmpdir(),'bannerfall-release-'));
 try{
  mkdirSync(join(root,'assets'));
  const assets=Object.fromEntries([
   'arena/iron-citadel.webp','arena/citadel-ground.webp','arena/destructible-barricade.png',
   'fighters/knight.png','fighters/raider.png','fx/projectile.png','fx/slash.png',
   'branding/fire-dragon-interactive.png','defenses/trap.png','defenses/turret.png','defenses/shield.png'
  ].map(filename=>[filename,{creator:'  ',source:'example',license:'internal',approved:true}]));
  writeFileSync(join(root,'assets/licenses.json'),JSON.stringify({assets}));
  const result=releaseReadiness({root});
  assert.equal(result.ready,false);
  assert.ok(result.issues.filter(s=>s.startsWith('unapproved')).length===11);
 }finally{rmSync(root,{force:true,recursive:true});}
});
