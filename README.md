# Sword & Bannerfall
**Fire Dragon Interactive** | Phaser 4.2.1 | Early playable engineering slice

A ten-round, side-scrolling combat game combining fantasy, sci-fi, and modern warfare; the engineering foundation includes melee, ranged attacks, guard stance, enemy pursuit and attacks, deterministic match flow, defeat-triggered upgrade cards, a retinue-command state machine, ten-person reserve rosters, tactical supply, and deployable traps, turrets, and shields.

## Setup
```bash
npm install
npm run dev
npm run build
```

**Required before playable visual build:** Install cleared production artwork per [asset contract](assets/README.md). Intentionally no placeholder shapes or mock art. Current UI includes non-final developer diagnostics.

### Controls
A/D movement; Space jump; J slash; K shoot; hold L block; E cycles retinue command; F deploy trap; G deploy turret; H deploy shield; 1/2/3 card selection after defeat.

### Current limitations
Companions are spawned as autonomous AI actors (two per side), and automatically move, select targets, attack, and retreat when seriously wounded. Squad commands influence their behavior. Ten-person rosters track sequential losses; the scene currently renders one active combatant per team, and match flow still has a ten-duel cap. Ground combat uses bounds, not authored collision shapes. Destructible terrain, fully animated deployable defenses, 2-player controls, simultaneous 10 fighters per side, licensed art, VFX/SFX, Windows installer, demo time gating, commerce integration and Snack Break Games listing are **not implemented**. This is not a production-ready release.

### Brand and release
Intended launch: $1.99 DRM-free download via Snack Break Games with a time-limited HTML5 demo and licensed Fire Dragon Interactive branding. Commerce and distribution are deliberately deferred until the game is complete.

### Build verification
GitHub Actions runs Node unit tests and the Vite production build on pushes and pull requests. CI status should be checked in GitHub Actions; committing a workflow does not prove it passed. Defense art is a mandatory prerequisite for visual scene bootstrap.

### Autonomous companions
Two companion AI units per team currently appear using the required fighter artwork. They act without direct player input. E cycles guard, patrol, and hunt for the allied squad; enemy units use hunt automatically. Companion AI supports nearest-target selection, cooldown attacks, guard positioning, lane patrol, pursuit, and low-health retreat. The companion subsystem is validated by separate Node unit tests. Companion respawn, stronger decision-making, original companion artwork, detailed animation and advanced navigation are future work.

### AI tactical roles (current milestone)
CompanionDirector now supports three independently acting roles: **Vanguard** (frontline melee), **Ranger** (long-range damage with rear formation spacing), and **Sentinel** (durable close protection). Threat scoring favors enemies near the champion, while rangers prefer vulnerable hostile companions when practical. All AI units autonomously navigate toward order-dependent formation goals, select targets, respect attack cooldowns and retreat at critical health. The Phaser scene assigns these roles to existing companion sprites; dedicated role-specific artwork, projectile feedback, animations and formation avoidance are still missing. Run `npm test` for behavioral tests. These commits have not been confirmed by a completed GitHub Actions run.

### Expanded AI battlefield pass
The scene now spawns four autonomous companions on each side (eight total). Squad roles remain sentinel, ranger, and vanguard. `BattlefieldCover` introduces authored destructible barricades with health, projectile obstruction and AI stop-short navigation. The battlefield uses a licensed barricade asset loaded from `public/assets/arena/destructible-barricade.png`, and stops loading if that art is not supplied. The unit tests include squad limits and cover-blocked pursuits. This is **not** full obstacle pathfinding or physics-based terrain destruction: units do not yet jump over or route around cover, and the two authored barricades share one art texture. Existing combat presentation remains an engineering slice and requires production artwork and successful CI confirmation before a playable release claim.

### Preparation stage
At the start of each duel the arena allows twelve seconds to position available traps, turrets and shields, or Enter to begin immediately. All allied companions remain computer-controlled. This remains a prototype: navigation and team tactics need more development, licensed art still needs to be added, and CI results are not independently confirmed.

### Coordinated assault AI
The squad coordinator now chooses a shared target for each side and re-evaluates periodically. Guard units may independently break focus to protect a nearby champion; Hunt units pursue shared targets and attack blocking destructible cover until the route opens. All behavior is autonomous and requires no per-unit player controls. Pure-model tests cover shared target persistence, champion protection and cover breaches. This is a first iteration, not full pathfinding or synchronized tactical maneuvers. Build verification is still pending.

