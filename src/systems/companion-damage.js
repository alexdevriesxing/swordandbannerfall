import {interceptDamage} from './abilities.js';

// Shared damage pipeline for companion units. Apply shield absorption first,
// then one Sentinel interception, and only then mutate HP in CompanionDirector.
export function protectedCompanionDamage(tactics,units,target,damage,timeMs){
 if(!target||!['blue','red'].includes(target.team)||!
   [target.x,damage,timeMs].every(Number.isFinite)||damage<0)throw new RangeError('Invalid companion hit');
 if(damage===0)return {damage:0,absorbed:0,intercepted:false};
 // Shield emitters stand on the ground. Unlike a legacy 1D hit, an
 // elevated fighter must not drain wards that cannot physically reach it.
 const shield=tactics.incomingDamage(target.team,damage,target.x,target.y??590);
 // A fully absorbed hit must not consume an allied Sentinel ability cooldown.
 if(shield.remaining===0)return {damage:0,absorbed:shield.absorbed,intercepted:false};
 const guard=interceptDamage(units,target.team,target.x,shield.remaining,timeMs,target.y??null,target.id??null);
 return {damage:guard.damage,absorbed:shield.absorbed,intercepted:guard.intercepted};
}
