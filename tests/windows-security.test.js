import test from 'node:test';
import assert from 'node:assert/strict';
import security from '../desktop/security.cjs';
const {isTrustedNavigation,isOfflineAssetRequest}=security;
const local='file:///C:/Program%20Files/Sword%20Bannerfall/resources/app.asar/dist/index.html';
const asset='file:///C:/Program%20Files/Sword%20Bannerfall/resources/app.asar/dist/assets/fighters/knight.png';
test('desktop launcher accepts only its exact offline entrypoint',()=>{
 assert.equal(isTrustedNavigation(local,local),true);
 assert.equal(isTrustedNavigation(local+'?debug=1',local),false);
 assert.equal(isTrustedNavigation('file:///C:/Windows/System32/other.html',local),false);
 assert.equal(isTrustedNavigation('https://example.com/',local),false);
 assert.equal(isTrustedNavigation('javascript:alert(1)',local),false);
 assert.equal(isTrustedNavigation('not a url',local),false);
});
test('only the packaged dist entry and its own bundled assets may be loaded',()=>{
 assert.equal(isOfflineAssetRequest(local,local),true);
 assert.equal(isOfflineAssetRequest(asset,local),true);
 assert.equal(isOfflineAssetRequest('file:///C:/Program%20Files/Sword%20Bannerfall/resources/app.asar/dist/assets/cards/deadeye.png',local),true);
 assert.equal(isOfflineAssetRequest(asset),false,'missing trusted index must fail closed');
});
test('local files outside the game bundle are not readable through the renderer',()=>{
 for(const url of [
  'file:///C:/Games/assets/fighters/knight.png',
  'file:///C:/Windows/System32/drivers/etc/hosts',
  'file:///C:/Users/Public/Documents/private.txt',
  'file:///C:/Program%20Files/Sword%20Bannerfall/resources/app.asar/desktop/main.cjs',
  'file:///C:/Program%20Files/Sword%20Bannerfall/resources/app.asar/dist-evil/leak.png',
  'file:///C:/Program%20Files/Sword%20Bannerfall/resources/app.asar/dist/../desktop/main.cjs',
  'file:///C:/Program%20Files/Sword%20Bannerfall/resources/app.asar/dist/%2e%2e/desktop/main.cjs',
  'https://example.com/data','http://localhost:8070/api','wss://example.com/',
  'javascript:alert(1)','data:text/html,hello','about:blank'
 ]) assert.equal(isOfflineAssetRequest(url,local),false,url);
});
