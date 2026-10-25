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
