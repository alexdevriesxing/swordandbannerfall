// Resolve assets for both web hosting and packaged Electron file:// pages.
// Vite's base './' is substituted at build time; never assume site-root URLs.
export function gameAssetUrl(relativePath,base='./'){
 if(typeof relativePath!=='string'||!/^assets\/[A-Za-z0-9._/-]+$/.test(relativePath)
   ||relativePath.split('/').includes('..')||relativePath.includes('//'))
  throw new Error('Invalid game art asset path');
 if(typeof base!=='string'||!['./','/'].includes(base)&&!/^\/[A-Za-z0-9._/-]*\/$/.test(base))
  throw new Error('Invalid deployment base');
 return base.endsWith('/')?base+relativePath:base+'/'+relativePath;
}
