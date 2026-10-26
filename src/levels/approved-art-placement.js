// Pixel-accurate, original art silhouettes measured on the owner-approved
// SHA-locked 17-texture source pack (see assets/generated-pack-lock.json).
// These are PRESENTATION measurements; they never create replacement artwork.
export const APPROVED_ALPHA_BOUNDS=Object.freeze({
  barricade:Object.freeze({textureWidth:160,textureHeight:280,left:40,top:61,right:120,bottom:218}),
  gantry:Object.freeze({textureWidth:380,textureHeight:135,left:74,top:26,right:305,bottom:109})
});
function check(bounds){
  if(!bounds||![bounds.textureWidth,bounds.textureHeight,bounds.left,bounds.top,bounds.right,bounds.bottom]
      .every(Number.isFinite)||bounds.textureWidth<=0||bounds.textureHeight<=0||
      bounds.left<0||bounds.top<0||bounds.right>bounds.textureWidth||
      bounds.bottom>bounds.textureHeight||bounds.right<=bounds.left||bounds.bottom<=bounds.top)
    throw new RangeError('Invalid authored transparency bounds');
}
export function fitPaintedSilhouette(bounds,{x,y,visibleWidth,visibleHeight}={}){
  check(bounds);
  if(![x,y,visibleWidth,visibleHeight].every(Number.isFinite)||visibleWidth<=0||visibleHeight<=0)
    throw new RangeError('Invalid art placement');
  const sx=visibleWidth/(bounds.right-bounds.left);
  const sy=visibleHeight/(bounds.bottom-bounds.top);
  return {
    x:x-((bounds.left+bounds.right)/2-bounds.textureWidth/2)*sx,
    y:y-((bounds.top+bounds.bottom)/2-bounds.textureHeight/2)*sy,
    displayWidth:bounds.textureWidth*sx,
    displayHeight:bounds.textureHeight*sy,
  };
}
// The physically walkable top is painted at the TOP of the mossy ledge. Keep
// the whole original painting undistorted and let its decorative stonehang
// extend downward below the independent one-way Arcade collider.
export function gantryPaintingPlacement(platform){
  const bounds=APPROVED_ALPHA_BOUNDS.gantry;
  if(!platform||![platform.x,platform.y,platform.width,platform.height].every(Number.isFinite)
     ||platform.width<=0||platform.height<=0)throw new RangeError('Invalid gantry');
  const scale=platform.width/(bounds.right-bounds.left);
  const bodyTop=platform.y-platform.height/2;
  return {
    x:platform.x-((bounds.left+bounds.right)/2-bounds.textureWidth/2)*scale,
    y:bodyTop+(bounds.textureHeight/2-bounds.top)*scale,
    displayWidth:bounds.textureWidth*scale,
    displayHeight:bounds.textureHeight*scale
  };
}
