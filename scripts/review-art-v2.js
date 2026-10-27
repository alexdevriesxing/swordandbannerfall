import {pathToFileURL} from 'node:url';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyAssets,REQUIRED_ASSETS} from './verify-assets.js';
import {inspectPngTransparency} from './inspect-png-alpha.js';

// Read-only technical intake for NEW v2 candidate exports. It never writes to
// public/assets, changes a license approval, or alters the original v1 lock.
export const ART_V2_REQUIRED=REQUIRED_ASSETS.filter(path=>!path.startsWith('branding/'));
export const ART_V2_ALPHA=Object.freeze([
 'arena/destructible-barricade.png','arena/iron-citadel-gantry.png',
 'fighters/knight.png','fighters/raider.png',
 'fx/projectile.png','fx/slash.png',
 'defenses/trap.png','defenses/turret.png','defenses/shield.png'
]);
export function reviewArtV2(directory,{allowPartial=false}={}){
 const root=resolve(directory);
 const structure=verifyAssets(root,ART_V2_REQUIRED);
 const issues=[
  ...(!allowPartial?structure.missing.map(path=>'missing: '+path):[]),
  ...structure.empty.map(path=>'empty: '+path),
  ...structure.invalid.map(path=>'invalid image/dimensions: '+path)
 ];
 const assets={};
 const digests=new Map();
 for(const path of ART_V2_REQUIRED){
  if(structure.missing.includes(path)||structure.empty.includes(path)||
     structure.invalid.includes(path))continue;
  const bytes=readFileSync(join(root,path));
  const sha256=createHash('sha256').update(bytes).digest('hex');
  if(digests.has(sha256))issues.push('duplicated artwork: '+digests.get(sha256)+' and '+path);
  digests.set(sha256,path);
  const alpha=ART_V2_ALPHA.includes(path)?inspectPngTransparency(bytes):null;
  if(alpha&&!alpha.ok)
   issues.push('unusable sprite transparency ('+alpha.reason+'): '+path);
  assets[path]={sha256,bytes:bytes.length,alpha};
 }
 const presentCount=ART_V2_REQUIRED.length-structure.missing.length;
 if(presentCount===0)issues.push('empty candidate: submit at least one original texture');
 return {candidate:'Sword_Bannerfall_Art_Pack_v2',assetRoot:root,
  requiredCount:ART_V2_REQUIRED.length,presentCount,complete:structure.missing.length===0,
  missing:structure.missing,technicalPass:issues.length===0,issues,assets,
  approval:'NOT APPROVED — requires manual visual rights and live Phaser review',
  source:'Do not transplant old v1 hashes or mutate assets/licenses.json automatically'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const dir=process.argv[2];
 const allowPartial=process.argv[3]==='--partial'&&process.argv.length===4;
 if(!dir||!existsSync(dir)||(process.argv.length>3&&!allowPartial)){
  console.error('Usage: node scripts/review-art-v2.js PATH_TO_V2_PUBLIC_ASSETS [--partial]');
  process.exitCode=2;
 }else{
  const report=reviewArtV2(dir,{allowPartial});
  console.log(JSON.stringify(report,null,2));
  if(!report.technicalPass)process.exitCode=1;
 }
}
