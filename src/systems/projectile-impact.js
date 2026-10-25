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
