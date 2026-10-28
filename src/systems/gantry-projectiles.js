// Hit testing against the two authored Iron Citadel stone gantries.
// These are physical platforms, not generated graphics. A bolt cannot pass
// through their solid 24px ledges even if it travels the entire span in one frame.
export function sweptGantryContact(previous,current,gantries=[]){
 if(!Array.isArray(gantries)||
    ![previous?.x,previous?.y,current?.x,current?.y].every(Number.isFinite))
  return null;
 const dx=current.x-previous.x,dy=current.y-previous.y;
 let first=null;
 for(const g of gantries){
  if(typeof g?.id!=='string'||!g.id.trim()||
     ![g.x,g.y,g.width,g.height].every(Number.isFinite)||
     g.width<=0||g.height<=0)continue;
  const x0=g.x-g.width/2,x1=g.x+g.width/2;
  const y0=g.y-g.height/2,y1=g.y+g.height/2;
  let enter=0,exit=1;
  const clip=(a,velocity,low,high)=>{
   if(velocity===0)return a>=low&&a<=high;
   const p=(low-a)/velocity,q=(high-a)/velocity;
   enter=Math.max(enter,Math.min(p,q));
   exit=Math.min(exit,Math.max(p,q));
   return enter<=exit;
  };
  if(!clip(previous.x,dx,x0,x1)||!clip(previous.y,dy,y0,y1))continue;
  if(!first||enter<first.time||
     (enter===first.time&&g.id.localeCompare(first.id)<0))
   first={kind:'terrain',terrainKind:'gantry',id:g.id,time:enter};
 }
 return first;
}
