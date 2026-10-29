import test from 'node:test';
import assert from 'node:assert/strict';
import {CompanionDirector} from '../src/systems/companions.js';
import {validImpact} from '../src/systems/impact.js';
import {cleaveSplashTargets} from '../src/systems/cleave.js';

function plannedEdgeCleave(team){
 const ai=new CompanionDirector({maxPerTeam:3});
 const blue=team==='blue';
 const actor=ai.add(team,blue?500:800,{role:'vanguard'});
 const enemy=ai.add(blue?'red':'blue',blue?587:713,{role:'sentinel'});
 ai.command(team,'hunt');
 const champions={
  blue:{team:'blue',hp:0,x:110,y:590},
  red:{team:'red',hp:0,x:1170,y:590}
 };
 const actions=ai.update(1000,0,champions);
 const queued=actions.find(a=>a.id===actor.id&&a.type==='attack');
 assert.ok(queued,'a close opponent should trigger the regular attack');
 assert.equal(queued.ability,'cleave','this case exercises the actual special windup');
 const attacker=ai.units.find(u=>u.id===actor.id);
 const target=ai.units.find(u=>u.id===enemy.id);
 return {ai,attacker,target,queued};
}

for(const team of ['blue','red']){
 test(team+' Vanguard special releases at the exact attack-planning reach',()=>{
  const {ai,attacker,target,queued}=plannedEdgeCleave(team);
  assert.equal(Math.abs(attacker.x-target.x),87);
  assert.equal(attacker.range,85);
  assert.equal(ai.attackRange,90);
  assert.equal(queued.targetId,target.id);
  assert.equal(validImpact({attacker,target,range:attacker.range}),false,
   'the old narrow release check silently discarded the selected Cleave');
  assert.equal(validImpact({
   attacker,target,range:Math.max(ai.attackRange,attacker.range)
  }),true,'windup release must use the shared effective attack reach');
  const dodge={...target,x:target.x+(team==='blue'?4:-4)};
  assert.equal(validImpact({
   attacker,target:dodge,range:Math.max(ai.attackRange,attacker.range)
  }),false,'a fighter that dodges beyond 90px can still escape the windup');
 });
}

test('Cleave splash targets have the same edge reach as the primary strike',()=>{
 const {ai,attacker,target}=plannedEdgeCleave('blue');
 const extra={id:99,team:'red',x:588,y:590,hp:40};
 assert.equal(cleaveSplashTargets(attacker,target,[extra],{
  range:attacker.range
 }).length,0,'legacy role-only radius drops valid edge targets');
 assert.deepEqual(cleaveSplashTargets(attacker,target,[extra],{
  range:Math.max(ai.attackRange,attacker.range)
 }).map(u=>u.id),[99]);
});

test('Vanguard range fix does not extend sentinel or ranger attack reach',()=>{
 const ai=new CompanionDirector({maxPerTeam:2});
 const v=ai.add('blue',200,{role:'vanguard'});
 const s=ai.add('blue',210,{role:'sentinel'});
 const r=ai.add('red',400,{role:'ranger'});
 assert.equal(Math.max(ai.attackRange,v.range),90);
 assert.equal(Math.max(ai.attackRange,s.range),95);
 assert.equal(Math.max(ai.attackRange,r.range),260);
});
