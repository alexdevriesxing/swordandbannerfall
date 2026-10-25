import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inspectOfflineBundle} from '../scripts/verify-offline-bundle.js';
function fixture(html,files=['assets/index.js','assets/branding/fire-dragon-interactive.png']){
 const root=mkdtempSync(join(tmpdir(),'sword-offline-'));
 mkdirSync(join(root,'dist'),{recursive:true});
 writeFileSync(join(root,'dist','index.html'),html);
 for(const path of files){mkdirSync(join(root,'dist',path.split('/').slice(0,-1).join('/')),{recursive:true});writeFileSync(join(root,'dist',path),'dummy');}
 return root;
}
test('file-safe Vite bundle with studio-owned logo passes entrypoint check',()=>{
 const root=fixture('<script type="module" src="./assets/index.js"></script>');
 try{assert.deepEqual(inspectOfflineBundle(root),{ok:true,issues:[]});}
 finally{rmSync(root,{recursive:true,force:true});}
});
test('absolute-root URL is rejected for an offline executable',()=>{
 const root=fixture('<script src="/assets/index.js"></script>');
 try{assert.equal(inspectOfflineBundle(root).ok,false);}
 finally{rmSync(root,{recursive:true,force:true});}
});
test('missing official branding blocks desktop distribution',()=>{
 const root=fixture('<script src="./assets/index.js"></script>',['assets/index.js']);
 try{assert.ok(inspectOfflineBundle(root).issues.some(x=>x.includes('studio logo')||x.includes('original Fire Dragon')));}
 finally{rmSync(root,{recursive:true,force:true});}
});
test('missing entrypoint rejects an incomplete compiled distribution',()=>{
 const root=fixture('<script src="./assets/missing.js"></script>');
 try{assert.equal(inspectOfflineBundle(root).ok,false);}
 finally{rmSync(root,{recursive:true,force:true});}
});
