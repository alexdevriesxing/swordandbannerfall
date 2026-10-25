// Shared target lookup for all travelling projectiles, champion or companion.
// Logical target IDs are exact: heroes use strings, AI companions use numbers.
export function resolveProjectileTarget(targetId, firingTeam, champions, companions) {
 if(!['blue','red'].includes(firingTeam))return null;
 let target=null,kind=null;
 if(targetId==='hero'||targetId==='enemy') {
  kind='champion';
  target=champions?.[targetId==='hero'?'blue':'red']??null;
 }else if(typeof targetId==='number'&&Number.isSafeInteger(targetId)){
  kind='companion';
  target=companions?.find(u=>u.id===targetId)??null;
 }
 if(!target||target.team===firingTeam||!['blue','red'].includes(target.team)||
    !(target.hp>0)||!Number.isFinite(target.x)||!Number.isFinite(target.y))return null;
 return {kind,id:targetId,team:target.team,x:target.x,y:target.y,hp:target.hp};
}
