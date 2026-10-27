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

test('authored cover rejects duplicate IDs before rendering or physics registration',()=>{
 assert.throws(()=>new BattlefieldCover([
  {id:'shared',x:400,width:80,hp:60},
  {id:'shared',x:700,width:80,hp:90}
 ]),/Invalid cover/);
});

test('invalid wall sizes, collision tops and durability cannot enter a match',()=>{
 const base={id:'wall',x:500,width:80,hp:80};
 for(const bad of [
  {...base,width:Infinity},{...base,width:NaN},{...base,hp:Infinity},
  {...base,hp:0},{...base,topY:NaN},{...base,topY:Infinity},
  {...base,id:''}
 ])assert.throws(()=>new BattlefieldCover([bad]),/Invalid cover/);
});

test('valid authored elevated cover with custom top survives snapshot and damage',()=>{
 const cover=new BattlefieldCover([{id:'rampart',x:820,width:60,hp:90,topY:430}]);
 assert.equal(cover.snapshot()[0].topY,430);
 assert.equal(cover.obstructionAtHeight(900,780,477.5)?.id,'rampart');
 assert.deepEqual(cover.damage('rampart',90),{applied:90,destroyed:true});
 assert.equal(cover.obstructionAtHeight(900,780,477.5),null);
});
