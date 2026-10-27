// Destructible cover and route blocking on a 1D side-scrolling battlefield.
// Authored sprite IDs are referenced by the renderer; no art is generated here.
export class BattlefieldCover {
 constructor(segments=[
  {id:'central-barricade',x:640,width:82,hp:120},
  {id:'east-bulkhead',x:820,width:60,hp:90}
 ]){
  this.segments=segments.map(s=>({...s,maxHp:s.hp}));
  for(const s of this.segments)if(!s.id||!Number.isFinite(s.x)||!(s.width>0)||!(s.hp>0))throw new Error('Invalid cover');
 }
 intact(){return this.segments.filter(s=>s.hp>0);}
 obstruction(from,to){
  const left=Math.min(from,to),right=Math.max(from,to);
  return this.intact().filter(s=>s.x+s.width/2>left&&s.x-s.width/2<right)
   .sort((a,b)=>Math.abs(a.x-from)-Math.abs(b.x-from)||a.id.localeCompare(b.id))[0]??null;
 }
 // Only cover intersecting a fighter's actual vertical footprint can
 // obstruct its movement. A soldier walking ABOVE a barricade on an authored
 // gantry must not collide with the ground wall's 1D horizontal footprint.
 obstructionAtHeight(from,to,feetY,{defaultTopY=517.5}={}){
  if(![from,to,feetY,defaultTopY].every(Number.isFinite))
   throw new RangeError('Invalid cover traversal');
  const left=Math.min(from,to),right=Math.max(from,to);
  return this.intact().filter(s=>
   feetY>=(s.topY??defaultTopY) &&
   s.x+s.width/2>left&&s.x-s.width/2<right
  ).sort((a,b)=>Math.abs(a.x-from)-Math.abs(b.x-from)||
   String(a.id).localeCompare(String(b.id)))[0]??null;
 }
 approachAtHeight(from,to,feetY,standoff=35){
  if(!Number.isFinite(standoff)||standoff<0)
   throw new RangeError('Invalid cover standoff');
  const block=this.obstructionAtHeight(from,to,feetY);
  if(!block)return to;
  const dir=Math.sign(to-from);
  return block.x-dir*(block.width/2+standoff);
 }
 damage(id,amount){
  if(!Number.isFinite(amount)||amount<0)throw new RangeError('Invalid damage');
  const s=this.segments.find(x=>x.id===id);
  if(!s)return {applied:0,destroyed:false};
  const applied=Math.min(s.hp,amount);s.hp-=applied;
  return {applied,destroyed:applied>0&&s.hp===0};
 }
 // Units can approach cover safely. Actual jumping/navigation will follow in the physics layer.
 approach(from,to,standoff=35){
  const block=this.obstruction(from,to);
  if(!block)return to;
  const dir=Math.sign(to-from);
  return block.x-dir*(block.width/2+standoff);
 }
 snapshot(){return this.segments.map(s=>({...s}));}
}

// Authored cover has a physical top at y=517.5 (580 - 125/2).
// Bullets above that top pass over it; ground travel still uses obstruction().
export function shotObstruction(cover,from,to,{topY=517.5}={}){
 if(!cover)return null;
 if(![from?.x,from?.y,to?.x,to?.y].every(Number.isFinite))return null;
 if(typeof cover.intact!=='function')return cover.obstruction?.(from.x,to.x)??null;
 const left=Math.min(from.x,to.x),right=Math.max(from.x,to.x);
 const impacts=[];
 for(const barrier of cover.intact()){
  const start=Math.max(left,barrier.x-barrier.width/2);
  const end=Math.min(right,barrier.x+barrier.width/2);
  if(start>end)continue;
  const height=barrier.topY??topY;
  const at=x=>from.x===to.x?Math.max(from.y,to.y):
    from.y+(to.y-from.y)*(x-from.x)/(to.x-from.x);
  if(Math.max(at(start),at(end))>=height)impacts.push(barrier);
 }
 return impacts.sort((a,b)=>Math.abs(a.x-from.x)-Math.abs(b.x-from.x)||String(a.id).localeCompare(String(b.id)))[0]??null;
}
