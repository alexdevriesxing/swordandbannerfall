// Elevation rules applied to autonomous attacks in artist-authored arenas.
export function combatElevation(attacker,target,{meleeVertical=65,rangedVertical=190}={}){
 const ay=attacker?.y??590,by=target?.y??590;
 if(!Number.isFinite(ay)||!Number.isFinite(by))return {melee:false,ranged:false};
 const difference=Math.abs(ay-by);
 return {melee:difference<=meleeVertical,ranged:difference<=rangedVertical};
}
