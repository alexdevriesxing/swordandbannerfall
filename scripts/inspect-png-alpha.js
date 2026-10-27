import {inflateSync} from 'node:zlib';
import {inspectImage} from './inspect-image.js';

// Read actual pixel alpha, not just PNG IHDR color type. A visually opaque
// RGBA file (for example a white-matted cutout) is not a transparent sprite.
// Supports 8-bit noninterlaced RGBA and grayscale-alpha exports. Other PNG
// layouts must be converted/reviewed explicitly, never silently approved.
export function inspectPngTransparency(buffer){
 const meta=inspectImage(buffer,'png');
 if(!meta)return {ok:false,reason:'invalid-png'};
 if(buffer[24]!==8||![4,6].includes(buffer[25])||buffer[28]!==0)
  return {ok:false,reason:'unsupported-alpha-encoding'};
 const channels=buffer[25]===6?4:2,bytesPerPixel=channels;
 const stride=meta.width*channels,uncompressedSize=meta.height*(stride+1);
 if(uncompressedSize>64*1024*1024)
  return {ok:false,reason:'oversized-image'};
 const chunks=[];
 for(let offset=8;offset<buffer.length;){
  const size=buffer.readUInt32BE(offset);
  const type=buffer.toString('ascii',offset+4,offset+8);
  if(type==='IDAT')chunks.push(buffer.subarray(offset+8,offset+8+size));
  offset+=size+12;
 }
 let data;
 try{data=inflateSync(Buffer.concat(chunks),{maxOutputLength:uncompressedSize+1});}
 catch{return {ok:false,reason:'invalid-compressed-data'};}
 if(data.length!==uncompressedSize)return {ok:false,reason:'invalid-scanline-size'};
 let transparentPixels=0,opaquePixels=0,partialPixels=0;
 let left=meta.width,top=meta.height,right=-1,bottom=-1;
 let transparentCorners=0;
 let previous=Buffer.alloc(stride),position=0;
 for(let y=0;y<meta.height;y++){
  const filter=data[position++],row=Buffer.from(data.subarray(position,position+stride));
  position+=stride;
  if(filter>4)return {ok:false,reason:'invalid-png-filter'};
  for(let i=0;i<stride;i++){
   const a=i>=bytesPerPixel?row[i-bytesPerPixel]:0;
   const b=previous[i],c=i>=bytesPerPixel?previous[i-bytesPerPixel]:0;
   let predictor=0;
   if(filter===1)predictor=a;
   else if(filter===2)predictor=b;
   else if(filter===3)predictor=Math.floor((a+b)/2);
   else if(filter===4){
    const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
    predictor=pa<=pb&&pa<=pc?a:pb<=pc?b:c;
   }
   row[i]=(row[i]+predictor)&255;
  }
  for(let x=0;x<meta.width;x++){
   const alpha=row[x*channels+channels-1];
   if(alpha===255)opaquePixels++;
   else if(alpha===0)transparentPixels++;
   else partialPixels++;
   if(alpha>12){
    left=Math.min(left,x);top=Math.min(top,y);
    right=Math.max(right,x);bottom=Math.max(bottom,y);
   }
   if((x===0||x===meta.width-1)&&(y===0||y===meta.height-1)
      &&alpha<=24)transparentCorners++;
  }
  previous=row;
 }
 const total=meta.width*meta.height;
 const actuallyTransparent=transparentPixels+partialPixels;
 const visible=opaquePixels+partialPixels;
 const bounds=visible>0?{left,top,right,bottom}:null;
 const ok=actuallyTransparent>0&&visible>0&&transparentCorners>=3;
 return {ok,reason:ok?null:
  !visible?'fully-transparent':!actuallyTransparent?'fully-opaque':
  'opaque-corners',width:meta.width,height:meta.height,
  transparentPixels,partialPixels,opaquePixels,
  transparentFraction:actuallyTransparent/total,
  transparentCorners,bounds};
}
