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
