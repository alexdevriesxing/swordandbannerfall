import {shotObstruction} from './cover.js';
import {sweptGantryContact} from './gantry-projectiles.js';
// Data-only arena tactics. No texture generation, rendering, or browser dependencies.
export const TEAM_SIZE=10;
// All deployed ward emitters stand on the authored ground lane at y=590.
// A ground ward cannot shield units on the 445px-high Iron Citadel gantries.
export const SHIELD_GROUND_Y=590;
export const SHIELD_VERTICAL_REACH=85;
export const DEFENSE_CATALOG=Object.freeze({
 trap:{cost:25,damage:30,range:48,cooldownMs:1800,maxHp:35},
 turret:{cost:45,damage:12,range:340,cooldownMs:1000,maxHp:65},
 shield:{cost:35,damage:0,range:125,cooldownMs:0,maxHp:90}
});
export class TacticalBattle {
 constructor({teamSize=TEAM_SIZE,startingSupply=100}={}){
  if(!Number.isInteger(teamSize)||teamSize<1)throw new RangeError('teamSize');
  this.teamSize=teamSize;this.supply={blue:startingSupply,red:startingSupply};
  this.rosters={blue:Array.from({length:teamSize},(_,i)=>({id:'blue-'+(i+1),alive:true})),
   red:Array.from({length:teamSize},(_,i)=>({id:'red-'+(i+1),alive:true}))};
  this.active={blue:0,red:0};this.defenses=[];this.nextDefenseId=1;
  this.orders={blue:'guard',red:'hunt'};
 }
 remaining(team){this.requireTeam(team);return this.rosters[team].filter(f=>f.alive).length;}
 requireTeam(team){if(!Object.hasOwn(this.rosters,team))throw new Error('Unknown team');}
 current(team){this.requireTeam(team);return this.rosters[team][this.active[team]]??null;}
 knockout(team){
  this.requireTeam(team);const unit=this.current(team);
  if(!unit||!unit.alive)return {accepted:false,remaining:this.remaining(team)};
  unit.alive=false;
  const next=this.rosters[team].findIndex(f=>f.alive);
  this.active[team]=next===-1?this.teamSize:next;
  return {accepted:true,fallen:unit.id,next:this.current(team)?.id??null,remaining:this.remaining(team),winner:this.winner()};
 }
 winner(){
  const b=this.remaining('blue'),r=this.remaining('red');
  return b===0&&r===0?'draw':b===0?'red':r===0?'blue':null;
 }
 order(team,mode){
  this.requireTeam(team);
  if(!['guard','patrol','hunt'].includes(mode))throw new Error('Invalid order');
  this.orders[team]=mode;return mode;
 }
 deploy(team,kind,x){
  this.requireTeam(team);
  const spec=DEFENSE_CATALOG[kind];
  if(!spec)throw new Error('Invalid defense type');
  if(!Number.isFinite(x)||x<50||x>1230)throw new RangeError('Defense location outside arena');
  if(this.winner())return {accepted:false,reason:'match-ended'};
  if(this.supply[team]<spec.cost)return {accepted:false,reason:'insufficient-supply'};
  // Prevent invisible overlapping defenses and placement inside enemy stronghold.
  if((team==='blue'&&x>610)||(team==='red'&&x<670))return {accepted:false,reason:'enemy-territory'};
  if(this.defenses.some(d=>d.hp>0&&Math.abs(d.x-x)<50))return {accepted:false,reason:'blocked'};
  this.supply[team]-=spec.cost;
  const defense={id:this.nextDefenseId++,team,kind,x,hp:spec.maxHp,lastFired:-Infinity};
  this.defenses.push(defense);return {accepted:true,defense:{...defense}};
 }
 getTargets(team,opponents,timeMs,{cover=null,gantries=[]}={}){
  this.requireTeam(team);
  if(!Number.isFinite(timeMs))throw new RangeError('Invalid defense time');
  const enemyTeam=team==='blue'?'red':'blue';
  // Old numeric champion-only callers remain valid; the arena supplies living 10v10 targets.
  const candidates=(Array.isArray(opponents)?opponents:[{id:'champion',x:opponents,hp:1}])
   .filter(u=>u&&u.hp>0&&u.id!=null&&Number.isFinite(u.x));
  const attacks=[];
  for(const d of this.defenses){
   if(d.team!==team||d.hp<=0||d.kind==='shield')continue;
   const spec=DEFENSE_CATALOG[d.kind];
   if(timeMs-d.lastFired<spec.cooldownMs)continue;
   const target=candidates.filter(u=>{
    if(Math.abs(d.x-u.x)>spec.range)return false;
    const targetY=Number.isFinite(u.y)?u.y:590;
    // A ground pressure trap cannot reach elevated platforms.
    if(d.kind==='trap'&&Math.abs(targetY-590)>60)return false;
    if(d.kind==='turret'&&(
      shotObstruction(cover,{x:d.x,y:560},{x:u.x,y:targetY-17})||
      sweptGantryContact({x:d.x,y:560},{x:u.x,y:targetY-17},gantries)
    ))return false;
    return true;
   }).sort((a,b)=>Math.abs(d.x-a.x)-Math.abs(d.x-b.x)||String(a.id).localeCompare(String(b.id)))[0];
   if(!target)continue;
   d.lastFired=timeMs;
   attacks.push({defenseId:d.id,targetTeam:enemyTeam,targetId:target.id,damage:spec.damage,kind:d.kind});
   if(d.kind==='trap')d.hp=0; // consumed only on an actual living target
  }
  return attacks;
 }
 incomingDamage(team,amount,x,targetY=SHIELD_GROUND_Y){
  this.requireTeam(team);
  if(!Number.isFinite(amount)||amount<0||
     !Number.isFinite(x)||!Number.isFinite(targetY))
   throw new RangeError('Invalid damage or shield target geometry');
  // Multiple paid shield emitters may cover the same fighter. Drain the
  // nearest living emitter first and carry any spillover to the next rather
  // than injuring the fighter while another nearby shield still has charge.
  const shields=this.defenses.filter(d=>d.team===team&&d.kind==='shield'&&
    d.hp>0&&Math.abs(d.x-x)<=DEFENSE_CATALOG.shield.range&&
    Math.abs(targetY-SHIELD_GROUND_Y)<=SHIELD_VERTICAL_REACH)
    .sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x)||a.id-b.id);
  let remaining=amount;
  for(const shield of shields){
   if(remaining<=0)break;
   const absorbed=Math.min(shield.hp,remaining);
   shield.hp-=absorbed;
   remaining-=absorbed;
  }
  return {absorbed:amount-remaining,remaining};
 }
 grantSupply(team,amount=20){
  this.requireTeam(team);
  if(!Number.isFinite(amount)||amount<0)throw new RangeError('Invalid supply grant');
  this.supply[team]+=amount;
 }
 snapshot(){return JSON.parse(JSON.stringify({teamSize:this.teamSize,remaining:{blue:this.remaining('blue'),red:this.remaining('red')},active:{blue:this.current('blue')?.id??null,red:this.current('red')?.id??null},supply:this.supply,orders:this.orders,defenses:this.defenses,winner:this.winner()}));}
}
