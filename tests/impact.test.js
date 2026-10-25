import test from 'node:test';import assert from 'node:assert/strict';
import {validImpact,resolveTarget} from '../src/systems/impact.js';
const a={id:1,team:'blue',hp:20,x:100},b={id:2,team:'red',hp:20,x:150};
test('rejects attack from dead or same-team fighter',()=>{assert.equal(validImpact({attacker:{...a,hp:0},target:b,range:100}),false);assert.equal(validImpact({attacker:a,target:{...b,team:'blue'},range:100}),false);});
test('rejects delayed attack once target escapes or gains cover',()=>{assert.equal(validImpact({attacker:a,target:{...b,x:300},range:100}),false);assert.equal(validImpact({attacker:a,target:b,range:100,cover:{obstruction:()=>({id:'wall'})}}),false);assert.equal(validImpact({attacker:a,target:b,range:100}),true);});
test('resolves champion and unit targets without targeting casualties',()=>{const champions={blue:{team:'blue',hp:100,x:50},red:{team:'red',hp:0,x:950}};assert.equal(resolveTarget({target:'hero'},[b],champions),champions.blue);assert.equal(resolveTarget({target:'enemy'},[b],champions),null);assert.equal(resolveTarget({target:2},[b],champions),b);assert.equal(resolveTarget({target:2},[{...b,hp:0}],champions),null);});
