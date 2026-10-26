import test from 'node:test';
import assert from 'node:assert/strict';
import {CompanionDirector} from '../src/systems/companions.js';
const champions={blue:{team:'blue',x:200,hp:100},red:{team:'red',x:950,hp:100}};
test('AI squads cap independently by team',()=>{
 const c=new CompanionDirector();assert.ok(c.add('blue',160));assert.ok(c.add('blue',185));assert.equal(c.add('blue',210),null);assert.ok(c.add('red',900));
});
test('hunt order advances autonomously toward opposing champion',()=>{
 const c=new CompanionDirector();const u=c.add('blue',200);
 c.command('blue','hunt');c.update(1000,1000,champions);
 assert.ok(c.units.find(x=>x.id===u.id).x>200);
});
test('guard protects near its champion without hunting distant enemies',()=>{
 const c=new CompanionDirector();const u=c.add('blue',200);
 c.update(1000,1000,champions);
 assert.ok(c.units[0].x<400);assert.equal(c.units[0].id,u.id);
});
test('companions engage when in range and respect cooldown',()=>{
 const c=new CompanionDirector();c.add('blue',930);
 c.command('blue','hunt');
 assert.equal(c.update(1000,0,champions).filter(a=>a.type==='attack').length,1);
 assert.equal(c.update(1200,0,champions).filter(a=>a.type==='attack').length,0);
 assert.equal(c.update(2000,0,champions).filter(a=>a.type==='attack').length,1);
});
test('wounded units retreat and do not attack',()=>{
 const c=new CompanionDirector();const u=c.add('blue',930);
 // A critically wounded Vanguard (15/80 HP) should disengage below 25%.
 c.command('blue','hunt');c.wound(u.id,65);
 const actions=c.update(1000,500,champions);
 assert.ok(c.units[0].x<930);assert.equal(actions.filter(a=>a.type==='attack').length,0);
});
test('dead units no longer act',()=>{
 const c=new CompanionDirector();const u=c.add('blue',900);c.wound(u.id,100);
 assert.equal(c.update(1500,100,champions).length,0);
});

test('surviving blue companions automatically hunt when their champion is defeated',()=>{
 const living=new CompanionDirector();living.add('blue',350);
 living.update(1000,100,{blue:{team:'blue',x:90,hp:100},red:{team:'red',x:600,hp:100}});
 const defeated=new CompanionDirector();defeated.add('blue',350);
 defeated.update(1000,100,{blue:{team:'blue',x:90,hp:0},red:{team:'red',x:600,hp:100}});
 assert.ok(living.units[0].x<350);
 assert.ok(defeated.units[0].x>350);
 // The explicit command stays unchanged; only the autonomous effective order changes.
 assert.equal(defeated.orders.blue,'guard');
});

test('moderate injuries do not force a permanent retreat',()=>{
 const c=new CompanionDirector();const u=c.add('blue',930);
 c.command('blue','hunt');c.wound(u.id,45); // 35/80 HP remains above the 25% threshold.
 const actions=c.update(1000,100,champions);
 assert.equal(actions.filter(a=>a.type==='attack').length,1);
});

test('surviving Patrol squad switches to effective Hunt after champion is eliminated',()=>{
 const director=new CompanionDirector();
 const unit=director.add('blue',350,{role:'vanguard'});
 director.command('blue','patrol');
 const champions={blue:{team:'blue',x:80,hp:0},red:{team:'red',x:750,hp:100}};
 director.update(1200,500,champions);
 assert.ok(director.units.find(u=>u.id===unit.id).x>350);
 assert.equal(director.orders.blue,'patrol','Remember the selected command without allowing a stalemate');
});
test('critically wounded last escort fights instead of retreating indefinitely',()=>{
 const director=new CompanionDirector();
 const fighter=director.add('blue',500,{role:'ranger'});
 director.command('blue','guard');
 director.wound(fighter.id,42); // 3/45 HP, below 25%.
 const champions={blue:{team:'blue',x:70,hp:0},red:{team:'red',x:675,hp:100}};
 const actions=director.update(1000,100,champions);
 assert.ok(actions.some(a=>a.type==='attack'&&a.id===fighter.id));
});
test('wounded escort still retreats if team has another living companion',()=>{
 const director=new CompanionDirector();
 const wounded=director.add('blue',500,{role:'ranger'});
 director.add('blue',300,{role:'vanguard'});
 director.wound(wounded.id,42);
 const champions={blue:{team:'blue',x:70,hp:0},red:{team:'red',x:675,hp:100}};
 const actions=director.update(1000,100,champions);
 assert.equal(actions.some(a=>a.type==='attack'&&a.id===wounded.id),false);
 assert.ok(director.units.find(u=>u.id===wounded.id).x<500);
});
