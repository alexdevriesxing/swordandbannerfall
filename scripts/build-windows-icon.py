"""Create a Windows .ico from the exact checked-in original studio logo.

This transforms only the genuine approved-source image; it never paints substitute
symbols, gradients, characters or other stand-in assets.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public/assets/branding/fire-dragon-interactive.png"
DEST = ROOT / "build/icon.ico"


def generate() -> Path:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Official studio artwork missing: {SOURCE}")
    with Image.open(SOURCE) as source:
        source.load()
        if source.width < 256 or source.height < 256:
            raise ValueError("Original studio artwork is too small for a Windows icon")
        source = source.convert("RGBA")
        source.thumbnail((960, 960), Image.Resampling.LANCZOS)
        result = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
        result.alpha_composite(
            source, ((1024 - source.width) // 2, (1024 - source.height) // 2)
        )
        DEST.parent.mkdir(parents=True, exist_ok=True)
        result.save(
            DEST,
            format="ICO",
            sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64),
                   (128, 128), (256, 256)],
        )
    return DEST


if __name__ == "__main__":
    print(f"Generated genuine Fire Dragon Windows icon: {generate()}")
