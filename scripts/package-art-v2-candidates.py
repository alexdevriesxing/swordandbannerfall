#!/usr/bin/env python3
"""Package exact, owner-exported production-art candidates without approving them.

Input: JSON object mapping runtime paths to the raw source-quality export files.
Does NOT synthesize textures, apply background removal, change image bytes,
update public/assets, or grant commercial/license approval.
"""
from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "assets" / "generated-pack-lock.json"
PREFIX = "public/assets/"
MAX_FILE_SIZE = 25_000_000
MAX_TOTAL = 150_000_000


def make_candidate_zip(mapping_path: str, output_path: str) -> dict:
    mapping_file, output = Path(mapping_path).expanduser().resolve(), Path(output_path).expanduser().resolve()
    entries = json.loads(mapping_file.read_text(encoding="utf-8"))
    allowed = set(json.loads(INVENTORY.read_text(encoding="utf-8"))["assets"].keys())
    if not isinstance(entries, dict) or not 1 <= len(entries) <= len(allowed):
        raise ValueError("Provide 1-17 source file mappings, no extras")
    if set(entries) - allowed:
        raise ValueError(f"Unknown or protected asset names: {sorted(set(entries)-allowed)}")
    if output.exists():
        raise FileExistsError("Refusing to replace an existing candidate ZIP")
    prepared = {}
    total = 0
    for name, source_path in sorted(entries.items()):
        if not isinstance(source_path, str) or not source_path.strip():
            raise ValueError(f"Invalid local export path for {name}")
        source = Path(source_path).expanduser()
        if not source.is_file():
            raise FileNotFoundError(f"Missing owner-exported image: {source}")
        if source.resolve() in (output, mapping_file):
            raise ValueError("Refusing to package the mapping file or destination")
        data = source.read_bytes()
        if not 100 <= len(data) <= MAX_FILE_SIZE:
            raise ValueError(f"Image candidate size invalid: {name}")
        # This only rejects clearly mislabeled exports. Deep structure, CRC,
        # dimensions, alpha pixels and visual QA are done in the next stage.
        if name.endswith(".png"):
            if not data.startswith(bytes([137,80,78,71,13,10,26,10])):
                raise ValueError(f"Expected PNG data (not a JPG or thumbnail): {name}")
        elif name.endswith(".webp"):
            if not (len(data)>=12 and data[:4]==b"RIFF" and data[8:12]==b"WEBP"):
                raise ValueError(f"Expected WebP data: {name}")
        total += len(data)
        if total > MAX_TOTAL:
            raise ValueError("Candidate export batch exceeds 150 MB")
        prepared[name] = data
    # Only one output is written, after all entry validations pass.
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for name, data in prepared.items():
            archive.writestr(PREFIX + name, data)
    return {
        "candidate": "Sword_Bannerfall_Art_Pack_v2", "decision": "UNAPPROVED",
        "zip": str(output), "count": len(prepared),
        "files": {name: hashlib.sha256(data).hexdigest() for name,data in prepared.items()},
    }


if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            raise ValueError("Usage: python scripts/package-art-v2-candidates.py PATH_MAP.json OUTPUT.zip")
        print(json.dumps(make_candidate_zip(sys.argv[1], sys.argv[2]), indent=2))
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print("Art candidate packaging rejected:", exc, file=sys.stderr)
        sys.exit(1)
