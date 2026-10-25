import {createHash} from 'node:crypto';
import {existsSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {inspectImage} from './inspect-image.js';
import {MINIMUM_DIMENSIONS} from './verify-assets.js';

// Pinned studio-owned artwork: served directly by the published studio site.
// Content MUST match source Git blob a1314... from repository commit 00d8212.
// Never substitute a freshly generated/logo-like image for the genuine brand.
export const OFFICIAL_LOGO_SOURCE=
 'https://www.firedragoninteractive.com/assets/fire-dragon-logo.png';
export const OFFICIAL_LOGO_BLOB_SHA='a1314f79d1f81709f2edcec1dbf619b9c8329ab1';
export const OFFICIAL_LOGO_PATH='branding/fire-dragon-interactive.png';

export function gitBlobSha(bytes){
 if(!Buffer.isBuffer(bytes))throw new TypeError('Expected image bytes');
 return createHash('sha1').update(Buffer.from('blob '+bytes.length+String.fromCharCode(0)))
  .update(bytes).digest('hex');
}
export function validateOfficialLogo(bytes){
 const image=inspectImage(bytes,'png');
 const minimum=MINIMUM_DIMENSIONS[OFFICIAL_LOGO_PATH];
 if(!image||image.width<minimum[0]||image.height<minimum[1])
  throw new Error('Official logo image is incomplete or below display resolution');
 if(gitBlobSha(bytes)!==OFFICIAL_LOGO_BLOB_SHA)
  throw new Error('Official logo does not match the pinned studio Git blob');
 return image;
}
export async function importOfficialBranding({root=process.cwd(),fetcher=fetch}={}){
 const result=await fetcher(OFFICIAL_LOGO_SOURCE,{
  redirect:'error',
  signal:AbortSignal.timeout(30000),
  headers:{'User-Agent':'SwordAndBannerfall-ArtImport/1.0'}
 });
 if(!result.ok)throw new Error('Official source download failed: HTTP '+result.status);
 const bytes=Buffer.from(await result.arrayBuffer());
 const image=validateOfficialLogo(bytes);
 const filepath=resolve(root,'public/assets',OFFICIAL_LOGO_PATH);
 if(existsSync(filepath)){
  const existing=readFileSync(filepath);
  if(!existing.equals(bytes))throw new Error('A different branded logo already exists; refusing to overwrite it');
 }else{
  mkdirSync(dirname(filepath),{recursive:true});
  writeFileSync(filepath,bytes,{flag:'wx'});
 }
 return {path:filepath,source:OFFICIAL_LOGO_SOURCE,gitSha:OFFICIAL_LOGO_BLOB_SHA,
  sha256:createHash('sha256').update(bytes).digest('hex'),width:image.width,height:image.height};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 importOfficialBranding().then(info=>console.log('Verified first-party logo imported:',JSON.stringify(info)))
  .catch(error=>{console.error('Official branding import blocked:',error.message);process.exitCode=1;});
}
