// Side-effect-free aim and hit checks; rendering uses only approved artwork.
export function aimVelocity(origin,target,speed=650){
 if(![origin?.x,origin?.y,target?.x,target?.y,speed].every(Number.isFinite)||speed<=0)throw new RangeError('Invalid projectile aim');
 const dx=target.x-origin.x,dy=target.y-origin.y;
 const magnitude=Math.hypot(dx,dy);
 if(magnitude<0.001)return {x:0,y:0};
 return {x:dx/magnitude*speed,y:dy/magnitude*speed};
}
export function overlapsCompanion(projectile,unit,{radius=42,aimOffsetY=17}={}){
 if(![projectile?.x,projectile?.y,unit?.x,unit?.y,radius].every(Number.isFinite)||radius<=0)return false;
 return Math.hypot(projectile.x-unit.x,projectile.y-(unit.y-aimOffsetY))<radius;
}
