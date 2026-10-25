import {existsSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';

// Vite's browser compilation can succeed yet be incompatible with file://.
// Validate relative entry points and approved-source brand bytes in dist/.
export function inspectOfflineBundle(root=process.cwd()){
 const dist=resolve(root,'dist'),index=resolve(dist,'index.html');
 const issues=[];
 if(!existsSync(index))return {ok:false,issues:['missing dist/index.html']};
 const html=readFileSync(index,'utf8');
 const srcs=[...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)].map(m=>m[1]);
 const scripts=[...html.matchAll(/<script[^>]+src\s*=\s*["']([^"']+)["']/g)].map(m=>m[1]);
 if(!scripts.length)issues.push('no Vite JavaScript entrypoint');
 for(const source of srcs){
  if(source.startsWith('/')||/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(source)){
   issues.push('non-local asset reference: '+source);continue;
  }
  if(source.split('/').includes('..')){issues.push('traversing asset reference: '+source);continue;}
  if(source.startsWith('./')&&!existsSync(resolve(dist,source)))
   issues.push('missing compiled output: '+source);
 }
 if(!scripts.every(s=>s.startsWith('./assets/')))issues.push('entrypoint must use a relative Vite base');
 if(!existsSync(resolve(dist,'assets/branding/fire-dragon-interactive.png')))
  issues.push('original Fire Dragon branding not copied to offline distribution');
 return {ok:issues.length===0,issues};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const result=inspectOfflineBundle();
 if(!result.ok){console.error('OFFLINE BUNDLE INVALID\n'+result.issues.join('\n'));process.exitCode=1;}
 else console.log('Offline index, compiled entrypoints and original studio logo verified.');
}
