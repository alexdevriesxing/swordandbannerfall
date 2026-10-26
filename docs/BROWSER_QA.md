# Browser gameplay acceptance — Iron Citadel

## Gates before browser QA

The live Phaser game refuses to start without its mandatory original production artwork. The browser test **never** supplies stand-in art, fabricated PNGs or shape textures. Do not run the browser workflow until `npm run check:release` passes, including its complete `public/assets/` inventory and `assets/licenses.json` ownership/permission approvals.

At the time this test was authored, the **only delivered image** was the exact, pinned Fire Dragon Interactive logo (`public/assets/branding/fire-dragon-interactive.png`). The 11 additional original art files listed in `assets/README.md` are required. A successful JS build or informational `check:assets` workflow step does not mean art is present.

## Running a real-browser playthrough

1. Commit all original licensed source art to `public/assets/`, at the exact documented paths and required minimum sizes.
2. Approve every asset in the rights register using true creator/source/license metadata, never dummy or fabricated rights.
3. From the GitHub repository, open **Actions → Full Chromium gameplay and replay QA → Run workflow**. This is a manual release-quality gate, separate from the always-on Node/Vite CI.
4. The workflow runs `npm run check:release`, all Node combat tests and the real production build before launching Chromium against the built Vite preview on loopback.
5. If the asset gate is clear, `scripts/browser-smoke.mjs` drives **real** keyboard input without directly mutating player or enemy HP, allowing the battle to end through the game's own combat logic. It checks the complete 20-unit roster, Enter-to-start, A/D movement, Space jumping, terminal victory, casualty accounting and Enter-to-replay.
6. The workflow uploads setup, combat, victory and replay screenshots, or a failure screenshot, in the `iron-citadel-browser-qa` artifact (14-day retention). Inspect these manually before calling the game playable or ready for release.

For local acceptance, run `npm install`, `npm run check:release`, `npm run build`, `npm install --no-save playwright@1.55.0`, `npx playwright install chromium`, start `npm run preview -- --host 127.0.0.1`, then run `node scripts/browser-smoke.mjs` in a separate shell.

## Security and limitations

The game exposes a read-only diagnostic snapshot only on `localhost` or `127.0.0.1` when the explicit `?qa=1` flag is present. The QA hook cannot force a win, spawn fighters, change supplies or grant damage.

This automated smoke does **not** sign off the final art direction, retinue readability, game feel, musical mix, accessibility, framerate on low-end hardware, or Windows installers. Those still need dedicated human QA before sales via Snack Break Games. The smoke is intentionally strict: a stalled battle, missing physics input or replay failure should fail rather than silently be marked as a pass.

## Comeback-card acceptance extension
When real match casualties generate a blue-team card choice, the browser smoke now presses **1** using Playwright's real keyboard events. The read-only local QA snapshot must report an increased selected-card count; the test never injects fake casualties or edits match state. The smoke then continues to natural victory and verifies that **Enter-to-replay resets** both selected and unlocked comeback rewards. A match that happens to produce no friendly casualties does not claim that card input was exercised: the JSON test output reports the observed `cardsChosen` total. Dedicated manual testing should provoke losses through actual gameplay to inspect all six original illustrated cards once art is delivered.

## Original generated artwork import note

The game's 18 required artwork slots include the six illustrated comeback card files. The original generated pack has been created, reviewed for basic export quality and source-locked, but its 17 binary images are still distributed as an artifact from the originating ChatGPT conversation. Follow `docs/ART_PACK_IMPORT.md` to install the exact checked assets before running the real-browser test. The pre-existing official studio logo stays untouched. The browser test must inspect crop transparency, static character poses and card readability at the intended display size before promoting generated art to commercial production.

## Extended keyboard, defense-economy and replay checks (October 2026)

The real Chromium acceptance flow now covers more than passive survival. During setup it presses **G** to buy a blue-team turret from the 100-supply budget, checks the 45-supply debit and confirms that attempting a second turret in the identical location cannot spend an additional 45. The opening screenshot is retained; a separate `01b-player-turret.png` captures the purchased defense on the actual arena.

After starting the fight it presses **E** and observes the real squad order change from Guard to Patrol through the loopback-only read-only snapshot. It holds **L** to verify Guard stance and releases it to confirm a return to Attack stance. The browser still tests player movement, jumping, a natural complete 10v10 battle, real comeback-card input when casualties make one available, casualty accounting and victory replay without injecting HP or simulating a win.

Finally, the replay snapshot must show a new 10v10 roster, restored player and enemy supply, no leftover purchased blue defenses, a reset blue squad command and default Attack stance. This catches incomplete `scene.restart()` cleanup that a win-only smoke would miss.

**Scope:** The standard `npm test` / Vite build CI verifies parsing of this browser script but does not execute Chromium. The manual `Full Chromium gameplay and replay QA` workflow runs these assertions only after all 18 authentic artwork files and their approved rights records pass the hard production-art gate. Green code CI must never be reported as a completed visual playthrough.

## Escape pause and resume QA

During preparation or an active match, **Escape** opens a text-only Pause menu above the rendered battlefield. The Arena Scene is paused (not restarted), freezing its update, Arcade physics, scene-clock events, enemy decisions and active demo countdown. Escape from Pause Menu resumes the same encounter. The input handler deliberately consumes the resume key transition to avoid immediately reopening the menu. Once a match or time-limited demo has ended, pause cannot bypass its completion screen.

Both real Chromium acceptance scripts now test an Escape pause during preparation and during combat, check that elapsed preparation time or the demo countdown stops, and verify the champion's physical X/Y coordinates stay unchanged while frozen. The loopback-only read-only QA snapshot reports `paused` and `preparationElapsedMs`; it provides no method to manipulate game state or advance time.

These remain **pending real-browser checks** until the 17 original artwork files are committed to `public/assets/` and the strict rights/checksum release preflight passes. Node and Vite CI alone cannot demonstrate functioning pause input in the rendered game.
