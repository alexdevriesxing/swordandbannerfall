import {pathToFileURL} from 'node:url';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {verifyAssets,REQUIRED_ASSETS} from './verify-assets.js';
export function releaseReadiness({root=process.cwd()}={}){
 const result=verifyAssets(resolve(root,'public/assets'));
 const register=resolve(root,'assets/licenses.json');
 const issues=[...result.missing.map(s=>'missing asset: '+s),...result.empty.map(s=>'empty asset: '+s),...result.invalid.map(s=>'invalid asset: '+s)];
 if(!existsSync(register))issues.push('missing asset rights register: assets/licenses.json');
 else{
  try{
   const data=JSON.parse(readFileSync(register,'utf8'));
   for(const filename of REQUIRED_ASSETS){
    const asset=data.assets?.[filename];
    if(!asset||!['creator','source','license'].every(key=>typeof asset[key]==='string'&&asset[key].trim().length>0)||asset.approved!==true)issues.push('unapproved or undocumented asset: '+filename);
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
