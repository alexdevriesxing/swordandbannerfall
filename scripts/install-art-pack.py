#!/usr/bin/env python3
"""Install owner-approved, generated original Sword & Bannerfall art from ZIP.

No placeholders, CDN downloads or GitHub binary conversion; every file is
checked against the SHA-256 and source-sheet locks in this repository first.
The original first-party studio branding is never overwritten.
"""
from __future__ import annotations
import hashlib
import json
import sys
from pathlib import Path
from zipfile import ZipFile, BadZipFile

ROOT = Path(__file__).resolve().parent.parent
LOCK = ROOT / "assets" / "generated-pack-lock.json"
DEST = ROOT / "public" / "assets"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def install(archive_path: str | Path) -> list[str]:
    lock = json.loads(LOCK.read_text(encoding="utf-8"))
    expected = lock["assets"]
    zip_path = Path(archive_path).expanduser().resolve()
    if not zip_path.is_file():
        raise FileNotFoundError(f"Download the original art pack ZIP first: {zip_path}")
    checked: dict[str, bytes] = {}
    with ZipFile(zip_path) as archive:
        for source in lock["sourceSheets"]:
            archived = "source_sheets/" + source["filename"]
            data = archive.read(archived)
            if digest(data) != source["sha256"]:
                raise ValueError(f"Unverified original source art: {archived}")
        for path, metadata in expected.items():
            if path.startswith("/") or ".." in Path(path).parts:
                raise ValueError(f"Unsafe asset path in lock: {path}")
            data = archive.read("public/assets/" + path)
            if digest(data) != metadata["sha256"]:
                raise ValueError(f"Rejected modified, corrupt or substituted artwork: {path}")
            target = DEST / path
            if target.exists() and digest(target.read_bytes()) != metadata["sha256"]:
                raise FileExistsError(f"Different asset exists; refusing overwrite: {target}")
            checked[path] = data

    # All SHA-256 source and export checks pass before writing even one file.
    installed = []
    for path, data in checked.items():
        target = DEST / path
        if not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            installed.append(path)
    print(f"Art pack verified: {len(checked)} textures, installed {len(installed)} new.")
    print("Official studio branding remains unchanged.")
    print("Next run: npm run check:release && npm test && npm run build")
    print("Then run the manual Chromium gameplay acceptance before Windows distribution.")
    return installed


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise ValueError("Usage: python scripts/install-art-pack.py PATH_TO_ART_PACK.zip")
        install(sys.argv[1])
    except (OSError, ValueError, KeyError, BadZipFile) as exc:
        print("Artwork import blocked:", exc, file=sys.stderr)
        sys.exit(1)
