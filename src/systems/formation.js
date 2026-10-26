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

/**
 * Keep ranged escorts behind an active melee screen during Hunt advances.
 * Only constrains movement toward a living target; emergency kiting remains free.
 */
export function screenedRangerGoal(unit,target,allies,goal,{gap=60,left=50,right=1230}={}){
 if(unit?.role!=='ranger'||!target||!Number.isFinite(target.x)||!Number.isFinite(goal))return goal;
 if(!Number.isFinite(gap)||gap<0)throw new RangeError('Invalid formation gap');
 const direction=Math.sign(target.x-unit.x);
 if(!direction||Math.sign(goal-unit.x)!==direction)return goal;
 const front=allies.filter(a=>a.team===unit.team&&a.id!==unit.id&&a.hp>0&&
  (a.role==='vanguard'||a.role==='sentinel')&&Number.isFinite(a.x));
 if(!front.length)return goal;
 // The furthest advanced melee fighter anchors the screen.
 const screen=direction>0?Math.max(...front.map(a=>a.x)):Math.min(...front.map(a=>a.x));
 const limit=Math.max(left,Math.min(right,screen-direction*gap));
 return direction>0?Math.min(goal,limit):Math.max(goal,limit);
}

/**
 * Melee assault lanes: Vanguards engage first while Sentinels remain close
 * enough to shield them. Stable ID-based offsets limit single-point crowding.
 */
export function meleeAssaultGoal(unit,target,goal,{left=50,right=1230}={}){
 if(!['vanguard','sentinel'].includes(unit?.role)||!target||!Number.isFinite(target.x)||!Number.isFinite(unit.x))return goal;
 const approach=unit.x<=target.x?-1:1;
 const offset=unit.role==='sentinel'?43:21;
 const lane=(Number(unit.id)%3-1)*8;
 const position=target.x+approach*(offset+lane);
 return Math.max(left,Math.min(right,position));
}
