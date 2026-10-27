# Art director decision — Sword & Bannerfall — 2026-10-27

**Decision authority:** delegated by game owner in this conversation: "proceed and you decide approval".

## Decisions

**APPROVED FOR CONCEPT/ART DIRECTION ONLY:** painterly medieval siege environment, blue/gold knight versus red/crimson raider, hand-painted citadel masonry, physically readable wooden defenses, distinct illustrated comeback-card scenarios. This establishes the art brief, not actual production-sprite acceptance.

**REJECTED AS PHASER RUNTIME TEXTURES:** all five generated promotional compositions in `Sword_Bannerfall_ArtDirection_Concepts_2026-10-27.zip`. They contain baked-in text, UI, frames, miniature character images and/or fake "approval" stamps. Cropping would yield small, noisy, nontransparent, inconsistent runtime images rather than finished high-resolution single assets. They are suitable as references, not as sprites, platforms, effects, or card exports.

**NOT YET APPROVED:** the 17 named v2 standalone candidates. Separate generation jobs were submitted, but the available material does not establish 17 separately inspected and technically verified output files. A returned generation job SUCCESS/media reference, by itself, is not evidence of an acceptable PNG/WebP export. Until files are available for full-resolution visual review and a technical check, no SHA-256 approval is justified.

**APPROVED AND UNCHANGED:** official first-party `branding/fire-dragon-interactive.png` as documented by the existing license register.

## Asset-specific disposition

| Requested game texture | Decision | Required to approve |
|---|---|---|
| arena/iron-citadel.webp | Pending | Full-bleed environment only, no baked HUD or fighters; >=1920x1080 |
| arena/citadel-ground.webp | Pending | Seam-compatible ground texture, >=1280x120 |
| arena/destructible-barricade.png | Pending | Real transparency and collision-aligned silhouette |
| arena/iron-citadel-gantry.png | Pending | Real transparency, obvious walkable top |
| fighters/knight.png | Pending | Clean complete blue character, alpha, readable at 45x65 |
| fighters/raider.png | Pending | Clean complete red character, alpha, readable at 45x65 |
| fx/projectile.png | Pending | Isolated, alpha-composited projectile |
| fx/slash.png | Pending | Isolated, alpha-composited combat streak |
| defenses/trap.png | Pending | Isolated, realistic pressure trap |
| defenses/turret.png | Pending | Isolated mechanical ballista turret |
| defenses/shield.png | Pending | Isolated magical shield device |
| cards/war-cry.png | Pending | Distinct rally card illustration, 512x512 |
| cards/shieldwall.png | Pending | Distinct defensive formation card illustration, 512x512 |
| cards/swift-march.png | Pending | Distinct mobility card illustration, 512x512 |
| cards/field-medics.png | Pending | Distinct healing card illustration, 512x512 |
| cards/war-chest.png | Pending | Distinct supply card illustration, 512x512 |
| cards/deadeye.png | Pending | Distinct precision-archery card illustration, 512x512 |

## Approval workflow

1. Retrieve individual generated media exports, not composite pictures or job IDs.
2. Inspect every image at source resolution, checking anatomy, weapon completeness, aesthetics, team palette, cropped edges, text contamination, and game-readability.
3. For isolated sprite/prop/effect textures, manually inspect alpha edges and transparent matte; do not accept a colored or checkerboard background.
4. Normalize pixel dimensions with authored proportions preserved; update collision/alpha silhouette measurements based on the actual reviewed file bytes.
5. Run `node scripts/review-art-v2.js <candidate-public-assets-folder>`, record the exact exported SHA-256 per runtime path, inspect duplicate warnings.
6. Perform delegated rights/provenance review; create a **new** v2 manifest only after all 17 pass. Do not overwrite the immutable v1 generated-pack lock or fabricate checksums.
7. Commit the actual binaries together with the exact v2 license register, then require strict release readiness, automated tests, build, real browser QA and screenshots.

**Current release approval: DENIED.** The software's existing green CI indicates code health only. The missing texture binaries, authored animations, audio and full human-in-the-loop graphical QA must be completed before commercial release. This decision can be revisited as each exact asset becomes available; owner consent to approve does not itself demonstrate passing asset quality.
