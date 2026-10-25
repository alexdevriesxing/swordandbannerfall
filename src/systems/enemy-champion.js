// Enemy champion combat pursuit, independent of Phaser and render assets.
// A champion always fights remaining opponents, including after their hero falls.
export function enemyChampionDecision({
  x,y,blueChampion,blueUnits=[],platforms=null,
  grounded=false,timeMs=0,nextTraversalAt=0,speed=155
}={}){
 if(![x,y,timeMs,nextTraversalAt,speed].every(Number.isFinite)||speed<=0)throw new RangeError('Invalid enemy champion movement');
 const foes=[
  ...(blueChampion?.hp>0?[{id:'hero',kind:'champion',x:blueChampion.x,y:blueChampion.y??590,hp:blueChampion.hp,platformNode:blueChampion.platformNode??null}]:[]),
  ...blueUnits.filter(u=>u.team==='blue'&&u.hp>0).map(u=>({id:u.id,kind:'companion',x:u.x,y:u.y??590,hp:u.hp,platformNode:u.platformNode??null}))
 ].filter(u=>Number.isFinite(u.x)&&Number.isFinite(u.y));
 foes.sort((a,b)=>Math.hypot(a.x-x,(a.y-y)*0.7)-Math.hypot(b.x-x,(b.y-y)*0.7)||String(a.id).localeCompare(String(b.id)));
 const target=foes[0]??null;
 if(!target)return {target:null,velocityX:0,jump:false,drop:false,aimX:x};
 let aimX=target.x,jump=false,drop=false;
 if(platforms&&Math.abs(y-target.y)>70){
  const current=platforms.nearest(x,y,{maxDistance:190});
  const destination=target.platformNode?platforms.nodes.get(target.platformNode):platforms.nearest(target.x,target.y,{maxDistance:190});
  const route=current&&destination?platforms.route(current.id,destination.id):null;
  if(route?.length>1){
   const next=route[1],dy=next.y-current.y;
   if(Math.abs(dy)>65){
    // Climb or descend only after reaching the authored takeoff.
    if(Math.abs(x-current.x)>30)aimX=current.x;
    else{
     aimX=next.x;
     if(grounded&&timeMs>=nextTraversalAt){
      if(dy<0)jump=true;
      else drop=true;
     }
    }
   }else aimX=next.x;
  }
 }
 const delta=aimX-x;
 return {
  target:{...target},
  velocityX:Math.abs(delta)>28?Math.sign(delta)*speed:0,
  jump,drop,aimX
 };
}
