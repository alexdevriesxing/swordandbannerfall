# Free-only art development pipeline — October 28, 2026

**Budget mandate:** No paid image models, subscription asset services, purchased stock assets, paid APIs, or paid texture-generation utilities. The project owner still requires finished, coherent, production-quality hand-painted assets. Flat silhouettes, geometric placeholders, procedural shapes, cropped promotional thumbnails, and image-matting tricks are not acceptable replacements.

## Honest inventory

The existing official Fire Dragon Interactive logo is present. The remaining 17 mandatory gameplay textures are **not installed in GitHub**. Three recent AI-produced art-direction boards are useful to brief an artist, but they contain lettering, multiple cropped images, and opaque backgrounds, and fail the export criteria. Do not put them in `public/assets/` or change rights approvals to claim otherwise.

The v1 pack is cryptographically locked but cannot be recreated from its SHA-256 hashes. If the original owner's pack can be retrieved, its checksum-verified importer remains the fastest zero-cost route. Otherwise, a new v2 pack needs unique originals and new provenance.

## A free, reproducible route

1. **Draw/paint source artwork** with free and open-source programs, such as Krita, GIMP and Inkscape. Keep working masters (KRA, XCF or SVG as appropriate) and export actual rendered textures. Do not use unlicensed images or paid APIs.
2. **Make each image independently:** four arena images (1920×1080 background, 1280×120 ground, isolated transparent barricade, isolated transparent gantry), two isolated fighter sprites (knight facing right, raider left), two independent transparent VFX, three defense objects, six 512×512 illustrated tactical cards. The existing official branding asset is separate.
3. **Preserve source proof:** original master filename, creator, license/rights basis, creation date, final exported SHA-256 and reviewer decision. For any new pack, record *new* hashes instead of borrowing v1 data. Keep every file uniquely named using the exact paths in `scripts/verify-assets.js`.
4. **Preflight without paid services:** `npm run art:review-v2 -- ./candidate/public/assets` (or `node scripts/review-art-v2.js ./candidate/public/assets --partial` for a limited intake). This checks valid image structures, minimum dimensions, actual PNG transparency on 9 isolated sprite/FX files, duplicate byte hashes and now unexpected files, folders and symlinks. The partial flag is **only intake**, not release approval.
5. **Review each sprite at actual game size:** check 45×65 companion readability, 72×100 champion readability, 62×44 defenses, distinct color silhouettes, transparency fringes and camera movement; test barricade and gantry painting against exact Arcade colliders. Update approved alpha placement bounds only after inspection of actual v2 PNG pixels.
6. **Run visual acceptance:** after all 17 textures are staged and properly approved, run strict `npm run check:release`, Chromium gameplay, 4-minute demo browser QA and Windows installer QA. The green unit-test pipeline alone does not certify artwork.

## Pass/fail contract

Reject files with promotional labels/checkmarks baked into the texture, a grid of multiple objects where the game expects one, no real transparent background, insufficient native resolution, illegible or inconsistent art at display size, mismatched collider boundaries, unsupported rights, or no editable source/master. No invented success claims.

**Release status:** BLOCKED until genuine 17-file image pack, character animations, original audio and actual visual/Windows playthrough are done. The code-side validator can improve without pretending the images now exist.
