"""Convert the organizers' card PNGs to WebP thumbs/fulls for the app."""
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from PIL import Image

DEFAULT_SRC = Path("spengler_2025_259_ASSETS_UPDATED_MASTER_QA_CANDIDATE/assets")
DEFAULT_OUT = Path("app/public")
EXPECTED = 259
SIZES = {"thumb": 320, "full": 768}
ART = {
    "davos_spengler_cup_trophy_poster.png": "trophy.webp",
    "spengler_cup_2025_card_deck.png": "deck.webp",
}
QUALITY = 80


def convert(job: tuple[Path, list[tuple[Path, int]]]) -> None:
    """Decode one source image and write each (destination, width) variant."""
    src, targets = job
    with Image.open(src) as im:
        im = im.convert("RGBA")
        for dest, width in targets:
            height = round(im.height * width / im.width)
            resized = im.resize((width, height), Image.LANCZOS)
            dest.parent.mkdir(parents=True, exist_ok=True)
            resized.save(dest, "WEBP", quality=QUALITY, method=4)


def report(folder: Path) -> None:
    files = list(folder.glob("*.webp"))
    total = sum(f.stat().st_size for f in files)
    print(f"{folder.name}: {len(files)} files, {total} bytes")


def main(src: Path = DEFAULT_SRC, out: Path = DEFAULT_OUT) -> int:
    pngs = sorted(src.glob("*.png"))
    if len(pngs) != EXPECTED:
        print(f"expected {EXPECTED} source PNGs, found {len(pngs)}", file=sys.stderr)
        return 1
    jobs = [
        (png, [(out / "cards" / size / f"{png.stem}.webp", w) for size, w in SIZES.items()])
        for png in pngs
    ]
    jobs += [(Path(name), [(out / "art" / target, 768)]) for name, target in ART.items()]
    with ProcessPoolExecutor() as pool:
        list(pool.map(convert, jobs))
    for size in SIZES:
        report(out / "cards" / size)
    report(out / "art")
    return 0


if __name__ == "__main__":
    sys.exit(main())
