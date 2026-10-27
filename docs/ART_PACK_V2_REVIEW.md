# Sword & Bannerfall — Art Pack v2: Generation & Review Register
**Date:** 2026-10-27  
**Requested by:** Game owner, with explicit delegated artwork-generation and asset-review authority.  
**Current decision:** **Visual direction accepted; all 17 new game texture exports NOT YET APPROVED.**  
**Existing version:** `Sword_Bannerfall_Original_Art_Pack_v1` stays immutable. Do not overwrite its SHA-256 locks or retroactively claim new files have the old hashes.

## Art-direction decision

The hand-painted dark-fantasy **Iron Citadel** direction is accepted as a reference for generating individual textures: legible blue lion versus red dragon teams, weathered stone and iron, oak barricades, mossy ledges, premium painted illustrated cards, readable silhouettes at 1280×720. Preserve the genuine first-party Fire Dragon Interactive logo already committed in `public/assets/branding`.

On 27 October a set of promotional concept composites was generated. These compositions are **not usable individual Phaser assets**: in-image menus, typography, cropped low-resolution thumbnails, and alleged "APPROVED" badges are part of the generated picture itself. They are not evidence of an actual approval, integration, testing, or license clearance. A review/contact sheet and five visual-direction images are available from the originating ChatGPT conversation as `Sword_Bannerfall_ArtDirection_Concepts_2026-10-27.zip`. **Do not import this zip into the game.**

A separate 17-item individually briefed image-generation job set was also submitted through Canva. A job-accepted response is not evidence that its result is complete, delivered or production-approved. Review each completed image at full pixels; reject failures and regenerate.

## Exact runtime inventory (17 new exports)

| Runtime file | Minimum dimensions | Art / export rule |
| --- | --- | --- |
| `arena/iron-citadel.webp` | 1920×1080 | Full bleed side-view citadel environment; no UI, labels, characters or composited cards |
| `arena/citadel-ground.webp` | 1280×120 | Independent side-on coherent paving/earth strip; correct baseline and visually compatible edges |
| `arena/destructible-barricade.png` | 82×125 | Isolated destructible wood/stone barrier; real alpha; align visible silhouette to static body |
| `arena/iron-citadel-gantry.png` | 240×24 | Isolated horizontal stone gantry with clearly painted walkable top and real alpha |
| `fighters/knight.png` | 72×100 | Blue-team full-body knight facing screen-right; usable silhouette at 45×65 |
| `fighters/raider.png` | 72×100 | Red-team full-body raider facing screen-left; usable silhouette at 45×65 |
| `fx/projectile.png` | 24×24 | Isolated arrow/bolt, not baked into battle scene; alpha only outside painted glow |
| `fx/slash.png` | 64×64 | Isolated sword-action effect with appropriate alpha |
| `defenses/trap.png` | 62×44 | Isolated physically legible spike trap with alpha |
| `defenses/turret.png` | 70×70 | Isolated medieval ballista turret with alpha |
| `defenses/shield.png` | 62×44 | Isolated blue-glowing ward emitter with alpha |
| `cards/war-cry.png` | 512×512 | Full illustrated rallying-standards scene, no embedded caption |
| `cards/shieldwall.png` | 512×512 | Full illustrated armored shieldwall scene, no embedded caption |
| `cards/swift-march.png` | 512×512 | Full illustrated fast-scouter march scene, no embedded caption |
| `cards/field-medics.png` | 512×512 | Full illustrated healing scene, no embedded caption |
| `cards/war-chest.png` | 512×512 | Full illustrated war supplies chest, no embedded caption |
| `cards/deadeye.png` | 512×512 | Full illustrated precision archer scene, no embedded caption |

Additionally, the original `branding/fire-dragon-interactive.png` must remain unchanged and retain its existing verified SHA-256.

## Approval is per exact delivered file, not per prompt

A candidate must pass **all** of the following before the delegated project reviewer records `approved-generated-integration`:

1. The actual PNG/WebP export is available at the exact required runtime path; the file decodes with a valid internal structure, minimum native dimensions and a valid PNG CRC or WebP container.
2. Source and export SHA-256 are recorded **from the exact bytes on disk**. Never invent, reuse v1 or copy expected hashes into a v2 registration without checking bytes.
3. A visual review confirms the standalone image really depicts the named asset, no unrelated UI/text/borders/advertisements, no obvious cropped anatomy, no missing weapons, and is readable at its true Phaser display size.
4. Sprite/FX/defense/gantry/barricade assets have **real transparent edges**, not a painted checkerboard or white/black rectangular matte. No vector/procedural substitutes. Any removal of background must be manually inspected for halo and cut-out defects.
5. Fighter poses and visible alpha silhouettes must fit the authored physics; measured bounds must update `src/levels/approved-art-placement.js` **only after measured PNGs are present**. Preserve aspect ratios.
6. Record generator/source, date, project-specific user delegation, rights basis, file hashes, reviewer, and limits in `assets/licenses.json`. This is a delegated game-art acceptance, **not** a legal guarantee of exclusivity or freedom from similar third-party art.
7. `npm run check:release`, `npm test`, `npm run build`, `npm run build:demo` and the strict Chromium browser QA must all pass on the **same committed version**. Review real screenshots, character alpha/motion, collider alignment, card option sizes, and visual contrast.
8. The Windows NSIS build and clean-PC launch remain a separate hard gate before sales.

## Exact file-version handling

Do not delete the v1 lock, remove the old import guard, or alter the existing license approvals just to make a build green. Treat the new completed exports as **v2 candidates** until reviewed. Create a new source/export manifest with the actual v2 SHA-256 checksums and source provenance. Only after all 17 candidate exports pass review, atomically commit: 17 images, v2 source/texture hashes, the reviewed rights register, and verified alpha-placement constants. Archive/relabel the old v1 importer as legacy if the project officially switches packs. Never invoke the legacy v1 issue workflow on a differently generated v2 archive.

**Current release verdict:** blocked on isolated production art exports, full graphical validation, production character animation, licensed production sound/music, Windows QA and storefront integration. CI success on JS code does not override this verdict.
