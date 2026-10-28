import {DEFENSE_CATALOG} from './tactics.js';

// Authored Iron Citadel defensive strategy. The enemy pays full supply costs;
// nothing spawns from nowhere, and actions never occur beneath living opponents.
export const IRON_CITADEL_DEFENSE_PLAN=Object.freeze([
 Object.freeze({id:'western-turret',kind:'turret',x:940,phase:'setup'}),
 Object.freeze({id:'rear-shield',kind:'shield',x:1080,phase:'setup'}),
 Object.freeze({id:'approach-trap',kind:'trap',x:775,phase:'fight'}),
 Object.freeze({id:'fallback-turret',kind:'turret',x:1175,phase:'fight'})
]);

export class EnemyDefenseDirector {
 constructor({team='red',plan=IRON_CITADEL_DEFENSE_PLAN,firstBattleDeployMs=6000,
   battleCooldownMs=8000,safetyDistance=80}={}){
  if(!['blue','red'].includes(team))throw new Error('Unknown defense team');
  if(!Array.isArray(plan)||!plan.every(p=>p?.id&&DEFENSE_CATALOG[p.kind]&&
    ['setup','fight'].includes(p.phase)&&Number.isFinite(p.x)))
   throw new Error('Invalid authored defense plan');
  if(![firstBattleDeployMs,battleCooldownMs,safetyDistance].every(n=>Number.isFinite(n)&&n>=0))
   throw new RangeError('Invalid enemy defense timing');
  this.team=team;this.plan=plan;this.firstBattleDeployMs=firstBattleDeployMs;
  this.battleCooldownMs=battleCooldownMs;this.safetyDistance=safetyDistance;
  this.completed=new Set();this.lastBattleDeploy=-Infinity;
  this.battleStartedAt=null;
 }
 update(tactics,{phase,timeMs=0,opponents=[]}={}){
  if(!tactics||!['setup','fight','finished'].includes(phase)||!Number.isFinite(timeMs))
   throw new Error('Invalid defense director input');
  if(phase==='finished')return [];
  if(phase==='fight'&&this.battleStartedAt===null)this.battleStartedAt=timeMs;
  const spawned=[];
  for(const entry of this.plan){
   if(this.completed.has(entry.id)||entry.phase!==phase)continue;
   if(phase==='fight'&&(timeMs-this.battleStartedAt<this.firstBattleDeployMs
     ||timeMs-this.lastBattleDeploy<this.battleCooldownMs))continue;
   if(tactics.supply[this.team]<DEFENSE_CATALOG[entry.kind].cost)continue;
   // A defense is assembled on the arena floor (y=590). Do not spawn
   // beneath a living ground combatant, but an enemy safely overhead on
   // an authored 445px gantry does not occupy the deployment footprint.
   if(opponents.some(u=>u?.hp>0&&Number.isFinite(u.x)&&
     Math.abs(u.x-entry.x)<this.safetyDistance&&
     Number.isFinite(u.y??590)&&Math.abs((u.y??590)-590)<=65))continue;
   const result=tactics.deploy(this.team,entry.kind,entry.x);
   if(result.accepted){
    this.completed.add(entry.id);
    if(phase==='fight')this.lastBattleDeploy=timeMs;
    spawned.push(result.defense);
   }else if(result.reason==='blocked'||result.reason==='enemy-territory'){
    // Cannot relocate a hand-authored defense or clip through other assets.
    this.completed.add(entry.id);
   }
  }
  return spawned;
 }
 snapshot(){return {team:this.team,completed:[...this.completed],
   waiting:this.plan.filter(e=>!this.completed.has(e.id)).map(e=>e.id),
   battleStartedAt:this.battleStartedAt,lastBattleDeploy:this.lastBattleDeploy};}
}