### 10-per-side population milestone
The arena now creates **nine autonomous AI companions and one primary champion per team** (20 visible combatants, subject to all required art being supplied). Three companion roles are distributed across each faction. The overlay reports remaining living AI companions. New model tests cover the nine-companion capacity and exclusion of fallen units from updates. **Not yet a complete 10-elimination match:** the older duel/round score model still independently tracks ten champion knockouts; fallen companions are not currently reconciled with the tactical ten-slot roster, and companion respawns/physics collision are not implemented. The next integration step is unifying individual squad casualties with victory and defeat conditions. No claim is made that CI or visual QA passed.

### Unified elimination win condition
`EliminationMatch` registers one primary champion and nine AI companions per side, counts individual casualties once and ends the match when one faction has no surviving fighters. The current scene invokes that controller on champion and companion defeats. The earlier `CombatDirector` remains for health/cards and retains legacy round methods; its inter-round lifecycle is not yet integrated with the new single-match flow. The game still requires final art, balanced combat, comprehensive visual testing and successful CI. The surviving companion AI currently uses lateral image positioning rather than fully authored skeletal animation or individual physics bodies.

### Role abilities and match cleanup (October 2026)
The active arena no longer invokes the obsolete ten-duel round/card transition methods. The single ten-versus-ten elimination controller remains the match authority. AI companions automatically activate cooldown-based Vanguard cleave and Ranger precision attacks; nearby Sentinel allies can periodically reduce incoming damage by 40%. These mechanics have deterministic unit tests. The older standalone CombatDirector still contains legacy methods for compatibility with historical tests but those methods are not used by the scene. This is still an unverified engineering build pending CI, licensed production art, combat balance and browser smoke testing.

### Combat readability and anti-stalemate pass
The arena displays a bounded combat event feed for champion damage, fighter eliminations, destroyed barricades and match victory. A deterministic battle-pacing controller temporarily increases autonomous movement and enemy pursuit speed after an extended interval without meaningful damage; a successful hit resets the timer. This does **not** add procedural art or substitute for combat animations. The new model has unit tests, but the browser build and licensed artwork integration still require verification.

### Readability pass — health labels, hit responses, special windups
The arena now shows numeric health indicators above active AI companions, fades champion sprites and applies a restrained camera reaction after damage, and announces special ability attacks with a short deferred impact window. Pending special attacks are cancelled when the attacker or intended target is eliminated. These effects use Phaser text and sprite properties rather than procedurally generated character art. The telegraph timing, cancellation, capacity limit and health label formatting are unit-tested. Full battle testing, production textures, animated role effects, sound integration, and accessibility tuning remain outstanding.

### Impact-time reliability pass
Delayed special attacks now revalidate that the attacker and target are alive, opposing, in range, and unobstructed when damage is due. Stale AI actions from fighters eliminated earlier in the same frame are skipped. Pure-model regression tests cover these cases. Browser smoke tests and full CI verification are still pending; the production artwork contract remains unchanged.

### Champion target selection pass
The champion combat controls now select living enemy AI companions as valid melee/ranged targets, not only the opposing champion. Companion casualties update the same match ledger, remove their sprites and health labels, and can end the match. A pure targeting module with regression tests excludes allies, dead enemies, out-of-range opponents and targets behind cover. Companion-target ranged attacks currently apply damage immediately (no separate projectile animation) and require final VFX/physics integration. Direct local build execution was unavailable due to networking restrictions; repository commits alone do not prove CI or gameplay success.

### Match lifecycle regression pass
The repository includes `tests/match-lifecycle.test.js`, covering a complete 10v10 elimination scenario from preparation through final victory, duplicate-KO protection, fighting companions after the enemy champion falls, and target selection after barricade destruction. The arena's selected champion melee target and slash direction were corrected. This is a model-level regression harness, **not a verified Phaser browser playthrough**. Production artwork and end-to-end rendering validation remain blockers to release.

### Production release gates
Run `npm test` and `npm run build` for code verification, then `npm run check:assets` to check all eleven required PNG/WebP assets exist and have correct file signatures. GitHub Actions reports the asset gate as an informational step until final licensed artwork is staged; a green code build **does not** mean the game is ready to ship. The asset gate verifies file signatures only, not art quality, animation completeness, or licensing. A written source/author/rights register and actual browser playtesting remain mandatory before any Windows installer or paid HTML5 release. Phaser 4.2.1 is an official npm version.

### Projectile reliability correction
Phaser overlap callback now treats the projectile as the first colliding object and the champion as the second. A separately tested pure guard rejects friendly fire, inactive objects, and missing team metadata. The corrected code is committed, but a browser verification and CI test result have not yet been obtained.
