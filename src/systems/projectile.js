// Pure guard for Arcade Physics projectile overlaps.
export function shouldProjectileHit(projectileTeam,targetTeam,projectileActive=true,targetActive=true){
 return projectileActive===true&&targetActive===true&&
  (projectileTeam==='blue'||projectileTeam==='red')&&
  (targetTeam==='blue'||targetTeam==='red')&&projectileTeam!==targetTeam;
}
