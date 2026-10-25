'use strict';
// The DRM-free Windows app is local-first and makes no external requests.
function isTrustedNavigation(candidate,localIndex){
 try {
  const url=new URL(candidate);
  return url.protocol==='file:'&&url.href===new URL(localIndex).href;
 }catch{return false;}
}
function isOfflineAssetRequest(candidate){
 try{
  const url=new URL(candidate);
  return url.protocol==='file:';
 }catch{return false;}
}
module.exports={isTrustedNavigation,isOfflineAssetRequest};
