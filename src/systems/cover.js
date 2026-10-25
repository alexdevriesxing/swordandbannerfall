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
