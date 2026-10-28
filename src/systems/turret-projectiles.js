import {aimVelocity} from './ballistics.js';
import {shotObstruction} from './cover.js';
import {sweptGantryContact} from './gantry-projectiles.js';

// Defensive turrets fire the game's approved projectile texture. Their shots
// may be intercepted by an enemy fighter or physical wall during flight.
export function planTurretShot({
 defense,target,damage,cover=null,gantries=[],speed=650
}={}){
 if(defense?.kind!=='turret'||!['blue','red'].includes(defense?.team)||
    !(defense.hp>0)||!(target?.hp>0)||
    !['blue','red'].includes(target.team)||target.team===defense.team||
    ![defense.x,target.x,target.y,damage,speed].every(Number.isFinite)||
    damage<=0||speed<=0||
    !(typeof target.id==='string'||Number.isSafeInteger(target.id)))return null;
 const origin={x:defense.x,y:560};
 const destination={x:target.x,y:target.y-17};
 if(shotObstruction(cover,origin,destination)||
    sweptGantryContact(origin,destination,gantries))return null;
 const velocity=aimVelocity(origin,destination,speed);
 if(velocity.x===0&&velocity.y===0)return null;
 return {origin,velocity,team:defense.team,targetId:target.id,damage,coverDamage:damage};
}
