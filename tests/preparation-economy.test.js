import test from 'node:test';
import assert from 'node:assert/strict';
import {TacticalBattle} from '../src/systems/tactics.js';
import {refundSetupDefenses} from '../src/systems/preparation-economy.js';

test('red human receives exactly 100 supply after AI defenses are refunded',()=>{
 const tactics=new TacticalBattle();
 assert.equal(tactics.deploy('red','turret',940).accepted,true);
 assert.equal(tactics.deploy('red','shield',1080).accepted,true);
 assert.equal(tactics.supply.red,20);
 const removed=refundSetupDefenses(tactics,'red');
 assert.deepEqual(removed.map(d=>d.kind),['turret','shield']);
 assert.equal(tactics.supply.red,100);
 assert.equal(tactics.defenses.length,0);
});
test('mode switching never refunds player one defenses',()=>{
 const tactics=new TacticalBattle();
 tactics.deploy('blue','turret',220);
 tactics.deploy('red','shield',1000);
 refundSetupDefenses(tactics,'red');
 assert.equal(tactics.supply.blue,55);
 assert.equal(tactics.supply.red,100);
 assert.deepEqual(tactics.defenses.map(d=>d.team),['blue']);
});
test('switching back to VS AI restores setup cost without creating free supply',()=>{
 const tactics=new TacticalBattle();
 tactics.deploy('red','turret',940);
 tactics.deploy('red','shield',1080);
 refundSetupDefenses(tactics,'red');
 tactics.deploy('red','trap',850);
 assert.equal(tactics.supply.red,75);
 refundSetupDefenses(tactics,'red');
 assert.equal(tactics.supply.red,100);
 tactics.deploy('red','turret',940);
 tactics.deploy('red','shield',1080);
 assert.equal(tactics.supply.red,20);
 assert.equal(refundSetupDefenses(tactics,'red').length,2);
 assert.equal(refundSetupDefenses(tactics,'red').length,0);
 assert.equal(tactics.supply.red,100,'No supply inflation on repeated refunds');
});
test('cannot reset the active fight or refund malformed defense catalogs',()=>{
 const tactics=new TacticalBattle();
 tactics.deploy('red','trap',850);
 assert.throws(()=>refundSetupDefenses(tactics,'red',{phase:'fight'}),/Cannot refund/);
 assert.equal(tactics.supply.red,75);
 tactics.defenses.push({id:99,team:'red',kind:'unverified'});
 assert.throws(()=>refundSetupDefenses(tactics,'red'),/Unknown defense/);
 assert.equal(tactics.supply.red,75,'Validation failure must be atomic');
});
