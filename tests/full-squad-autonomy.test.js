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
