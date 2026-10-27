# New artwork generation review — 27 October 2026

**Decision: REJECT — generated presentation art cannot enter the release asset inventory.**

Owner authorized independent artwork generation and requested delegated release-quality assessment. Three newly generated original PNG images were reviewed. All three show coherent Sword & Bannerfall art direction, but **all three are promotional asset-board collages** rather than individually exportable 2D sprite and background textures.

| New source board | Resolution | Image channels | SHA-256 |
|---|---:|---|---|
| a_large_promotional_composite_asset_sheet_style_im.png | 1560×1008 | RGB (opaque) | `e170264049548581f155d52b801bf727ca6cba5a2e8e59d5f887bf02175d9508` |
| a_polished_promotional_asset_sheet_infographic_sty.png | 1536×1024 | RGB (opaque) | `eda78036dc819d1c4ab18956d76a719a83d66d23d136be6591c464ee33ccbb4e` |
| a_wide_poster_like_composite_image_with_a_clean.png | 1536×1024 | RGB (opaque) | `4454b19ba0b3b7cb1d040ee52d0d1c7a8f9811f973b98d177660a69a906bc47e` |

## Why they fail release quality

- Files are composite boards containing embedded labels, UI mockups, marketing checkmarks, false statements of integration or approval, and multiple thumbnail illustrations. Embedded prose cannot be taken as verification.
- The 17 missing required textures remain unprovided as independent, correctly named, correctly sized source images.
- The sprite candidates have no isolated PNG transparency. Thumbnail upscaling would not preserve genuine native detail.
- None contains a clean, full-resolution, 16:9, empty battlefield background.
- Six individually illustrated 512×512 comeback cards have not been generated as isolated source files.
- The existing `assets/generated-pack-lock.json`, `assets/licenses.json`, `assets/placement-lock.json` and `src/levels/approved-art-placement.js` still correctly refer to the earlier v1 artwork, which is not installed. The old signatures and measured alpha silhouettes must not be reused to approve replacement art.

**Result: 0 of 17 missing importable textures delivered; 0 newly approved.** Three concept/reference boards were generated, quality-reviewed, and provided to the owner in a separate chat ZIP with a machine-readable SHA-256 manifest. That ZIP is *not* stored in this repository.

The safe v2 intake remains `npm run art:review-v2 -- path/to/v2/public/assets [--partial]`. When a standalone texture is delivered, run the technical preflight, inspect pixel alpha silhouette, source and commercial reuse rights, gameplay-scale legibility, collider/painting alignment, and full Chromium QA before any new pack lock or approval.

**No art checks were bypassed, no repository rights records were falsely modified, and no new image assets were committed under `public/assets/`.** Commercial release remains blocked.