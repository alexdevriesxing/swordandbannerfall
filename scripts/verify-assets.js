import {pathToFileURL} from 'node:url';
import {existsSync,statSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {inspectImage} from './inspect-image.js';
export const REQUIRED_ASSETS=[
 'arena/iron-citadel.webp','arena/citadel-ground.webp','arena/destructible-barricade.png','arena/iron-citadel-gantry.png',
 'fighters/knight.png','fighters/raider.png','fx/projectile.png','fx/slash.png',
 'branding/fire-dragon-interactive.png','defenses/trap.png','defenses/turret.png','defenses/shield.png'
];
// Minimum native pixel dimensions at the displayed size: no automatic
// upscaling of undersized production textures. Higher-resolution masters preferred.
export const MINIMUM_DIMENSIONS=Object.freeze({
 'arena/iron-citadel.webp':[1920,1080],
 'arena/citadel-ground.webp':[1280,120],
 'arena/destructible-barricade.png':[82,125],
 'arena/iron-citadel-gantry.png':[240,24],
 'fighters/knight.png':[72,100],
 'fighters/raider.png':[72,100],
 'fx/projectile.png':[24,24],
 'fx/slash.png':[64,64],
 'branding/fire-dragon-interactive.png':[256,128],
 'defenses/trap.png':[62,44],
 'defenses/turret.png':[70,70],
 'defenses/shield.png':[62,44]
});
export function verifyAssets(root,entries=REQUIRED_ASSETS){
 const missing=[],empty=[],invalid=[];
 for(const entry of entries){
  if(entry.startsWith('/')||entry.includes('..')||!/^[-\w./]+$/.test(entry)){invalid.push(entry);continue;}
  const filename=resolve(root,entry);
  if(!existsSync(filename)){missing.push(entry);continue;}
  if(!statSync(filename).isFile()||statSync(filename).size===0){empty.push(entry);continue;}
  const buffer=readFileSync(filename);
  const format=entry.endsWith('.png')?'png':entry.endsWith('.webp')?'webp':null;
  const image=inspectImage(buffer,format);
  const minimum=MINIMUM_DIMENSIONS[entry];
  if(!image||(minimum&&(image.width<minimum[0]||image.height<minimum[1])))invalid.push(entry);
 }
 return {ok:missing.length===0&&empty.length===0&&invalid.length===0,missing,empty,invalid};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const root=resolve('public/assets');
 const result=verifyAssets(root);
 if(!result.ok){console.error('Production asset gate failed:',JSON.stringify(result,null,2));process.exitCode=1;}
 else console.log('All mandatory production image structures, CRCs (PNG) and minimum dimensions verified. Check license register and visual QA separately.');
}
