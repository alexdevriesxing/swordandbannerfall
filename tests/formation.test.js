import test from 'node:test';import assert from 'node:assert/strict';import {formationGoal,breachCandidate,rangerStandoffGoal,screenedRangerGoal} from '../src/systems/formation.js';
test('isolated fighter follows its goal',()=>{const u={id:1,x:200,team:'blue',hp:80};assert.equal(formationGoal(u,300,[u]),300);});
test('crowded teammates receive stable, distinct destinations',()=>{const units=[1,2,3].map(id=>({id,x:300,team:'blue',hp:80}));const goals=units.map(u=>formationGoal(u,300,units));assert.equal(new Set(goals).size,3);assert.deepEqual(goals,units.map(u=>formationGoal(u,300,units)));});
test('dead enemies are not spacing candidates',()=>{const u={id:1,x:100,team:'blue',hp:50};assert.equal(formationGoal(u,100,[u,{id:2,x:100,team:'red',hp:50},{id:3,x:100,team:'blue',hp:0}]),100);});
test('breach requires living obstacle within reach',()=>{const u={x:300};assert.equal(breachCandidate(u,{id:'wall',x:400,hp:20},{reach:100}).id,'wall');assert.equal(breachCandidate(u,{x:401,hp:20},{reach:100}),null);assert.equal(breachCandidate(u,{x:350,hp:0}),null);});

test('ranger retreats to a safe standoff point when an opponent closes',()=>{
 const ranger={id:1,role:'ranger',team:'blue',x:300};
 assert.equal(rangerStandoffGoal(ranger,{x:350}),175);
 assert.equal(rangerStandoffGoal({...ranger,x:400},{x:350}),525);
 assert.equal(rangerStandoffGoal({...ranger,x:200},{x:500}),null);
});
test('standoff correction respects arena bounds and other roles',()=>{
 assert.equal(rangerStandoffGoal({role:'ranger',team:'blue',x:70},{x:80}),50);
 assert.equal(rangerStandoffGoal({role:'ranger',team:'red',x:1210},{x:1200}),1230);
 assert.equal(rangerStandoffGoal({role:'sentinel',team:'blue',x:300},{x:320}),null);
 assert.throws(()=>rangerStandoffGoal({role:'ranger',x:300},{x:310},{preferred:20,minimum:40}),RangeError);
});

test('ranger advance remains behind living melee screen',()=>{
 const ranger={id:1,team:'blue',role:'ranger',x:200,hp:45};
 const target={x:900};
 const team=[ranger,{id:2,team:'blue',role:'vanguard',x:350,hp:80},{id:3,team:'blue',role:'sentinel',x:310,hp:90}];
 assert.equal(screenedRangerGoal(ranger,target,team,650),290);
 assert.equal(screenedRangerGoal({...ranger,x:320},target,team,550),290);
 assert.equal(screenedRangerGoal(ranger,target,team,100),100,'retreat is never restricted');
 assert.equal(screenedRangerGoal(ranger,target,team,650,{gap:0}),350);
});
test('screen uses living friendly melee escorts and mirrors for red team',()=>{
 const red={id:10,team:'red',role:'ranger',x:1000,hp:45};
 const allies=[red,{id:11,team:'red',role:'sentinel',x:800,hp:90},{id:12,team:'red',role:'vanguard',x:860,hp:0},{id:13,team:'blue',role:'vanguard',x:600,hp:80}];
 assert.equal(screenedRangerGoal(red,{x:200},allies,500),860);
 assert.equal(screenedRangerGoal(red,{x:200},[red],500),500);
 assert.equal(screenedRangerGoal({...red,role:'vanguard'},{x:200},allies,500),500);
});
