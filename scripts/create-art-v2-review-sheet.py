#!/usr/bin/env python3
"""Create an image review *contact sheet* from exported candidate art, not game assets."""
from __future__ import annotations
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, UnidentifiedImageError

COLS, CELL_W, CELL_H = 4, 350, 260
GAP, HEADER_H = 14, 88


def create_sheet(stage_dir: str, output_file: str):
    stage = Path(stage_dir)
    manifest = json.loads((stage / "intake-manifest.json").read_text(encoding="utf-8"))
    files = sorted(manifest["textures"])
    rows = (len(files) + COLS - 1) // COLS
    width = COLS * CELL_W + (COLS + 1) * GAP
    height = HEADER_H + rows * (CELL_H + GAP) + GAP
    sheet = Image.new("RGB", (width, height), "#101820")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    draw.text((GAP, 15), "SWORD & BANNERFALL - V2 CANDIDATE INSPECTION", fill="#fff8e8", font=font)
    draw.text((GAP, 38), "UNAPPROVED - source preview, not a shippable runtime art package", fill="#ffad71", font=font)
    draw.text((GAP, 59), "Check source pixels, alpha edges, gameplay readability and license provenance independently.", fill="#bdc9d6", font=font)
    for i, relative in enumerate(files):
        cell_x = GAP + (i % COLS) * (CELL_W + GAP)
        cell_y = HEADER_H + (i // COLS) * (CELL_H + GAP)
        draw.rounded_rectangle((cell_x, cell_y, cell_x+CELL_W, cell_y+CELL_H),
                               radius=8, fill="#263541", outline="#687d8e", width=1)
        source = stage / "public" / "assets" / relative
        try:
            with Image.open(source) as original:
                original.load()
                native = original.size
                img = original.convert("RGBA")
                preview = ImageOps.contain(img, (CELL_W - 28, CELL_H - 62))
                px = cell_x + (CELL_W - preview.width) // 2
                py = cell_y + 10 + (CELL_H-62-preview.height) // 2
                # Checkerboard exists ONLY in this review sheet, never exported to game.
                for y in range(cell_y+10, cell_y+CELL_H-52, 16):
                    for x in range(cell_x+10, cell_x+CELL_W-10, 16):
                        if ((x-cell_x)//16+(y-cell_y)//16) % 2 == 0:
                            draw.rectangle((x, y, x+15, y+15), fill="#394d5a")
                sheet.paste(preview, (px, py), preview)
                size_label = f"{native[0]} x {native[1]} | {original.mode}"
        except (OSError, UnidentifiedImageError, ValueError) as exc:
            size_label = f"UNREADABLE: {type(exc).__name__}"
        draw.rectangle((cell_x+7, cell_y+CELL_H-47,
                        cell_x+CELL_W-7, cell_y+CELL_H-7), fill="#14212c")
        draw.text((cell_x+12, cell_y+CELL_H-42), relative, fill="#ffffff", font=font)
        draw.text((cell_x+12, cell_y+CELL_H-25), size_label,
                  fill="#a4bdd0", font=font)
    path = Path(output_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, format="PNG")
    print(f"Created UNAPPROVED review sheet for {len(files)} images: {path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python scripts/create-art-v2-review-sheet.py STAGE_DIR OUTPUT_PNG")
    create_sheet(sys.argv[1], sys.argv[2])
