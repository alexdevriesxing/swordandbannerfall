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
