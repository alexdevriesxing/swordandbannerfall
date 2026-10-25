import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const workflow=readFileSync(resolve(root,'.github/workflows/import-owner-art-pack.yml'),'utf8');

test('only repository owner comment on exact import issue can execute artwork upload',()=>{
 assert.match(workflow,/issue_comment:/);
 assert.match(workflow,/types:\s*\[created\]/);
 assert.match(workflow,/github\.event\.comment\.user\.login == 'alexdevriesxing'/);
 assert.match(workflow,/github\.event\.issue\.number == 1/);
 assert.match(workflow,/github\.repository == 'alexdevriesxing\/swordandbannerfall'/);
});
test('only platform-generated attachment URLs are admitted',()=>{
 assert.match(workflow,/user-attachments\//);
 assert.match(workflow,/Sword_Bannerfall_Original_Art_Pack_v1/);
 assert.match(workflow,/len\(links\)!=1/);
 assert.match(workflow,/--max-filesize 20000000/);
});
test('all content is verified before the bot can stage or commit it',()=>{
 const ordered=[
  'python scripts/install-art-pack.py',
  'npm run check:release',
  'npm test',
  'npm run build',
  'npm run check:offline-bundle',
  'git add public/assets/'
 ];
 let previous=-1;
 for(const marker of ordered){
  const location=workflow.indexOf(marker);
  assert.ok(location>previous,'Missing or out-of-order import gate: '+marker);
  previous=location;
 }
 assert.match(workflow,/git push origin HEAD:main/);
});
test('asset-import automation must never auto-release or create purchase routes',()=>{
 assert.doesNotMatch(workflow,/electron-builder/);
 assert.doesNotMatch(workflow,/gh release create/);
 assert.doesNotMatch(workflow,/creem\.io/);
 assert.match(workflow,/contents: write/);
});
