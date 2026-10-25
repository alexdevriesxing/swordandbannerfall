// Tunable deterministic role abilities; no rendering or placeholder assets.
export const ABILITIES=Object.freeze({
 vanguard:{id:'cleave',cooldownMs:4200,bonusDamage:8},
 ranger:{id:'precision',cooldownMs:5000,bonusDamage:10},
 sentinel:{id:'intercept',cooldownMs:6500,bonusDamage:0}
});
export function specialAttack(unit,timeMs){
 const spec=ABILITIES[unit.role];
 if(!spec||timeMs-(unit.lastAbility??-Infinity)<spec.cooldownMs)return null;
 unit.lastAbility=timeMs;
 return {ability:spec.id,bonusDamage:spec.bonusDamage};
}
export function interceptDamage(units,team,targetX,damage,timeMs){
 const guard=units.find(u=>u.team===team&&u.role==='sentinel'&&u.hp>0&&Math.abs(u.x-targetX)<=110&&timeMs-(u.lastIntercept??-Infinity)>=ABILITIES.sentinel.cooldownMs);
 if(!guard)return {damage,intercepted:false};
 guard.lastIntercept=timeMs;
 return {damage:Math.max(0,Math.round(damage*.6)),intercepted:true,sentinelId:guard.id};
}
