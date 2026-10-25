import {pathToFileURL} from 'node:url';
import {existsSync,statSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
export const REQUIRED_ASSETS=[
 'arena/iron-citadel.webp','arena/citadel-ground.webp','arena/destructible-barricade.png','arena/iron-citadel-gantry.png',
 'fighters/knight.png','fighters/raider.png','fx/projectile.png','fx/slash.png',
 'branding/fire-dragon-interactive.png','defenses/trap.png','defenses/turret.png','defenses/shield.png'
];
export function verifyAssets(root,entries=REQUIRED_ASSETS){
 const missing=[],empty=[],invalid=[];
 for(const entry of entries){
  if(entry.startsWith('/')||entry.includes('..')||!/^[-\w./]+$/.test(entry)){invalid.push(entry);continue;}
  const filename=resolve(root,entry);
  if(!existsSync(filename)){missing.push(entry);continue;}
  if(!statSync(filename).isFile()||statSync(filename).size===0){empty.push(entry);continue;}
  const buffer=readFileSync(filename);
  const png=entry.endsWith('.png')&&buffer.length>=8&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp=entry.endsWith('.webp')&&buffer.length>=12&&buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP';
  if(!png&&!webp)invalid.push(entry);
 }
 return {ok:missing.length===0&&empty.length===0&&invalid.length===0,missing,empty,invalid};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const root=resolve('public/assets');
 const result=verifyAssets(root);
 if(!result.ok){console.error('Production asset gate failed:',JSON.stringify(result,null,2));process.exitCode=1;}
 else console.log('All mandatory production asset file signatures verified. Check license register separately.');
}
