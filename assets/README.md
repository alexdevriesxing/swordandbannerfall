# Production asset contract

The game **must not ship with geometric stand-ins or programmer artwork**. Place licensed, cleared final art at these exact paths inside public/assets/ (Vite serves that folder from /assets):

- arena/iron-citadel.webp — full HD painted battlefield background (16:9).
- arena/citadel-ground.webp — seamless battleground foreground.
- fighters/knight.png — transparent facing-right blue champion.
- fighters/raider.png — transparent facing-left red champion.
- fx/projectile.png — transparent glowing ranged projectile.
- fx/slash.png — transparent melee arc.
- branding/fire-dragon-interactive.png — official Fire Dragon Interactive logo.
- defenses/trap.png — finished transparent trap artwork.
- defenses/turret.png — finished transparent turret artwork.
- defenses/shield.png — finished transparent shield artwork.

The bootstrap deliberately stops and displays an asset-error message if any file is absent. No placeholder assets are committed. All third-party art needs a license record, source, author, and rights confirmation. Visual polish, animation atlases, SFX and effects are not complete until approved assets are integrated.

- arena/destructible-barricade.png — approved transparent barricade sprite used for authored destructible segments.

- arena/iron-citadel-gantry.png — original licensed painted Iron Citadel elevated gantry art, transparent PNG; the renderer scales it to two authored 240 × 24 scene dimensions and creates an invisible Arcade static body of identical size. Do not stage a placeholder image or mark unapproved art as licensed.

## Verified original studio branding (2026-10-25)

**Imported and committed:** `public/assets/branding/fire-dragon-interactive.png`, the exact 682 × 1024 source PNG from `www.firedragoninteractive.com/assets/fire-dragon-logo.png`. Its SHA-1 Git blob identity was cryptographically checked against the original file in `alexdevriesxing/Firedragoninteractive` at commit `00d82120238aeef3b65717143ec5da05eb5a524b`. Source URL, SHA-256 and original dimensions are in `assets/branding-provenance.json`.

The finished logo appears in the Iron Citadel HUD and victory presentation. The importer is reproducible with `npm run assets:import-branding` and refuses a different or corrupted image. This provenance record is not a licence grant; the project owner must confirm branding and other art usage rights in `assets/licenses.json`.

**Still outstanding:** the other 11 required scene, character, effects and defense textures. Do not borrow assets from unrelated games or create placeholder polygons to pass a gate. `npm run check:assets` now verifies complete PNG chunk structure and CRC, WebP container metadata and image dimensions before accepting deliveries; artistic quality, transparent edges, coherent sprite proportions and licensing still require manual sign-off.
