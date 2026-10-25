import test from 'node:test';
import assert from 'node:assert/strict';
import security from '../desktop/security.cjs';
const {isTrustedNavigation,isOfflineAssetRequest}=security;
const local='file:///C:/Program%20Files/Sword%20Bannerfall/resources/app.asar/dist/index.html';
test('desktop launcher accepts only its exact offline entrypoint',()=>{
 assert.equal(isTrustedNavigation(local,local),true);
 assert.equal(isTrustedNavigation('file:///C:/Windows/System32/other.html',local),false);
 assert.equal(isTrustedNavigation('https://example.com/',local),false);
 assert.equal(isTrustedNavigation('javascript:alert(1)',local),false);
 assert.equal(isTrustedNavigation('not a url',local),false);
});
test('offline game blocks remote code, telemetry, stores and sockets',()=>{
 assert.equal(isOfflineAssetRequest('file:///C:/Games/assets/fighters/knight.png'),true);
 for(const url of ['https://example.com/data','http://localhost:8070/api','wss://example.com/',
  'javascript:alert(1)','data:text/html,hello','about:blank']){
  assert.equal(isOfflineAssetRequest(url),false,url);
 }
});
