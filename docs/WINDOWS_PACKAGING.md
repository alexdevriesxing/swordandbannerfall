# Sword & Bannerfall — Windows installer and release procedure

## Architecture

One **offline, DRM-free Windows x64 application**, built from the same Phaser 4/Vite gameplay sources as the web demo. The native shell uses Electron 45; the one-click installer uses NSIS via electron-builder 26.15.3. The game opens local `dist/index.html` with relative `./assets/` URLs. It does not require a server, player account, Cloudflare D1 queries, remote fonts or a Creem API request to play. The Windows renderer runs with Node integration off, context isolation on, sandbox on and external network requests/navigation blocked.

The installer icon is derived only from the original Fire Dragon Interactive source PNG already committed to `public/assets/branding/fire-dragon-interactive.png` and cryptographically identified in `assets/branding-provenance.json`. It is processed into `build/icon.ico` locally during packaging with Pillow; generated logo substitutes are forbidden.

## Build/QA workflow

There are three distinct release gates:

1. **Routine code CI** — every push runs the complete Node combat tests, the Vite build, and `npm run check:offline-bundle`. This checks compiled entrypoint paths are compatible with opening `file://` URLs and that the real studio logo is copied into the build. The missing-art gate remains **informational here** and must not be mistaken for release approval.
2. **Real browser gameplay acceptance** — manual GitHub Actions workflow `Full Chromium gameplay and replay QA`. This refuses to start until `npm run check:release` succeeds with *all 12 final assets* and truthful licensing approvals. It drives the real game from preparation through unassisted victory and replay, attaching screenshots for review.
3. **Windows installer packaging** — manual GitHub Actions workflow `Windows NSIS installer — licensed art required`. It also runs the strict asset and licensing gate, then the full tests and build, verifies the offline bundle, generates an original-brand ICO and packages a one-click x64 NSIS `.exe`. The EXE is uploaded as a private QA artifact, **not published to players**.

Developers with final approved assets may also run:

```powershell
npm install
npm run check:release
npm run build:windows
```

Local Windows packaging requires Python 3 and `Pillow==11.3.0`. The installer build script independently rechecks artwork and all Node tests and will not silently build a commercial-looking app from missing textures.

## Licensing and asset requirement

The current production asset inventory contains the original Fire Dragon Interactive logo. The other 11 genuine drawn scene, fighter, defense and effects textures are not delivered. Until these arrive, `npm run check:release` must remain **red**, the browser game intentionally refuses to render the arena, and the Windows workflow must refuse to create an EXE.

The rights register `assets/licenses.json` is also still missing. It must be completed by someone authorized to approve the original assets. Source provenance alone does not represent a license or transfer of IP rights.

## Windows human QA before commercial release

Once the artwork and rights gates pass, verify the exact NSIS installer on clean Windows 11 machines:

- Install with standard user permissions, create/review Start Menu and desktop shortcuts, and launch without administrator rights.
- Run the full battle including preparation defenses, all 20 combatants, 1v1 and ranged hitboxes, gantry jumping and drops, team wipe/victory and Enter-to-replay. Repeat on another machine.
- Test offline by disabling Wi-Fi/Ethernet completely before launch and play; no dependency on www.snackbreakgames.com or external services is acceptable.
- Ensure player saves/options work without writing into Program Files; no such persistence is implemented yet, so do not claim it is complete.
- Uninstall via Windows Apps and verify shortcuts are removed. Confirm that neither the app nor installer is flagged by a security scanner.
- Verify icon appearance across Windows sizes, correct high-DPI scaling, gamepad/keyboard accessibility, audio balance, screen-size handling, performance and stability.
- For paid distribution, obtain an appropriate Windows Authenticode signing certificate and configure `WINDOWS_CSC_LINK` and `WINDOWS_CSC_KEY_PASSWORD` secrets. A successful **unsigned QA installer** must not be marketed as production-signed.

## Snack Break Games and Creem

The Windows EXE remains **DRM-free** and is downloaded *after purchase* from a secure seller-controlled fulfilment route. No purchase, entitlement, payment credential or Creem secret belongs inside the Electron application. The $1.99 checkout and download entitlement flow must be separately wired and verified against live Creem configuration before listing. A limited HTML5 browser demo will use the same art/gameplay repository but must have independently validated content/time limits and cannot imply unlimited paid access.

**Current status:** Windows packaging code is implemented and standard CI verifies its paths. Neither a complete Windows installer nor a real asset-complete browser gameplay certification exists yet. Do not publish a paid listing or call the build production ready.

## Generated-art pack integration update (25 October 2026)

The previously missing artwork has now been produced **as a separate original generated-art ZIP in the owner's ChatGPT conversation**, but the ZIP's 17 image binaries have not yet been committed to GitHub. The required image inventory has increased from 12 to **18**, because the six illustrated comeback cards are now used by the live scene and mandatory for rendering. Project-use reviews and exact SHA-256 locks have been committed; they do not make missing binaries magically available.

First download and import the artifact according to `docs/ART_PACK_IMPORT.md`, commit the 17 textures, then run both the hard-gated Chromium gameplay acceptance and Windows NSIS installer workflow. Do not call the game playable or offer a sale until those workflows and manual visual QA actually pass.
