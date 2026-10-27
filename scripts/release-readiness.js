import {pathToFileURL} from 'node:url';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {verifyAssets,REQUIRED_ASSETS} from './verify-assets.js';
import {checkPlacementLock} from './check-placement-lock.js';
export function releaseReadiness({root=process.cwd()}={}){
 const result=verifyAssets(resolve(root,'public/assets'));
 const register=resolve(root,'assets/licenses.json');
 const issues=[...result.missing.map(s=>'missing asset: '+s),...result.empty.map(s=>'empty asset: '+s),...result.invalid.map(s=>'invalid asset: '+s),...checkPlacementLock({root})];
 if(!existsSync(register))issues.push('missing asset rights register: assets/licenses.json');
 else{
  try{
   const data=JSON.parse(readFileSync(register,'utf8'));
   for(const filename of REQUIRED_ASSETS){
    const asset=data.assets?.[filename];
    if(!asset||!['creator','source','license','rightsBasis','reviewer','reviewedAt'].every(
      key=>typeof asset[key]==='string'&&asset[key].trim().length>0)
      ||asset.approved!==true||!/^[a-f0-9]{64}$/.test(asset.sha256??'')
      ||typeof asset.decision!=='string'||!asset.decision.startsWith('approved-')){
      issues.push('unapproved or undocumented asset: '+filename);
      continue;
    }
    const actualPath=resolve(root,'public/assets',filename);
    if(existsSync(actualPath)){
      const hash=createHash('sha256').update(readFileSync(actualPath)).digest('hex');
      if(hash!==asset.sha256)issues.push('approved art checksum mismatch: '+filename);
    }
   }
  }catch{issues.push('invalid asset rights register');}
 }
 return {ready:issues.length===0,issues};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const state=releaseReadiness();
 if(!state.ready){console.error('RELEASE BLOCKED\n'+state.issues.join('\n'));process.exitCode=1;}
 else console.log('File and rights gates passed. Manual browser playthrough still required.');
}
