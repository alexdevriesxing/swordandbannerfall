import { aimVelocity } from './ballistics.js';
import { shotObstruction } from './cover.js';

// A player shot must travel through the arena and resolve against the first
// physical obstacle. Never subtract cover HP at the instant the key is pressed.
export function planChampionShot({
  attacker, target=null, lookToward=null, cover=null,
  range=650, damage=12, coverDamage=18
}={}) {
  if (!['blue','red'].includes(attacker?.team) ||
      ![attacker?.x,attacker?.y,range,damage,coverDamage].every(Number.isFinite) ||
      range<=0 || damage<=0 || coverDamage<=0) return null;
  const sight=target??lookToward;
  if (!sight || !Number.isFinite(sight.x) ||
      (sight.y!==undefined && !Number.isFinite(sight.y))) return null;
  if (target && (target.hp<=0 || target.team===attacker.team ||
      !['blue','red'].includes(target.team) ||
      !(typeof target.id==='string' || Number.isSafeInteger(target.id)) ||
      Math.abs(target.x-attacker.x)>range)) return null;

  const originY=attacker.y-17;
  const destination={x:sight.x,y:(sight.y??590)-17};
  const obstruction=shotObstruction(cover,{x:attacker.x,y:originY},destination);
  if (!target && (!obstruction || Math.abs(obstruction.x-attacker.x)>range))
    return null;
  const direction=Math.sign(sight.x-attacker.x)||(attacker.team==='blue'?1:-1);
  // Do not spawn a projectile on the far side of nearby solid cover.
  const coverEdge=obstruction ?
    Math.max(0,Math.abs(obstruction.x-attacker.x)-obstruction.width/2-4) : 43;
  // Never spawn on the far side of a close opponent: the previous fixed
  // 43px muzzle could send a near-contact shot backwards through the shooter.
  const targetEdge=Math.max(0,Math.abs(sight.x-attacker.x)-4);
  const muzzle=Math.min(43,coverEdge,targetEdge);
  const origin={x:attacker.x+direction*muzzle,y:originY};
  const aim=target?destination:{x:obstruction.x,y:originY};
  // An overlapping target at identical coordinates still receives a
  // travelling projectile in the attacker's facing direction.
  if(aim.x===origin.x&&aim.y===origin.y)aim.x+=direction*50;
  return {
    origin,
    velocity:aimVelocity(origin,aim),
    team:attacker.team,
    targetId:target?.id??null,
    damage,coverDamage
  };
}
