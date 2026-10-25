import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {verifyAssets} from './verify-assets.js';
export function releaseReadiness({root=process.cwd()}={}){
 const result=verifyAssets(resolve(root,'public/assets'));
 const register=resolve(root,'assets/licenses.json');
 const issues=[...result.missing.map(s=>'missing asset: '+s),...result.empty.map(s=>'empty asset: '+s),...result.invalid.map(s=>'invalid asset: '+s)];
 if(!existsSync(register))issues.push('missing asset rights register: assets/licenses.json');
 else{
  try{
   const data=JSON.parse(readFileSync(register,'utf8'));
   for(const path of [...result.missing,...result.empty,...result.invalid])void path;
   for(const filename of ['arena/iron-citadel.webp','arena/citadel-ground.webp','arena/destructible-barricade.png','fighters/knight.png','fighters/raider.png','fx/projectile.png','fx/slash.png','branding/fire-dragon-interactive.png','defenses/trap.png','defenses/turret.png','defenses/shield.png']){
    const asset=data.assets?.[filename];
    if(!asset||!asset.creator||!asset.source||!asset.license||asset.approved!==true)issues.push('unapproved or undocumented asset: '+filename);
   }
  }catch{issues.push('invalid asset rights register');}
 }
 return {ready:issues.length===0,issues};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
 const state=releaseReadiness();
 if(!state.ready){console.error('RELEASE BLOCKED\n'+state.issues.join('\n'));process.exitCode=1;}
 else console.log('File and rights gates passed. Manual browser playthrough still required.');
}
