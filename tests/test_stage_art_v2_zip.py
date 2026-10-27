import importlib.util
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("stage_art_v2", ROOT / "scripts" / "stage-art-v2-zip.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
EXPECTED = sorted(json.loads((ROOT / "assets" / "generated-pack-lock.json").read_text())["assets"])


def make_archive(path, files=None, extra=()):
    if files is None:
        files = {f"public/assets/{name}": b"non-placeholder-candidate-bytes:" + name.encode()
                 for name in EXPECTED}
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for name, data in list(files.items()) + list(extra):
            z.writestr(name, data)


class CandidateArchiveSafety(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.dir = Path(self.temp.name)
        self.archive = self.dir / "candidate.zip"
        self.output = self.dir / "staged"

    def test_exact_inventory_stages_with_hash_manifest(self):
        make_archive(self.archive)
        result = module.stage(str(self.archive), str(self.output))
        self.assertEqual(17, len(result["textures"]))
        self.assertIn("UNAPPROVED", result["decision"])
        self.assertTrue((self.output / "intake-manifest.json").is_file())
        self.assertEqual(17, len(list((self.output/"public"/"assets").rglob("*.*"))))
        # Once real art is installed, this test must keep passing; it only writes\n        # inside the isolated temporary staging directory.

    def test_rejects_extra_or_missing_items(self):
        make_archive(self.archive, extra=[("public/assets/branding/fake.png", b"fake")])
        with self.assertRaisesRegex(ValueError, "exactly 17"):
            module.stage(str(self.archive), str(self.output))
        self.assertFalse(self.output.exists())
        files = {f"public/assets/{name}": b"sample" for name in EXPECTED[:-1]}
        make_archive(self.archive, files)
        with self.assertRaisesRegex(ValueError, "exactly 17"):
            module.stage(str(self.archive), str(self.output))

    def test_rejects_path_traversal_without_writing_files(self):
        files = {f"public/assets/{name}": b"sample" for name in EXPECTED[1:]}
        files["public/assets/arena/../fighters/knight.png"] = b"attack"
        make_archive(self.archive, files)
        with self.assertRaisesRegex(ValueError, "Forbidden archive entry"):
            module.stage(str(self.archive), str(self.output))
        self.assertFalse(self.output.exists())

    def test_rejects_duplicate_zip_members(self):
        files = {f"public/assets/{name}": b"sample" for name in EXPECTED[:-1]}
        duplicate = "public/assets/" + EXPECTED[0]
        # 17 entries total, one repeated and one missing.
        make_archive(self.archive, files, extra=[(duplicate, b"second")])
        with self.assertRaisesRegex(ValueError, "Duplicate asset path"):
            module.stage(str(self.archive), str(self.output))
        self.assertFalse(self.output.exists())

    def test_never_merges_two_staging_sets(self):
        make_archive(self.archive)
        self.output.mkdir()
        with self.assertRaises(FileExistsError):
            module.stage(str(self.archive), str(self.output))



    def test_partial_candidate_stages_only_submitted_art_and_lists_remaining(self):
        files = {
            "public/assets/fighters/knight.png": b"candidate knight fixture",
            "public/assets/fighters/raider.png": b"candidate raider fixture",
        }
        make_archive(self.archive, files)
        result = module.stage(str(self.archive), str(self.output), allow_partial=True)
        self.assertEqual(result["submittedCount"], 2)
        self.assertEqual(result["requiredCount"], 17)
        self.assertEqual(len(result["missing"]), 15)
        self.assertFalse(result["complete"])
        self.assertIn("UNAPPROVED", result["decision"])
        self.assertFalse((self.output / "public" / "assets" / "branding").exists())

    def test_partial_candidate_rejects_zero_or_unlisted_files(self):
        make_archive(self.archive, {})
        with self.assertRaisesRegex(ValueError, "1-17"):
            module.stage(str(self.archive), str(self.output), allow_partial=True)
        self.assertFalse(self.output.exists())
        make_archive(self.archive, {"public/assets/branding/fire-dragon-interactive.png": b"fake"})
        with self.assertRaisesRegex(ValueError, "Forbidden archive entry"):
            module.stage(str(self.archive), str(self.output), allow_partial=True)
        self.assertFalse(self.output.exists())

    def test_partial_candidate_still_rejects_path_traversal_and_duplicates(self):
        for entries, extra in [
            ({"public/assets/fighters/../knight.png": b"attack"}, ()),
            ({"public/assets/fighters/knight.png": b"good"}, [
                ("public/assets/fighters/knight.png", b"duplicate")]),
        ]:
            make_archive(self.archive, entries, extra=extra)
            with self.assertRaisesRegex(ValueError, "Forbidden archive entry|Duplicate asset path"):
                module.stage(str(self.archive), str(self.output), allow_partial=True)
            self.assertFalse(self.output.exists())

if __name__ == "__main__":
    unittest.main()
