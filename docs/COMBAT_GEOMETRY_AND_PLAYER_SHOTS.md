# Combat geometry, ranged action and full-map regression — 28 October 2026

**Status:** Engineering verification only. Commercial release is blocked by the
mandatory original-art and visual acceptance gates.

## Physical melee target selection

Champion melee, Vanguard Cleave splash and autonomous delayed attacks must
not damage a combatant through the authored Iron Citadel gantry slabs.
Candidate evaluation uses the same `sweptGantryContact` segment-to-AABB
intersection as travelling projectiles. The 24-pixel stone walkways are
authoritative geometry and cannot be ignored because the source/target
centres happen to be within the broader 65-pixel melee elevation envelope.

- Champion melee uses `nearestOpponent(...,{gantries,attackMode:'melee'})`.
- Vanguard Cleave uses `cleaveSplashTargets(...,{gantries})` to reject
  physically blocked extra victims.
- Ranged **player aim selection** intentionally does not reject the platform.
  The player can press fire, see an authentic projectile sprite, and watch
  the stone intercept it during flight; no hit or KO is awarded.
- Allied and enemy autonomous ranged attacks do reject obstructed trajectories
  before committing attack cooldowns, and windups revalidate on release.

## Champion free fire

Pressing the champion shooting key in combat must launch a genuine travelling
projectile even when no living opponent or close barricade is within
auto-target acquisition range. The shot travels in the direction supplied by
the opposing champion's last position (or another explicit look point).
It carries `targetId:null` and does not automatically award a hit or damage
terrain. Only first physical projectile contact can damage a fighter or
barricade. Both blue and red controls use this same function.

Validated invalid inputs (missing look point, invalid opponent ownership,
dead targets, malformed geometry) still reject the shot. Collision with
friendlies, opponents, destructible cover and raised terrain is decided later
by the existing battle projectile resolver. Bolts are retired by the existing
1900ms active-shot lifetime.

## Full-map model testing

`tests/autonomous-match.test.js` provides a renderer-free 10v10 simulator
using the same companion AI, routing, ranged shot planners, projectile
interception and physics descriptions as the live scene. An optional
`withGantries` scenario adds:

- `IRON_CITADEL_NODES` and `IRON_CITADEL_LINKS` authored walk/jump routes.
- One correctly elevated escort on each faction's home gantry.
- Real wall and stone-slab projectile collision.
- Real ranged obstruction checks and delayed attack validation.
- Invariant checks for finished match, winner, ten original units per side,
  zero duplicate KOs and bounded simulation frames.
- Multiple seeded starting formations and a seeded early loss of the blue
  champion to prove autonomy continues after player elimination.

These are **not Chromium tests** and cannot validate sprites, alpha clipping,
tween feel, gamepad input, audio, camera readability or Windows behavior.

## Release acceptance remains strict

The repo still needs the 17 individually approved original textures, correctly
authored character animations, commercial-quality music and sound effects,
real Chromium setup/combat/demo/replay QA, Windows 10/11 installer QA and
checkout/fulfillment verification. A successful `npm test`, Vite production
build or demo build never overrides `npm run check:release`. No procedural
art or paid generation service is authorized.
