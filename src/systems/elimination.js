// Single source of truth for one life per fighter. No respawn or duplicate scoring.
export class EliminationMatch {
 constructor({fightersPerTeam=10}={}){
  if(!Number.isInteger(fightersPerTeam)||fightersPerTeam<1)throw new RangeError('fightersPerTeam');
  this.capacity=fightersPerTeam;this.units=new Map();this.phase='setup';this.winner=null;this.eliminations={blue:0,red:0};
 }
 register(team,id){
  if(this.phase!=='setup')throw new Error('Registration closed');
  if(!['blue','red'].includes(team)||id==null||this.units.has(String(id)))throw new Error('Invalid or duplicate unit');
  if([...this.units.values()].filter(u=>u.team===team).length>=this.capacity)throw new Error('Team full');
  this.units.set(String(id),{team,alive:true});return String(id);
 }
 begin(){
  if(this.phase!=='setup')throw new Error('Match already started');
  for(const team of ['blue','red'])if([...this.units.values()].filter(u=>u.team===team).length!==this.capacity)throw new Error('Incomplete roster');
  this.phase='fight';
 }
 eliminate(id){
  const unit=this.units.get(String(id));
  if(this.phase!=='fight'||!unit||!unit.alive)return {accepted:false,winner:this.winner};
  unit.alive=false;this.eliminations[unit.team]++;
  const remaining=this.remaining(unit.team);
  if(remaining===0){this.winner=unit.team==='blue'?'red':'blue';this.phase='finished';}
  return {accepted:true,remaining,winner:this.winner};
 }
 remaining(team){
  if(!['blue','red'].includes(team))throw new Error('Invalid team');
  return [...this.units.values()].filter(u=>u.team===team&&u.alive).length;
 }
 snapshot(){return {phase:this.phase,winner:this.winner,remaining:{blue:this.remaining('blue'),red:this.remaining('red')},eliminations:{...this.eliminations}};}
}
