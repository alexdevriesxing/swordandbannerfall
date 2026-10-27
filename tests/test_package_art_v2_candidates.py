import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("package_art_v2",ROOT/"scripts"/"package-art-v2-candidates.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

PNG=b"\x89PNG\r\n\x1a\n"+bytes(range(120))
WEBP=b"RIFF"+bytes(4)+b"WEBP"+bytes(range(120))

class PackageArtV2Tests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory()
  self.addCleanup(self.temp.cleanup)
  self.root=Path(self.temp.name)
  self.mapping=self.root/"map.json"
  self.output=self.root/"Sword_Bannerfall_Art_Pack_v2_Candidates.zip"
 def sources(self):
  knight=self.root/"blue-knight-alpha.png";knight.write_bytes(PNG)
  background=self.root/"citadel-source.webp";background.write_bytes(WEBP)
  data={"fighters/knight.png":str(knight),"arena/iron-citadel.webp":str(background)}
  self.mapping.write_text(json.dumps(data),encoding="utf-8")
  return data

 def test_packaging_preserves_exact_source_bytes_and_filenames(self):
  data=self.sources()
  result=module.make_candidate_zip(str(self.mapping),str(self.output))
  self.assertEqual(result["decision"],"UNAPPROVED")
  self.assertEqual(result["count"],2)
  with zipfile.ZipFile(self.output) as archive:
   self.assertEqual(set(archive.namelist()),{"public/assets/"+x for x in data})
   for name,filepath in data.items():
    self.assertEqual(archive.read("public/assets/"+name),Path(filepath).read_bytes())

 def test_wrong_file_type_is_rejected_without_creating_archive(self):
  self.sources()
  original=json.loads(self.mapping.read_text())
  Path(original["fighters/knight.png"]).write_bytes(b"NOT_A_PNG"+bytes(130))
  with self.assertRaisesRegex(ValueError,"Expected PNG"):
   module.make_candidate_zip(str(self.mapping),str(self.output))
  self.assertFalse(self.output.exists())

 def test_unknown_paths_cannot_replace_studio_logo(self):
  paths=self.sources()
  self.mapping.write_text(json.dumps({"branding/fire-dragon-interactive.png":paths["fighters/knight.png"]}))
  with self.assertRaisesRegex(ValueError,"Unknown or protected"):
   module.make_candidate_zip(str(self.mapping),str(self.output))
  self.assertFalse(self.output.exists())

 def test_existing_art_batch_is_not_overwritten(self):
  self.sources()
  self.output.write_bytes(b"untouched")
  with self.assertRaises(FileExistsError):
   module.make_candidate_zip(str(self.mapping),str(self.output))
  self.assertEqual(self.output.read_bytes(),b"untouched")

 def test_missing_files_or_empty_mappings_are_rejected(self):
  self.mapping.write_text("{}",encoding="utf-8")
  with self.assertRaisesRegex(ValueError,"1-17"):
   module.make_candidate_zip(str(self.mapping),str(self.output))
  self.mapping.write_text(json.dumps({"fighters/raider.png":str(self.root/"missing.png")}))
  with self.assertRaises(FileNotFoundError):
   module.make_candidate_zip(str(self.mapping),str(self.output))
  self.assertFalse(self.output.exists())

if __name__=="__main__":
 unittest.main()
