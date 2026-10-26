// Swept segment-to-target hit detection for fast Arcade projectiles.
// Avoids missing narrow companions when frame time jumps (no visual placeholders).
export function sweptCompanionHit(previous,current,unit,{radius=42,aimOffsetY=17}={}){
 if(![previous?.x,previous?.y,current?.x,current?.y,unit?.x,unit?.y,radius,aimOffsetY].every(Number.isFinite)||radius<=0)return false;
 const sx=previous.x,sy=previous.y,dx=current.x-sx,dy=current.y-sy;
 const tx=unit.x,ty=unit.y-aimOffsetY;
 const lengthSquared=dx*dx+dy*dy;
 const t=lengthSquared>0?Math.max(0,Math.min(1,((tx-sx)*dx+(ty-sy)*dy)/lengthSquared)):0;
 return Math.hypot(sx+t*dx-tx,sy+t*dy-ty)<radius;
}

/**
 * Earliest hit on a travelled projectile segment. Prevents both tunnelling and
 * bullets damaging a fighter behind nearer solid cover in the same frame.
 * Returns 'unit', 'cover', or null. Cover top matches approved barricade art.
 */
export function sweptProjectileContact(previous,current,unit,cover,{radius=42,aimOffsetY=17,topY=517.5}={}){
 // Missing target is valid for a cover-only shot, or for a projectile whose
 // assigned fighter was eliminated in flight. The wall must still intercept it.
 const hasTarget=unit!==null&&unit!==undefined;
 if(![previous?.x,previous?.y,current?.x,current?.y,radius,aimOffsetY,topY]
    .every(Number.isFinite)||radius<=0||
    (hasTarget&&![unit.x,unit.y].every(Number.isFinite)))return null;
 const dx=current.x-previous.x,dy=current.y-previous.y;
 let unitT=Infinity;
 if(hasTarget){
  const a=dx*dx+dy*dy;
  const ox=previous.x-unit.x,oy=previous.y-(unit.y-aimOffsetY);
  const b=2*(ox*dx+oy*dy),c=ox*ox+oy*oy-radius*radius;
  if(c<=0)unitT=0;
  else if(a>0){
   const disc=b*b-4*a*c;
   if(disc>=0){const enter=(-b-Math.sqrt(disc))/(2*a);
    if(enter>=0&&enter<=1)unitT=enter;}
  }
 }
 let firstCover=null,coverT=Infinity;
 for(const wall of cover?.intact?.()??[]){
  if(!wall||!wall.id||![wall.x,wall.width].every(Number.isFinite)||wall.width<=0)continue;
  const left=wall.x-wall.width/2,right=wall.x+wall.width/2,top=wall.topY??topY;
  if(!Number.isFinite(top))continue;
  let entry=0,exit=1;
  if(dx===0){if(previous.x<left||previous.x>right)continue;}
  else{
   const ta=(left-previous.x)/dx,tb=(right-previous.x)/dx;
   entry=Math.max(entry,Math.min(ta,tb));exit=Math.min(exit,Math.max(ta,tb));
  }
  if(dy===0){if(previous.y<top)continue;}
  else if(dy>0)entry=Math.max(entry,(top-previous.y)/dy);
  else exit=Math.min(exit,(top-previous.y)/dy);
  // Deterministic tie-break when two authored walls overlap.
  if(entry<=exit&&(entry<coverT||(entry===coverT&&String(wall.id)<String(firstCover?.id)))){
   firstCover=wall;
   coverT=entry;
  }
 }
 if(firstCover&&coverT<=unitT)return {kind:'cover',id:firstCover.id,time:coverT};
 return unitT!==Infinity?{kind:'unit',id:unit.id??null,time:unitT}:null;
}

// Preserve the original public decision API used by existing combat models.
export function sweptProjectileImpact(previous,current,unit,cover,options={}){
 return sweptProjectileContact(previous,current,unit,cover,options)?.kind??null;
}
