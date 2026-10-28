import test from 'node:test';import assert from 'node:assert/strict';import {SquadCoordinator} from '../src/systems/squad.js';
test('hunters share focus and retain it briefly',()=>{
 const s=new SquadCoordinator({rethinkMs:1000});
 const own=[{team:'blue',x:100,hp:40},{team:'blue',x:150,hp:40}];
 const a={id:'a',x:250,hp:100},b={id:'b',x:750,hp:100};
 assert.equal(s.focus('blue',own,[a,b],0,'hunt',100).id,'a');
 assert.equal(s.focus('blue',own,[{...a,x:900},b],500,'hunt',100).id,'a');
 assert.equal(s.focus('blue',own,[{...a,x:900},b],1500,'hunt',100).id,'b');
});
test('guard order favors enemies close to champion',()=>{
 const s=new SquadCoordinator();
 const units=[{team:'blue',x:550,hp:70}];
 const enemyNear={id:'near',x:120,hp:100},enemyFar={id:'far',x:520,hp:100};
 assert.equal(s.focus('blue',units,[enemyNear,enemyFar],1000,'guard',100).id,'near');
});
test('a defeated focus is discarded',()=>{
 const s=new SquadCoordinator();const units=[{team:'blue',x:100,hp:50}];
 s.focus('blue',units,[{id:'one',x:150,hp:50}],100,'hunt',100);
 assert.equal(s.focus('blue',units,[{id:'two',x:180,hp:50}],200,'hunt',100).id,'two');
 assert.equal(s.focus('blue',units,[],250,'hunt',100),null);
});

test('guard instantly redirects to a fresh threat near the champion',()=>{
 const s=new SquadCoordinator({rethinkMs:1200});
 const defenders=[{team:'blue',x:550,hp:80}];
 const distant={id:'distant',x:520,hp:100};
 assert.equal(s.focus('blue',defenders,[distant],100,'guard',100).id,'distant');
 const intruder={id:'intruder',x:125,hp:100};
 assert.equal(s.focus('blue',defenders,[distant,intruder],150,'guard',100).id,'intruder');
});
test('guard holds its existing focus when no new immediate threat appears',()=>{
 const s=new SquadCoordinator({rethinkMs:1200});
 const defenders=[{team:'blue',x:550,hp:80}];
 const first={id:'first',x:500,hp:100};
 assert.equal(s.focus('blue',defenders,[first],100,'guard',100).id,'first');
 assert.equal(s.focus('blue',defenders,[{...first,x:900},{id:'other',x:700,hp:100}],150,'guard',100).id,'first');
});

test('changing from guard to hunt immediately recalculates shared target',()=>{
 const s=new SquadCoordinator({rethinkMs:1200});
 const own=[{team:'blue',x:550,hp:80}];
 const near={id:'near',x:120,hp:100},far={id:'far',x:530,hp:100};
 assert.equal(s.focus('blue',own,[near,far],100,'guard',100).id,'near');
 assert.equal(s.focus('blue',own,[near,far],110,'hunt',100).id,'far');
});
test('eliminated foes cannot remain squad focus during the rethink interval',()=>{
 const s=new SquadCoordinator({rethinkMs:1200});
 const own=[{team:'blue',x:500,hp:80}];
 const first={id:'first',x:510,hp:100},second={id:'second',x:700,hp:100};
 assert.equal(s.focus('blue',own,[first,second],100,'hunt',100).id,'first');
 assert.equal(s.focus('blue',own,[{...first,hp:0},second],110,'hunt',100).id,'second');
 assert.equal(s.focus('blue',own,[{...first,hp:0}],120,'hunt',100),null);
});

test('mixed 10v10 frontline chooses an engageable target over a closer upper-ledge distraction',()=>{
 const director=new SquadCoordinator({rethinkMs:1200});
 const team=[
  {id:1,team:'blue',role:'vanguard',x:300,y:590,hp:80},
  {id:2,team:'blue',role:'vanguard',x:320,y:590,hp:80},
  {id:3,team:'blue',role:'sentinel',x:310,y:590,hp:100},
  {id:4,team:'blue',role:'ranger',x:280,y:590,hp:45}
 ];
 const elevated={id:'ledge',x:335,y:445,hp:100};
 const reachable={id:'ground',x:400,y:590,hp:100};
 assert.equal(director.focus('blue',team,[elevated,reachable],1000,'hunt',180).id,'ground');
});
test('entirely ranged teams can focus elevated opponents within their shot envelope',()=>{
 const director=new SquadCoordinator();
 const rangers=[1,2,3].map(id=>({id,team:'blue',role:'ranger',x:300,y:590,hp:45}));
 const elevated={id:'ledge',x:350,y:445,hp:100};
 const distant={id:'ground',x:500,y:590,hp:100};
 assert.equal(director.focus('blue',rangers,[elevated,distant],1000,'hunt',180).id,'ledge');
});
test('focus remains valid when the only remaining opponent is on another height',()=>{
 const director=new SquadCoordinator();
 const team=[{id:1,team:'blue',role:'sentinel',x:290,y:590,hp:80}];
 const unreachable={id:'upper',x:310,y:445,hp:100};
 assert.equal(director.focus('blue',team,[unreachable],1000,'hunt',180).id,'upper');
 assert.equal(director.focus('blue',team,[],1300,'hunt',180),null);
});
test('guard threat priority still overrides elevation penalties for a champion intruder',()=>{
 const director=new SquadCoordinator();
 const team=[1,2,3].map(id=>({id,team:'blue',role:'vanguard',x:430,y:590,hp:80}));
 const elevatedThreat={id:'threat',x:100,y:445,hp:100};
 const groundFar={id:'far',x:490,y:590,hp:100};
 assert.equal(director.focus('blue',team,[elevatedThreat,groundFar],1000,'guard',100).id,'threat');
});
