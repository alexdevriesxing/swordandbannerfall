import {DEFENSE_CATALOG} from './tactics.js';
// Only while preparation remains open, undo the setup loadout of one team.
// Return fresh IDs so the scene can remove its already-painted licensed art.
export function refundSetupDefenses(tactics,team,{phase='setup'}={}){
 if(phase!=='setup')throw new Error('Cannot refund a fighting team');
 if(!tactics||!['blue','red'].includes(team)||!Array.isArray(tactics.defenses)||
    !Number.isFinite(tactics.supply?.[team]))throw new Error('Invalid setup economy');
 const removed=tactics.defenses.filter(d=>d.team===team);
 for(const defense of removed){
  const cost=DEFENSE_CATALOG[defense.kind]?.cost;
  if(!Number.isFinite(cost))throw new Error('Unknown defense cannot be refunded');
 }
 const refunded=removed.reduce((sum,d)=>sum+DEFENSE_CATALOG[d.kind].cost,0);
 tactics.supply[team]+=refunded;
 tactics.defenses=tactics.defenses.filter(d=>d.team!==team);
 return removed.map(d=>({...d}));
}
