import test from 'node:test';
import assert from 'node:assert/strict';
import {BattlefieldCover} from '../src/systems/cover.js';
import {jumpPlan} from '../src/systems/navigation.js';
import {CompanionDirector} from '../src/systems/companions.js';
import {PlatformRoutes} from '../src/systems/platform-routes.js';
import {IRON_CITADEL_NODES,IRON_CITADEL_LINKS} from '../src/levels/iron-citadel.js';

test('elevated fighter sees no ground barricade below the actual feet',()=>{
 const cover=new BattlefieldCover([{id:'wall',x:820,width:60,hp:90}]);
 assert.equal(cover.obstructionAtHeight(900,780,477.5),null);
 assert.equal(cover.approachAtHeight(900,780,477.5),780);
});

test('a ground fighter must stop short of the same intact wall',()=>{
 const cover=new BattlefieldCover([{id:'wall',x:820,width:60,hp:90}]);
 assert.equal(cover.obstructionAtHeight(900,780,622.5)?.id,'wall');
 assert.equal(cover.approachAtHeight(900,780,622.5),885);
});

test('tall cover blocks an elevated fighter, but low cover does not',()=>{
 const cover=new BattlefieldCover([{id:'tower',x:820,width:60,hp:90,topY:430}]);
 assert.equal(cover.approachAtHeight(900,780,477.5),885);
 assert.equal(cover.approachAtHeight(900,780,420),780);
 cover.damage('tower',90);
 assert.equal(cover.approachAtHeight(900,780,622.5),780);
});

test('height-aware approach respects both travel directions and validates coordinates',()=>{
 const cover=new BattlefieldCover([{id:'wall',x:500,width:100,hp:80}]);
 assert.equal(cover.approachAtHeight(250,750,622.5),415);
 assert.equal(cover.approachAtHeight(750,250,622.5),585);
 assert.equal(cover.approachAtHeight(250,750,477.5),750);
 assert.throws(()=>cover.approachAtHeight(250,750,NaN),RangeError);
 assert.throws(()=>cover.approachAtHeight(250,750,622.5,-1),RangeError);
});

test('actual east-gantry ranger can move left over the intact east bulkhead',()=>{
 const platforms=new PlatformRoutes(IRON_CITADEL_NODES,IRON_CITADEL_LINKS);
 const cover=new BattlefieldCover();
 const ai=new CompanionDirector();
 const ranger=ai.add('blue',900,{role:'ranger',platformNode:'east-gantry'});
 const champs={blue:{team:'blue',x:600,y:590,hp:100},
  red:{team:'red',x:1190,y:590,hp:0}};
 const actions=ai.update(1000,1000,champs,cover,platforms);
 const updated=ai.units.find(u=>u.id===ranger.id);
 assert.equal(updated.y,445);
 assert.equal(updated.x,826,'ranger walks to the safe gantry edge above the wall');
 assert.ok(actions.some(a=>a.type==='move'&&a.id===ranger.id&&a.x===826));
 assert.equal(cover.intact().length,2,'walking overhead does not destroy walls');
});

test('the identical ground-positioned ranger remains blocked by the bulkhead',()=>{
 const cover=new BattlefieldCover();
 const ai=new CompanionDirector();
 const ranger=ai.add('blue',900,{role:'ranger'});
 const champs={blue:{team:'blue',x:600,y:590,hp:100},
  red:{team:'red',x:1190,y:590,hp:0}};
 ai.update(1000,1000,champs,cover);
 const updated=ai.units.find(u=>u.id===ranger.id);
 assert.equal(updated.y,590);
 assert.equal(updated.x,885,'ground ranger cannot walk through the barricade');
});

test('jump planner does not invent a leap across cover already below the fighter',()=>{
 const cover=new BattlefieldCover([{id:'short-wall',x:620,width:82,hp:80}]);
 const elevated={id:2,x:550,y:445};
 assert.equal(jumpPlan(elevated,750,cover,{timeMs:1000}),null);
 const grounded={...elevated,y:590};
 assert.ok(jumpPlan(grounded,750,cover,{timeMs:1000})?.active);
});

test('jump planner still respects genuinely tall cover on an elevated lane',()=>{
 const cover=new BattlefieldCover([{id:'tall-wall',x:620,width:82,hp:80,topY:420}]);
 const elevated={id:2,x:550,y:445};
 assert.ok(jumpPlan(elevated,750,cover,{timeMs:1000})?.active);
});
