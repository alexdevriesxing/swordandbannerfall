import { combatElevation } from './elevation.js';
// Revalidate delayed AI attacks at impact time, not only on windup.
export function validImpact({attacker,target,range,cover=null}){
 if(!attacker||!target||!(attacker.hp>0)||!(target.hp>0))return false;
 if(attacker.team===target.team)return false;
 if(!Number.isFinite(attacker.x)||!Number.isFinite(target.x))return false;
 if(!(Number.isFinite(range)&&range>0))return false;
 if(Math.abs(attacker.x-target.x)>range)return false;
 if(!combatElevation(attacker,target).melee)return false;
 return !(cover&&cover.obstruction(attacker.x,target.x));
}
export function resolveTarget(attack,units,champions){
 if(attack.target==='hero')return champions.blue?.hp>0?champions.blue:null;
 if(attack.target==='enemy')return champions.red?.hp>0?champions.red:null;
 return units.find(u=>u.id===attack.target&&u.hp>0)??null;
}
