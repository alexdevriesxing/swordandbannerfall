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
import {planCompanionShot,planCompanionCoverShot} from '../src/systems/companion-projectiles.js';
import {firstBattleProjectileContact} from '../src/systems/battle-projectiles.js';
import {planTurretShot} from '../src/systems/turret-projectiles.js';
import {cleaveSplashTargets,cleaveSplashDamage} from '../src/systems/cleave.js';
import {interceptDamage} from '../src/systems/abilities.js';
import {PlatformRoutes} from '../src/systems/platform-routes.js';
import {IRON_CITADEL_NODES,IRON_CITADEL_LINKS,IRON_CITADEL_GANTRIES} from '../src/levels/iron-citadel.js';

// Game-model smoke harness: exercises actual autonomy, cooldowns, cover, projectile
// flight, defenses, champion health and 10v10 eliminations without Phaser sprites.
// This is NOT a replacement for visual/physics/browser end-to-end validation.
function simulate({
 seed=1,blueHeroFalls=false,maxMs=180000,stepMs=100,formationVariance=0,
 withGantries=false
}={}){
 if(!Number.isFinite(formationVariance)||formationVariance<0||formationVariance>30)
  throw new RangeError('Invalid formation variance');
 const prep=new PreparationPhase({durationMs:1200});
 const match=new EliminationMatch();
 const ai=new CompanionDirector({maxPerTeam:9});
 const combat=new CombatDirector({seed});
 const tactics=new TacticalBattle();
 const cover=new BattlefieldCover();
 const platforms=withGantries?new PlatformRoutes(IRON_CITADEL_NODES,IRON_CITADEL_LINKS):null;
 const gantries=withGantries?IRON_CITADEL_GANTRIES:[];
 const windups=new AttackTelegraphs();
 const shots=[];
 const champions={
  blue:{id:'hero',team:'blue',x:210+(combat.rng.next()-.5)*2*formationVariance,y:590,hp:100},
  red:{id:'enemy',team:'red',x:1070+(combat.rng.next()-.5)*2*formationVariance,y:590,hp:100}
 };
 const clocks={hero:-Infinity,enemy:-Infinity};
 const metrics={frames:0,shots:0,hits:0,coverBroken:0,championKOs:0,attacks:0,duplicateKOs:0};
 match.register('blue','hero');match.register('red','enemy');
 for(const team of ['blue','red']){
  for(let i=0;i<9;i++){
   const role=['sentinel','ranger','vanguard'][i%3];
   const x=(withGantries&&i===7?(team==='blue'?350:930):
    team==='blue'?125+i*19:1150-i*19)+
    (combat.rng.next()-.5)*2*formationVariance;
   const platformNode=withGantries?(i===7?
    (team==='blue'?'west-gantry':'east-gantry'):
    (team==='blue'?'west-foot':'east-foot')):null;
   const unit=ai.add(team,x,{role,platformNode});
   assert.ok(unit);match.register(team,'ai-'+unit.id);
  }
 }
 const opening={
  champions:{blue:champions.blue.x,red:champions.red.x},
  units:ai.units.map(unit=>({id:unit.id,team:unit.team,x:unit.x}))
 };
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
  const blocked=tactics.incomingDamage(victim.team,amount,victim.x,victim.y??590);
  const protectedHit=interceptDamage(ai.units,victim.team,victim.x,blocked.remaining,time,victim.y??590,victim.id);
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
  const shot=planCompanionShot({attacker,target,damage,cover,gantries});
  if(!shot)return;
  shots.push({createdAt:time,x:shot.origin.x,y:shot.origin.y,
   velocity:shot.velocity,team:attacker.team,
   attacker:attacker.id,targetId:target.id,damage});
  metrics.shots++;
 }
 function fireCover(attacker,barrier,damage,time){
  const shot=planCompanionCoverShot({attacker,barrier,damage});
  if(!shot)return;
  shots.push({createdAt:time,x:shot.origin.x,y:shot.origin.y,
   velocity:shot.velocity,team:shot.team,attacker:attacker.id,
   targetId:null,damage:shot.damage,coverDamage:shot.coverDamage});
  metrics.shots++;
 }
 if(blueHeroFalls)hit('hero',1000,'ranged',0);
 for(let time=1300;time<=maxMs&&match.phase==='fight';time+=stepMs){
  metrics.frames++;
  const actions=ai.update(time,stepMs,champions,cover,platforms,null,gantries);
  for(const action of actions){
   if(match.phase!=='fight')break;
   if(action.type==='cover-attack'){
    const attacker=liveTarget(action.id);
    const wall=cover.intact().find(w=>w.id===action.coverId);
    if(!attacker||!wall)continue;
    if(attacker.role==='ranger')fireCover(attacker,wall,action.damage,time);
    else breach(action.coverId,action.damage);
    continue;
   }
   if(action.type!=='attack')continue;
   const attacker=liveTarget(action.id);
   if(!attacker)continue;
   const targetId=action.targetId==='champion'?(action.team==='blue'?'enemy':'hero'):action.targetId;
   const target=liveTarget(targetId);
   if(!target)continue;
   metrics.attacks++;
   if(action.ability){windups.schedule(time,action.id,targetId,action.damage);continue;}
   if(attacker.role==='ranger')fire(attacker,target,action.damage,time);
   else if(validImpact({
    attacker,target,range:Math.max(ai.attackRange,attacker.range),
    cover,gantries
   }))hit(targetId,action.damage,'melee',time);
  }
  for(const pending of windups.popReady(time)){
   if(match.phase!=='fight')break;
   const attacker=liveTarget(pending.attacker),target=liveTarget(pending.target);
   if(!validImpact({attacker,target,range:attacker?.range,cover,gantries}))continue;
   if(attacker.role==='ranger'){
    fire(attacker,target,pending.damage,time);
   }else{
    const splash=attacker.role==='vanguard'?cleaveSplashTargets(
     attacker,{...target,id:pending.target},[
      ...Object.values(champions).filter(u=>u.hp>0),
      ...ai.units.filter(u=>u.hp>0)
     ],{range:attacker.range,cover,gantries}):[];
    hit(pending.target,pending.damage,'melee',time);
    if(match.phase==='fight')
     for(const foe of splash){
      if(match.phase!=='fight')break;
      hit(foe.id,cleaveSplashDamage(pending.damage),'melee',time);
     }
   }
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
    firingTeam:shot.team,champions,companions:ai.units,cover,gantries
   });
   if(impact?.kind==='cover'){
    shots.splice(i,1);
    breach(impact.id,shot.coverDamage??shot.damage);
   }else if(impact?.kind==='terrain'){
    shots.splice(i,1);
   }else if(impact?.kind==='unit'){
    shots.splice(i,1);
    hit(impact.id,shot.damage,'ranged',time);
   }
  }
  if(match.phase!=='fight')break;
  for(const attack of tactics.getTargets('blue',[
   ...(champions.red.hp>0?[champions.red]:[]),
   ...ai.units.filter(u=>u.team==='red'&&u.hp>0)
  ],time,withGantries?{cover,gantries}:{})){
   if(attack.kind!=='turret'){
    hit(attack.targetId,attack.damage,'ranged',time);
    continue;
   }
   const defense=tactics.defenses.find(d=>d.id===attack.defenseId&&d.hp>0);
   const target=liveTarget(attack.targetId);
   const projectile=planTurretShot({defense,target,damage:attack.damage,cover,gantries});
   if(!projectile)continue;
   shots.push({createdAt:time,x:projectile.origin.x,y:projectile.origin.y,
    velocity:projectile.velocity,team:projectile.team,
    attacker:attack.defenseId,targetId:projectile.targetId,
    damage:projectile.damage,coverDamage:projectile.coverDamage});
   metrics.shots++;
  }
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
 return {match:match.snapshot(),opening,metrics,timeMs:1300+metrics.frames*stepMs,remainingHP:champions,cover:cover.snapshot()};
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

