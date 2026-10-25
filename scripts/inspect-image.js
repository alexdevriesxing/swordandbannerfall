// Strict structural checks for delivered source artwork, before Phaser decoding.
// This checks file integrity and dimensions, NOT originality or artistic quality.
const PNG_SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
const MAX_IMAGE_SIZE=64*1024*1024;
const MAX_PIXELS=64*1024*1024;

function crc32(buffer,start,end){
 let crc=0xffffffff;
 for(let i=start;i<end;i++){
  crc^=buffer[i];
  for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
 }
 return (crc^0xffffffff)>>>0;
}

function dimensionsOk(width,height){
 return Number.isInteger(width)&&Number.isInteger(height)&&width>0&&height>0
  &&width<=16384&&height<=16384&&width*height<=MAX_PIXELS;
}

export function inspectImage(buffer,extension){
 if(!Buffer.isBuffer(buffer)||buffer.length<32||buffer.length>MAX_IMAGE_SIZE)return null;
 if(extension==='png'){
  if(!buffer.subarray(0,8).equals(PNG_SIGNATURE))return null;
  let offset=8,ihdr=false,idat=false,iend=false,width=0,height=0;
  while(offset<buffer.length){
   if(offset+12>buffer.length)return null;
   const length=buffer.readUInt32BE(offset);
   const chunkStart=offset+8,chunkEnd=chunkStart+length,crcEnd=chunkEnd+4;
   if(length>MAX_IMAGE_SIZE||crcEnd>buffer.length)return null;
   const type=buffer.toString('ascii',offset+4,offset+8);
   if(!/^[A-Za-z]{4}$/.test(type))return null;
   if(crc32(buffer,offset+4,chunkEnd)!==buffer.readUInt32BE(chunkEnd))return null;
   if(!ihdr){
    if(type!=='IHDR'||length!==13)return null;
    width=buffer.readUInt32BE(chunkStart);height=buffer.readUInt32BE(chunkStart+4);
    if(!dimensionsOk(width,height)||![1,2,4,8,16].includes(buffer[chunkStart+8])
      ||![0,2,3,4,6].includes(buffer[chunkStart+9])
      ||buffer[chunkStart+10]!==0||buffer[chunkStart+11]!==0||buffer[chunkStart+12]>1)return null;
    ihdr=true;
   }else if(type==='IHDR')return null;
   if(type==='IDAT'&&length>0)idat=true;
   if(type==='IEND'){
    if(length!==0||!idat||crcEnd!==buffer.length)return null;
    iend=true;break;
   }
   offset=crcEnd;
  }
  return ihdr&&idat&&iend?{width,height,format:'png'}:null;
 }
 if(extension==='webp'){
  if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP'
   ||buffer.readUInt32LE(4)+8!==buffer.length)return null;
  let offset=12,width=0,height=0,frame=false;
  while(offset<buffer.length){
   if(offset+8>buffer.length)return null;
   const type=buffer.toString('ascii',offset,offset+4),length=buffer.readUInt32LE(offset+4);
   const start=offset+8,end=start+length;
   if(length>MAX_IMAGE_SIZE||end>buffer.length)return null;
   if(type==='VP8X'&&length>=10){
    width=1+buffer.readUIntLE(start+4,3);
    height=1+buffer.readUIntLE(start+7,3);
   }else if(type==='VP8L'&&length>=5&&buffer[start]===0x2f){
    const packed=buffer.readUInt32LE(start+1);
    if(!width){width=(packed&0x3fff)+1;height=((packed>>>14)&0x3fff)+1;}
    frame=true;
   }else if(type==='VP8 '&&length>=10&&
    buffer[start+3]===0x9d&&buffer[start+4]===0x01&&buffer[start+5]===0x2a){
    if(!width){width=buffer.readUInt16LE(start+6)&0x3fff;height=buffer.readUInt16LE(start+8)&0x3fff;}
    frame=true;
   }
   offset=end+(length%2);
  }
  return offset===buffer.length&&frame&&dimensionsOk(width,height)?{width,height,format:'webp'}:null;
 }
 return null;
}
