# Iron Citadel — defense elevation and friendly-fire rules

This document records the actual gameplay contract implemented in the Phaser 4
scene and independent combat systems. It is not an art approval or a commercial
release certification.

## Ground defense footprint

Defenses are constructed on the **ground lane**. A shield has a horizontal
radius of **125 world units** and an inclusive vertical reach of **85 world
units** from the ground fighter center (`y=590`). This protects nearby floor
combatants and modest jumps. An escort on the authored gantries at `y=445`
is **not** protected by an emitter stationed on the floor.

Ward absorption is applied before Sentinel interception and fighter damage;
multiple overlapping wards drain in nearest-to-fighter order with stable ID
ties. A fully shielded attack does not consume a Sentinel interception charge.
Ward charge never decreases for a target outside its vertical or horizontal
footprint.

## Other defenses

A pressure trap affects only targets near the ground (up to 60 pixels from the
ground fighter center) and is consumed only when a live hostile target
triggers it. Turrets respect cover and the authored 24px stone gantry geometry
before consuming their firing cooldown; their travelling bolts may still
physically collide with another hostile or an intervening barricade.

Whenever the target roster includes explicit team tags, both turret and trap
selection reject same-team fighters. Teamless candidates remain supported by
legacy headless tests that supply only horizontal coordinates.

The enemy defense planner avoids constructing a defense directly beneath a
living ground fighter. A target on an upper gantry does not occupy the floor
construction footprint; a fighter close to the floor still blocks it.

## Tests and scene integration

The champion and escort damage paths both use
`protectedCompanionDamage`, which passes real target elevation to the
shield calculator. The headless 10v10 simulator uses the same rule.

The verified test coverage is in:

- `tests/shield-elevation.test.js` — ground and gantry shielding,
  boundaries, both teams, stacked wards, Sentinel interaction, actual
  elimination accounting.
- `tests/stacked-shields.test.js` — overlap ordering and charge spillover.
- `tests/sentinel-elevation.test.js` — same-lane bodyguard protection.
- `tests/tactics.test.js` — turret/trap targeting, cooldowns, and friendly-fire
  protection on mixed rosters.
- `tests/enemy-defenses.test.js` — floor-safe AI placement.
- `tests/autonomous-match.test.js` — match-model elimination and damage.

## Art and commercial status

The original 17 texture exports are still absent from the repository.
Code and data-only tests do **not** validate visual ward radius, blast
feedback, fighting animations, source rights, final audio or Windows
installer behavior. The strict production-art gate must continue to fail
until independently reviewed originals and their new source/hashes are
present and the actual Chromium/Windows QA is successful. No free procedural
stand-ins are authorized as game artwork.
