import {combatElevation} from './elevation.js';
import {shotObstruction} from './cover.js';

// Vanguard Cleave is a limited, positional melee arc, not just bonus damage
// to the chosen fighter. Resolve only real nearby hostile combatants.
// No additional imagery is drawn; the authored VFX pipeline owns presentation.
export function cleaveSplashTargets(attacker,primary,candidates,{
 radius=65,range=95,maxExtra=2
}={}){
 if(!attacker||attacker.role!=='vanguard'||!(attacker.hp>0)||
  !primary||!(primary.hp>0)||primary.team===attacker.team||
  !['blue','red'].includes(attacker.team)||!['blue','red'].includes(primary.team)||
  !Array.isArray(candidates)||!
  [attacker.x,attacker.y,primary.x,primary.y,radius,range].every(Number.isFinite)||
  radius<=0||range<=0||!Number.isSafeInteger(maxExtra)||maxExtra<1)return [];
 const options=candidates.filter(enemy=>enemy&&enemy.id!==primary.id&&
  enemy.team===primary.team&&enemy.hp>0&&
  [enemy.x,enemy.y].every(Number.isFinite)&&
  Math.abs(enemy.x-primary.x)<=radius&&
  Math.abs(enemy.x-attacker.x)<=range&&
  combatElevation(attacker,enemy).melee===true&&
  !shotObstruction(attacker.cover??null,
   {x:attacker.x,y:attacker.y-17},{x:enemy.x,y:enemy.y-17}));
 return options.sort((a,b)=>
  Math.abs(a.x-primary.x)-Math.abs(b.x-primary.x)||
  String(a.id).localeCompare(String(b.id))).slice(0,maxExtra);
}

export function cleaveSplashDamage(primaryDamage){
 if(!Number.isFinite(primaryDamage)||primaryDamage<=0)throw new RangeError('Invalid cleave damage');
 return Math.max(1,Math.round(primaryDamage*.6));
}
