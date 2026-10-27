// Match-wide combat records with bounded, reproducible totals.
// No timers or storage: the arena drives events from actual hit/launch/card
// outcomes and starts fresh on every replay.
const teams=['blue','red'];
const fresh=()=>({damageDealt:0,hits:0,shots:0,cards:0,coverDamage:0});
export class MatchStatistics{
 constructor(){this.teams={blue:fresh(),red:fresh()};}
 team(name){
  if(!teams.includes(name))throw new Error('Invalid match statistics team');
  return this.teams[name];
 }
 hit(team,applied){
  if(!Number.isFinite(applied)||applied<0)throw new RangeError('Invalid hit amount');
  if(applied===0)return;
  const entry=this.team(team);
  entry.damageDealt+=applied;
  entry.hits++;
 }
 shot(team){
  this.team(team).shots++;
 }
 card(team){
  this.team(team).cards++;
 }
 breach(team,applied){
  if(!Number.isFinite(applied)||applied<0)throw new RangeError('Invalid cover damage');
  if(applied===0)return;
  this.team(team).coverDamage+=applied;
 }
 snapshot(){
  return {blue:{...this.teams.blue},red:{...this.teams.red}};
 }
}
export function matchStatSummary(stats){
 if(!stats?.blue||!stats?.red)return '';
 const line=team=>{
  const s=stats[team];
  return team.toUpperCase()+'  DAMAGE '+s.damageDealt+
   '  HITS '+s.hits+'  SHOTS '+s.shots+
   '  BREACH '+s.coverDamage+'  CARDS '+s.cards;
 };
 return line('blue')+'\n'+line('red');
}
