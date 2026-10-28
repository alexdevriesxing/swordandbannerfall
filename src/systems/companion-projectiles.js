import {aimVelocity} from './ballistics.js';
import {combatElevation} from './elevation.js';
import {shotObstruction} from './cover.js';
import {sweptGantryContact} from './gantry-projectiles.js';

// A projectile is a real travelling object. Never apply ranged damage on attack selection.
// The scene renders the existing approved projectile sprite, never generated artwork.
export function planCompanionShot({
 attacker,target,damage,cover=null,gantries=[],speed=650
}={}){
 if(!attacker||!target||!['blue','red'].includes(attacker.team)||
    !['blue','red'].includes(target.team)||attacker.team===target.team||
    !(attacker.hp>0)||!(target.hp>0)||
    ![attacker.x,attacker.y,target.x,target.y,damage,speed].every(Number.isFinite)||
    damage<=0||speed<=0)return null;
 if(!combatElevation(attacker,target).ranged)return null;
 if(shotObstruction(cover,{x:attacker.x,y:attacker.y-17},{x:target.x,y:target.y-17}))return null;
 const direction=Math.sign(target.x-attacker.x)||(attacker.team==='blue'?1:-1);
 // Keep close-range bolts on the shooter's side of their target.
 const muzzle=Math.min(24,Math.max(0,Math.abs(target.x-attacker.x)-4));
 const origin={x:attacker.x+direction*muzzle,y:attacker.y-17};
 const destination={x:target.x,y:target.y-17};
 if(destination.x===origin.x&&destination.y===origin.y)
  destination.x+=direction*50;
 // Preserve cooldown opportunities for legitimate targets rather than
 // launching autonomous arrows into impenetrable stone platforms.
 if(sweptGantryContact(origin,destination,gantries))return null;
 const velocity=aimVelocity(origin,destination,speed);
 if(velocity.x===0&&velocity.y===0)return null;
 return {origin,velocity,targetId:target.id,team:attacker.team,damage};
}

/**
 * Fire a real ranged breaching shot at authored cover. The projectile must
 * physically arrive before any cover HP changes. No synthetic impact FX.
 */
export function planCompanionCoverShot({attacker,barrier,damage,speed=650}={}){
 if(attacker?.role!=='ranger'||!['blue','red'].includes(attacker?.team)||
    !(attacker.hp>0)||!barrier?.id||!(barrier.hp>0)||
    ![attacker.x,attacker.y,barrier.x,barrier.width,damage,speed].every(Number.isFinite)||
    barrier.width<=0||damage<=0||speed<=0||
    Math.abs(barrier.x-attacker.x)>attacker.range)return null;
 const dir=Math.sign(barrier.x-attacker.x)||(attacker.team==='blue'?1:-1);
 // Preserve a visible spawn point on the shooter's side of the barricade.
 const edgeDistance=Math.max(0,Math.abs(barrier.x-attacker.x)-barrier.width/2);
 const muzzle=Math.min(24,Math.max(0,edgeDistance-4));
 const origin={x:attacker.x+dir*muzzle,y:attacker.y-17};
 const target={x:barrier.x,y:Math.max(origin.y,(barrier.topY??517.5)+8)};
 const velocity=aimVelocity(origin,target,speed);
 if(velocity.x===0&&velocity.y===0)return null;
 return {origin,velocity,team:attacker.team,targetId:null,damage,coverDamage:damage};
}
