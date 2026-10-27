import test from 'node:test';
import assert from 'node:assert/strict';
import {sentinelEscortGoal} from '../src/systems/formation.js';

test('sentinel supports a wounded vanguard behind the battle line',()=>{
 const sentinel={id:4,team:'blue',role:'sentinel',x:300,hp:100,maxHp:100};
 const allies=[sentinel,{id:2,team:'blue',role:'vanguard',x:500,hp:30,maxHp:80}];
 assert.equal(sentinelEscortGoal(sentinel,{x:800},allies,740),462);
 assert.equal(sentinelEscortGoal({...sentinel,team:'red'},{x:100},[{...allies[1],team:'red'}],200),538);
});
test('healthy, eliminated and opposing fighters do not trigger escort movement',()=>{
 const unit={id:1,team:'blue',role:'sentinel',x:200};
 const v={id:2,team:'blue',role:'vanguard',x:350,hp:80,maxHp:80};
 assert.equal(sentinelEscortGoal(unit,{x:800},[v],700),700);
 assert.equal(sentinelEscortGoal(unit,{x:800},[{...v,hp:0}],700),700);
 assert.equal(sentinelEscortGoal(unit,{x:800},[{...v,hp:20,team:'red'}],700),700);
 assert.equal(sentinelEscortGoal({...unit,role:'ranger'},{x:800},[{...v,hp:20}],700),700);
});

test('distant wounded Vanguard does not drag Sentinel across the full battlefield',()=>{
 const sentinel={id:3,team:'blue',role:'sentinel',x:200,y:590,hp:100};
 const wounded={id:4,team:'blue',role:'vanguard',x:980,y:590,hp:9,maxHp:80};
 assert.equal(sentinelEscortGoal(sentinel,{x:1110},[wounded],340),340);
});
test('Sentinel holds own level rather than chasing injured allies on another gantry',()=>{
 const sentinel={id:3,team:'blue',role:'sentinel',x:330,y:445,hp:100};
 const wounded={id:4,team:'blue',role:'vanguard',x:350,y:590,hp:8,maxHp:80};
 assert.equal(sentinelEscortGoal(sentinel,{x:600},[wounded],385),385);
 const sameLevel={...wounded,y:445};
 assert.equal(sentinelEscortGoal(sentinel,{x:600},[sameLevel],385),312);
});
test('Sentinel escort thresholds and ranges are configurable without unsafe values',()=>{
 const sentinel={id:3,team:'blue',role:'sentinel',x:200,y:590,hp:100};
 const wounded={id:4,team:'blue',role:'vanguard',x:320,y:590,hp:20,maxHp:80};
 assert.equal(sentinelEscortGoal(sentinel,{x:600},[wounded],250,{maxDistance:100}),250);
 assert.equal(sentinelEscortGoal(sentinel,{x:600},[wounded],250,{maxDistance:120}),282);
 assert.throws(()=>sentinelEscortGoal(sentinel,{x:600},[wounded],250,{maxDistance:-1}),RangeError);
});
