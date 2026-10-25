import { SquadCoordinator } from './squad.js';
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
 add(team,x,{role='vanguard',hp,damage,speed}={}){
  if(!Object.hasOwn(ROLES,role))throw new Error('Invalid companion role');
  const spec=ROLES[role];hp??=spec.hp;damage??=spec.damage;speed??=spec.speed;
  if(!['blue','red'].includes(team)||!Number.isFinite(x))throw new Error('Invalid companion');
  if(this.units.filter(u=>u.team===team&&u.hp>0).length>=this.maxPerTeam)return null;
  const unit={id:this.nextId++,team,x,anchor:x,hp,maxHp:hp,damage,speed,role,range:spec.range,lastAttack:-Infinity};
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
 update(timeMs,deltaMs,champions,cover=null){
  if(!Number.isFinite(timeMs)||!Number.isFinite(deltaMs)||deltaMs<0)throw new RangeError('Invalid time');
  const actions=[];
  const snapshot=this.units.filter(u=>u.hp>0).map(u=>({...u}));
  const teamFocus={};
  for(const team of ['blue','red']){
   const enemyTeam=team==='blue'?'red':'blue';
   const enemyChampion=champions[enemyTeam];
   const foes=[...(enemyChampion?.hp>0?[{id:'champion',x:enemyChampion.x,hp:enemyChampion.hp}]:[]),...snapshot.filter(u=>u.team===enemyTeam)];
   teamFocus[team]=this.coordinator.focus(team,snapshot,foes,timeMs,this.orders[team],champions[team]?.x??(team==='blue'?100:1180));
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
   const closest=this.orders[unit.team]==='guard'&&personal&&Math.abs(personal.x-(champion?.x??unit.anchor))<160?personal:(shared??personal);
   const order=this.orders[unit.team];
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
   // Stop short of surviving obstacles; ranged shots cannot pass through cover.
   if(cover)goal=cover.approach(unit.x,goal);
   const dist=goal-unit.x;
   const step=Math.min(Math.abs(dist),unit.speed*deltaMs/1000);
   unit.x=Math.min(1230,Math.max(50,unit.x+Math.sign(dist)*step));
   actions.push({type:'move',id:unit.id,x:unit.x});
   if(!closest||unit.hp/unit.maxHp<.25)continue;
   const blockedShot=cover&&cover.obstruction(unit.x,closest.x);
   if(blockedShot&&this.orders[unit.team]==='hunt'&&timeMs-unit.lastAttack>=this.attackCooldown&&Math.abs(blockedShot.x-unit.x)<=unit.range){
    unit.lastAttack=timeMs;
    actions.push({type:'cover-attack',id:unit.id,team:unit.team,coverId:blockedShot.id,damage:unit.damage});
   }else if(!blockedShot&&Math.abs(closest.x-unit.x)<=Math.max(this.attackRange,unit.range)&&timeMs-unit.lastAttack>=this.attackCooldown){
    unit.lastAttack=timeMs;
    actions.push({type:'attack',id:unit.id,team:unit.team,targetId:closest.id,damage:unit.damage});
   }
  }
  return actions;
 }
 snapshot(){return JSON.parse(JSON.stringify({units:this.units,orders:this.orders}));}
}
