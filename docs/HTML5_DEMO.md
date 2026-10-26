# Standalone HTML5 preview — Snack Break Games

Sword & Bannerfall has two **separately compiled** experiences:

- **Windows DRM-free paid edition** — normal Vite build (`npm run build`), unrestricted match replay, packaged using the gated `npm run build:windows` installer workflow.
- **Browser preview** — dedicated Vite `demo` mode (`npm run build:demo`) producing `dist-demo/`. The compiled code includes a one-match limit and a **four-minute active-combat timer**. The preparation phase does not consume preview time. Completing the first match or reaching the time limit freezes the demo and displays a link to `https://www.snackbreakgames.com/`.

The browser demo is a standalone *preview*, not a payment check, license server, or a way to secure a full paid browser game. Do not ship the full commercial Windows assets/source as an unrestricted web product. The full paid edition must remain the offline installer distributed through the authorized store checkout; **no live Creem purchase link has been wired in this milestone**.

## Commands

```bash
npm test
npm run build              # Windows/full edition web bundle, dist/
npm run build:demo         # Limited HTML5 preview, dist-demo/
npm run check:demo         # Hard artwork and rights gate, then limited demo build
```

**Never upload `dist-demo/` before `npm run check:release` passes.** Both Vite builds can compile without artwork, but Boot deliberately refuses to display the game when approved production textures are missing. The browser demo does not introduce procedural shapes, stand-in art or unlicensed downloads.

The two builds must be hosted separately. Use `dist-demo/` as the document root for a dedicated preview URL under Snack Break Games; use the Windows build inside Electron for the paid file-safe executable. The actual store route and Creem checkout remain website-integration tasks, not something a downloadable game should fake.

## Manual browser acceptance

When the 17 pending original textures are committed and all 18 approved files clear their checksums/rights register, launch **GitHub Actions → Real Chromium limited-demo acceptance → Run workflow**. This runs the full Node test suite, builds `dist-demo/`, opens it in actual Chromium, then checks:

1. Initial setup contains 20 fighters and zero demo combat time charged.
2. Enter starts combat and the actual clock advances.
3. The encounter ends through the real combat system or after four minutes of active battle; no fabricated KOs, arbitrary clock jumps or unlocks.
4. The preview remains finished after Enter; the user cannot start another match.
5. Screenshots are saved as a 14-day GitHub Actions artifact.

A second workflow, **Full Chromium gameplay and replay QA**, continues to check the unrestricted Windows-mode browser bundle, including natural victory, setup/defense commands and Enter-to-replay.

## Production limitations

Until artwork imports, these real Chromium tests remain blocked by design. Demo code can be compiled and its clock tested with Node without implying the game is browser-playable. Browser-only time limits are not DRM and do not establish payment entitlement. Sound design, animation transitions, performance on low-end hardware, visual polish, offline installer signing and actual Creem payment/fulfilment still need separate production review.
