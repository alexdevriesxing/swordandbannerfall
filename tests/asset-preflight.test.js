import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {verifyAssets} from '../scripts/verify-assets.js';
import {inspectImage} from '../scripts/inspect-image.js';
import {pngFixture} from './helpers/image-fixtures.js';
test('preflight reports missing and corrupt production assets',()=>{const p=mkdtempSync(join(tmpdir(),'bannerfall-'));try{mkdirSync(join(p,'fx'));writeFileSync(join(p,'fx','slash.png'),'not an image');const r=verifyAssets(p,['fx/slash.png','fx/projectile.png']);assert.deepEqual(r.missing,['fx/projectile.png']);assert.deepEqual(r.invalid,['fx/slash.png']);assert.equal(r.ok,false);}finally{rmSync(p,{recursive:true,force:true});}});
test('preflight accepts complete, correctly-sized PNG structures',()=>{const p=mkdtempSync(join(tmpdir(),'bannerfall-'));try{mkdirSync(join(p,'fx'));writeFileSync(join(p,'fx','slash.png'),pngFixture(64,64));assert.equal(verifyAssets(p,['fx/slash.png']).ok,true);}finally{rmSync(p,{recursive:true,force:true});}});
test('preflight rejects path traversal',()=>{const p=mkdtempSync(join(tmpdir(),'bannerfall-'));try{assert.deepEqual(verifyAssets(p,['../secret.png']).invalid,['../secret.png']);}finally{rmSync(p,{recursive:true,force:true});}});

test('fake PNG signature alone is not considered approved source artwork',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bannerfall-'));
 try{mkdirSync(join(dir,'fx'));writeFileSync(join(dir,'fx','slash.png'),Buffer.from([137,80,78,71,13,10,26,10]));
  assert.deepEqual(verifyAssets(dir,['fx/slash.png']).invalid,['fx/slash.png']);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('production gates reject art smaller than the texture displayed in game',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bannerfall-'));
 try{mkdirSync(join(dir,'fx'));writeFileSync(join(dir,'fx','slash.png'),pngFixture(32,32));
  assert.deepEqual(verifyAssets(dir,['fx/slash.png']).invalid,['fx/slash.png']);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('bad CRC and missing final PNG chunk fail structural validation',()=>{
 const good=pngFixture(64,64);
 const modified=Buffer.from(good);modified[24]^=1;
 assert.equal(inspectImage(modified,'png'),null);
 assert.equal(inspectImage(good.subarray(0,-12),'png'),null);
});
test('minimal WebP RIFF header is rejected without a complete image payload',()=>{
 assert.equal(inspectImage(Buffer.from('RIFF1234WEBP','ascii'),'webp'),null);
});
