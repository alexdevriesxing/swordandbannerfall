import {combatElevation} from './elevation.js';
// Pure selection rules for champion attacks against full squads.
export function nearestOpponent(fromX,team,champions,units,{range=Infinity,cover=null,fromY=null,attackMode='melee'}={}){
 if(!Number.isFinite(fromX)||!['blue','red'].includes(team))throw new Error('Invalid attacker');
 const foe=team==='blue'?'red':'blue';
 const candidates=[
  ...(champions[foe]?.hp>0?[{id:foe==='blue'?'hero':'enemy',x:champions[foe].x,y:champions[foe].y??590,team:foe,hp:champions[foe].hp,kind:'champion'}]:[]),
  ...units.filter(u=>u.team===foe&&u.hp>0).map(u=>({...u,kind:'companion'}))
 ];
 return candidates.filter(u=>Math.abs(u.x-fromX)<=range&&!(cover&&cover.obstruction(fromX,u.x))&&(fromY===null||combatElevation({y:fromY},u)[attackMode]===true))
  .sort((a,b)=>Math.abs(a.x-fromX)-Math.abs(b.x-fromX)||String(a.id).localeCompare(String(b.id)))[0]??null;
}
