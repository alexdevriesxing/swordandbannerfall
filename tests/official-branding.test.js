import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
 gitBlobSha,validateOfficialLogo,importOfficialBranding,
 OFFICIAL_LOGO_SOURCE,OFFICIAL_LOGO_BLOB_SHA,OFFICIAL_LOGO_PATH
} from '../scripts/import-official-branding.js';
import {pngFixture} from './helpers/image-fixtures.js';

test('Git blob SHA matches standard Git hash for a known input',()=>{
 assert.equal(gitBlobSha(Buffer.from('hello\n')),'ce013625030ba8dba906f756967f9e9ca394464a');
});
test('branding import is pinned to a specific first-party source commit',()=>{
 const url=new URL(OFFICIAL_LOGO_SOURCE);
 assert.equal(url.hostname,'www.firedragoninteractive.com');
 assert.equal(url.pathname,'/assets/fire-dragon-logo.png');
 assert.equal(OFFICIAL_LOGO_BLOB_SHA.length,40);
 assert.equal(OFFICIAL_LOGO_PATH,'branding/fire-dragon-interactive.png');
});
test('a valid but substituted PNG is rejected as unapproved company artwork',()=>{
 assert.throws(()=>validateOfficialLogo(pngFixture(256,128)),/does not match the pinned studio Git blob/);
 assert.throws(()=>validateOfficialLogo(Buffer.from('not png')),/incomplete/);
});
test('importer refuses replacement art before writing anything to the repository',async()=>{
 const root=mkdtempSync(join(tmpdir(),'bannerfall-branding-'));
 try{
  const fetcher=async()=>({ok:true,arrayBuffer:async()=>pngFixture(256,128)});
  await assert.rejects(()=>importOfficialBranding({root,fetcher}),/does not match the pinned/);
  assert.equal(existsSync(join(root,'public','assets','branding','fire-dragon-interactive.png')),false);
 }finally{rmSync(root,{recursive:true,force:true});}
});
