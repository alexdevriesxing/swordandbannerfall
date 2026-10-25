import test from 'node:test';
import assert from 'node:assert/strict';
import {CompanionDirector,ROLES} from '../src/systems/companions.js';
const champions={blue:{team:'blue',x:220,hp:100},red:{team:'red',x:990,hp:100}};
test('three AI roles have distinct combat profiles',()=>{
 const d=new CompanionDirector({maxPerTeam:3});
 const units=['vanguard','ranger','sentinel'].map(role=>d.add('blue',220,{role}));
 assert.deepEqual(units.map(u=>u.role),['vanguard','ranger','sentinel']);
 assert.ok(units[2].maxHp>units[1].maxHp);
 assert.ok(units[1].range>units[0].range);
 assert.throws(()=>d.add('red',990,{role:'unknown'}));
});
test('ranger fires from beyond melee distance',()=>{
 const d=new CompanionDirector();
 const u=d.add('blue',740,{role:'ranger'});
 d.command('blue','hunt');
 const actions=d.update(1000,0,champions);
 assert.ok(actions.some(a=>a.type==='attack'&&a.id===u.id&&a.targetId==='champion'));
});
test('sentinel positions close while ranger stays behind in guard',()=>{
 const d=new CompanionDirector({maxPerTeam:3});
 const s=d.add('blue',220,{role:'sentinel'});
 const r=d.add('blue',220,{role:'ranger'});
 d.update(1000,1000,champions);
 assert.ok(d.units.find(u=>u.id===s.id).x>d.units.find(u=>u.id===r.id).x);
});
