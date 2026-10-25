// Deterministic single-lane formation spacing without random movement or new art.
export function formationGoal(unit,goal,allies,{spacing=24,weight=0.55}={}){
 if(!Number.isFinite(goal)||!Number.isFinite(unit.x))throw new RangeError('Invalid position');
 const nearby=allies.filter(a=>a.team===unit.team&&a.hp>0&&a.id!==unit.id&&Math.abs(a.x-goal)<spacing*2);
 if(!nearby.length)return goal;
 // Tie-breaking is stable across frames, so units do not jitter or swap lanes.
 const order=[...nearby,unit].sort((a,b)=>a.id-b.id);
 const rank=order.findIndex(a=>a.id===unit.id),center=(order.length-1)/2;
 const offset=(rank-center)*spacing;
 return Math.max(50,Math.min(1230,goal+offset*weight));
}
export function breachCandidate(unit,obstacle,{reach=110}={}){
 return obstacle&&obstacle.hp>0&&Math.abs(unit.x-obstacle.x)<=reach?obstacle:null;
}
