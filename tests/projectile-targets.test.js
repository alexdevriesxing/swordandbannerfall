import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveProjectileTarget} from '../src/systems/projectile-targets.js';
import {sweptProjectileImpact} from '../src/systems/projectile-impact.js';

const champions={
 blue:{team:'blue',x:200,y:580,hp:100},
 red:{team:'red',x:800,y:580,hp:100}
};
const units=[
 {id:7,team:'red',x:400,y:590,hp:45},
 {id:8,team:'blue',x:450,y:445,hp:45},
 {id:9,team:'red',x:500,y:590,hp:0}
];
test('champion-targeted shot resolves a live hostile hero',()=>{
 assert.deepEqual(resolveProjectileTarget('enemy','blue',champions,units),{
  kind:'champion',id:'enemy',team:'red',x:800,y:580,hp:100
 });
 assert.equal(resolveProjectileTarget('hero','blue',champions,units),null);
});
test('companion-targeted shot resolves only a living enemy of the shooter',()=>{
 assert.equal(resolveProjectileTarget(7,'blue',champions,units)?.kind,'companion');
 assert.equal(resolveProjectileTarget(8,'blue',champions,units),null);
 assert.equal(resolveProjectileTarget(9,'blue',champions,units),null);
});
test('dead champions, invalid IDs and malformed coordinates fail closed',()=>{
 assert.equal(resolveProjectileTarget('enemy','blue',{...champions,red:{...champions.red,hp:0}},units),null);
 assert.equal(resolveProjectileTarget('blue','red',champions,units),null);
 assert.equal(resolveProjectileTarget('7','blue',champions,units),null);
 assert.equal(resolveProjectileTarget(7.1,'blue',champions,units),null);
 assert.equal(resolveProjectileTarget('enemy','blue',{...champions,red:{...champions.red,y:NaN}},units),null);
 assert.equal(resolveProjectileTarget('enemy','green',champions,units),null);
});
test('fast moving projectile can strike champion between frames',()=>{
 const champion=resolveProjectileTarget('enemy','blue',champions,units);
 assert.equal(sweptProjectileImpact({x:700,y:563},{x:900,y:563},champion,null),'unit');
});
test('cover in front of a champion wins collision priority even at low frame rate',()=>{
 const champion=resolveProjectileTarget('enemy','blue',champions,units);
 const cover={intact:()=>[{id:'wall',x:740,width:40,hp:90}]};
 assert.equal(sweptProjectileImpact({x:700,y:563},{x:900,y:563},champion,cover),'cover');
});
test('shots at a champion on a raised platform only connect at actual elevation',()=>{
 const raised={...champions,red:{...champions.red,y:445}};
 const champion=resolveProjectileTarget('enemy','blue',raised,units);
 assert.equal(sweptProjectileImpact({x:700,y:563},{x:900,y:563},champion,null),null);
 assert.equal(sweptProjectileImpact({x:700,y:428},{x:900,y:428},champion,null),'unit');
});
