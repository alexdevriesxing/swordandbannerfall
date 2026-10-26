// Tactical squad decisions: shared focus fire without individual player control.
export class SquadCoordinator {
 constructor({rethinkMs=1200}={}){this.rethinkMs=rethinkMs;this.targets={blue:null,red:null};this.decidedAt={blue:-Infinity,red:-Infinity};this.lastOrder={blue:null,red:null};}
 focus(team,units,foes,time,order,championX){
  if(!['blue','red'].includes(team))throw new Error('Unknown team');
  // A new tactical command must take effect immediately, without preserving
  // the previous command's focus for the remainder of the rethink interval.
  const orderChanged=this.lastOrder[team]!==order;
  this.lastOrder[team]=order;
  const livingFoes=foes.filter(f=>f.hp===undefined||f.hp>0);
  if(!livingFoes.length){this.targets[team]=null;this.decidedAt[team]=-Infinity;return null;}
  const existing=livingFoes.find(f=>f.id===this.targets[team]);
  // Guard squads immediately reconsider focus when a new enemy threatens the
  // champion. Ordinary hunt focus remains sticky to prevent target thrashing.
  const newGuardThreat=order==='guard'&&livingFoes.some(f=>f.id!==existing?.id&&Math.abs(f.x-championX)<250&&(!existing||Math.abs(existing.x-championX)>=250));
  if(existing&&!orderChanged&&time-this.decidedAt[team]<this.rethinkMs&&!newGuardThreat)return existing;
  const squad=units.filter(u=>u.team===team&&u.hp>0);
  const center=squad.length?squad.reduce((sum,u)=>sum+u.x,0)/squad.length:championX;
  const scoring=f=>{
    const risk=Math.abs(f.x-championX);
    const protection=order==='guard'&&risk<250?500:0;
    const weakened=Number.isFinite(f.hp)?Math.max(0,100-f.hp)*.5:0;
    return Math.abs(f.x-center)-protection-weakened;
  };
  const target=[...livingFoes].sort((a,b)=>scoring(a)-scoring(b)||String(a.id).localeCompare(String(b.id)))[0];
  this.targets[team]=target.id;this.decidedAt[team]=time;return target;
 }
}
