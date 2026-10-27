// Tunable deterministic role abilities; no rendering or placeholder assets.
export const ABILITIES=Object.freeze({
 vanguard:{id:'cleave',cooldownMs:4200,bonusDamage:8},
 ranger:{id:'precision',cooldownMs:5000,bonusDamage:10},
 sentinel:{id:'intercept',cooldownMs:6500,bonusDamage:0}
});
export function specialAttack(unit,timeMs){
 // Intercept is a defensive reaction fired only by interceptDamage().
 // Treating it as an offensive windup made Sentinels announce an incoming
 // "INTERCEPT" attack and consume an unrelated offensive ability cooldown.
 if(unit?.role==='sentinel')return null;
 const spec=ABILITIES[unit?.role];
 if(!spec||timeMs-(unit.lastAbility??-Infinity)<spec.cooldownMs)return null;
 unit.lastAbility=timeMs;
 return {ability:spec.id,bonusDamage:spec.bonusDamage};
}
export function interceptDamage(units,team,targetX,damage,timeMs,targetY=null,targetId=null){
 if(!Number.isFinite(damage)||damage<0)throw new RangeError('Invalid interception damage');
 if(damage===0)return {damage:0,intercepted:false};
 // Combatants on separate gantries cannot shield one another through empty air.
 // The optional Y preserves the existing 1D compatibility for legacy callers.
 if(targetY!==null&&!Number.isFinite(targetY))throw new RangeError('Invalid protection elevation');
 const guard=units.find(u=>u.team===team&&u.role==='sentinel'&&u.hp>0&&
  (targetId===null||u.id!==targetId)&&
  Math.abs(u.x-targetX)<=110&&
  (targetY===null||Number.isFinite(u.y)&&Math.abs(u.y-targetY)<=65)&&
  timeMs-(u.lastIntercept??-Infinity)>=ABILITIES.sentinel.cooldownMs);
 if(!guard)return {damage,intercepted:false};
 guard.lastIntercept=timeMs;
 return {damage:Math.max(0,Math.round(damage*.6)),intercepted:true,sentinelId:guard.id};
}
