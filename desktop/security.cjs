'use strict';
// The DRM-free Windows app only reads files from its own bundled dist directory.
// Do not grant blanket file:// access: that can expose unrelated local documents.
const {dirname,isAbsolute,relative}=require('node:path');
const {fileURLToPath}=require('node:url');

function isTrustedNavigation(candidate,localIndex){
 try {
  const url=new URL(candidate),index=new URL(localIndex);
  return url.protocol==='file:'&&index.protocol==='file:'&&
   !url.search&&!url.hash&&url.href===index.href;
 }catch{return false;}
}

function isOfflineAssetRequest(candidate,localIndex){
 try{
  const url=new URL(candidate),index=new URL(localIndex);
  if(url.protocol!=='file:'||index.protocol!=='file:')return false;
  // Decode through Node's file URL parser rather than string prefix matching:
  // sibling directories, encoded traversal, UNC hosts and alternate drives
  // must not be mistaken for child paths of the packaged game.
  const root=dirname(fileURLToPath(index));
  const file=fileURLToPath(url);
  const child=relative(root,file);
  return child!==''&&!child.startsWith('..')&&!isAbsolute(child)
   &&!child.split(/[\\/]/).includes('..')
   ||child===''&&file===fileURLToPath(index);
 }catch{return false;}
}
module.exports={isTrustedNavigation,isOfflineAssetRequest};
