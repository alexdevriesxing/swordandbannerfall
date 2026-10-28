import {combatElevation} from './elevation.js';
import {shotObstruction} from './cover.js';
import {sweptGantryContact} from './gantry-projectiles.js';
// Pure selection rules for champion attacks against full squads.
export function nearestOpponent(fromX,team,champions,units,{range=Infinity,cover=null,gantries=[],fromY=null,attackMode='melee'}={}){
 if(!Number.isFinite(fromX)||!['blue','red'].includes(team))throw new Error('Invalid attacker');
 const foe=team==='blue'?'red':'blue';
 const candidates=[
  ...(champions[foe]?.hp>0?[{id:foe==='blue'?'hero':'enemy',x:champions[foe].x,y:champions[foe].y??590,team:foe,hp:champions[foe].hp,kind:'champion'}]:[]),
  ...units.filter(u=>u.team===foe&&u.hp>0).map(u=>({...u,kind:'companion'}))
 ];
 return candidates.filter(u=>{
  if(Math.abs(u.x-fromX)>range)return false;
  if(fromY===null)return !cover?.obstruction(fromX,u.x);
  const start={x:fromX,y:fromY-17},end={x:u.x,y:(u.y??590)-17};
  if(shotObstruction(cover,start,end))return false;
  if(!combatElevation({y:fromY},u)[attackMode])return false;
  // Human melee must not reach through an actual stone platform.
  // Ranged aiming remains permissive: the travelling projectile itself
  // handles the first terrain impact and visually shows a blocked shot.
  return attackMode!=='melee'||!sweptGantryContact(start,end,gantries);
 }).sort((a,b)=>Math.abs(a.x-fromX)-Math.abs(b.x-fromX)||
   String(a.id).localeCompare(String(b.id)))[0]??null;
}