test('real seeded deployment variations produce distinct, reproducible 10v10 matches',()=>{
 const variants=[13,21,44,105,144,233,377,503];
 const openings=new Set();
 for(const seed of variants){
  const result=simulate({seed,formationVariance:25,maxMs:180000});
  openings.add(JSON.stringify(result.opening));
  assert.equal(result.match.phase,'finished',
   'formation variant '+seed+' stalled: '+JSON.stringify(result.metrics));
  assert.equal(result.metrics.duplicateKOs,0);
  for(const team of ['blue','red'])
   assert.equal(result.match.eliminations[team]+result.match.remaining[team],10,
    'variant '+seed+' broke roster conservation');
 }
 assert.equal(openings.size,variants.length,
  'different seeds must actually vary the formation rather than repeat the same test');
 const first=simulate({seed:44,formationVariance:25,maxMs:180000});
 const again=simulate({seed:44,formationVariance:25,maxMs:180000});
 assert.deepEqual(first.opening,again.opening);
 assert.deepEqual(first.metrics,again.metrics,'seeded match should replay deterministically');
});

test('full Iron Citadel 10v10 model includes real gantry traversal and collision',()=>{
 const configs=[
  {seed:5,formationVariance:10,withGantries:true,maxMs:180000},
  {seed:71,formationVariance:20,withGantries:true,maxMs:180000},
  {seed:97,blueHeroFalls:true,formationVariance:14,withGantries:true,maxMs:180000}
 ];
 for(const cfg of configs){
  const result=simulate(cfg);
  assert.equal(result.match.phase,'finished',
   'Iron Citadel 10v10 stalled for seed '+cfg.seed+': '+JSON.stringify(result.metrics));
  assert.ok(['blue','red'].includes(result.match.winner));
  assert.equal(result.metrics.duplicateKOs,0);
  for(const team of ['blue','red'])
   assert.equal(result.match.eliminations[team]+result.match.remaining[team],10);
  assert.ok(result.metrics.frames<=1800);
  assert.ok(result.metrics.shots>0,'gantry test must exercise real travelling projectiles');
 }
});
