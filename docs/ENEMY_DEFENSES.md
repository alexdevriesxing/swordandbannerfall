# Enemy fortifications — Iron Citadel tactical encounter

## Purpose
The red team is not a passive target in the twelve-second preparation stage. Its autonomous commander spends the **same supply budget** as the player, places paid defenses in its own territory, and reinforces positions only after supply has been earned in battle. It has no hidden free traps, infinite reserves, instant map-wide strikes, or control over the blue player.

## Authored defense plan

| Stage | Defense | X coordinate | Cost | Purpose |
| --- | --- | ---: | ---: | --- |
| Preparation | Turret | 940 | 45 | Cover the eastern approach as soon as its ballistic sightline opens |
| Preparation | Shield | 1080 | 35 | Guard the red champion and rear vanguards from damage |
| Battle, earliest 6 seconds after launch | Trap | 775 | 25 | Punish a ground-level advance through the broken eastern choke |
| Battle, later reinforcement | Turret | 1175 | 45 | Reinforce the rear if enough supply is earned |

Starting red supply is 100. The first two defenses consume 80, leaving 20. Later reinforcements are **not** free: a trap requires earned supply to reach at least 25. The fighting-stage director adds an 8-second cooldown between paid construction events and refuses placement within 80 horizontal units of any living blue champion or escort. It cannot create defenses on an already occupied position.

This plan is intentionally **simple but competitive**. Defenses are based on the authored Iron Citadel geometry and approved `defenses/turret.png`, `defenses/shield.png`, `defenses/trap.png` images; red placement uses a tint on the same real textures for rapid recognition, not synthetic art.

## Full-team combat

Red turrets and traps target the nearest living **blue champion or autonomous companion** within their range. They work after the champion dies, and their damage uses the existing shields, Sentinel interception, champion guard, casualty supply, and comeback-card consequences.

The vertical rules matter: a **ground trap** may detonate only against an opponent standing within 60 vertical game units of the ground combat lane (Y=590). It never damages a fighter safe on a Y=445 gantry just because their X coordinates align. A turret starts firing from its authored muzzle elevation (Y=560) and uses `shotObstruction` to verify a projectile can travel to the target without hitting intact barricades. A raised target may be fired upon **over** an intact ground barrier when the calculated ray clears the barrier.

Spent traps and depleted shields are removed from the Phaser scene. Turrets, shields and traps count against the paid resource budget for both sides. A full battle can end only when a complete ten-person team has been eliminated; defenses cannot resurrect dead fighters.

## Code, tests and browser acceptance

- Pure strategy and constraints: `src/systems/enemy-defenses.js`.
- Shared defender targeting, altitude and cover: `src/systems/tactics.js`.
- Actual graphics, symmetric blue/red attack dispatch, and defense cleanup: `src/main.js`.
- Tests: `tests/enemy-defenses.test.js`, `tests/tactics.test.js`.
- Asset-gated Chromium browser QA now checks initial red turret + shield, red supply of 20, and both defensive positions resetting on replay.

**QA boundary:** GitHub Node/Vite CI proves rules and bundled source, not the completed artwork, combat feel, online checkout, installed Windows game or real browser physics. The browser acceptance runner must remain disabled until all 12 original assets and truthful licensing approvals are present. The current only delivered genuine art asset is the official studio logo.
