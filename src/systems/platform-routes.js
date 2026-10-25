// Authored traversal graph for future multi-elevation arena scenes.
// Nodes correspond to real, artist-authored platform landing zones.
export class PlatformRoutes {
 constructor(nodes=[],links=[]){
  this.nodes=new Map();
  for(const n of nodes){if(!n.id||!Number.isFinite(n.x)||!Number.isFinite(n.y)||this.nodes.has(n.id))throw new Error('Invalid platform node');this.nodes.set(n.id,{...n});}
  this.links=links.map(([a,b])=>{if(!this.nodes.has(a)||!this.nodes.has(b))throw new Error('Unknown traversal node');return [a,b];});
 }
 route(start,end){
  if(!this.nodes.has(start)||!this.nodes.has(end))return null;
  const queue=[[start]],visited=new Set([start]);
  while(queue.length){
   const path=queue.shift(),here=path.at(-1);
   if(here===end)return path.map(id=>({...this.nodes.get(id)}));
   for(const [a,b] of this.links){const next=a===here?b:b===here?a:null;if(next&&!visited.has(next)&&reachableLanding(this.nodes.get(here),this.nodes.get(next))){visited.add(next);queue.push([...path,next]);}}
  }
  return null;
 }
 nearest(x,y,{maxDistance=120}={}){
  return [...this.nodes.values()].filter(n=>Math.hypot(n.x-x,n.y-y)<=maxDistance).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)||a.id.localeCompare(b.id))[0]??null;
 }
}
export function reachableLanding(from,to){
 if(!from||!to||from.id===to.id)return false;
 if(![from.x,from.y,to.x,to.y].every(Number.isFinite))return false;
 if(to.x<50||to.x>1230||to.y<100||to.y>650)return false;
 return Math.hypot(to.x-from.x,to.y-from.y)<=300&&Math.abs(to.y-from.y)<=145;
}
export function platformJump(unit,from,to,timeMs,{speed=210,minDurationMs=460}={}){
 if(!reachableLanding(from,to)||timeMs<(unit.nextJumpAt??0))return null;
 // A jump starts only from the actual authored takeoff landing, never from across the map.
 if(!Number.isFinite(unit.x)||Math.abs(unit.x-from.x)>36)return null;
 const distance=Math.hypot(to.x-from.x,to.y-from.y);
 if(distance>300||Math.abs(to.y-from.y)>145)return null;
 return {active:true,startX:unit.x,startY:from.y,endX:to.x,endY:to.y,startedAt:timeMs,durationMs:Math.max(minDurationMs,distance/speed*1000),nextJumpAt:timeMs+Math.max(minDurationMs,distance/speed*1000)+900};
}
export function advancePlatformJump(unit,timeMs){
 const j=unit.platformJump;if(!j?.active)return null;
 const t=Math.min(1,Math.max(0,(timeMs-j.startedAt)/j.durationMs));
 unit.x=j.startX+(j.endX-j.startX)*t;
 const y=j.startY+(j.endY-j.startY)*t-75*4*t*(1-t);
 if(t===1){unit.platformJump=null;unit.nextJumpAt=j.nextJumpAt;}
 return {type:'move',id:unit.id,x:unit.x,y,jumping:t<1};
}
