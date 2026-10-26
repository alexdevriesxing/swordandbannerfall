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

/**
 * Rangers kite an approaching opponent rather than joining a melee pile.
 * The preferred standoff point is clamped to the authored arena bounds.
 * Returning null means the current order/role does not need a correction.
 */
export function rangerStandoffGoal(unit, target, { minimum=115, preferred=175, left=50, right=1230 }={}) {
 if(unit?.role!=='ranger'||!target||!Number.isFinite(target.x)||!Number.isFinite(unit.x))return null;
 if(!Number.isFinite(minimum)||!Number.isFinite(preferred)||minimum<=0||preferred<minimum)throw new RangeError('Invalid ranger standoff');
 const distance=Math.abs(unit.x-target.x);
 if(distance>=minimum)return null;
 const direction=unit.x===target.x?(unit.team==='red'?1:-1):Math.sign(unit.x-target.x);
 return Math.max(left,Math.min(right,target.x+direction*preferred));
}
