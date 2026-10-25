import test from 'node:test';
import assert from 'node:assert/strict';
import {BattlefieldCover} from '../src/systems/cover.js';
test('intact cover prevents crossing and directs units to its edge',()=>{
 const c=new BattlefieldCover([{id:'wall',x:500,width:100,hp:70}]);
 assert.equal(c.obstruction(250,750).id,'wall');
 assert.equal(c.approach(250,750),415);
 assert.equal(c.approach(750,250),585);
});
test('destruction permanently clears line of sight',()=>{
 const c=new BattlefieldCover([{id:'wall',x:500,width:100,hp:70}]);
 assert.deepEqual(c.damage('wall',30),{applied:30,destroyed:false});
 assert.deepEqual(c.damage('wall',50),{applied:40,destroyed:true});
 assert.equal(c.obstruction(250,750),null);
});
test('invalid damage cannot repair or destroy cover',()=>{
 const c=new BattlefieldCover([{id:'wall',x:500,width:100,hp:70}]);
 assert.throws(()=>c.damage('wall',-1));
 assert.deepEqual(c.damage('missing',10),{applied:0,destroyed:false});
});

test('first barricade encountered along the travel direction takes damage first',()=>{
 const c=new BattlefieldCover();
 assert.equal(c.obstruction(900,200).id,'east-bulkhead');
 assert.equal(c.obstruction(200,900).id,'central-barricade');
 const first=c.obstruction(900,200);
 c.damage(first.id,first.hp);
 assert.equal(c.obstruction(900,200).id,'central-barricade');
});
