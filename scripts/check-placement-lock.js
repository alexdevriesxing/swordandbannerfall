import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {APPROVED_ALPHA_BOUNDS} from '../src/levels/approved-art-placement.js';

const required=Object.freeze({
 'arena/destructible-barricade.png':'barricade',
 'arena/iron-citadel-gantry.png':'gantry'
});
const keys=['textureWidth','textureHeight','left','top','right','bottom'];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

// Additional hard release gate for artwork that drives independent collision
// bodies. A v2 replacement can never reuse old v1 silhouette measurements by
// only changing assets/licenses.json.
export function checkPlacementLock({root=process.cwd(),bounds=APPROVED_ALPHA_BOUNDS}={}){
 const path=resolve(root,'assets/placement-lock.json');
 if(!existsSync(path))return ['missing artwork-bound collider placement lock'];
 let lock;
 try{lock=JSON.parse(readFileSync(path,'utf8'));}
 catch{return ['invalid artwork-bound collider placement lock'];}
 const issues=[];
 if(!lock||typeof lock.packId!=='string'||!lock.packId.trim()||
    !lock.textures||typeof lock.textures!=='object')
  return ['malformed artwork-bound collider placement lock'];
 let licenses=null;
 const register=resolve(root,'assets/licenses.json');
 try{if(existsSync(register))licenses=JSON.parse(readFileSync(register,'utf8'));}
 catch{ /* Release-readiness checks this separately. */ }
 for(const [filename,key] of Object.entries(required)){
  const record=lock.textures[filename],placement=bounds[key];
  if(!record||record.placementKey!==key||!/^[a-f0-9]{64}$/.test(record.sha256??'')||
     !record.bounds||!placement||!keys.every(k=>
       Number.isFinite(record.bounds[k])&&record.bounds[k]===placement[k])){
   issues.push('unreviewed or mismatched collider silhouette: '+filename);
   continue;
  }
  const approvedHash=licenses?.assets?.[filename]?.sha256;
  if(approvedHash&&approvedHash!==record.sha256)
   issues.push('collider placement lock differs from approved art checksum: '+filename);
  const asset=join(root,'public/assets',filename);
  if(existsSync(asset)&&digest(readFileSync(asset))!==record.sha256)
   issues.push('collider placement lock differs from actual texture bytes: '+filename);
 }
 return issues;
}
