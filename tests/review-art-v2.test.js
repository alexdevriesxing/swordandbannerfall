import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {reviewArtV2,ART_V2_REQUIRED,ART_V2_ALPHA} from '../scripts/review-art-v2.js';
test('a new pack has exactly seventeen non-branding isolated game textures',()=>{
 assert.equal(ART_V2_REQUIRED.length,17);
 assert.equal(ART_V2_ALPHA.length,9);
 assert.ok(ART_V2_REQUIRED.every(path=>!path.startsWith('branding/')));
 assert.ok(ART_V2_REQUIRED.includes('cards/deadeye.png'));
});
test('empty candidate never receives automatic approval or alters v1',()=>{
 const root=mkdtempSync(join(tmpdir(),'bannerfall-v2-candidate-'));
 try{
  const report=reviewArtV2(root);
  assert.equal(report.technicalPass,false);
  assert.equal(report.presentCount,0);
  assert.equal(report.issues.length,17);
  assert.ok(report.approval.startsWith('NOT APPROVED'));
  assert.deepEqual(readdirSync(root),[]);
 }finally{rmSync(root,{recursive:true,force:true});}
});

function crc32(bytes){
 let crc=0xffffffff;
 for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return (crc^0xffffffff)>>>0;
}
function pngChunk(tag,data){
 const type=Buffer.from(tag),length=Buffer.alloc(4),checksum=Buffer.alloc(4);
 length.writeUInt32BE(data.length);
 checksum.writeUInt32BE(crc32(Buffer.concat([type,data])));
 return Buffer.concat([length,type,data,checksum]);
}
// Tiny one-color in-memory PNG is a unit-test fixture, NEVER runtime art.
function testCardPng(){
 const ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(512,0);ihdr.writeUInt32BE(512,4);ihdr[8]=8;ihdr[9]=6;
 const pixels=Buffer.alloc(512*(512*4+1));
 for(let y=0;y<512;y++){
  const start=y*(512*4+1);pixels[start]=0;
  for(let x=0;x<512;x++){
   const i=start+1+x*4;pixels[i]=23;pixels[i+1]=91;pixels[i+2]=145;pixels[i+3]=255;
  }
 }
 return Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  pngChunk('IHDR',ihdr),pngChunk('IDAT',deflateSync(pixels)),pngChunk('IEND',Buffer.alloc(0))
 ]);
}
test('valid single-card batch passes intake without becoming approved or complete',()=>{
 const root=mkdtempSync(join(tmpdir(),'bannerfall-v2-partial-'));
 try{
  mkdirSync(join(root,'cards'),{recursive:true});
  writeFileSync(join(root,'cards','war-cry.png'),testCardPng());
  const result=reviewArtV2(root,{allowPartial:true});
  assert.equal(result.presentCount,1);
  assert.equal(result.missing.length,16);
  assert.equal(result.complete,false);
  assert.equal(result.technicalPass,true);
  assert.ok(result.approval.startsWith('NOT APPROVED'));
  assert.ok(/^[a-f0-9]{64}$/.test(result.assets['cards/war-cry.png'].sha256));
  assert.equal(reviewArtV2(root).technicalPass,false,'full pack still requires all 17 files');
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('even partial submissions must contain at least one valid decoded image',()=>{
 const root=mkdtempSync(join(tmpdir(),'bannerfall-v2-empty-'));
 try{
  const result=reviewArtV2(root,{allowPartial:true});
  assert.equal(result.technicalPass,false);
  assert.equal(result.complete,false);
  assert.ok(result.issues.some(x=>x.includes('empty candidate')));
 }finally{rmSync(root,{recursive:true,force:true});}
});
