import test from 'node:test';
import assert from 'node:assert/strict';
import {CompanionDirector} from '../src/systems/companions.js';
import {validImpact} from '../src/systems/impact.js';
import {BattlefieldCover} from '../src/systems/cover.js';
import {IRON_CITADEL_GANTRIES} from '../src/levels/iron-citadel.js';

// Reproduce the renderer's two-stage frame: every companion plans against a
// living snapshot; the entire roster may move before action damage is applied.
function pendingAction(team='blue'){
 const ai=new CompanionDirector({maxPerTeam:2});
 const isBlue=team==='blue';
 const actor=ai.add(team,isBlue?500:800,{role:'vanguard'});
 const foe=ai.add(isBlue?'red':'blue',isBlue?555:745,{role:'sentinel'});
 const champions={
  blue:{team:'blue',x:100,y:590,hp:0},
  red:{team:'red',x:1180,y:590,hp:0}
 };
 ai.command(team,'hunt');
 const actions=ai.update(1000,0,champions);
 const planned=actions.find(a=>a.type==='attack'&&a.id===actor.id);
 assert.ok(planned,'AI should plan a close-range immediate melee attack');
 assert.equal(planned.targetId,foe.id);
 return {ai,actor:ai.units.find(u=>u.id===actor.id),foe:ai.units.find(u=>u.id===foe.id),planned};
}
const eligible=(actor,target,ai,cover=null,gantries=[])=>validImpact({
 attacker:actor,target,range:Math.max(ai.attackRange,actor.range),cover,gantries
});

test('blue immediate melee plan becomes invalid if the victim retreats this frame',()=>{
 const {ai,actor,foe}=pendingAction('blue');
 assert.equal(eligible(actor,foe,ai),true);
 const hp=foe.hp;
 foe.x+=175;
 assert.equal(eligible(actor,foe,ai),false);
 assert.equal(foe.hp,hp,'eligibility cannot mutate combat HP');
});
test('red immediate melee plan also expires when opponent dashes beyond reach',()=>{
 const {ai,actor,foe}=pendingAction('red');
 assert.equal(eligible(actor,foe,ai),true);
 foe.x-=160;
 assert.equal(eligible(actor,foe,ai),false);
});
test('new barricade cannot be meleed through after an AI strike was planned',()=>{
 const {ai,actor,foe}=pendingAction('blue');
 const cover=new BattlefieldCover([{id:'fresh-barricade',x:530,width:20,hp:120}]);
 assert.equal(eligible(actor,foe,ai,cover),false);
 assert.equal(cover.segments[0].hp,120);
});
test('real stone gantry blocks otherwise vertically valid melee after target moves',()=>{
 const {ai,actor,foe}=pendingAction('blue');
 actor.x=300;actor.y=530;
 foe.x=355;foe.y=468;
 assert.equal(eligible(actor,foe,ai),true,'vertical melee envelope alone permits hit');
 assert.equal(eligible(actor,foe,ai,null,IRON_CITADEL_GANTRIES),false);
});
test('close living enemy remains attackable after both units complete their movement',()=>{
 const {ai,actor,foe}=pendingAction('blue');
 actor.x+=5;
 foe.x+=8;
 assert.equal(eligible(actor,foe,ai,null,IRON_CITADEL_GANTRIES),true);
});
test('a teammate or eliminated fighter never receives queued melee damage',()=>{
 const {ai,actor,foe}=pendingAction('blue');
 assert.equal(eligible(actor,{...foe,team:'blue'},ai),false);
 assert.equal(eligible(actor,{...foe,hp:0},ai),false);
});
test('immediate AI strikes against a moving champion use live geometry and health',()=>{
 const attacker={id:3,role:'sentinel',team:'blue',x:500,y:590,hp:80,range:95};
 const champion={id:'enemy',team:'red',x:580,y:590,hp:100};
 const ai={attackRange:90};
 assert.equal(eligible(attacker,champion,ai),true);
 assert.equal(eligible(attacker,{...champion,x:630},ai),false);
 assert.equal(eligible(attacker,{...champion,hp:0},ai),false);
});
