import {deflateSync} from 'node:zlib';

// Real, structurally valid PNG fixtures created in memory for file-gate tests.
// These are NEVER staged in public/assets and are not game artwork.
const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
function crc32(data){
 let crc=0xffffffff;
 for(const value of data){
  crc^=value;
  for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
 }
 return (crc^0xffffffff)>>>0;
}
function chunk(type,data=Buffer.alloc(0)){
 const t=Buffer.from(type,'ascii'),header=Buffer.alloc(4),tail=Buffer.alloc(4);
 header.writeUInt32BE(data.length);tail.writeUInt32BE(crc32(Buffer.concat([t,data])));
 return Buffer.concat([header,t,data,tail]);
}
export function pngFixture(width=64,height=64){
 const header=Buffer.alloc(13);
 header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);
 header[8]=8;header[9]=6; // 8-bit RGBA, no interlace
 const lineLength=width*4+1,scanlines=Buffer.alloc(lineLength*height);
 const compressed=deflateSync(scanlines);
 return Buffer.concat([SIGNATURE,chunk('IHDR',header),chunk('IDAT',compressed),chunk('IEND')]);
}
