import { specialAttack } from './abilities.js';
import { SquadCoordinator } from './squad.js';
import { formationGoal, breachCandidate } from './formation.js';
import { jumpPlan, advanceJump, GROUND_Y } from './navigation.js';
import { platformJump, advancePlatformJump } from './platform-routes.js';
import { combatElevation } from './elevation.js';
import { shotObstruction } from './cover.js';
// Deterministic allied and enemy companion AI; independent of Phaser and artwork.
export const ORDERS=Object.freeze(['guard','patrol','hunt']);
export const ROLES=Object.freeze({
 vanguard:{hp:80,damage:11,speed:115,range:85},
 ranger:{hp:45,damage:9,speed:145,range:260},
 sentinel:{hp:100,damage:7,speed:95,range:95}
});
export class CompanionDirector {
 constructor({maxPerTeam=2,attackRange=90,attackCooldown=850}={}){
  this.maxPerTeam=maxPerTeam;this.attackRange=attackRange;this.attackCooldown=attackCooldown;
  this.units=[];this.nextId=1;this.orders={blue:'guard',red:'hunt'};this.coordinator=new SquadCoordinator();
 }
 add(team,x,{role='vanguard',hp,damage,speed,platformNode=null}={}){
  if(!Object.hasOwn(ROLES,role))throw new Error('Invalid companion role');
  const spec=ROLES[role];hp??=spec.hp;damage??=spec.damage;speed??=spec.speed;
  if(!['blue','red'].includes(team)||!Number.isFinite(x))throw new Error('Invalid companion');
  if(this.units.filter(u=>u.team===team&&u.hp>0).length>=this.maxPerTeam)return null;
  const unit={id:this.nextId++,team,x,anchor:x,hp,maxHp:hp,damage,speed,role,range:spec.range,platformNode,y:GROUND_Y,lastAttack:-Infinity};
  this.units.push(unit);return {...unit};
 }
 command(team,order){
  if(!Object.hasOwn(this.orders,team)||!ORDERS.includes(order))throw new Error('Invalid order');
  this.orders[team]=order;
 }
 wound(id,amount){
  if(!Number.isFinite(amount)||amount<0)throw new RangeError('Invalid damage');
  const unit=this.units.find(u=>u.id===id);
  if(!unit||unit.hp<=0)return {applied:0,ko:false};
  const applied=Math.min(amount,unit.hp);unit.hp-=applied;
  return {applied,ko:unit.hp===0};
 }
 update(timeMs,deltaMs,champions,cover=null,platforms=null){
  if(!Number.isFinite(timeMs)||!Number.isFinite(deltaMs)||deltaMs<0)throw new RangeError('Invalid time');
  const actions=[];
  // At the beginning of an authored-platform encounter, snap the logical elevation
  // to its documented landing zone before computing AI targeting and routes.
  if(platforms)for(const u of this.units){
   if(u.hp>0&&u.platformNode&&!u.platformJump&&!u.jump&&u.y===GROUND_Y){
    u.y=platforms.nodes.get(u.platformNode)?.y??GROUND_Y;
   }
  }
  const snapshot=this.units.filter(u=>u.hp>0).map(u=>({...u}));
  // Guarding a fallen champion stalls an elimination match; surviving fighters hunt instead.
  const battleOrder=team=>champions[team]?.hp<=0&&this.orders[team]==='guard'?'hunt':this.orders[team];
  const teamFocus={};
  for(const team of ['blue','red']){
   const enemyTeam=team==='blue'?'red':'blue';
   const enemyChampion=champions[enemyTeam];
   const foes=[...(enemyChampion?.hp>0?[{id:'champion',x:enemyChampion.x,hp:enemyChampion.hp}]:[]),...snapshot.filter(u=>u.team===enemyTeam)];
   teamFocus[team]=this.coordinator.focus(team,snapshot,foes,timeMs,battleOrder(team),champions[team]?.x??(team==='blue'?100:1180));
  }
  for(const unit of this.units){
   if(unit.hp<=0)continue;
   const champion=champions[unit.team],enemy=champions[unit.team==='blue'?'red':'blue'];
   const foes=[
    ...(enemy&&enemy.hp>0?[{id:'champion',team:enemy.team,x:enemy.x,hp:enemy.hp}]:[]),
    ...snapshot.filter(u=>u.team!==unit.team)
   ];
   // Prioritize immediate threats to our champion; ranged units favor fragile enemy companions.
   const score=foe=>{
    const distance=Math.abs(foe.x-unit.x);
    const threat=Math.abs(foe.x-(champion?.x??unit.anchor))<180?110:0;
    const fragility=unit.role==='ranger'&&foe.id!=='champion'?35:0;
    return distance-threat-fragility;
   };
   const personal=foes.sort((a,b)=>score(a)-score(b)||String(a.id).localeCompare(String(b.id)))[0];
   const shared=foes.find(f=>f.id===teamFocus[unit.team]?.id);
   const closest=battleOrder(unit.team)==='guard'&&personal&&Math.abs(personal.x-(champion?.x??unit.anchor))<160?personal:(shared??personal);
   const order=battleOrder(unit.team);
   const guardPoint=champion?.x??unit.anchor;
   const fallback=unit.team==='blue'?110:1170;
   // Guardians protect their champion; patrollers defend a fixed lane; hunters engage.
   let goal=unit.anchor;
   const formationOffset=unit.role==='ranger'?-85:unit.role==='sentinel'?20:65;
   const facing=unit.team==='blue'?1:-1;
   if(order==='guard')goal=closest&&Math.abs(closest.x-guardPoint)<230?closest.x-facing*(unit.role==='ranger'?140:30):guardPoint+facing*formationOffset;
   if(order==='patrol')goal=unit.anchor+Math.sin(timeMs/1150+unit.id)*115;
   if(order==='hunt')goal=closest?closest.x-facing*(unit.role==='ranger'?180:unit.role==='sentinel'?35:20):fallback;
   // Automatically preserve wounded units, irrespective of player micromanagement.
   if(unit.hp/unit.maxHp<.25)goal=fallback;
   // Follow authored connected landings only when a multi-level map supplies them.
   if(platforms&&order==='hunt'&&unit.platformNode&&closest?.platformNode&&unit.platformNode!==closest.platformNode&&!unit.platformJump){
    const route=platforms.route(unit.platformNode,closest.platformNode);
    if(route?.length>1){
     const from=platforms.nodes.get(unit.platformNode);
     const next=route[1];
     // Same-elevation graph edges are traversed on foot; only elevation changes jump.
     if(from&&Math.abs(from.y-next.y)<2){
      goal=next.x;
      unit.pendingWalkNode=next.id;
     }else if(from&&Math.abs(unit.x-from.x)>36)goal=from.x;
     else{
      const plan=platformJump(unit,from,next,timeMs);
      if(plan){unit.platformJump=plan;unit.pendingPlatformNode=next.id;}
     }
    }
   }
   if(unit.platformJump){
    const motion=advancePlatformJump(unit,timeMs);
    if(motion){unit.y=motion.y;if(!unit.platformJump){unit.platformNode=unit.pendingPlatformNode;unit.pendingPlatformNode=null;}actions.push(motion);continue;}
   }
   // Spread a crowded single-lane squad before applying obstacle standoff.
   if(!unit.pendingWalkNode)goal=formationGoal(unit,goal,snapshot);
   // The ground-level cover hop cannot land safely on a raised gantry.
   if(order==='hunt'&&!unit.jump&&!(platforms?.nodes.get(unit.platformNode)?.width)){
    const plan=jumpPlan(unit,goal,cover,{timeMs});
    if(plan)unit.jump=plan;
   }
   if(unit.jump){
    const motion=advanceJump(unit,timeMs);
    if(motion){unit.y=motion.y;actions.push(motion);continue;}
   }
   // Grounded units stop at intact barriers.
   if(cover)goal=cover.approach(unit.x,goal);
   const dist=goal-unit.x;
   const step=Math.min(Math.abs(dist),unit.speed*deltaMs/1000);
   unit.x=Math.min(1230,Math.max(50,unit.x+Math.sign(dist)*step));
   // On an elevated landing, stay on the physical gantry until taking a valid jump.
   const ledge=platforms?.nodes.get(unit.platformNode);
   if(ledge?.width)unit.x=Math.max(ledge.x-ledge.width/2+16,Math.min(ledge.x+ledge.width/2-16,unit.x));
   if(unit.pendingWalkNode&&platforms&&Math.abs(unit.x-platforms.nodes.get(unit.pendingWalkNode).x)<=36){
    unit.platformNode=unit.pendingWalkNode;unit.pendingWalkNode=null;
   }
   unit.y=platforms&&unit.platformNode?(platforms.nodes.get(unit.platformNode)?.y??GROUND_Y):GROUND_Y;
   actions.push({type:'move',id:unit.id,x:unit.x,y:unit.y});
   if(!closest||unit.hp/unit.maxHp<.25)continue;
   const enemyY=closest.y??(platforms&&closest.platformNode?platforms.nodes.get(closest.platformNode)?.y:GROUND_Y)??GROUND_Y;
   const blockedShot=shotObstruction(cover,{x:unit.x,y:unit.y-17},{x:closest.x,y:enemyY-17});
   const breach=breachCandidate(unit,blockedShot,{reach:Math.max(this.attackRange,unit.range)});
   if(breach&&order==='hunt'&&timeMs-unit.lastAttack>=this.attackCooldown){
    unit.lastAttack=timeMs;
    actions.push({type:'cover-attack',id:unit.id,team:unit.team,coverId:blockedShot.id,damage:unit.damage});
   }else if(!blockedShot&&combatElevation(unit,{...closest,y:closest.y??(platforms&&closest.platformNode?platforms.nodes.get(closest.platformNode)?.y:GROUND_Y)})[unit.role==='ranger'?'ranged':'melee']&&Math.abs(closest.x-unit.x)<=Math.max(this.attackRange,unit.range)&&timeMs-unit.lastAttack>=this.attackCooldown){
    unit.lastAttack=timeMs;
    const special=specialAttack(unit,timeMs);
    actions.push({type:'attack',id:unit.id,team:unit.team,targetId:closest.id,damage:unit.damage+(special?.bonusDamage??0),ability:special?.ability??null});
   }
  }
  return actions;
 }
 snapshot(){return JSON.parse(JSON.stringify({units:this.units,orders:this.orders}));}
}
