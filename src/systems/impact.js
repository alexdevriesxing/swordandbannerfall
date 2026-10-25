import { combatElevation } from './elevation.js';
import { shotObstruction } from './cover.js';
// Revalidate delayed AI attacks at impact time, not only on windup.
export function validImpact({attacker,target,range,cover=null}){
 if(!attacker||!target||!(attacker.hp>0)||!(target.hp>0))return false;
 if(attacker.team===target.team)return false;
 if(!Number.isFinite(attacker.x)||!Number.isFinite(target.x))return false;
 if(!(Number.isFinite(range)&&range>0))return false;
 if(Math.abs(attacker.x-target.x)>range)return false;
 if(!combatElevation(attacker,target)[attacker.role==='ranger'?'ranged':'melee'])return false;
 return !shotObstruction(cover,{x:attacker.x,y:(attacker.y??590)-17},{x:target.x,y:(target.y??590)-17});
}
export function resolveTarget(attack,units,champions){
 if(attack.target==='hero')return champions.blue?.hp>0?champions.blue:null;
 if(attack.target==='enemy')return champions.red?.hp>0?champions.red:null;
 return units.find(u=>u.id===attack.target&&u.hp>0)??null;
}
