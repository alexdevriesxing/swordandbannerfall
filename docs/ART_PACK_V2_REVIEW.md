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

## 27 October follow-up — candidate files and technical review refinement

The connected Canva account contains a dedicated candidate folder: [Sword & Bannerfall — Art Pack v2 Candidates (Unapproved)](https://www.canva.com/folder/FAHZL3s260c). The **source** Iron Citadel background and the original blue Knight image were successfully filed there. The transparent-background Knight derivative remains accessible separately as Canva media `MAHZL3DIzLE`; Canva rejected the attempt to move this derivative into that folder, so no overwrite or surrogate asset was made.

The two source media IDs are `MAHZL9-eGG8` (Citadel, 1680×944 JPG) and `MAHZL_j8s_k` (Knight, 1264×1264 JPG). The Knight derivative was created via Canva's background-removal workflow, but **no export PNG bytes were obtained for local visual/pixel QA**. Neither image is approved for the runtime inventory yet. The Citadel JPG is below the authored 1920×1080 minimum.

A second source-generation request for a single red Raider was submitted as a Canva image-generation job, with no downloaded result yet. Do not treat job receipt, a thumbnail, or auto-polling UI as delivered files or a pass of technical QA.

### Updated strict v2 technical gate

Run `npm run art:review-v2 -- /absolute/path/to/v2/assets` on exported image bytes. `scripts/review-art-v2.js` now uses `scripts/inspect-png-alpha.js` to **decompress and inspect the actual PNG alpha pixels** of nine isolated characters, props and effects. The review conservatively requires PNG RGBA/grayscale+alpha 8-bit noninterlaced exports, both visible and transparent pixels, and at least three transparent corners. It rejects fully opaque RGBA files with painted white backgrounds, completely empty transparent canvases and obvious rectangular matte edges, even if the PNG declares an alpha channel. Paletted/interlaced exports need an explicit conversion followed by repeat visual review.

This structural and alpha scan does **not** establish correct anatomy, high-resolution quality, rights clearance or a successful rendered in-game frame; per-asset manual visual approval remains necessary. Production `assets/licenses.json` and v1 checksums remain untouched.

## Owner-only non-destructive v2 intake — GitHub Issue #2

The new [v2 candidate art intake issue](https://github.com/alexdevriesxing/swordandbannerfall/issues/2) is independent from the older **v1 immutable-original importer on Issue #1**. Never use v1's installation issue for v2 outputs or send its source ZIP as a v2 candidate.

To submit a complete isolated v2 pack, export all 17 correctly sized individual textures (with real transparent alpha on nine isolated images), place them at the exact `public/assets/<category>/<filename>` paths listed above, and create the archive **`Sword_Bannerfall_Art_Pack_v2_Candidates.zip`**. In a new owner comment on Issue #2 attach exactly that ZIP. The project-owned GitHub Action `.github/workflows/stage-v2-art-candidates.yml` will:

- refuse arbitrary domains, commenters other than the owner, unrelated issues, malformed or oversized attachments, unsafe ZIP paths, symlinks, encrypted files, extra files and excessive decompression;
- stage the 17 files outside the actual game directory; never change branding, runtime art, v1 SHA locks or commercial-rights decisions;
- run `node scripts/review-art-v2.js STAGING_DIR/public/assets` to check source file dimensions, structural integrity and *actual decoded transparent pixels*;
- generate a labelled, source-derived **review-only** contact sheet (no replacement game shapes or fake illustrations);
- produce a 14-day GitHub Actions artifact with exact SHA-256s, the technical report and candidate bytes, **not** an approved bundle.

The secure ZIP intake Python unit tests run both from standard push CI and the issue workflow. When working locally, the equivalent commands are:

```bash
python scripts/stage-art-v2-zip.py Sword_Bannerfall_Art_Pack_v2_Candidates.zip /tmp/bf-v2
npm run art:review-v2 -- /tmp/bf-v2/public/assets
python scripts/create-art-v2-review-sheet.py /tmp/bf-v2 /tmp/bf-v2/contact-sheet.png
```

The local contact-sheet command requires Pillow. Only after source inspection and successful in-engine screenshots may the delegated art director approve any exact runtime file, update the v2 source/output manifest and the rights register, or commit binary game assets. **A successful intake action does not perform these approval steps automatically.**

## 27 October — incremental batch review enabled

**Revision to the previous all-17 requirement:** the owner-only GitHub Issue #2 reviewer now accepts a nonempty ZIP containing **any 1–17** of the listed original export paths, with no other files or branding. The same original filename `Sword_Bannerfall_Art_Pack_v2_Candidates.zip` is used for each independent owner-submitted batch. This allows blue Knight, red Raider and subsequent standalone exports to be inspected immediately without creating stand-in textures for unfinished parts.

The secure ZIP stage records `submittedCount`, `requiredCount=17`, `complete`, and `missing` in the generated JSON manifest. Running `node scripts/review-art-v2.js FOLDER --partial` validates only the submitted candidates while preserving a visible list of every missing image. TechnicalPass on a *partial* subset means merely that those submitted files passed this technical check: it never changes the `approval: NOT APPROVED` result, never authorizes publication and never satisfies `npm run check:release`.

For standalone local review:
```bash
python scripts/stage-art-v2-zip.py Sword_Bannerfall_Art_Pack_v2_Candidates.zip /tmp/bf-v2 --partial
npm run art:review-v2 -- /tmp/bf-v2/public/assets --partial
python scripts/create-art-v2-review-sheet.py /tmp/bf-v2 /tmp/bf-v2/contact-sheet.png
```

The default (without `--partial`) deliberately **still requires all 17 files** in both the ZIP staging command and structural reviewer, preventing accidental promotion of a partial batch into the finished-game release. Each submission produces its own unapproved evidence; nothing is silently merged or committed. The immutable original v1 lock, the actual production assets, the real studio logo, the user rights register, game installer and checkout stay unchanged.

## 27 October — exported-source packager and comeback-card candidates

The standalone **War Cry** illustration finished as Canva media `MAHZN0oD3lA` with a **1264×1264 JPG** source, and was moved into the [v2 review folder](https://www.canva.com/folder/FAHZL3s260c). Its source dimensions exceed the 512×512 card requirement, but **its actual exported pixels have not been retrieved or visually inspected at full resolution**, so `cards/war-cry.png` remains unapproved. A card must be exported to an actual PNG file (not renamed JPG), preserving correct proportions and subject placement.

Five additional distinct card illustration generations were submitted through Canva as source candidates: **Shieldwall, Swift March, Field Medics, War Chest, and Deadeye**. Submission is not evidence of finished or approved exports. Keep each artwork distinct, square, text-free and individually exported; avoid baked card borders or UI that the game already draws.

### Packaging individually exported images without renaming bytes

A safe owner-side command now builds the exact GitHub Issue #2 ZIP from a simple mapping file. Create a local JSON file named `my-v2-art-sources.json` containing **only the exports already finished**, for example:

```json
{
  "fighters/knight.png": "C:/Users/YourName/Downloads/knight-transparent-export.png",
  "fighters/raider.png": "C:/Users/YourName/Downloads/raider-transparent-export.png",
  "cards/war-cry.png": "C:/Users/YourName/Downloads/war-cry-export.png"
}
```

The right-hand entries are **examples of file locations, not files claimed to exist**. They must refer to the exact locally downloaded original-resolution PNG/WebP exports. To create the intake ZIP on Windows:

```powershell
python scripts/package-art-v2-candidates.py my-v2-art-sources.json Sword_Bannerfall_Art_Pack_v2_Candidates.zip
```

This command verifies known runtime names, file presence, plausible size and actual PNG/WebP signatures; it **does not** transform/re-export art, resize to invent detail, pretend a JPG is a PNG, or update approved production artwork. It rejects existing output ZIPs rather than overwriting them. Attach the resulting ZIP to the [v2 review Issue #2](https://github.com/alexdevriesxing/swordandbannerfall/issues/2) from the owner account. The automated, non-destructive intake then checks pixel dimensions, PNG decoded alpha, format and SHA-256. All commercial art approvals still require human visual evaluation and live gameplay QA.

The packager is deliberately separate from the old v1 checksum lock and is covered by its own automated security tests.
