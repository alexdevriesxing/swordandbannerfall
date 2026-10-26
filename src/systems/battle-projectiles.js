import { sweptProjectileContact } from './projectile-impact.js';

// Resolve the first physical contact along one projectile frame, regardless
// of its originally selected target. This avoids bullets phasing through one
// enemy to hit a more distant enemy in crowded 10v10 battles.
export function firstBattleProjectileContact(previous,current,{
  firingTeam,champions=null,companions=[],cover=null
}={}) {
 if(!['blue','red'].includes(firingTeam) ||
    ![previous?.x,previous?.y,current?.x,current?.y].every(Number.isFinite))
    return null;
 const eligible=target => target && ['blue','red'].includes(target.team) &&
   target.team!==firingTeam && target.hp>0 &&
   [target.x,target.y].every(Number.isFinite);
 const enemies=[];
 for (const team of ['blue','red']) {
  const champion=champions?.[team];
  if (eligible(champion)) enemies.push({
   id:team==='blue'?'hero':'enemy',kind:'champion',
   x:champion.x,y:champion.y
  });
 }
 for (const fighter of companions??[]) {
  if (eligible(fighter) && Number.isSafeInteger(fighter.id)) enemies.push({
   id:fighter.id,kind:'companion',x:fighter.x,y:fighter.y
  });
 }
 // Cover wins exact-time ties. A travelling bullet must not penetrate a wall
 // simply because an opponent and the barricade are hit within one tick.
 let first=sweptProjectileContact(previous,current,null,cover);
 for(const enemy of enemies) {
  const hit=sweptProjectileContact(previous,current,enemy,null);
  if(!hit||hit.kind!=='unit')continue;
  if(!first || hit.time<first.time ||
     (hit.time===first.time && first.kind==='unit' &&
      String(enemy.id).localeCompare(String(first.id))<0))
   first={kind:'unit',id:enemy.id,targetKind:enemy.kind,time:hit.time};
 }
 return first;
}
