import test from 'node:test';
import assert from 'node:assert/strict';
import {PreparationPhase} from '../src/systems/preparation.js';
import {EliminationMatch} from '../src/systems/elimination.js';
import {CompanionDirector} from '../src/systems/companions.js';
import {CombatDirector} from '../src/systems/combat.js';
import {TacticalBattle} from '../src/systems/tactics.js';
import {BattlefieldCover,shotObstruction} from '../src/systems/cover.js';
import {AttackTelegraphs} from '../src/systems/telegraphs.js';
import {validImpact} from '../src/systems/impact.js';
import {nearestOpponent} from '../src/systems/targeting.js';
import {planCompanionShot} from '../src/systems/companion-projectiles.js';
import {firstBattleProjectileContact} from '../src/systems/battle-projectiles.js';
import {interceptDamage} from '../src/systems/abilities.js';

// Game-model smoke harness: exercises actual autonomy, cooldowns, cover, projectile
// flight, defenses, champion health and 10v10 eliminations without Phaser sprites.
// This is NOT a replacement for visual/physics/browser end-to-end validation.
function simulate({seed=1,blueHeroFalls=false,maxMs=180000,stepMs=100}={}){
 const prep=new PreparationPhase({durationMs:1200});
 const match=new EliminationMatch();
 const ai=new CompanionDirector({maxPerTeam:9});
 const combat=new CombatDirector({seed});
 const tactics=new TacticalBattle();
 const cover=new BattlefieldCover();
 const windups=new AttackTelegraphs();
 const shots=[];
 const champions={
  blue:{id:'hero',team:'blue',x:210,y:590,hp:100},
  red:{id:'enemy',team:'red',x:1070,y:590,hp:100}
 };
 const clocks={hero:-Infinity,enemy:-Infinity};
 const metrics={frames:0,shots:0,hits:0,coverBroken:0,championKOs:0,attacks:0,duplicateKOs:0};
 match.register('blue','hero');match.register('red','enemy');
 for(const team of ['blue','red']){
  for(let i=0;i<9;i++){
   const role=['sentinel','ranger','vanguard'][i%3];
   const x=team==='blue'?125+i*19:1150-i*19;
   const unit=ai.add(team,x,{role});
   assert.ok(unit);match.register(team,'ai-'+unit.id);
  }
 }
 assert.equal(prep.tick(600),false);
 assert.equal(prep.tick(600),true);
 match.begin();
 ai.command('blue','hunt');
 tactics.deploy('blue','turret',410);
 function liveTarget(id){
  if(id==='hero')return champions.blue.hp>0?champions.blue:null;
  if(id==='enemy')return champions.red.hp>0?champions.red:null;
  return ai.units.find(u=>u.id===id&&u.hp>0)??null;
 }
 function hit(targetId,amount,type='melee',time=0){
  if(match.phase!=='fight')return;
  const victim=liveTarget(targetId);
  if(!victim)return;
  const blocked=tactics.incomingDamage(victim.team,amount,victim.x);
  const protectedHit=interceptDamage(ai.units,victim.team,victim.x,blocked.remaining,time);
  if(targetId==='hero'||targetId==='enemy'){
   const result=combat.damage(targetId,protectedHit.damage,type);
   champions[victim.team].hp=combat.fighters[targetId].hp;
   if(result.applied>0)metrics.hits++;
   if(result.ko){
    metrics.championKOs++;
    if(!match.eliminate(targetId).accepted)metrics.duplicateKOs++;
    windups.cancelFor(targetId);
   }
  }else{
   const result=ai.wound(targetId,protectedHit.damage);
   if(result.applied>0)metrics.hits++;
   if(result.ko){
    if(!match.eliminate('ai-'+targetId).accepted)metrics.duplicateKOs++;
    windups.cancelFor(targetId);
   }
  }
 }
 function breach(id,amount){
  const before=cover.segments.find(s=>s.id===id)?.hp??0;
  const result=cover.damage(id,amount);
  if(before>0&&result.destroyed)metrics.coverBroken++;
 }
 function fire(attacker,target,damage,time){
  const shot=planCompanionShot({attacker,target,damage,cover});
  if(!shot)return;
  shots.push({createdAt:time,x:shot.origin.x,y:shot.origin.y,
   velocity:shot.velocity,team:attacker.team,
   attacker:attacker.id,targetId:target.id,damage});
  metrics.shots++;
 }
 if(blueHeroFalls)hit('hero',1000,'ranged',0);
 for(let time=1300;time<=maxMs&&match.phase==='fight';time+=stepMs){
  metrics.frames++;
  const actions=ai.update(time,stepMs,champions,cover);
  for(const action of actions){
   if(match.phase!=='fight')break;
   if(action.type==='cover-attack'){breach(action.coverId,action.damage);continue;}
   if(action.type!=='attack')continue;
   const attacker=liveTarget(action.id);
   if(!attacker)continue;
   const targetId=action.targetId==='champion'?(action.team==='blue'?'enemy':'hero'):action.targetId;
   const target=liveTarget(targetId);
   if(!target)continue;
   metrics.attacks++;
   if(action.ability){windups.schedule(time,action.id,targetId,action.damage);continue;}
   if(attacker.role==='ranger')fire(attacker,target,action.damage,time);
   else hit(targetId,action.damage,'melee',time);
  }
  for(const pending of windups.popReady(time)){
   if(match.phase!=='fight')break;
   const attacker=liveTarget(pending.attacker),target=liveTarget(pending.target);
   if(!validImpact({attacker,target,range:attacker?.range,cover}))continue;
   if(attacker.role==='ranger')fire(attacker,target,pending.damage,time);
   else hit(pending.target,pending.damage,'melee',time);
  }
  for(let i=shots.length-1;i>=0;i--){
   const shot=shots[i];
   if(time-shot.createdAt>1900){shots.splice(i,1);continue;}
   const previous={x:shot.x,y:shot.y};
   shot.x+=shot.velocity.x*stepMs/1000;
   shot.y+=shot.velocity.y*stepMs/1000;
   // The headless model uses the exact first-impact rules as the Phaser
   // scene: an intervening fighter intercepts, or the nearer cover absorbs.
   const impact=firstBattleProjectileContact(previous,{x:shot.x,y:shot.y},{
    firingTeam:shot.team,champions,companions:ai.units,cover
   });
   if(impact?.kind==='cover'){
    shots.splice(i,1);
    breach(impact.id,shot.damage);
   }else if(impact?.kind==='unit'){
    shots.splice(i,1);
    hit(impact.id,shot.damage,'ranged',time);
   }
  }
  if(match.phase!=='fight')break;
  for(const attack of tactics.getTargets('blue',[
   ...(champions.red.hp>0?[champions.red]:[]),
   ...ai.units.filter(u=>u.team==='red'&&u.hp>0)
  ],time))hit(attack.targetId,attack.damage,'ranged',time);
  for(const team of ['blue','red']){
   if(match.phase!=='fight')break;
   const champion=champions[team];if(champion.hp<=0)continue;
   const selected=nearestOpponent(champion.x,team,champions,ai.units,{range:Infinity});
   if(!selected)continue;
   const distance=Math.abs(selected.x-champion.x);
   const coverHit=cover.obstruction(champion.x,selected.x);
   const goal=coverHit?cover.approach(champion.x,selected.x,50):selected.x+(team==='blue'?-65:65);
   const move=Math.min(Math.abs(goal-champion.x),155*stepMs/1000);
   champion.x=Math.max(50,Math.min(1230,champion.x+Math.sign(goal-champion.x)*move));
   if(time-clocks[champion.id]<750)continue;
   clocks[champion.id]=time;
   if(coverHit){if(Math.abs(coverHit.x-champion.x)<600)breach(coverHit.id,18);continue;}
   if(distance<110)hit(selected.id,21,'melee',time);
   else if(distance<575){
    // Champion fire in this headless harness uses the same delayed flight semantics.
    fire({...champion,role:'ranger'},selected,12,time);
   }
  }
 }
 return {match:match.snapshot(),metrics,timeMs:1300+metrics.frames*stepMs,remainingHP:champions,cover:cover.snapshot()};
}
test('two autonomous 10v10 teams complete a finite seeded match',()=>{
 const result=simulate({seed:1});
 assert.equal(result.match.phase,'finished',JSON.stringify(result));
 assert.ok(['blue','red'].includes(result.match.winner));
 assert.equal(result.match.remaining[result.match.winner==='blue'?'red':'blue'],0);
 assert.equal(result.match.eliminations.blue+result.match.eliminations.red,20-result.match.remaining.blue-result.match.remaining.red);
 assert.equal(result.metrics.duplicateKOs,0);
 assert.ok(result.metrics.hits>0);
 assert.ok(result.metrics.shots>0);
 assert.equal(result.metrics.coverBroken,2,'both authored ground barriers must be breached');
 assert.ok(result.timeMs<60000,'the seeded game should not stall');
});
test('surviving squads continue fighting and finish after blue champion is killed first',()=>{
 const result=simulate({seed:7,blueHeroFalls:true});
 assert.equal(result.match.phase,'finished',JSON.stringify(result));
 assert.equal(result.match.eliminations.blue>=1,true);
 assert.equal(result.metrics.duplicateKOs,0);
});
test('autonomous match remains bounded across several deterministic seeds',()=>{
 for(const seed of [2,19,103]){
  const result=simulate({seed,maxMs:180000});
  assert.equal(result.match.phase,'finished','seed '+seed+' '+JSON.stringify(result));
  assert.ok(result.metrics.frames<=1800);
  assert.equal(result.metrics.duplicateKOs,0);
 }
});

test('extended 10v10 projectile-interception scenarios finish without duplicate eliminations',()=>{
 const seeds=[11,17,29,43,59,71,97,127,181,233,311,409];
 for(const seed of seeds){
  const result=simulate({seed,maxMs:180000});
  assert.equal(result.match.phase,'finished',
   'battle stalled for seed '+seed+' '+JSON.stringify(result.metrics));
  assert.ok(['blue','red'].includes(result.match.winner),
   'invalid winner at seed '+seed);
  assert.equal(result.metrics.duplicateKOs,0,
   'duplicate KO at seed '+seed);
  for(const team of ['blue','red'])
   assert.equal(result.match.eliminations[team]+result.match.remaining[team],10,
    'incorrect 10v10 roster accounting for '+team+' seed '+seed);
  assert.ok(result.metrics.frames<=1800,'seed '+seed+' exceeded frame budget');
 }
});
