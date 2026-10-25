import {aimVelocity} from './ballistics.js';
import {combatElevation} from './elevation.js';
import {shotObstruction} from './cover.js';

// A projectile is a real travelling object. Never apply ranged damage on attack selection.
// The scene renders the existing approved projectile sprite, never generated artwork.
export function planCompanionShot({attacker,target,damage,cover=null,speed=650}={}){
 if(!attacker||!target||!['blue','red'].includes(attacker.team)||
    !['blue','red'].includes(target.team)||attacker.team===target.team||
    !(attacker.hp>0)||!(target.hp>0)||
    ![attacker.x,attacker.y,target.x,target.y,damage,speed].every(Number.isFinite)||
    damage<=0||speed<=0)return null;
 if(!combatElevation(attacker,target).ranged)return null;
 if(shotObstruction(cover,{x:attacker.x,y:attacker.y-17},{x:target.x,y:target.y-17}))return null;
 const direction=Math.sign(target.x-attacker.x)||(attacker.team==='blue'?1:-1);
 const origin={x:attacker.x+direction*24,y:attacker.y-17};
 const destination={x:target.x,y:target.y-17};
 const velocity=aimVelocity(origin,destination,speed);
 if(velocity.x===0&&velocity.y===0)return null;
 return {origin,velocity,targetId:target.id,team:attacker.team,damage};
}
