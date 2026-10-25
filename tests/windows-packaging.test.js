import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
const windowsWorkflow=readFileSync(resolve(root,'.github/workflows/windows-installer.yml'),'utf8');
const launcher=readFileSync(resolve(root,'desktop/main.cjs'),'utf8');
const vite=readFileSync(resolve(root,'vite.config.js'),'utf8');

test('one-click Windows x64 packaging is pinned and never silently publishes',()=>{
 assert.equal(pkg.main,'desktop/main.cjs');
 assert.equal(pkg.devDependencies.electron,'45.0.0');
 assert.equal(pkg.devDependencies['electron-builder'],'26.15.3');
 assert.deepEqual(pkg.build.win.target,[{target:'nsis',arch:['x64']}]);
 assert.equal(pkg.build.nsis.oneClick,true);
 assert.equal(pkg.build.publish,null);
 assert.match(pkg.scripts['build:windows'],/^npm run check:release && npm test && npm run build && npm run check:offline-bundle/);
 assert.match(pkg.scripts['build:windows'],/build-windows-icon\.py/);
 assert.match(pkg.scripts['build:windows'],/--publish never/);
});
test('installer is strictly manual and gated before packaging',()=>{
 assert.match(windowsWorkflow,/workflow_dispatch:/);
 assert.match(windowsWorkflow,/npm run check:release/);
 assert.match(windowsWorkflow,/npm run check:offline-bundle/);
 assert.match(windowsWorkflow,/--publish never/);
 assert.doesNotMatch(windowsWorkflow,/\b(?:release|push):/);
});
test('sandboxed desktop launcher refuses Node and outside network navigation',()=>{
 assert.match(launcher,/nodeIntegration:false/);
 assert.match(launcher,/contextIsolation:true/);
 assert.match(launcher,/sandbox:true/);
 assert.match(launcher,/webSecurity:true/);
 assert.match(launcher,/isOfflineAssetRequest\(request\.url\)/);
 assert.match(launcher,/setWindowOpenHandler/);
});
test('Vite is explicitly configured for file-based game asset resolution',()=>{
 assert.match(vite,/base:\s*['"]\.\/['"]/);
});
