import test from 'node:test';import assert from 'node:assert/strict';import {shouldProjectileHit} from '../src/systems/projectile.js';
test('enemy projectile can hit living enemy champion',()=>assert.equal(shouldProjectileHit('blue','red'),true));
test('friendly fire prevented',()=>assert.equal(shouldProjectileHit('blue','blue'),false));
test('inactive projectiles and champions ignored',()=>{assert.equal(shouldProjectileHit('red','blue',false,true),false);assert.equal(shouldProjectileHit('red','blue',true,false),false);});
test('unknown team metadata is rejected',()=>assert.equal(shouldProjectileHit(undefined,'red'),false));
