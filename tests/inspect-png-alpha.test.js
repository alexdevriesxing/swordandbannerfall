import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {inspectPngTransparency} from '../scripts/inspect-png-alpha.js';

// Unit-test-only PNG byte fixture, not game artwork or a shippable texture.
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
function crc(bytes){
 let result=0xffffffff;
 for(const byte of bytes){
  result^=byte;
  for(let i=0;i<8;i++)result=(result>>>1)^((result&1)?0xedb88320:0);
 }
 return (result^0xffffffff)>>>0;
}
function chunk(name,data){
 const kind=Buffer.from(name,'ascii');
 const size=Buffer.alloc(4),checksum=Buffer.alloc(4);
 size.writeUInt32BE(data.length);
 checksum.writeUInt32BE(crc(Buffer.concat([kind,data])));
 return Buffer.concat([size,kind,data,checksum]);
}
function png(alphas){
 assert.equal(alphas.length,4);
 const ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(2,0);ihdr.writeUInt32BE(2,4);
 ihdr[8]=8;ihdr[9]=6;
 const pixels=Buffer.alloc(18);
 for(let y=0;y<2;y++){
  const start=y*9;pixels[start]=0;
  for(let x=0;x<2;x++){
   const index=start+1+x*4;
   pixels[index]=255;pixels[index+1]=140;pixels[index+2]=40;
   pixels[index+3]=alphas[y*2+x];
  }
 }
 return Buffer.concat([signature,chunk('IHDR',ihdr),
  chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
test('alpha review actually inspects decoded pixels and measured silhouette',()=>{
 const result=inspectPngTransparency(png([0,0,0,255]));
 assert.equal(result.ok,true);
 assert.equal(result.transparentPixels,3);
 assert.equal(result.opaquePixels,1);
 assert.equal(result.transparentCorners,3);
 assert.deepEqual(result.bounds,{left:1,top:1,right:1,bottom:1});
});
test('RGBA with a painted opaque matte fails despite having alpha channel',()=>{
 const result=inspectPngTransparency(png([255,255,255,255]));
 assert.equal(result.ok,false);
 assert.equal(result.reason,'fully-opaque');
});
test('blank transparent canvas cannot masquerade as a finished sprite',()=>{
 const result=inspectPngTransparency(png([0,0,0,0]));
 assert.equal(result.ok,false);
 assert.equal(result.reason,'fully-transparent');
});
test('opaque corners fail the isolated-cutout check',()=>{
 const result=inspectPngTransparency(png([255,255,0,0]));
 assert.equal(result.ok,false);
 assert.equal(result.reason,'opaque-corners');
});
test('partly transparent antialiased edges are detected',()=>{
 const result=inspectPngTransparency(png([0,0,0,128]));
 assert.equal(result.ok,true);
 assert.equal(result.partialPixels,1);
 assert.deepEqual(result.bounds,{left:1,top:1,right:1,bottom:1});
});
test('invalid or truncated PNG cannot pass review',()=>{
 assert.equal(inspectPngTransparency(Buffer.alloc(64)).ok,false);
 assert.equal(inspectPngTransparency(png([0,0,0,255]).subarray(0,50)).ok,false);
});
