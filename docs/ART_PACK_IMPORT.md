# Install the original Sword & Bannerfall artwork pack

## What has been created

The project now has one complete **content-locked art package** from the owner's 25 October 2026 request. It contains 11 original AI-assisted arena/fighter/FX/defense illustrations, plus 6 original illustrated comeback cards. The existing first-party Fire Dragon Interactive studio logo remains in GitHub untouched.

The source ZIP is supplied in the originating ChatGPT conversation as **Sword_Bannerfall_Original_Art_Pack_v1.zip**. It includes each exact exported game file at `public/assets/...`, three original generated art sheets, the export manifest and a review contact sheet.

The repository cannot reconstruct the generated binary art from its hash manifest alone. It is deliberately configured **not to fake missing assets**. Installing the ZIP and committing the files is necessary before the browser scene or Windows installer can load every texture.

## Windows instructions (recommended)

1. Download `Sword_Bannerfall_Original_Art_Pack_v1.zip` from the ChatGPT response and save it in `Downloads`.
2. Open your checked-out `swordandbannerfall` project folder.
3. In Windows PowerShell, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-art-pack.ps1
```

If the ZIP is somewhere else, append `-ZipPath "C:\Full\Path\Sword_Bannerfall_Original_Art_Pack_v1.zip"`.

The import checks the **SHA-256 of all three original source sheets and all 17 outputs before copying anything**. It refuses modified files and will not overwrite different existing art or the official Fire Dragon logo.

Alternatively, with Python 3:

```powershell
python scripts/install-art-pack.py "C:\Users\YOURNAME\Downloads\Sword_Bannerfall_Original_Art_Pack_v1.zip"
```

Once installed, run:

```powershell
npm run check:release
npm test
npm run build
```

Commit `public/assets/arena`, `fighters`, `fx`, `defenses` and `cards` to the repository. The checksum-locked approval decisions are already recorded in `assets/licenses.json` and will only match these exact generated exports.

## Approval scope and QA

The project owner explicitly delegated choosing and reviewing these assets and requested original generation. The assistant selected the originals, prepared transparent/cropped textures, checked the dimensions and approved the **exact exported artwork for integration**. The asset provenance, SHA-256 locks, reviewer, authorization and limits are recorded in `assets/generated-pack-lock.json` and `assets/licenses.json`.

This is a **technical/art-direction approval and user-directed project-use decision**, not an independent copyright opinion, promise of IP exclusivity or a final visual gameplay certification. Sprite animations still need production work (currently the champion art is a single combat pose), the background is enlarged from a concept-art panel, and handdrawn background/particle polish needs in-engine review before commercial release. No external game art was copied or substituted.

After installation, use Actions → **Full Chromium gameplay and replay QA** to run a genuine gameplay test with the imported art. Do not publish a Windows installer until that run passes and the game has been visually inspected, including transparent sprite outlines, readability at actual game resolution, obstacle art/colliders, action timing, card options and performance.

## Exact game texture list

- `arena/iron-citadel.webp`, `arena/citadel-ground.webp`, `arena/destructible-barricade.png`, `arena/iron-citadel-gantry.png`
- `fighters/knight.png`, `fighters/raider.png`
- `fx/projectile.png`, `fx/slash.png`
- `defenses/trap.png`, `defenses/turret.png`, `defenses/shield.png`
- `cards/war-cry.png`, `cards/shieldwall.png`, `cards/swift-march.png`, `cards/field-medics.png`, `cards/war-chest.png`, `cards/deadeye.png`

The one existing official `branding/fire-dragon-interactive.png` remains separate from this 17-image generated artwork pack.
