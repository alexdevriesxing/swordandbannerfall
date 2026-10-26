# Sword & Bannerfall — Release Acceptance and Blocker Register

**Status:** Development build / not approved for sale.  
**Game:** Phaser 4, 10v10 elimination, nine AI escorts per champion, VS AI or local 2P.  
**Distribution target:** one-click Windows installer and a separate four-minute HTML5 demo via Snack Break Games.

## 1. Never confuse build success with finished-game approval

The ordinary push CI pipeline (`.github/workflows/ci.yml`) tests gameplay logic and builds the Vite production and demo bundles. It intentionally performs its production-asset inventory check as **informational**. Therefore a green push build **does not** prove that the browser scene can load, that licensed art is present, or that the Windows product is ready.

The asset checksum and license gate (`npm run check:release`) is **mandatory** for browser gameplay QA, demo QA and Windows NSIS packaging. Never weaken this check, generate stand-in art, edit SHA hashes to match new files, or declare artwork approved without the actual reviewed originals.

## 2. Hard blocker: install the approved original artwork

The source-verified ZIP named `Sword_Bannerfall_Original_Art_Pack_v1.zip` contains **17 original game textures**: 11 battlefield/fighter/defense/FX textures and six illustrated comeback cards. The genuine Fire Dragon Interactive logo is the eighteenth required texture and is already in GitHub.

The ZIP was created in the originating project conversation but its binaries are not in the repository. The checksum manifest and licensing register **cannot recreate** those images. To install without a local checkout:

1. Download the exact original ZIP, not a re-export or substitute.
2. Attach it in a new comment on [GitHub Issue #1](https://github.com/alexdevriesxing/swordandbannerfall/issues/1), using the repository-owner account.
3. The `Import owner-approved generated artwork` GitHub Action must verify the original three source-sheet SHA-256 hashes and all 17 exported texture hashes, run the strict checks, and commit only approved files.
4. Confirm `public/assets/arena/`, `fighters/`, `fx/`, `defenses/` and `cards/` are populated and `npm run check:release` passes.

Alternative local path and exact naming are in `docs/ART_PACK_IMPORT.md` and `scripts/install-art-pack.py`. Do not use the standalone concept sprite sheets in place of the checksum-locked pack.

## 3. Verify the real 10v10 browser match

After art import, dispatch the **Full Chromium gameplay and replay QA** workflow (`browser-gameplay.yml`). Inspect its screenshots and test logs, not just the overall workflow result.

Required observable results:

- All 20 fighters and original terrain textures load; both barricades have corresponding physical colliders.
- Blue and red defenses are visible, cost real supply, and reject invalid duplicate placements.
- Pause freezes physics and time; resume restores input without immediately pausing again.
- Blue champion movement, jumping, guard, squad-order switching, real travelling ranged bullets and melee all work.
- Physical bullets strike the first hostile fighter or barricade along the swept path, regardless of a more distant selected target; teammates do not receive friendly-fire damage.
- Nine allies per side act autonomously after setup, and they continue fighting if their champion dies.
- Cards are offered for genuine friendly casualties and consumed only by genuine selections.
- An unassisted battle ends with exactly ten original roster entries accounted for per faction, no duplicate eliminations, and physically removed destroyed cover.
- The victory screen freezes state; Enter restarts fresh rosters, defenses, supply, card offers and active Arcade physics.
- The separate local-two-human test confirms fair red setup economy, red movement/jump/guard/orders and red champion projectiles.

Browser scripts: `scripts/browser-smoke.mjs` and `scripts/browser-local-2p-smoke.mjs`. Their QA snapshot interface is read-only, loopback-only and enabled only with `?qa=1`.

## 4. HTML5 demo acceptance

Dispatch **Real Chromium limited-demo acceptance** (`browser-demo.yml`). Confirm:

- A separate `vite build --mode demo` output, not the unrestricted commercial build.
- A single 10v10 match; 240,000 ms of **active combat** as the maximum session.
- The demo clock never consumes time during setup or pause and cannot be reset for a second match.
- Demo conclusion is a real match victory or genuine combat-time expiry.
- The post-demo call to action links to the genuine Snack Break Games website.
- Asset and rights checks pass **before** demo acceptance. Do not present the time cap as secure payment enforcement.

## 5. Finish commercial presentation

A mechanically complete headless or JavaScript-tested game is not commercially finished. Before release, review and finish:

- **Visual consistency:** transparency edges, true proportions, collider-to-paint alignment, all roles readable amid twenty fighters, arena contrast and UI legibility at 1280×720.
- **Character animations:** authored idle/run/jump/guard/hit/melee/ranged/KO animations. Static battle poses are *not* final character animation.
- **Original audio:** production sound effects for weapons, hits, blocks, losses, card choices, victory and defeat; properly licensed/approved background music. No stock placeholders or synthetic default beeps.
- **Battle feel:** unassisted 10v10 pacing, no insurmountable AI stalemates, readable card offers, fair VS AI and local 2P, keyboard and gamepad comfort.
- **Performance:** long-match memory behavior, bullet collision cost, pause/resume/replay stability and absence of browser-console exceptions.

## 6. Windows installer acceptance

Only after art, sound, animation and Chromium QA are approved, dispatch **Windows NSIS installer — licensed art required** (`windows-installer.yml`). The resulting `Sword-Bannerfall-Windows-QA-Installer` is **a QA artifact**, not an automatic public release.

On a clean Windows 10/11 PC, manually verify one-click install, first launch, complete match, local 2P, pause/replay, gamepad, offline texture/audio loading, clean uninstall, shortcut creation, no external navigation or unsafe Node access. Check code signing and SmartScreen behavior separately; a build does not prove signature or trust.

Only then configure the $1.99 Creem checkout and Windows download on [snackbreakgames.com](https://www.snackbreakgames.com/) and verify that the paid installer is **not** publicly linked as a free demo. No purchase endpoint or order fulfillment should be described as live until tested.

## 7. Current engineering baseline

The repository contains a full-match headless 10v10 smoke harness, deterministic seed coverage, role-AI movement, barricade physics, projectile interception, comeback drafts, control-mode selection, match victory and replay. The first-hostile / first-cover projectile resolver lives in `src/systems/battle-projectiles.js`; the actual Phaser scene uses it in `src/main.js`. The Chromium scripts additionally require visible champion projectile flight in both control modes.

**Remaining hard blockers:** import the 17 original art files; actual browser and Windows QA; final authored character animation and production music/SFX; store checkout and installer delivery verification. Do not publish before they are resolved.
