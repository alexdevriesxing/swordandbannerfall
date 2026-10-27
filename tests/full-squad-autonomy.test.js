import test from 'node:test';
import assert from 'node:assert/strict';
import { CompanionDirector } from '../src/systems/companions.js';

// Full-population integration contract: AI escorts are autonomous, even when
// a human controls each team's champion. No sprite or device dependencies.
const champions = () => ({
  blue: { team: 'blue', x: 140, hp: 100 },
  red: { team: 'red', x: 1140, hp: 100 }
});
function battlefield() {
  const director = new CompanionDirector({ maxPerTeam: 9 });
  for (let i = 0; i < 9; i++) {
    const role = ['vanguard', 'ranger', 'sentinel'][i % 3];
    assert.ok(director.add('blue', 180 + i * 9, { role }));
    assert.ok(director.add('red', 1100 - i * 9, { role }));
  }
  return director;
}
test('nine escorts per team act without controller input', () => {
  const director = battlefield();
  director.command('blue', 'hunt');
  director.command('red', 'hunt');
  const initial = new Map(director.units.map(u => [u.id, u.x]));
  const actions = director.update(1000, 250, champions());
  const moved = actions.filter(a => a.type === 'move');
  assert.equal(director.units.length, 18);
  assert.equal(moved.length, 18);
  assert.equal(new Set(moved.map(a => a.id)).size, 18);
  // All escorts receive an autonomous movement decision. Only the melee
  // frontline must advance directly: Rangers may fall back to preserve their
  // standoff distance behind the screen, rather than blindly charging.
  for (const team of ['blue', 'red']) {
    const forward = team === 'blue' ? 1 : -1;
    const fighters = director.units.filter(u => u.team === team);
    const frontline = fighters.filter(u => u.role !== 'ranger');
    const rangers = fighters.filter(u => u.role === 'ranger');
    assert.equal(frontline.length, 6);
    assert.equal(rangers.length, 3);
    assert.ok(frontline.every(u => forward * (u.x - initial.get(u.id)) > 0),
      team + ' melee escorts must advance to engage');
    assert.ok(rangers.every(u => Number.isFinite(u.x) && u.x >= 50 && u.x <= 1230),
      team + ' ranged escorts must remain inside the playable arena');
    for (const fighter of fighters) {
      const action = moved.find(a => a.id === fighter.id);
      assert.equal(action.x, fighter.x);
      assert.ok(Number.isFinite(action.y));
    }
  }
});
test('casualty stops acting and makes a roster slot available', () => {
  const director = battlefield();
  assert.equal(director.add('blue', 200), null);
  const casualty = director.units.find(u => u.team === 'blue');
  const hit = director.wound(casualty.id, casualty.hp);
  assert.equal(hit.ko, true);
  assert.equal(director.wound(casualty.id, 99).applied, 0);
  const replacement = director.add('blue', 200, { role: 'sentinel' });
  assert.ok(replacement);
  const actions = director.update(1000, 100, champions());
  assert.ok(!actions.some(a => a.id === casualty.id));
  assert.ok(actions.some(a => a.id === replacement.id));
  assert.equal(director.units.filter(u => u.team === 'blue' && u.hp > 0).length, 9);
});
test('surviving escorts continue fighting after their champion is eliminated', () => {
  const director = battlefield();
  const state = champions();
  state.blue.hp = 0;
  director.command('blue', 'guard');
  const positions = director.units.filter(u => u.team === 'blue').map(u => u.x);
  director.update(1000, 200, state);
  const blue = director.units.filter(u => u.team === 'blue');
  assert.ok(blue.some((u, i) => u.x > positions[i]));
  assert.equal(director.orders.blue, 'guard');
});

test('multiple wounded escorts continue to engage after their champion falls',()=>{
 const director=new CompanionDirector({maxPerTeam:3});
 const first=director.add('blue',200,{role:'vanguard'});
 const second=director.add('blue',210,{role:'vanguard'});
 director.add('red',250,{role:'vanguard'});
 director.wound(first.id,70);
 director.wound(second.id,70);
 director.command('blue','guard');
 const fallenCaptains={
  blue:{team:'blue',x:180,y:590,hp:0},
  red:{team:'red',x:1100,y:590,hp:0}
 };
 const actions=director.update(1000,100,fallenCaptains);
 assert.ok(director.units.find(u=>u.id===first.id).x>200,
  'injured survivor must advance instead of infinitely retreating');
 assert.ok(director.units.find(u=>u.id===second.id).x>210,
  'second injured survivor must join last-stand combat');
 assert.ok(actions.some(a=>a.type==='attack'&&a.id===first.id));
 assert.ok(actions.some(a=>a.type==='attack'&&a.id===second.id));
 assert.equal(director.orders.blue,'guard',
  'emergency Hunt is runtime behavior, not permanent player-order mutation');
});

test('wounded escorts can still withdraw while their captain is alive',()=>{
 const director=new CompanionDirector();
 const unit=director.add('blue',200,{role:'vanguard'});
 director.add('red',250,{role:'vanguard'});
 director.wound(unit.id,70);
 director.command('blue','hunt');
 const captains={
  blue:{team:'blue',x:180,y:590,hp:100},
  red:{team:'red',x:1100,y:590,hp:100}
 };
 const actions=director.update(1000,100,captains);
 assert.ok(director.units.find(u=>u.id===unit.id).x<200,
  'critical-HP fighter should withdraw if their captain can cover retreat');
 assert.equal(actions.some(a=>a.type==='attack'&&a.id===unit.id),false);
});
