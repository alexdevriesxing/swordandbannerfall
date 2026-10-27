#!/usr/bin/env python3
"""Untrusted v2-art ZIP intake. This is *staging*, never asset approval/install."""
from __future__ import annotations

import hashlib
import json
import stat
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Legacy lock is used ONLY for the list of runtime paths, NEVER its old hashes.
INVENTORY = ROOT / "assets" / "generated-pack-lock.json"
MAX_ZIP_BYTES = 75_000_000
MAX_FILE_BYTES = 25_000_000
MAX_TOTAL_BYTES = 150_000_000
MAX_RATIO = 300
PREFIX = "public/assets/"


def stage(archive_name: str, destination: str, allow_partial: bool = False) -> dict:
    archive_path, target = Path(archive_name), Path(destination).resolve()
    if not archive_path.is_file() or archive_path.stat().st_size > MAX_ZIP_BYTES:
        raise ValueError("Candidate ZIP missing or exceeds 75 MB")
    expected = set(json.loads(INVENTORY.read_text(encoding="utf-8"))["assets"])
    if len(expected) != 17:
        raise ValueError("Unexpected inventory size; review required")
    payloads: dict[str, bytes] = {}
    with zipfile.ZipFile(archive_path) as archive:
        files = [item for item in archive.infolist() if not item.is_dir()]
        if not files or len(files) > len(expected) or (not allow_partial and len(files) != len(expected)):
            raise ValueError("Archive must contain 1-17 candidate files (or exactly 17 without --partial)")
        cumulative = 0
        for item in files:
            name = item.filename
            if (
                "\\" in name or name.startswith("/") or ":" in name
                or not name.startswith(PREFIX)
                or any(part in ("", ".", "..") for part in name.split("/"))
                or name[len(PREFIX):] not in expected
            ):
                raise ValueError(f"Forbidden archive entry: {name!r}")
            if stat.S_IFMT(item.external_attr >> 16) == stat.S_IFLNK:
                raise ValueError(f"Symlink in archive forbidden: {name}")
            if item.flag_bits & 0x1:
                raise ValueError(f"Encrypted ZIP entry: {name}")
            if item.file_size <= 0 or item.file_size > MAX_FILE_BYTES:
                raise ValueError(f"Invalid file size: {name}")
            if item.compress_size <= 0 or item.file_size / item.compress_size > MAX_RATIO:
                raise ValueError(f"Suspicious compression ratio: {name}")
            cumulative += item.file_size
            if cumulative > MAX_TOTAL_BYTES:
                raise ValueError("Expanded candidate exceeds 150 MB")
            relative = name[len(PREFIX):]
            if relative in payloads:
                raise ValueError(f"Duplicate asset path: {relative}")
            data = archive.read(item)  # ZipFile checks entry CRC before returning.
            if len(data) != item.file_size:
                raise ValueError(f"Incorrect decoded size for {relative}")
            payloads[relative] = data
    if not allow_partial and set(payloads) != expected:
        raise ValueError(f"Incomplete candidate; missing {sorted(expected-set(payloads))}")

    # Stage in an isolated folder, never touching public/assets or v1 locks.
    root = target / "public" / "assets"
    report = {"version": "Sword_Bannerfall_Art_Pack_v2",
              "decision": "UNAPPROVED - candidate technical intake only",
              "archive_sha256": hashlib.sha256(archive_path.read_bytes()).hexdigest(),
              "complete": set(payloads) == expected,
              "missing": sorted(expected - set(payloads)),
              "submittedCount": len(payloads),
              "requiredCount": len(expected),
              "textures": {}}
    # Refuse a pre-existing staging folder rather than mix two candidate sets.
    if target.exists():
        raise FileExistsError("Staging target exists; use a fresh destination")
    for relative, data in sorted(payloads.items()):
        destination_file = root / relative
        destination_file.parent.mkdir(parents=True, exist_ok=True)
        destination_file.write_bytes(data)
        report["textures"][relative] = {
            "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)}
    (target / "intake-manifest.json").write_text(
        json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    try:
        if len(sys.argv) not in (3, 4) or (len(sys.argv) == 4 and sys.argv[3] != "--partial"):
            raise ValueError("Usage: python scripts/stage-art-v2-zip.py ART_ZIP CLEAN_STAGING_DIR [--partial]")
        report = stage(sys.argv[1], sys.argv[2], allow_partial=len(sys.argv) == 4)
        print(f"Staged {len(report['textures'])} unapproved candidate images. No production assets changed.")
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as exc:
        print("Candidate intake rejected:", exc, file=sys.stderr)
        sys.exit(1)
